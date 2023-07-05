import * as constants from "../utils/constants.js";
import {
  getCanonicalUrl,
  getSchemeAndHostAndPort,
} from "../utils/url-utils.js";

// Handle Google sign in
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startGoogleSignIn") {
    chrome.identity.launchWebAuthFlow(
      {
        url: `${constants.SERVER_ADDRESS}/api/users/auth/google`,
        interactive: true,
      },
      (redirectUrl) => {
        console.log(redirectUrl);
        // Handle the redirect URL or JWT response
        chrome.runtime.sendMessage({
          action: "authResult",
          authResult: redirectUrl,
        });
      }
    );
  }
});

// Comment action handler
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.action) {
    // Handle comment register
    case constants.ACTION_REGISTER_COMMENT:
      (async function () {
        let jwtToken = await chrome.storage.local.get(
          constants.STORAGE_KEY_AUTH_ACCESS_TOKEN
        );
        let jwtTokenExists =
          jwtToken &&
          jwtToken.hasOwnProperty(constants.STORAGE_KEY_AUTH_ACCESS_TOKEN);
        if (!jwtTokenExists) {
          console.log("Please sign in...");
          return;
        }

        try {
          const tabs = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          const currentTab = tabs[0];

          const response = await fetch(
            `${constants.SERVER_ADDRESS}/api/comments`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${
                  jwtToken[constants.STORAGE_KEY_AUTH_ACCESS_TOKEN]
                }`,
              },
              body: JSON.stringify({
                targetCanonicalUrl: getCanonicalUrl(currentTab.url),
                targetFullUrl: currentTab.url,
                content: request.content,
                schemeAndHostAndPort: getSchemeAndHostAndPort(currentTab.url),
              }),
            }
          );

          if (!response.ok) {
            throw new Error("Request failed with status: " + response.status);
          }

          const data = await response.json();
          sendResponse({ success: true, data: data });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      })();
      break;
    // Handle comment delete
    case constants.ACTION_DELETE_COMMENT:
      (async function () {
        let jwtToken = await chrome.storage.local.get(
          constants.STORAGE_KEY_AUTH_ACCESS_TOKEN
        );
        let jwtTokenExists =
          jwtToken &&
          jwtToken.hasOwnProperty(constants.STORAGE_KEY_AUTH_ACCESS_TOKEN);
        if (!jwtTokenExists) {
          console.log("Please sign in...");
          return;
        }

        try {
          const response = await fetch(
            `${constants.SERVER_ADDRESS}/api/comments/${request.commentId}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${
                  jwtToken[constants.STORAGE_KEY_AUTH_ACCESS_TOKEN]
                }`,
              }
            }
          );

          if (!response.ok) {
            throw new Error("Request failed with status: " + response.status);
          }

          const data = await response.json();
          sendResponse({ success: true, data: data });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      })();
      break;
    // Handle comments fetch
    case constants.ACTION_FETCH_COMMENTS:
      (async function () {
        try {
          const tabs = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          const currentTab = tabs[0];

          const page = request.page ?? 0;
          const size = request.size ?? 10;

          const response = await fetch(
            `${
              constants.SERVER_ADDRESS
            }/api/comments?targetCanonicalUrl=${encodeURIComponent(
              getCanonicalUrl(currentTab.url)
            )}&page=${page}&size=${size}`
          );

          if (!response.ok) {
            throw new Error("Request failed with status: " + response.status);
          }

          const data = await response.json();
          sendResponse({ success: true, data: data });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      })();
      break;

    default:
      break;
  }

  return true;
});
