import { getAccessToken } from "../utils/auth-utils.js";
import * as constants from "../utils/constants.js";
import {
  getCanonicalUrl,
  getSchemeAndHostAndPort,
} from "../utils/url-utils.js";

// Handle Google sign in
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startGoogleSignIn") {
    console.log("startGoogleSignIn called");
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

// Handle sign out
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startSignOut") {
    (async function () {
      let accessToken = await getAccessToken();

      try {
        const response = await fetch(
          `${constants.SERVER_ADDRESS}/api/users/logout`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
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
  }
});

// Handle refresh token
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "refreshToken") {
    console.log("refreshToken called");
    (async function () {
      let refreshToken = (
        await chrome.storage.local.get(constants.STORAGE_KEY_AUTH_REFRESH_TOKEN)
      )[constants.STORAGE_KEY_AUTH_REFRESH_TOKEN];

      try {
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
          throw new Error("Request failed with status: " + response.status);
        }

        const data = await response.json();
        sendResponse({ success: true, data: data });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
  }
});

// Comment action handler
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.action) {
    // Handle comment register
    case constants.ACTION_REGISTER_COMMENT:
      (async function () {
        let jwtToken = await getAccessToken();
        if (!jwtToken) {
          console.log("Please sign in...");
          return;
        }
        console.log(jwtToken);

        // debugger;
        try {
          const tabs = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          console.log(tabs);
          const currentTab = tabs[0];

          const response = await fetch(
            `${constants.SERVER_ADDRESS}/api/comments`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${jwtToken}`,
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
    // Handle comment edit
    case constants.ACTION_EDIT_COMMENT:
      (async function () {
        let jwtToken = await getAccessToken();
        if (!jwtToken) {
          console.log("Please sign in...");
          return;
        }

        try {
          const response = await fetch(
            `${constants.SERVER_ADDRESS}/api/comments/${request.commentId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${jwtToken}`,
              },
              body: JSON.stringify({
                content: request.commentContent,
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
        let jwtToken = await getAccessToken();
        if (!jwtToken) {
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
                Authorization: `Bearer ${jwtToken}`,
              },
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
