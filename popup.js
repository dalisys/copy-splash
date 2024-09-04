// Load saved settings when the popup opens
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(
    ["width", "height", "quality", "fit", "crop", "ar", "customQuery"],
    (data) => {
      if (data.width) document.getElementById("width").value = data.width;
      if (data.height) document.getElementById("height").value = data.height;
      if (data.quality) document.getElementById("quality").value = data.quality;
      if (data.fit) document.getElementById("fit").value = data.fit;
      if (data.crop) document.getElementById("crop").value = data.crop;
      if (data.ar) document.getElementById("ar").value = data.ar;
      if (data.customQuery)
        document.getElementById("custom-query").value = data.customQuery;
    }
  );
});

// Save settings when the save button is clicked
document.getElementById("save-button").addEventListener("click", () => {
  const settings = {
    width: document.getElementById("width").value,
    height: document.getElementById("height").value,
    quality: document.getElementById("quality").value,
    fit: document.getElementById("fit").value,
    crop: document.getElementById("crop").value,
    ar: document.getElementById("ar").value,
    customQuery: document.getElementById("custom-query").value,
  };

  chrome.storage.sync.set(settings);
});

// Reset settings when the reset button is clicked
document.getElementById("reset-button").addEventListener("click", () => {
  document.getElementById("settings-form").reset();
  chrome.storage.sync.clear();
});
