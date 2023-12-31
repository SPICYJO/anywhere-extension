const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const api = require('./api');
const passport = require('koa-passport');
const cors = require('@koa/cors');

// Load .env file
require('dotenv').config({ path: 'env/.env' });

// Logging settings
if (process.env.ENV === 'PROD') {
  console.log = function () {};
}

// Koa settings
const app = new Koa();
const router = new Router();

// CORS
app.use(
  cors({
    origin: process.env.CORS_ALLOW_ORIGIN,
  }),
);

// Initialize Passport (Auth)
app.use(passport.initialize());

// Api settings
router.use('/api', api.routes());
// Health check
router.get('/', (ctx) => {
  ctx.body = {
    state: 'ok',
  };
});
app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

// MongoDB settings
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose
  .connect(process.env.MONGO_URI, {
    // useMongoClient: true,
    useNewUrlParser: true,
  })
  .then((response) => {
    console.log(`Successfully connected to mongodb ${response}`);
  })
  .catch((e) => {
    console.error(e);
  });

// Listen to port
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log('listening to port 4000');
});
