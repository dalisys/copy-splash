// Maximum number of profiles
const MAX_PROFILES = 10;

// Function to show toast notifications
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "show";
  setTimeout(() => {
    toast.className = toast.className.replace("show", "");
  }, 3000);
}

// Load profiles into the select field
function loadProfiles() {
  chrome.storage.sync.get(["profiles"], (data) => {
    const profiles = data.profiles || {};
    const profileSelect = document.getElementById("profiles");
    profileSelect.innerHTML =
      '<option value="" disabled selected>Select a profile</option>';
    Object.keys(profiles).forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      profileSelect.appendChild(option);
    });
  });
}

// Save current settings as a backup before loading a new profile
function backupCurrentSettings(callback) {
  const currentSettings = {
    width: document.getElementById("width").value,
    height: document.getElementById("height").value,
    quality: document.getElementById("quality").value,
    fit: document.getElementById("fit").value,
    crop: document.getElementById("crop").value,
    ar: document.getElementById("ar").value,
    customQuery: document.getElementById("custom-query").value,
  };

  chrome.storage.sync.set({ backupSettings: currentSettings }, () => {
    if (callback) callback();
  });
}

// Save current settings as a profile
function saveCurrentSettingsAsProfile(profileName, callback) {
  const settings = {
    width: document.getElementById("width").value,
    height: document.getElementById("height").value,
    quality: document.getElementById("quality").value,
    fit: document.getElementById("fit").value,
    crop: document.getElementById("crop").value,
    ar: document.getElementById("ar").value,
    customQuery: document.getElementById("custom-query").value,
  };

  chrome.storage.sync.get(["profiles"], (data) => {
    const profiles = data.profiles || {};
    profiles[profileName] = settings;
    chrome.storage.sync.set({ profiles }, () => {
      loadProfiles();
      if (callback) callback();
    });
  });
}

// Save Profile Button Click
document.getElementById("save-profile").addEventListener("click", () => {
  const profileName = document.getElementById("profile-name").value.trim();
  if (!profileName) {
    showToast("Please enter a profile name.");
    return;
  }

  chrome.storage.sync.get(["profiles"], (data) => {
    const profiles = data.profiles || {};
    if (
      Object.keys(profiles).length >= MAX_PROFILES &&
      !profiles[profileName]
    ) {
      showToast(`Maximum of ${MAX_PROFILES} profiles reached.`);
      return;
    }

    saveCurrentSettingsAsProfile(profileName, () => {
      document.getElementById("profile-name").value = "";
      showToast("Profile saved successfully!");
    });
  });
});

// Load Profile Button Click
document.getElementById("load-profile").addEventListener("click", () => {
  const selectedProfile = document.getElementById("profiles").value;
  if (!selectedProfile) {
    showToast("Please select a profile to load.");
    return;
  }

  // First, backup current settings
  backupCurrentSettings(() => {
    // Then, load the selected profile
    chrome.storage.sync.get(["profiles"], (data) => {
      const profiles = data.profiles || {};
      const settings = profiles[selectedProfile];
      if (settings) {
        document.getElementById("width").value = settings.width || "";
        document.getElementById("height").value = settings.height || "";
        document.getElementById("quality").value = settings.quality || "";
        document.getElementById("fit").value = settings.fit || "";
        document.getElementById("crop").value = settings.crop || "";
        document.getElementById("ar").value = settings.ar || "";
        document.getElementById("custom-query").value =
          settings.customQuery || "";

        // Save the loaded profile settings to chrome.storage.sync
        chrome.storage.sync.set(settings, () => {
          showToast("Profile loaded and settings saved!");
        });
      } else {
        showToast("Selected profile does not exist.");
      }
    });
  });
});

// Delete Profile Button Click (Optional)
document.getElementById("delete-profile").addEventListener("click", () => {
  const selectedProfile = document.getElementById("profiles").value;
  if (!selectedProfile) {
    showToast("Please select a profile to delete.");
    return;
  }

  chrome.storage.sync.get(["profiles"], (data) => {
    const profiles = data.profiles || {};
    if (profiles[selectedProfile]) {
      delete profiles[selectedProfile];
      chrome.storage.sync.set({ profiles }, () => {
        loadProfiles();
        showToast("Profile deleted successfully!");
      });
    }
  });
});

// Save Settings Button Click
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

  chrome.storage.sync.set(settings, () => {
    showToast("Settings saved!");
  });
});

// Reset Settings Button Click
document.getElementById("reset-button").addEventListener("click", () => {
  document.getElementById("settings-form").reset();
  chrome.storage.sync.clear(() => {
    loadProfiles();
    showToast("Settings reset!");
  });
});

// Initialize profiles on DOM load
document.addEventListener("DOMContentLoaded", () => {
  // Load existing settings
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

  // Load profiles into the dropdown
  loadProfiles();
});
