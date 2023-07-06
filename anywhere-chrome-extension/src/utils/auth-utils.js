import { jwt_decode } from "../vendors/jwt-decode.js";
import * as constants from "./constants.js";

/**
 * Get JWT access token
 * If valid access token is stored in chrome storage, return token from storage
 * If valid access token is not in chrome storage and refresh token is in chrome storage, request access token from server and return it
 * If refresh token is invalid, return null
 * @returns
 */
export async function getAccessToken() {
  // debugger;
  let jwtToken = (
    await chrome.storage.local.get(constants.STORAGE_KEY_AUTH_ACCESS_TOKEN)
  )[constants.STORAGE_KEY_AUTH_ACCESS_TOKEN];

  let decodedAuthInfo = jwtToken ? jwt_decode(jwtToken) : null;
  let expiresAt = decodedAuthInfo ? decodedAuthInfo.exp : null;
  console.log(decodedAuthInfo);
  var currentTime = Math.floor(Date.now() / 1000);

  // Stored access token is not valid
  if (!expiresAt || expiresAt < currentTime) {
    await chrome.storage.local.remove(constants.STORAGE_KEY_AUTH_ACCESS_TOKEN);

    // Check refresh token validity
    let refreshToken = (
      await chrome.storage.local.get(constants.STORAGE_KEY_AUTH_REFRESH_TOKEN)
    )[constants.STORAGE_KEY_AUTH_REFRESH_TOKEN];
    let decodedAuthInfo2 = refreshToken ? jwt_decode(refreshToken) : null;
    let expiresAt2 = decodedAuthInfo2 ? decodedAuthInfo2.exp : null;
    if (!expiresAt2 || expiresAt2 < currentTime) {
      await chrome.storage.local.remove(
        constants.STORAGE_KEY_AUTH_REFRESH_TOKEN
      );
      return null;
    }

    // Request access token to server
    const response = await fetch(
      `${constants.SERVER_ADDRESS}/api/users/auth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken: refreshToken,
        }),
      }
    );

    if (!response.ok) {
      // throw new Error("Request failed with status: " + response.status);
      return null;
    }
    const data = await response.json();
    await chrome.storage.local.set({
      jwtToken: data.accessToken,
    });
    return data.accessToken;
  }
  // Stored access token is valid
  else {
    return jwtToken;
  }
}