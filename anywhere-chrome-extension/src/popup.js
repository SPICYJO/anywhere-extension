document.getElementById("google-signin").addEventListener("click", () => {
  console.log("sign in called");
  chrome.runtime.sendMessage({ action: "startGoogleSignIn" });
});

document
  .getElementById("google-signout")
  .addEventListener("click", async () => {
    console.log("sign out called");
    await chrome.storage.local.remove("jwtToken");
    await updateLoginUI();
  });

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "authResult") {
    // Handle the authentication result or JWT response
    console.log(message.authResult);

    let jwtToken = getQueryParam(message.authResult, "token");
    await chrome.storage.local.set({ jwtToken: jwtToken });
    await updateLoginUI();
  }
});

document.getElementById("submit-button").addEventListener("click", () => {
  console.log("comment register called!");
  const content = document.getElementById("content-input").value;
  chrome.runtime.sendMessage({
    action: "registerComment",
    content: content,
  });
});

fetchComments();
updateLoginUI();
updateUrlUI();

/**
 * Fetch comments
 */
async function fetchComments() {
  chrome.runtime.sendMessage({ action: 'fetchComments' }, function(response) {
    // Handle the response from the background script
    if (response.success) {
      // Data fetched successfully, do something with it
      console.log(response.data);
    } else {
      // Error occurred while fetching data
      console.error(response.error);
    }
  });
}


/**
 * Update log in status UI
 */
async function updateLoginUI() {
  let jwtToken = await chrome.storage.local.get("jwtToken");
  console.log(jwtToken);
  let jwtTokenExists = jwtToken && jwtToken.hasOwnProperty("jwtToken");
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

  document.getElementById("current-url").innerText = currentTab.url;
}

function getQueryParam(url, param) {
  const searchParams = new URLSearchParams(new URL(url).search);
  return searchParams.get(param);
}
