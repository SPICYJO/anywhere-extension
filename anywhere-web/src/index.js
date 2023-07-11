import * as constants from "./utils/constants";
import { getTimeSinceString } from "./utils/date-utils";
import { getCanonicalUrl } from "./utils/url-utils";

console.log("Hello");

// State
let currentPage = 0;
let size = 5;
let totalPageCount = 1;
let targetCanonicalUrl;

updateUI();
onpopstate = updateUI;

function updateUI() {
  const currentUrl = new URL(location.href);
  const currentSearchParams = new URLSearchParams(currentUrl.search);
  const urlParam = currentSearchParams.get("url");
  const pageParam = currentSearchParams.get("page");
  const sizeParam = currentSearchParams.get("size");

  if (urlParam) {
    const targetUrl = decodeURIComponent(urlParam);
    targetCanonicalUrl = getCanonicalUrl(targetUrl);
    document.getElementById("url-input").value = targetCanonicalUrl;
  } else {
    targetCanonicalUrl = undefined;
    document.getElementById("url-input").value = "";
  }
  if (pageParam) {
    currentPage = Number(pageParam) - 1;
  } else {
    currentPage = 0;
  }
  if (sizeParam) {
    size = Number(sizeParam);
  } else {
    size = 5;
  }

  updateComments(targetCanonicalUrl, currentPage, size);
}

/**
 * Fetch comments and update the UI
 * @param {*} targetCanonicalUrl
 * @param {*} page
 * @param {*} size
 */
async function updateComments(targetCanonicalUrl, page, size) {
  // Fetch data
  const url = targetCanonicalUrl
    ? `${
        constants.SERVER_ADDRESS
      }/api/comments?targetCanonicalUrl=${encodeURIComponent(
        targetCanonicalUrl
      )}&page=${page}&size=${size}`
    : `${constants.SERVER_ADDRESS}/api/comments?page=${page}&size=${size}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Request failed with status: " + response.status);
  }
  const data = await response.json();

  // Update UI
  const commentList = document.querySelector(".comment-list");
  while (commentList.firstChild) {
    commentList.removeChild(commentList.firstChild);
  }

  const nowString = new Date().toISOString();
  for (let comment of data.contents) {
    const template = document.querySelector("#comment-template");
    const commentInstance = document.importNode(
      template.content.firstElementChild,
      true
    );
    const authorElement = commentInstance.querySelector(".comment-author");
    authorElement.textContent = comment.userNickname;
    const textElement = commentInstance.querySelector(".comment-text");
    textElement.textContent = comment.content;
    const urlElement = commentInstance.querySelector(".target-url-button");
    urlElement.href = comment.targetCanonicalUrl;
    const urlTextElement = commentInstance.querySelector(".comment-target-url");
    urlTextElement.textContent = comment.targetCanonicalUrl;
    const urlDivElement = commentInstance.querySelector(".comment-target-div");
    urlDivElement.addEventListener("click", function () {
      console.log("dddd");

      let currentUrl = new URL(location.href);
      let currentSearchParams = new URLSearchParams(currentUrl.search);
      currentSearchParams.set("url", comment.targetCanonicalUrl);
      currentSearchParams.set("page", 1);
      currentUrl.search = currentSearchParams.toString();
      targetCanonicalUrl = comment.targetCanonicalUrl;
      currentPage = 0;

      history.pushState({}, "", currentUrl.toString());
      updateUI();
    });
    const createdDateElement =
      commentInstance.querySelector(".registered-date");
    createdDateElement.textContent = getTimeSinceString(
      comment.createdAt,
      nowString
    );
    commentList.appendChild(commentInstance);
  }
  if (data.contents.length === 0) {
    const textNode = document.createTextNode("There is no comment here yet.");
    commentList.appendChild(textNode);
  }

  totalPageCount = data.totalPageCount;
  renderPagination(currentPage, totalPageCount);
}

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

  let currentUrl = new URL(location.href);
  let currentSearchParams = new URLSearchParams(currentUrl.search);
  currentSearchParams.set("page", nextPage + 1);
  currentUrl.search = currentSearchParams.toString();

  history.pushState({}, "", currentUrl.toString());
  updateComments(targetCanonicalUrl, currentPage, size);
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
