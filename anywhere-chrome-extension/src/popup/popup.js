import * as constants from "../utils/constants.js";
import { getTimeSinceString } from "../utils/date-utils.js";
import { getCanonicalUrl } from "../utils/url-utils.js";

fetchComments();
updateLoginUI();
updateUrlUI();

// UI event handlers
document.getElementById("google-signin").addEventListener("click", () => {
  console.log("sign in called");
  chrome.runtime.sendMessage({ action: "startGoogleSignIn" });
});

document
  .getElementById("google-signout")
  .addEventListener("click", async () => {
    console.log("sign out called");
    await chrome.storage.local.remove(constants.STORAGE_KEY_AUTH_ACCESS_TOKEN);
    await updateLoginUI();
  });

document.getElementById("submit-button").addEventListener("click", async () => {
  console.log("comment register called!");
  const content = document.getElementById("content-input").value;
  const response = await chrome.runtime.sendMessage({
    action: constants.ACTION_REGISTER_COMMENT,
    content: content,
  });
  if (response.success) {
    console.log(response.data);
    const nowString = new Date().toISOString();

    const commentList = document.querySelector(".comment-list");

    let comment = response.data;
    const template = document.querySelector("#comment-template");
    const commentInstance = document.importNode(template.content, true);

    const authorElement = commentInstance.querySelector(".comment-author");
    authorElement.textContent = comment.userNickname;

    const textElement = commentInstance.querySelector(".comment-text");
    textElement.textContent = comment.content;

    const createdDateElement =
      commentInstance.querySelector(".registered-date");
    createdDateElement.textContent = getTimeSinceString(
      comment.createdAt,
      nowString
    );

    commentList.insertBefore(commentInstance, commentList.firstChild);
  } else {
    console.log("Register failed...");
  }
});

// message handlers
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "authResult") {
    // Handle the authentication result or JWT response
    console.log(message.authResult);

    let jwtToken = getQueryParam(message.authResult, "token");
    await chrome.storage.local.set({ jwtToken: jwtToken });
    await updateLoginUI();
  }
});

// helper functions

/**
 * Fetch comments
 */
async function fetchComments() {
  const response = await chrome.runtime.sendMessage({
    action: constants.ACTION_FETCH_COMMENTS,
  });

  if (response.success) {
    console.log(response.data);
    const commentList = document.querySelector(".comment-list");
    while (commentList.firstChild) {
      commentList.removeChild(commentList.firstChild);
    }

    const nowString = new Date().toISOString();

    for (let comment of response.data) {
      const template = document.querySelector("#comment-template");
      const commentInstance = document.importNode(template.content, true);

      const authorElement = commentInstance.querySelector(".comment-author");
      authorElement.textContent = comment.userNickname;

      const textElement = commentInstance.querySelector(".comment-text");
      textElement.textContent = comment.content;

      const createdDateElement =
        commentInstance.querySelector(".registered-date");
      createdDateElement.textContent = getTimeSinceString(
        comment.createdAt,
        nowString
      );

      commentList.appendChild(commentInstance);
    }
  } else {
    console.log("Fetch failed...");
  }
}

/**
 * Update log in status UI
 */
async function updateLoginUI() {
  let jwtToken = await chrome.storage.local.get(
    constants.STORAGE_KEY_AUTH_ACCESS_TOKEN
  );
  console.log(jwtToken);
  let jwtTokenExists =
    jwtToken &&
    jwtToken.hasOwnProperty(constants.STORAGE_KEY_AUTH_ACCESS_TOKEN);
  debugger;
  if (jwtTokenExists) {
    document.getElementById("google-signin").classList.add("hidden");
    document.getElementById("google-signout").classList.remove("hidden");
  } else {
    document.getElementById("google-signin").classList.remove("hidden");
    document.getElementById("google-signout").classList.add("hidden");
  }
}

/**
 * Update url UI
 */
async function updateUrlUI() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];

  document.getElementById("current-url").innerText = getCanonicalUrl(
    currentTab.url
  );
}

function getQueryParam(url, param) {
  const searchParams = new URLSearchParams(new URL(url).search);
  return searchParams.get(param);
}
