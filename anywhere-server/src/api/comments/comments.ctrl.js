const Comment = require('models/comment');

exports.createComment = async (ctx) => {
  const { targetCanonicalUrl, targetFullUrl, content, schemeAndHostAndPort } =
    ctx.request.body;

  const { id: userId, nickname: userNickname } = ctx.state.user.user;

  const comment = new Comment({
    userId,
    userNickname,
    targetCanonicalUrl,
    targetFullUrl,
    content,
    schemeAndHostAndPort,
  });

  try {
    await comment.save();
  } catch (e) {
    return ctx.throw(500);
  }

  ctx.body = comment;
};

exports.updateComment = async (ctx) => {
  const {
    userId,
    userNickname,
    targetCanonicalUrl,
    targetFullUrl,
    content,
    schemeAndHostAndPort,
  } = ctx.request.body;

  const comment = new Comment({
    userId,
    userNickname,
    targetCanonicalUrl,
    targetFullUrl,
    content,
    schemeAndHostAndPort,
  });

  try {
    await comment.save();
  } catch (e) {
    return ctx.throw(500);
  }

  ctx.body = comment;
};

exports.listComments = async (ctx) => {
  // const { targetUrl } = ctx.request.body;

  const comments = await Comment.find({}).exec();

  ctx.body = comments;
};
