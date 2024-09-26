// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "downloadImage") {
    const { url, filename } = request;

    // Initiate the download
    chrome.downloads.download(
      {
        url: url,
        filename: filename,
        saveAs: true, // Prompt the user with the Save As dialog
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error(`Download failed: ${chrome.runtime.lastError.message}`);
          sendResponse({
            success: false,
            message: chrome.runtime.lastError.message,
          });
        } else {
          console.log(`Download started with ID: ${downloadId}`);
          sendResponse({ success: true, downloadId: downloadId });
        }
      }
    );

    return true;
  }
});
