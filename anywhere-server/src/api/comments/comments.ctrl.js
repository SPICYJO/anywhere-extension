const Comment = require('models/comment');

exports.createComment = async (ctx) => {
  const { targetUrl } = ctx.request.body;

  const comment = new Comment({
    targetUrl,
  });

  try {
    await comment.save();
  } catch (e) {
    return ctx.throw(500);
  }

  ctx.body = comment;
};

exports.list = (ctx) => {
  ctx.body = 'Hello';
};
