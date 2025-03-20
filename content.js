// Function to check if an image is an Unsplash image using multiple detection strategies
function isUnsplashImage(img) {
  // First check if the image is too small
  const imgWidth =
    img.naturalWidth || img.width || parseInt(img.getAttribute("width")) || 0;
  const imgHeight =
    img.naturalHeight ||
    img.height ||
    parseInt(img.getAttribute("height")) ||
    0;

  // Skip small images (like thumbnails and icons)
  if (imgWidth <= 200 || imgHeight <= 200) {
    return false;
  }

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

  // Strategy 2: Check for semantic markup with itemprop attributes
  if (img.hasAttribute("itemprop")) {
    const itemprop = img.getAttribute("itemprop");
    if (itemprop === "thumbnailUrl" || itemprop === "contentUrl") {
      // Additional size check for thumbnails
      const sizes = img.getAttribute("sizes");
      if (sizes && sizes.includes("1x1")) {
        return false;
      }
      return true;
    }
  }

  // Strategy 3: Check for parent elements with stable data attributes
  const figure = img.closest("figure");
  if (figure) {
    if (
      figure.hasAttribute("data-testid") &&
      figure.getAttribute("data-testid").includes("photo-grid")
    ) {
      // Check if this is a collection thumbnail
      if (
        figure.closest('[class*="collection"]') ||
        figure.closest('[href*="collection"]')
      ) {
        return false;
      }
      return true;
    }

    if (
      figure.hasAttribute("itemprop") &&
      figure.getAttribute("itemprop") === "image"
    ) {
      return true;
    }

    // Check for typical Unsplash photo container structure
    const hasPhotoLinks =
      figure.querySelectorAll('a[href*="/photos/"]').length > 0;
    const hasDownloadButton =
      figure.querySelectorAll('a[href*="download"]').length > 0;
    if (hasPhotoLinks || hasDownloadButton) return true;
  }

  // Strategy 4: Check for parent anchor with specific patterns (for new layout)
  const parentAnchor = img.closest("a");
  if (parentAnchor) {
    // Skip collection thumbnails
    if (parentAnchor.getAttribute("href")?.includes("/collection")) {
      return false;
    }

    // Check for semantic attributes
    if (
      parentAnchor.hasAttribute("itemprop") &&
      parentAnchor.getAttribute("itemprop") === "contentUrl"
    ) {
      return true;
    }

    // Check URL patterns that are unlikely to change
    const href = parentAnchor.getAttribute("href") || "";
    if (
      href.includes("/photos/") ||
      href.includes("/de/fotos/") ||
      href.includes("/fr/photos/") ||
      href.includes("/es/fotos/") ||
      href.includes("/it/foto/")
    ) {
      return true;
    }
  }

  // Strategy 5: Check image attributes and properties (stable attributes)
  if (
    img.hasAttribute("data-testid") &&
    img.getAttribute("data-testid").includes("photo")
  ) {
    // Skip if it's a collection or profile image
    if (img.closest('[href*="collection"]') || img.closest('[href*="users"]')) {
      return false;
    }
    return true;
  }

  // Additional size check for any remaining images
  if (imgWidth > 300 && imgHeight > 300) {
    // Check if image has typical Unsplash photo attributes
    const hasUnsplashAttributes =
      img.getAttribute("alt")?.toLowerCase().includes("photo") ||
      img.getAttribute("loading") === "lazy";
    if (hasUnsplashAttributes) return true;
  }

  // Fallback: Base URL check only as last resort
  return (
    baseUrl.startsWith("https://images.unsplash.com/") &&
    !baseUrl.includes("/profile-") &&
    imgWidth > 300 &&
    imgHeight > 300
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
  shadowContainer.style.left = "10px"; // Position at the left side
  shadowContainer.style.zIndex = "2"; // Lower z-index to stay below the header
  shadowContainer.style.pointerEvents = "auto"; // Ensure the button can be clicked
  shadowContainer.style.transform = "none"; // Prevent any transforms from affecting position

  // Create the shadow root
  const shadowRoot = shadowContainer.attachShadow({ mode: "open" });

  // Add hover effect using shadow DOM CSS
  const style = document.createElement("style");
  style.textContent = `
  .unsplash-copy-button {
    position: relative;
    z-index: 2;
    background-color: rgba(0, 0, 0, 0.6);
    color: #fff;
    border: 1px solid #e1e1e1;
    padding: 5px 10px;
    font-size: 12px;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.3s, color 0.3s;
    margin-bottom: 5px;
    text-shadow: 0px 0px 2px rgba(0,0,0,0.8);
    transform: none;
  }

  .unsplash-copy-button:hover {
    background-color: #3B136C;
    color: #fff;
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

        // Extract artist name
        const artistName = extractArtistName(img);

        // Generate the filename using the new function
        const filename = generateFilename(imageId, settings, artistName);

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

  // Force the container to have the correct positioning context
  container.style.position = "relative";
  container.style.display = "block"; // Ensure block display
  container.style.transform = "none"; // Prevent transforms from affecting positioning

  // If there's a parent figure, also ensure it has proper positioning
  const parentFigure = container.closest("figure");
  if (parentFigure) {
    parentFigure.style.position = "relative";
    parentFigure.style.display = "block";
  }

  container.appendChild(shadowContainer);

  // Mark the image as processed using a data attribute instead of a class
  img.setAttribute("data-unsplash-processed", "true");
  img.classList.add("SqNWg"); // Keep for backward compatibility
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
          // Skip if already processed (using more stable data attribute)
          if (!node.hasAttribute("data-unsplash-processed")) {
            addCopyButton(node);
          }
        } else {
          // If it's not an image, check its children
          node
            .querySelectorAll("img[srcset]:not([data-unsplash-processed])")
            .forEach((img) => {
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
document
  .querySelectorAll("img[srcset]:not([data-unsplash-processed])")
  .forEach((img) => {
    addCopyButton(img);
  });

/**
 * Attempts to extract the artist name from the image's surrounding elements
 * @param {HTMLImageElement} img - The image element
 * @returns {string} - The artist name or empty string if not found
 */
function extractArtistName(img) {
  // Try to find the closest figure or article container
  const container = img.closest("figure") || img.closest("article");
  if (!container) return "";

  // Find all links in the container
  const links = container.getElementsByTagName("a");

  // Look through all links to find one that matches the Unsplash user pattern
  for (const link of links) {
    const href = link.getAttribute("href") || "";
    // Match either /@username or /users/username pattern
    if (href.includes("/@") || href.includes("/users/")) {
      const fullName = link.textContent.trim();
      if (fullName) {
        // Avoid returning the username (which starts with @)
        return fullName.startsWith("@") ? "" : fullName;
      }
    }
  }

  return "";
}

/**
 * Generates a sanitized filename incorporating image ID and user-selected parameters.
 *
 * @param {string} imageId - The unique identifier of the image.
 * @param {Object} settings - User-selected settings for customizing the image URL.
 * @param {string} artistName - The name of the artist (optional).
 * @returns {string} - A sanitized filename string.
 */
function generateFilename(imageId, settings, artistName = "") {
  // Function to sanitize filename by removing invalid characters
  function sanitizeFilename(name) {
    return name.replace(/[^a-z0-9_\-\.]/gi, "_");
  }

  // Accumulate parameters for filename
  let paramsForFilename = [];

  // Add artist name as prefix if available, with 'made_by_' prefix
  const safeArtistName = artistName
    ? `made_by_${sanitizeFilename(artistName)}-`
    : "";

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
      const safeKey = key.replace(/[^a-z0-9_\-]/gi, "");
      const safeValue = value.replace(/[^a-z0-9_\-]/gi, "");
      paramsForFilename.push(`${safeKey}${safeValue}`);
    });
  }

  // Join all parameters with a hyphen
  const paramsString = paramsForFilename.join("-");

  // Construct the final filename with artist name prefix
  const baseFilename = sanitizeFilename(imageId);
  const filename = paramsString
    ? `${safeArtistName}${baseFilename}-${paramsString}.jpg`
    : `${safeArtistName}${baseFilename}.jpg`;

  return filename;
}
