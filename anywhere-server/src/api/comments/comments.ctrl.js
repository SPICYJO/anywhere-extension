const Comment = require('models/comment');

/**
 * Create comment
 * @param {*} ctx 
 * @returns 
 */
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

/**
 * Update comment
 * @param {} ctx 
 * @returns 
 */
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

/**
 * Delete comment
 * @param {*} ctx 
 * @returns 
 */
exports.deleteComment = async (ctx) => {
  const { commentId } = ctx.params;
  const { id: userId } = ctx.state.user.user;

  const comment = await Comment.findById(commentId);

  if (comment.userId !== userId) {
    return ctx.throw(400);
  }

  try {
    await comment.deleteOne();
  } catch (e) {
    return ctx.throw(500);
  }

  ctx.body = comment;
};

/**
 * List comments
 * @param {} ctx 
 */
exports.listComments = async (ctx) => {
  // const { targetUrl } = ctx.request.body;
  const { page, size, targetCanonicalUrl } = ctx.query;

  const comments = await Comment.findByTargetCanonicalUrl(
    targetCanonicalUrl,
    page,
    size,
  );

  ctx.body = comments;
};
