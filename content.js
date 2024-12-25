// Function to check if an image is an Unsplash image using multiple detection strategies
function isUnsplashImage(img) {
  // Strategy 1: Check srcset URL pattern
  const srcset = img.getAttribute("srcset");
  if (!srcset) return false;

  const baseUrl = extractBaseUrl(srcset);
  if (
    !baseUrl.startsWith("https://images.unsplash.com/") ||
    baseUrl.includes("/profile-")
  ) {
    return false;
  }

  // Strategy 2: Check if image is in a typical Unsplash photo container
  const figure = img.closest("figure");
  if (figure) {
    // Check for typical Unsplash photo container structure
    const hasPhotoLinks =
      figure.querySelectorAll('a[href*="/photos/"]').length > 0;
    const hasDownloadButton =
      figure.querySelectorAll('a[href*="download"]').length > 0;
    if (hasPhotoLinks || hasDownloadButton) return true;
  }

  // Strategy 3: Check image attributes and properties
  const imgWidth = img.naturalWidth || img.width;
  const imgHeight = img.naturalHeight || img.height;
  // Unsplash images are typically high quality and larger than profile pictures
  if (imgWidth > 300 && imgHeight > 300) {
    // Check if image has typical Unsplash photo attributes
    const hasUnsplashAttributes =
      img.getAttribute("alt")?.toLowerCase().includes("photo") ||
      img.getAttribute("data-test")?.includes("photo") ||
      img.getAttribute("loading") === "lazy";
    if (hasUnsplashAttributes) return true;
  }

  // Strategy 4: Legacy class-based detection (as fallback)
  return (
    img.classList.contains("DVW3V") ||
    img.classList.contains("I7OuT") ||
    img.classList.contains("L1BOa")
  );
}

// Function to safely add the copy button using Shadow DOM
function addCopyButton(img) {
  // Skip if already processed
  if (img.classList.contains("SqNWg")) return;

  // Use the new detection function
  if (!isUnsplashImage(img)) return;

  // Ensure we don't duplicate the button
  if (img.parentElement.querySelector(".unsplash-copy-button-container"))
    return;

  // Extract the base URL from the srcset attribute
  const srcset = img.getAttribute("srcset");
  const baseUrl = extractBaseUrl(srcset);

  // Check if the URL matches the desired pattern and is not a profile image
  if (
    !baseUrl.startsWith("https://images.unsplash.com/") ||
    baseUrl.includes("/profile-")
  )
    return;

  // Create a container for the shadow DOM
  const shadowContainer = document.createElement("div");
  shadowContainer.className = "unsplash-copy-button-container";
  shadowContainer.style.position = "absolute";
  shadowContainer.style.top = "10px"; // Position at the top
  shadowContainer.style.left = "2%"; // Center horizontally
  shadowContainer.style.zIndex = "1"; // High z-index to ensure it's above other elements
  shadowContainer.style.pointerEvents = "auto"; // Ensure the button can be clicked

  // Create the shadow root
  const shadowRoot = shadowContainer.attachShadow({ mode: "open" });

  // Add hover effect using shadow DOM CSS
  const style = document.createElement("style");
  style.textContent = `
  .unsplash-copy-button {
    position: relative;
    z-index: 1;
    background-color: rgba(0, 0, 0, 0.4);
    color: #fff;
    border: 1px solid #e1e1e1;
    padding: 5px 10px;
    font-size: 12px;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.3s, color 0.3s;
    margin-bottom: 5px;
  }

  .unsplash-copy-button:hover {
    background-color: #3B136C; /* Change background on hover */
    color: #fff; /* Change text color on hover */
  }
`;
  shadowRoot.appendChild(style);

  // Create a button element inside the shadow DOM
  const copyButton = document.createElement("button");
  copyButton.textContent = "Copy Link";
  copyButton.className = "unsplash-copy-button"; // Apply the class to the button

  // Create a button element inside the shadow DOM
  const downloadButton = document.createElement("button");
  downloadButton.textContent = "Download";
  downloadButton.className = "unsplash-copy-button"; // Apply the class to the button

  const br = document.createElement("br");

  // Append the button to the shadow DOM
  shadowRoot.appendChild(copyButton);
  shadowRoot.appendChild(br);
  shadowRoot.appendChild(downloadButton);

  // Copy URL to clipboard on button click and prevent event propagation and default behavior
  copyButton.onclick = (event) => {
    event.stopPropagation();
    event.preventDefault();

    chrome.storage.sync.get(
      ["width", "height", "quality", "fit", "crop", "customQuery"],
      (settings) => {
        let baseUrl = extractBaseUrl(srcset);

        // Append user settings as query parameters to the URL
        const params = new URLSearchParams();
        if (settings.width) params.append("w", settings.width);
        if (settings.height) params.append("h", settings.height);
        if (settings.quality) params.append("q", settings.quality);
        if (settings.fit) params.append("fit", settings.fit);
        if (settings.crop) params.append("crop", settings.crop);
        if (settings.ar) params.append("ar", settings.crop);

        // If customQuery exists, parse it and add its key-value pairs to params
        if (settings.customQuery) {
          const customParams = new URLSearchParams(settings.customQuery);
          customParams.forEach((value, key) => {
            params.append(key, value);
          });
        }

        if (params.toString()) {
          baseUrl += "?" + params.toString();
        }

        navigator.clipboard.writeText(baseUrl).then(() => {
          copyButton.textContent = "Link Copied!";
          setTimeout(() => {
            copyButton.textContent = "Copy Link";
          }, 1000);
        });
      }
    );
  };

  // Handle "Download Image" button click
  downloadButton.onclick = (event) => {
    event.stopPropagation();
    event.preventDefault();

    chrome.storage.sync.get(
      ["width", "height", "quality", "fit", "crop", "customQuery"],
      (settings) => {
        let baseUrl = extractBaseUrl(img.getAttribute("srcset"));

        // Append user settings as query parameters to the URL
        const params = new URLSearchParams();
        if (settings.width) params.append("w", settings.width);
        if (settings.height) params.append("h", settings.height);
        if (settings.quality) params.append("q", settings.quality);
        if (settings.fit) params.append("fit", settings.fit);
        if (settings.crop) params.append("crop", settings.crop);
        if (settings.ar) params.append("ar", settings.crop);

        // If customQuery exists, parse it and add its key-value pairs to params
        if (settings.customQuery) {
          const customParams = new URLSearchParams(settings.customQuery);
          customParams.forEach((value, key) => {
            params.append(key, value);
          });
        }

        if (params.toString()) {
          baseUrl += "?" + params.toString();
        }

        // Extract image ID for a meaningful filename
        const imageIdMatch = baseUrl.match(
          /images\.unsplash\.com\/photo\/(\w+)/
        );
        const imageId = imageIdMatch ? imageIdMatch[1] : "unsplash-image";

        // Generate the filename using the new function
        const filename = generateFilename(imageId, settings);

        // Send a message to the background script to initiate the download
        chrome.runtime.sendMessage(
          {
            action: "downloadImage",
            url: baseUrl,
            filename: filename,
          },
          (response) => {
            if (response && response.success) {
              downloadButton.textContent = "Download Started!";
              setTimeout(() => {
                downloadButton.textContent = "Download";
              }, 1000);
            } else {
              console.error(`Download failed: ${response.message}`);
              downloadButton.textContent = "Download Failed!";
              setTimeout(() => {
                downloadButton.textContent = "Download";
              }, 1000);
            }
          }
        );
      }
    );
  };

  // Add shadow container to the image's parent container
  const container = img.parentElement;
  container.style.position = "relative"; // Ensure the parent is positioned to allow absolute positioning
  container.appendChild(shadowContainer);
}

// Function to extract the base URL from the srcset
function extractBaseUrl(srcset) {
  const regex = /(https:\/\/images\.unsplash\.com\/[^\s?]+)/;
  const match = srcset.match(regex);
  return match ? match[1] : ""; // Return the matched base URL or an empty string if not found
}

// MutationObserver to observe for images being added to the DOM
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) {
        // Ensure it is an element
        if (node.tagName === "IMG" && node.hasAttribute("srcset")) {
          addCopyButton(node);
        } else {
          // If it's not an image, check its children
          node.querySelectorAll("img[srcset]").forEach((img) => {
            addCopyButton(img);
          });
        }
      }
    });
  });
});

// Start observing the document body for added nodes
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Initial run to add buttons to already existing images
document.querySelectorAll("img[srcset]").forEach((img) => {
  addCopyButton(img);
});

/**
 * Generates a sanitized filename incorporating image ID and user-selected parameters.
 *
 * @param {string} imageId - The unique identifier of the image.
 * @param {Object} settings - User-selected settings for customizing the image URL.
 * @returns {string} - A sanitized filename string.
 */
function generateFilename(imageId, settings) {
  // Function to sanitize filename by removing invalid characters
  function sanitizeFilename(name) {
    return name.replace(/[^a-z0-9_\-\.]/gi, "_");
  }

  // Accumulate parameters for filename
  let paramsForFilename = [];

  if (settings.width) paramsForFilename.push(`w${settings.width}`);
  if (settings.height) paramsForFilename.push(`h${settings.height}`);
  if (settings.quality) paramsForFilename.push(`q${settings.quality}`);
  if (settings.fit) paramsForFilename.push(`fit${settings.fit}`);
  if (settings.crop) paramsForFilename.push(`crop${settings.crop}`);
  if (settings.ar) paramsForFilename.push(`ar${settings.ar}`);

  // Include custom query parameters if they exist
  if (settings.customQuery) {
    const customParams = new URLSearchParams(settings.customQuery);
    customParams.forEach((value, key) => {
      // Replace any spaces or special characters in key or value
      const safeKey = key.replace(/[^a-z0-9_\-]/gi, "");
      const safeValue = value.replace(/[^a-z0-9_\-]/gi, "");
      paramsForFilename.push(`${safeKey}${safeValue}`);
    });
  }

  // Join all parameters with a hyphen
  const paramsString = paramsForFilename.join("-");

  // Construct the final filename
  const baseFilename = sanitizeFilename(imageId);
  const filename = paramsString
    ? `${baseFilename}-${paramsString}.jpg`
    : `${baseFilename}.jpg`;

  return filename;
}
