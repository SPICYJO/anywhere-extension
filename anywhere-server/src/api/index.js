const Router = require('koa-router');
const apiCtrl = require('./comments/comments.ctrl');
const users = require('./users');

const api = new Router();

// api.get('/', apiCtrl.list);
api.get('/comments', apiCtrl.list);
api.post('/comments', apiCtrl.createComment);

api.use('/users', users.routes());

module.exports = api;
