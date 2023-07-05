const Router = require('koa-router');
const apiCtrl = require('./comments/comments.ctrl');
const users = require('./users');
const passport = require('koa-passport');

const api = new Router();

// api.get('/', apiCtrl.list);
api.get('/comments', apiCtrl.listComments);
api.post(
  '/comments',
  passport.authenticate('jwt', {
    session: false,
  }),
  apiCtrl.createComment,
);

api.use('/users', users.routes());

module.exports = api;
