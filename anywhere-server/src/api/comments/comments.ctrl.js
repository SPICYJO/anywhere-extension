const Comment = require('models/comment');
const User = require('models/user');
const ObjectId = require('mongoose').Types.ObjectId;
const MAX_NICKNAME_LENGTH = 30;
const MAX_URL_LENGTH = 65535;
const MAX_HOST_LENGTH = 300;
const MAX_CONTENT_LENGTH = 500;

/**
 * List comments
 * @param {} ctx
 */
exports.listComments = async (ctx) => {
  // Request
  const { page, size, targetCanonicalUrl } = ctx.query;

  // Validation
  if (
    page < 0 ||
    page >= 2048 ||
    size < 0 ||
    size > 50 ||
    targetCanonicalUrl.length > MAX_URL_LENGTH
  ) {
    return ctx.throw(400);
  }

  // Action
  const comments = await Comment.findByTargetCanonicalUrl(
    targetCanonicalUrl,
    page,
    size,
  );

  // Response
  ctx.body = comments;
};

/**
 * Create comment
 * @param {*} ctx
 * @returns
 */
exports.createComment = async (ctx) => {
  // Request
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

  // Validation
  const user = await User.findById(userId);
  if (
    !user ||
    isEmptyString(userId) ||
    isEmptyString(targetCanonicalUrl) ||
    isEmptyString(targetFullUrl) ||
    !isValidContent(content) ||
    isEmptyString(schemeAndHostAndPort) ||
    userNickname.length > MAX_NICKNAME_LENGTH ||
    targetCanonicalUrl.length > MAX_URL_LENGTH ||
    targetFullUrl.length > MAX_URL_LENGTH ||
    schemeAndHostAndPort.length > MAX_HOST_LENGTH
  ) {
    return ctx.throw(400);
  }

  // Action
  try {
    await comment.save();
  } catch (e) {
    return ctx.throw(500);
  }

  // Response
  ctx.body = comment;
};

/**
 * Update comment
 * @param {*} ctx
 * @returns
 */
exports.updateComment = async (ctx) => {
  // Request
  const { commentId } = ctx.params;
  const { id: userId, nickname: userNickname } = ctx.state.user.user;
  const { content } = ctx.request.body;

  // Validation
  if (!ObjectId.isValid(commentId)) {
    return ctx.throw(400);
  }
  const comment = await Comment.findById(commentId);
  if (comment.userId !== userId) {
    return ctx.throw(400);
  }
  if (content) {
    if (!isValidContent(content)) {
      return ctx.throw(400);
    }
    comment.content = content;
  }
  if (
    userNickname &&
    !isEmptyString(userNickname) &&
    userNickname.length <= MAX_NICKNAME_LENGTH
  ) {
    comment.userNickname = userNickname;
  }

  // Action
  comment.modifiedAt = Date.now();
  try {
    await comment.save();
  } catch (e) {
    return ctx.throw(500);
  }

  // Response
  ctx.body = comment;
};

/**
 * Delete comment
 * @param {*} ctx
 * @returns
 */
exports.deleteComment = async (ctx) => {
  // Request
  const { commentId } = ctx.params;
  const { id: userId } = ctx.state.user.user;

  // Validation
  if (!ObjectId.isValid(commentId)) {
    return ctx.throw(400);
  }
  const comment = await Comment.findById(commentId);
  if (comment.userId !== userId) {
    return ctx.throw(400);
  }

  // Action
  try {
    await comment.deleteOne();
  } catch (e) {
    return ctx.throw(500);
  }

  // Response
  ctx.body = comment;
};

function isValidContent(content) {
  if (!content) {
    return false;
  }

  if (content.trim().length === 0) {
    return false;
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return false;
  }

  return true;
}

function isEmptyString(content) {
  if (!content) {
    return true;
  }

  if (content.trim().length === 0) {
    return true;
  }

  return false;
}