const Router = require('koa-router');
const apiCtrl = require('./api.ctrl');

const api = new Router();

// api.get('/', apiCtrl.list);

api.post('/comments', apiCtrl.createComment);

module.exports = api;
