// Function to safely add the copy button using Shadow DOM
function addCopyButton(img) {
  // Ensure the image is a main photo by checking for specific classes
  if (
    !img.classList.contains("DVW3V") &&
    !img.classList.contains("I7OuT") &&
    !img.classList.contains("L1BOa")
  )
    return;

  if (img.classList.contains("SqNWg")) return;

  // Check if the image is inside a container with a sponsored indicator
  // const container1 = img.closest("figure");
  // if (container1 && container1.querySelector(".XtjY4.o0Ned.J6aD_")) return; // Skip if the specific sponsored indicator is found

  // Extract the base URL from the srcset attribute
  const srcset = img.getAttribute("srcset");
  const baseUrl = extractBaseUrl(srcset);

  // Check if the URL matches the desired pattern and is not a profile image
  if (
    !baseUrl.startsWith("https://images.unsplash.com/") ||
    baseUrl.includes("/profile-")
  )
    return;

  // Ensure we don't duplicate the button
  if (img.parentElement.querySelector(".unsplash-copy-button-container"))
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
  }

  .unsplash-copy-button:hover {
    background-color: #3B136C; /* Change background on hover */
    color: #fff; /* Change text color on hover */
  }
`;
  shadowRoot.appendChild(style);

  // Create a button element inside the shadow DOM
  const button = document.createElement("button");
  button.textContent = "Copy Link";
  button.className = "unsplash-copy-button"; // Apply the class to the button

  // Append the button to the shadow DOM
  shadowRoot.appendChild(button);

  // Copy URL to clipboard on button click and prevent event propagation and default behavior
  button.onclick = (event) => {
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
          button.textContent = "Link Copied!";
          setTimeout(() => {
            button.textContent = "Copy Link";
          }, 1000);
        });
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
        if (
          node.tagName === "IMG" &&
          node.hasAttribute("srcset") &&
          (node.classList.contains("DVW3V") ||
            node.classList.contains("I7OuT") ||
            node.classList.contains("L1BOa"))
        ) {
          addCopyButton(node); // Add button if it's an Unsplash image with specific classes
        } else {
          // If it's not an image, check its children
          node.querySelectorAll("img[srcset]").forEach((img) => {
            if (
              img.classList.contains("DVW3V") ||
              img.classList.contains("I7OuT") ||
              img.classList.contains("L1BOa")
            ) {
              addCopyButton(img);
            }
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
  if (
    img.classList.contains("DVW3V") ||
    img.classList.contains("I7OuT") ||
    img.classList.contains("L1BOa")
  ) {
    addCopyButton(img); // Only add button to images with specific classes
  }
});
