export const getUserFriendlyMessage = (body, defaultKey, t) => {
  if (body?.messageKey) {
    return t(body.messageKey, body.params || {});
  }
  if (body?.message) {
    return body.message;
  }
  return t(defaultKey);
};