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
function loadProfiles(callback) {
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
    if (callback) callback();
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

// Auto-load profile on selection
document.getElementById("profiles").addEventListener("change", (event) => {
  const selectedProfile = event.target.value;
  if (!selectedProfile) {
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

// Rename Profile Button Click
document.getElementById("rename-profile").addEventListener("click", () => {
  const selectedProfile = document.getElementById("profiles").value;
  if (!selectedProfile) {
    showToast("Please select a profile to rename.");
    return;
  }

  const newProfileName = prompt(
    "Enter the new name for the profile:",
    selectedProfile
  );

  if (!newProfileName || newProfileName.trim() === "") {
    showToast("Profile rename cancelled or invalid name provided.");
    return;
  }

  const trimmedNewName = newProfileName.trim();

  if (trimmedNewName === selectedProfile) {
    showToast("Profile name is unchanged.");
    return;
  }

  chrome.storage.sync.get(["profiles"], (data) => {
    const profiles = data.profiles || {};

    if (profiles[trimmedNewName]) {
      showToast(`A profile with the name "${trimmedNewName}" already exists.`);
      return;
    }

    if (profiles[selectedProfile]) {
      profiles[trimmedNewName] = profiles[selectedProfile];
      delete profiles[selectedProfile];

      chrome.storage.sync.set({ profiles }, () => {
        loadProfiles(() => {
          document.getElementById("profiles").value = trimmedNewName;
        });
        showToast("Profile renamed successfully!");
      });
    }
  });
});

// Export Profile Button Click
document.getElementById("export-profile").addEventListener("click", () => {
  const selectedProfile = document.getElementById("profiles").value;
  if (!selectedProfile) {
    showToast("Please select a profile to export.");
    return;
  }

  chrome.storage.sync.get(["profiles"], (data) => {
    const profiles = data.profiles || {};
    const profileSettings = profiles[selectedProfile];

    if (profileSettings) {
      const blob = new Blob([JSON.stringify(profileSettings, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedProfile}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Profile exported successfully!");
    } else {
      showToast("Could not find the selected profile to export.");
    }
  });
});

// Import Profile Button Click
document
  .getElementById("import-profile-button")
  .addEventListener("click", () => {
    document.getElementById("import-profile-input").click();
  });

document
  .getElementById("import-profile-input")
  .addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target.result);
        const profileName = file.name.replace(/\.json$/, "").trim();

        if (!profileName) {
          showToast("Invalid filename for profile.");
          return;
        }

        if (
          typeof importedSettings !== "object" ||
          importedSettings === null ||
          Array.isArray(importedSettings)
        ) {
          showToast("Invalid profile format in JSON file. Must be a JSON object.");
          return;
        }

        const validKeys = [
          "width",
          "height",
          "quality",
          "fit",
          "crop",
          "ar",
          "customQuery",
        ];
        const settings = {};
        for (const key of validKeys) {
          settings[key] = importedSettings[key] || "";
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

          if (profiles[profileName]) {
            showToast(`Profile "${profileName}" already exists.`);
            return;
          }

          profiles[profileName] = settings;
          chrome.storage.sync.set({ profiles }, () => {
            loadProfiles();
            showToast("Profile imported successfully!");
          });
        });
      } catch (error) {
        showToast(
          "Failed to parse JSON file. Make sure it's a valid profile export."
        );
      } finally {
        // Reset file input
        event.target.value = null;
      }
    };
    reader.readAsText(file);
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
  const bentoGrid = document.querySelector(".bento-grid");
  const inputs = bentoGrid.querySelectorAll("input, select");
  inputs.forEach((input) => {
    if (input.tagName === "SELECT") {
      input.selectedIndex = 0; // Reset to the first option
    } else {
      input.value = "";
    }
  });

  const settingsKeys = [
    "width",
    "height",
    "quality",
    "fit",
    "crop",
    "ar",
    "customQuery",
  ];

  chrome.storage.sync.remove(settingsKeys, () => {
    showToast("Settings reset!");
  });
});

// Initialize profiles on DOM load
document.addEventListener("DOMContentLoaded", () => {
  // Load saved settings when the popup is opened
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
        document.getElementById("custom-query").value = data.customQuery || "";
    }
  );

  // Load profiles
  loadProfiles();

  // Theme switcher logic
  const themeToggleButton = document.getElementById("theme-toggle-button");

  // Apply the saved theme on load
  chrome.storage.sync.get("theme", ({ theme }) => {
    if (theme === "dark") {
      document.body.classList.add("dark-mode");
    }
  });

  // Handle theme toggle
  themeToggleButton.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    if (document.body.classList.contains("dark-mode")) {
      chrome.storage.sync.set({ theme: "dark" });
    } else {
      chrome.storage.sync.set({ theme: "light" });
    }
  });
});
