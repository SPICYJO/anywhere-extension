// JWT decode library
// Imported from: https://github.com/auth0/jwt-decode

function InvalidTokenError(message) {
  this.message = message;
}

InvalidTokenError.prototype = new Error();
InvalidTokenError.prototype.name = "InvalidTokenError";

function b64DecodeUnicode(str) {
  return decodeURIComponent(
    atob(str).replace(/(.)/g, function (m, p) {
      var code = p.charCodeAt(0).toString(16).toUpperCase();
      if (code.length < 2) {
        code = "0" + code;
      }
      return "%" + code;
    })
  );
}

export function base64_url_decode(str) {
  var output = str.replace(/-/g, "+").replace(/_/g, "/");
  switch (output.length % 4) {
    case 0:
      break;
    case 2:
      output += "==";
      break;
    case 3:
      output += "=";
      break;
    default:
      throw new Error("base64 string is not of the correct length");
  }

  try {
    return b64DecodeUnicode(output);
  } catch (err) {
    return atob(output);
  }
}

export function jwt_decode(token, options) {
  if (typeof token !== "string") {
    throw new InvalidTokenError("Invalid token specified: must be a string");
  }

  options = options || {};
  var pos = options.header === true ? 0 : 1;

  var part = token.split(".")[pos];
  if (typeof part !== "string") {
    throw new InvalidTokenError(
      "Invalid token specified: missing part #" + (pos + 1)
    );
  }

  try {
    var decoded = base64_url_decode(part);
  } catch (e) {
    throw new InvalidTokenError(
      "Invalid token specified: invalid base64 for part #" +
        (pos + 1) +
        " (" +
        e.message +
        ")"
    );
  }

  try {
    return JSON.parse(decoded);
  } catch (e) {
    throw new InvalidTokenError(
      "Invalid token specified: invalid json for part #" +
        (pos + 1) +
        " (" +
        e.message +
        ")"
    );
  }
}
