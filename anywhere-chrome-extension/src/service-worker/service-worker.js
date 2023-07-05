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

// Handle comments fetch
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === constants.ACTION_FETCH_COMMENTS) {
    // Perform the data fetch here
    fetch(`${constants.SERVER_ADDRESS}/api/comments`)
      .then((response) => response.json())
      .then((data) => {
        // Return the fetched data to the content script
        sendResponse({ success: true, data: data });
      })
      .catch((error) => {
        // Return the error message to the content script
        sendResponse({ success: false, error: error.message });
      });

    // Indicate that the response will be sent asynchronously
    return true;
  }
});

// Handle comment register
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  (async function () {
    if (request.action === constants.ACTION_REGISTER_COMMENT) {
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
    }
  })();

  return true;
});
