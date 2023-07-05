const passport = require('koa-passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const Router = require('koa-router');
// const userCtrl = require('./user.ctrl');
const User = require('models/user');
const UserModel = require('models/user-model');

// Load .env file
require('dotenv').config();

const users = new Router();

// Jwt settings
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
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
      callbackURL: '/api/users/auth/google/callback',
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

users.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['email'] }),
);

users.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    session: false,
  }),
  (ctx) => {
    // Generate JWT token
    const token = jwt.sign({ user: ctx.state.user }, process.env.JWT_SECRET);

    // Redirect to the profile page with the token as a query parameter
    ctx.redirect(
      `https://${process.env.CHROME_EXTENSION_ID}.chromiumapp.org/api/users/auth/google/callback?token=${token}`,
    );
    // ctx.redirect(`/profile?token=${token}`);
  },
);

module.exports = users;
