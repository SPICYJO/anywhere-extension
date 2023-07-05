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

updateLoginUI();

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

function getQueryParam(url, param) {
  const searchParams = new URLSearchParams(new URL(url).search);
  return searchParams.get(param);
}
