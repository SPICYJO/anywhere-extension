import { getAccessToken, refreshAccessToken } from "../utils/auth-utils.js";
import * as constants from "../utils/constants.js";
import {
  getCanonicalUrl,
  getSchemeAndHostAndPort,
} from "../utils/url-utils.js";

// Badge - Initialize
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "0",
  });
});

// Badge - Listen to active tab change event
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const activeTab = await chrome.tabs.get(activeInfo.tabId);
  if (!activeTab.url) {
    return;
  }

  updateBadgeCount(activeTab.url, activeInfo.tabId);
});

// Badge - Listen to tab url change event
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId && tab.url && tab.status === "complete") {
    updateBadgeCount(tab.url, tabId);
  }
});

async function updateBadgeCount(url, tabId) {
  const canonicalUrl = getCanonicalUrl(url);
  const response = await fetch(
    `${
      constants.SERVER_ADDRESS
    }/api/comments/count?targetCanonicalUrl=${encodeURIComponent(
      canonicalUrl
    )}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Request failed with status: " + response.status);
  }

  const { count } = await response.json();
  const countString = count > 999 ? "999+" : `${count}`;
  chrome.action.setBadgeText({
    ...(tabId && { tabId }),
    text: countString,
  });
}

async function increaseBadgeCount(delta, tabId) {
  const text = await chrome.action.getBadgeText({ tabId });

  if (text === "999+") {
    return;
  }

  let currentCount = Number(text);
  if (typeof currentCount !== "number" || currentCount === NaN) {
    return;
  }
  currentCount = currentCount + delta;
  const countString = currentCount > 999 ? "999+" : `${currentCount}`;
  chrome.action.setBadgeText({
    ...(tabId && { tabId }),
    text: countString,
  });
}

// Handle Google sign in
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startGoogleSignIn") {
    chrome.identity.launchWebAuthFlow(
      {
        url: `${constants.SERVER_ADDRESS}/api/users/auth/google`,
        interactive: true,
      },
      (redirectUrl) => {
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

      if (!accessToken) {
        sendResponse({ success: true, data: {} });
        return;
      }

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

// Comment action handler
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.action) {
    // Handle comment register
    case constants.ACTION_REGISTER_COMMENT:
      (async function () {
        let jwtToken = await getAccessToken();
        if (!jwtToken) {
          return;
        }

        // debugger;
        try {
          const tabs = await chrome.tabs.query({
            active: true,
            lastFocusedWindow: true,
          });
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
          increaseBadgeCount(1, currentTab.id);
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
          return;
        }

        const tabs = await chrome.tabs.query({
          active: true,
          lastFocusedWindow: true,
        });
        const currentTab = tabs[0];

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
          increaseBadgeCount(-1, currentTab.id);
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
            lastFocusedWindow: true,
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
    // Handle change nickname
    case constants.ACTION_CHANGE_NICKNAME:
      (async function () {
        let jwtToken = await getAccessToken();
        if (!jwtToken) {
          return;
        }

        try {
          const response = await fetch(
            `${constants.SERVER_ADDRESS}/api/users/nickname`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${jwtToken}`,
              },
              body: JSON.stringify({
                nickname: request.nickname,
              }),
            }
          );

          if (!response.ok) {
            throw new Error("Request failed with status: " + response.status);
          }

          const data = await response.json();
          refreshAccessToken();
          sendResponse({ success: true, data: data });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      })();
      break;
    // Handle access token refresh
    case constants.ACTION_REFRESH_ACCESS_TOKEN:
      (async function () {
        try {
          // debugger;
          const response = await fetch(
            `${constants.SERVER_ADDRESS}/api/users/auth/refresh`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                refreshToken: request.refreshToken,
              }),
            }
          );

          if (!response.ok) {
            throw new Error("Request failed with status: " + response.status);
          }

          const data = await response.json();
          sendResponse({ success: true, data: data });
        } catch (error) {
          throw error;
          // sendResponse({ success: false, error: error.message });
        }
      })();
      break;
    default:
      break;
  }

  return true;
});
