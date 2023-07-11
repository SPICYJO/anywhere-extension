import { getAccessToken } from "../utils/auth-utils.js";
import * as constants from "../utils/constants.js";
import { getTimeSinceString } from "../utils/date-utils.js";
import { getCanonicalUrl } from "../utils/url-utils.js";
import { jwt_decode } from "../vendors/jwt-decode.js";

var currentPage = 0;
var totalPageCount = 1;

fetchComments();
updateLoginUI();
updateUrlUI();

// UI event handlers
document.getElementById("google-signin").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "startGoogleSignIn" });
});

document
  .getElementById("change-nickname")
  .addEventListener("click", async function () {
    let jwtToken = await getAccessToken();
    let decodedAuthInfo = jwt_decode(jwtToken);
    let userNickname = decodedAuthInfo.user.nickname;
    let nickname = prompt("Please enter new nickname.", userNickname);
    if (nickname) {
      const response = await chrome.runtime.sendMessage({
        action: constants.ACTION_CHANGE_NICKNAME,
        nickname: nickname,
      });
      if (response.success) {
        document.getElementById("nickname-text").textContent = nickname;
      } else {
      }
    }
  });

// Handle pagination click
function handlePaginationClick(event) {
  event.preventDefault();

  // Get the clicked page number or navigation action
  const page = event.target.getAttribute("data-page");

  let nextPage;
  if (page === "prev") {
    nextPage = currentPage - 1;
  } else if (page === "next") {
    nextPage = currentPage + 1;
  } else {
    nextPage = Number(page);
  }
  if (nextPage < 0 || nextPage >= totalPageCount) {
    return;
  }
  if (currentPage === nextPage) {
    return;
  }

  currentPage = nextPage;
  fetchComments();
}
function renderPagination(currentPage, totalPageCount) {
  const paginationContainer = document.querySelector(".comment-pagination");
  paginationContainer.innerHTML = "";

  // Render previous page link
  const prevPageLink = createPaginationLink("<", currentPage - 1);
  paginationContainer.appendChild(prevPageLink);

  // Render page numbers or ellipsis
  if (totalPageCount <= 5) {
    // Render all page numbers
    for (let page = 0; page < totalPageCount; page++) {
      const pageLink = createPaginationLink(page + 1, page);
      paginationContainer.appendChild(pageLink);
    }
  } else {
    // Render ellipsis and limited page numbers
    if (currentPage <= 2) {
      // Render first 5 page numbers
      for (let page = 0; page < 5; page++) {
        const pageLink = createPaginationLink(page + 1, page);
        paginationContainer.appendChild(pageLink);
      }
      // Render ellipsis
      const ellipsis = createEllipsis();
      paginationContainer.appendChild(ellipsis);
    } else if (currentPage > totalPageCount - 3) {
      // Render last 5 page numbers
      const ellipsis = createEllipsis();
      paginationContainer.appendChild(ellipsis);
      for (let page = totalPageCount - 5; page < totalPageCount; page++) {
        const pageLink = createPaginationLink(page + 1, page);
        paginationContainer.appendChild(pageLink);
      }
    } else {
      // Render current page and surrounding page numbers
      const ellipsisStart = createEllipsis();
      paginationContainer.appendChild(ellipsisStart);

      for (let page = currentPage - 2; page <= currentPage + 2; page++) {
        const pageLink = createPaginationLink(page + 1, page);
        paginationContainer.appendChild(pageLink);
      }

      const ellipsisEnd = createEllipsis();
      paginationContainer.appendChild(ellipsisEnd);
    }
  }

  // Render next page link
  const nextPageLink = createPaginationLink(">", currentPage + 1);
  paginationContainer.appendChild(nextPageLink);

  document.querySelectorAll(".comment-pagination-link").forEach((link) => {
    link.addEventListener("click", handlePaginationClick);
  });
}
function createPaginationLink(text, page) {
  const link = document.createElement("a");
  link.href = "#";
  link.classList.add("comment-pagination-link");
  if (page === currentPage) {
    link.classList.add("active");
  }
  link.textContent = text;
  link.setAttribute("data-page", page);
  return link;
}

function createEllipsis() {
  const ellipsis = document.createElement("span");
  ellipsis.classList.add("comment-pagination-ellipsis");
  ellipsis.textContent = "...";
  return ellipsis;
}

document
  .getElementById("google-signout")
  .addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ action: "startSignOut" });
    await chrome.storage.local.remove(constants.STORAGE_KEY_AUTH_ACCESS_TOKEN);
    await chrome.storage.local.remove(constants.STORAGE_KEY_AUTH_REFRESH_TOKEN);
    await updateLoginUI();
  });

let registerCommentFunction = async () => {
  const content = document.getElementById("content-input").value;

  if (!content || content.trim() === "") {
    return;
  }

  const response = await chrome.runtime.sendMessage({
    action: constants.ACTION_REGISTER_COMMENT,
    content: content,
  });
  if (response.success) {
    const nowString = new Date().toISOString();

    const commentList = document.querySelector(".comment-list");

    let comment = response.data;
    const template = document.querySelector("#comment-template");
    const commentInstance = document.importNode(
      template.content.firstElementChild,
      true
    );

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

    const editButton = commentInstance.querySelector(".edit-button");
    editButton.classList.remove("hidden");
    editButton.addEventListener("click", async function () {
      let editedContent = prompt("Please update the comment.", comment.content);
      if (editedContent) {
        const response = await chrome.runtime.sendMessage({
          action: constants.ACTION_EDIT_COMMENT,
          commentId: comment._id,
          commentContent: editedContent,
        });
        if (response.success) {
          textElement.textContent = editedContent;
        } else {
        }
      }
    });

    const deleteButton = commentInstance.querySelector(".delete-button");
    deleteButton.classList.remove("hidden");
    deleteButton.addEventListener("click", async function () {
      let confirmed = confirm("Are you sure to delete this comment?");
      if (confirmed) {
        const response = await chrome.runtime.sendMessage({
          action: constants.ACTION_DELETE_COMMENT,
          commentId: comment._id,
        });
        if (response.success) {
          commentInstance.remove();
        } else {
        }
      }
    });

    commentList.insertBefore(commentInstance, commentList.firstChild);
    document.getElementById("content-input").value = "";
  } else {
  }
};

// submit keyboard shortcut
document
  .getElementById("content-input")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      registerCommentFunction();
    }
  });

// submit button click
document
  .getElementById("submit-button")
  .addEventListener("click", registerCommentFunction);

// message handlers
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "authResult") {
    // Handle the authentication result or JWT response

    let jwtToken = getQueryParam(message.authResult, "token");
    let refreshToken = getQueryParam(message.authResult, "refreshToken");
    await chrome.storage.local.set({
      jwtToken: jwtToken,
      refreshToken: refreshToken,
    });
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
    page: currentPage,
    size: 5,
  });

  if (response.success) {
    const commentList = document.querySelector(".comment-list");

    let jwtToken = await getAccessToken(false);

    let decodedAuthInfo = jwtToken ? jwt_decode(jwtToken) : null;
    let currentUserId = decodedAuthInfo ? decodedAuthInfo.user.id : null;

    while (commentList.firstChild) {
      commentList.removeChild(commentList.firstChild);
    }

    const nowString = new Date().toISOString();

    for (let comment of response.data.contents) {
      const template = document.querySelector("#comment-template");
      const commentInstance = document.importNode(
        template.content.firstElementChild,
        true
      );

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

      const editButton = commentInstance.querySelector(".edit-button");
      const deleteButton = commentInstance.querySelector(".delete-button");

      if (comment.userId === currentUserId) {
        editButton.classList.remove("hidden");
        editButton.addEventListener("click", async function () {
          let editedContent = prompt(
            "Please update the comment.",
            comment.content
          );
          if (editedContent) {
            const response = await chrome.runtime.sendMessage({
              action: constants.ACTION_EDIT_COMMENT,
              commentId: comment._id,
              commentContent: editedContent,
            });
            if (response.success) {
              textElement.textContent = editedContent;
            } else {
            }
          }
        });

        deleteButton.classList.remove("hidden");
        deleteButton.addEventListener("click", async function () {
          let confirmed = confirm("Are you sure to delete this comment?");
          if (confirmed) {
            const response = await chrome.runtime.sendMessage({
              action: constants.ACTION_DELETE_COMMENT,
              commentId: comment._id,
            });
            if (response.success) {
              commentInstance.remove();
            } else {
            }
          }
        });
      }

      commentList.appendChild(commentInstance);
    }

    totalPageCount = response.data.totalPageCount;
    renderPagination(currentPage, totalPageCount);
  } else {
  }
}

/**
 * Update log in status UI
 */
async function updateLoginUI() {
  let jwtToken = await getAccessToken(false);
  if (jwtToken) {
    document.getElementById("google-signin").classList.add("hidden");
    document.getElementById("google-signout").classList.remove("hidden");
    document.getElementById("signed-in-text").classList.remove("hidden");
    document.getElementById("signed-in-div").classList.remove("hidden");
    document.getElementById("signed-out-text").classList.add("hidden");
    document.getElementById("content-input").disabled = false;
    document.getElementById("content-input").textContent = "";
    document.getElementById("submit-button").disabled = false;

    let decodedAuthInfo = jwt_decode(jwtToken);
    let userNickname = decodedAuthInfo.user.nickname;
    document.getElementById("nickname-text").textContent = userNickname;
  } else {
    document.getElementById("google-signin").classList.remove("hidden");
    document.getElementById("google-signout").classList.add("hidden");
    document.getElementById("signed-in-text").classList.add("hidden");
    document.getElementById("signed-in-div").classList.add("hidden");
    document.getElementById("signed-out-text").classList.remove("hidden");
    Array.from(document.getElementsByClassName("delete-button")).forEach(
      (ele) => {
        ele.classList.add("hidden");
      }
    );
    Array.from(document.getElementsByClassName("edit-button")).forEach(
      (ele) => {
        ele.classList.add("hidden");
      }
    );
    document.getElementById("content-input").disabled = true;
    document.getElementById("content-input").textContent =
      "Please sign in to write a comment.";
    document.getElementById("submit-button").disabled = true;
  }
}

/**
 * Update url UI
 */
async function updateUrlUI() {
  const tabs = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  const currentTab = tabs[0];

  document.getElementById("current-url").innerText = getCanonicalUrl(
    currentTab.url
  );
}

function getQueryParam(url, param) {
  const searchParams = new URLSearchParams(new URL(url).search);
  return searchParams.get(param);
}
