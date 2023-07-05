// Handle Google sign in
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startGoogleSignIn") {
    chrome.identity.launchWebAuthFlow(
      {
        url: "http://localhost:4000/api/users/auth/google",
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
  if (request.action === "fetchComments") {
    // Perform the data fetch here
    fetch("http://localhost:4000/api/comments")
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
chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.action === "registerComment") {
    let jwtToken = await chrome.storage.local.get("jwtToken");
    let jwtTokenExists = jwtToken && jwtToken.hasOwnProperty("jwtToken");
    if (!jwtTokenExists) {
      console.log("Please sign in...");
      return;
    }

    // Perform the data fetch here
    fetch("http://localhost:4000/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken["jwtToken"]}`,
      },
      body: JSON.stringify({
        // Provide any data you want to send in the request body
        content: request.content,
        // ...
      }),
    })
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
