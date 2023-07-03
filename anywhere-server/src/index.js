const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const api = require('./api');

require('dotenv').config();

const app = new Koa();
const router = new Router();

router.use('/api', api.routes());

app.use(bodyParser());

app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 4000;

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

const comment = require('models/comment');
console.log(comment);

app.listen(port, () => {
  console.log('listening to port 4000');
});
