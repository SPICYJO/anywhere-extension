const passport = require('koa-passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const Router = require('koa-router');
const User = require('models/user');
const RefreshToken = require('models/refresh-token');
const UserModel = require('models/user-model');

// Load .env file
require('dotenv').config({ path: 'env/.env' });

const users = new Router();

// Jwt settings
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.ACCESS_TOKEN_JWT_SECRET,
};
passport.use(
  'jwt',
  new JwtStrategy(opts, function (jwt_payload, done) {
    console.log(jwt_payload);
    done(null, jwt_payload);
  }),
);

// OAuth settings
passport.use(
  'google',
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/api/users/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      const userEmail = profile.emails[0].value;
      let user = await User.findByEmail(userEmail);
      if (!user) {
        user = User({
          email: userEmail,
          provider: 'google',
          providerAccessToken: accessToken,
          providerId: profile.id,
          nickname: 'test', // TODO
        });
      } else {
        user.lastLoginAt = Date.now();
      }
      await user.save();
      done(null, new UserModel(user.id, user.email, user.nickname));
    },
  ),
);

// Define routes
users.get('/login', (ctx) => {
  ctx.body = '<a href="/api/users/auth/google">Login with Google</a>';
});

users.post(
  '/logout',
  passport.authenticate('jwt', {
    session: false,
  }),
  async (ctx) => {
    const { id: userId } = ctx.state.user.user;

    await RefreshToken.deleteAllByUserId(userId);

    ctx.body = {};
  },
);

users.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['email'] }),
);

users.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    session: false,
  }),
  async (ctx) => {
    // Generate access token
    const accessToken = jwt.sign(
      { user: ctx.state.user },
      process.env.ACCESS_TOKEN_JWT_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRE_TIME,
      },
    );

    // Generate refresh token
    const refreshToken = jwt.sign({}, process.env.REFRESH_TOKEN_JWT_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE_TIME,
    });

    // Save refresh token in database
    const decodedToken = jwt.decode(refreshToken);
    const expiryTime = decodedToken.exp;
    console.log(expiryTime);
    var expireDate = new Date(expiryTime * 1000);
    const refreshTokenEntity = RefreshToken({
      userId: ctx.state.user.id,
      tokenValue: refreshToken,
      expiresAt: expireDate,
    });
    await refreshTokenEntity.save();

    // Redirect to the extension with the token as a query parameter
    ctx.redirect(
      `https://${process.env.CHROME_EXTENSION_ID}.chromiumapp.org/api/users/auth/google/callback?token=${accessToken}&refreshToken=${refreshToken}`,
    );
  },
);

users.post('/auth/refresh', async (ctx) => {
  // Validate refresh token
  const { refreshToken } = ctx.request.body;
  if (!isValidToken(refreshToken, process.env.REFRESH_TOKEN_JWT_SECRET)) {
    return ctx.throw(400);
  }
  let refreshTokenEntity = await RefreshToken.findByTokenValue(refreshToken);
  if (!refreshTokenEntity) {
    return ctx.throw(400);
  }
  let user = await User.findById(refreshTokenEntity.userId);
  if (!user) {
    return ctx.throw(400);
  }

  // Generate access token
  let userModel = new UserModel(user.id, user.email, user.nickname);
  const accessToken = jwt.sign(
    { user: userModel },
    process.env.ACCESS_TOKEN_JWT_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE_TIME,
    },
  );

  ctx.body = {
    accessToken: accessToken,
  };
});

function isValidToken(token, secret) {
  try {
    jwt.verify(token, secret);
    return true;
  } catch (error) {
    // Token verification failed
    console.error('Token verification failed:', error.message);
    return false;
  }
}

module.exports = users;
