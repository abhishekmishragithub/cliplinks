document.addEventListener("DOMContentLoaded", () => {
  const addProfileBtn = document.getElementById("add-profile-btn");
  const resetAllBtn = document.getElementById("reset-all-btn");
  const profileListContainer = document.getElementById("profile-list");
  const noProfilesMessage = document.getElementById("no-profiles-message");
  const statusMessage = document.getElementById("status-message");

  // modal elements
  const modal = document.getElementById("profile-modal");
  const modalTitle = document.getElementById("modal-title");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const profileForm = document.getElementById("profile-form");
  const profileIdInput = document.getElementById("profile-id");
  const platformSelect = document.getElementById("platform");
  const customPlatformGroup = document.getElementById("custom-platform-group");
  const customPlatformNameInput = document.getElementById(
    "custom-platform-name",
  );
  const usernameInput = document.getElementById("username");
  const urlInput = document.getElementById("url");
  const saveProfileBtn = document.getElementById("save-profile-btn");

  const STORAGE_KEY = "socialProfiles";

  const platformDetails = {
    linkedin: {
      name: "LinkedIn",
      icon: "icons/linkedin.png",
      urlPrefix: "https://linkedin.com/in/",
    },
    twitter: {
      name: "X / Twitter",
      icon: "icons/x.png",
      urlPrefix: "https://x.com/",
    },
    github: {
      name: "GitHub",
      icon: "icons/github.png",
      urlPrefix: "https://github.com/",
    },
    website: {
      name: "Website",
      icon: "icons/website.png",
      urlPrefix: "https://",
    },
    youtube: {
      name: "YouTube",
      icon: "icons/youtube.png",
      urlPrefix: "https://youtube.com/@",
    },
    custom: { name: "Custom", icon: "icons/custom.png", urlPrefix: "" },
    // TODO: let user choose the icon or emoji for custom fields
  };

  function showStatus(message, isError = false, duration = 3000) {
    statusMessage.textContent = message;
    statusMessage.className = isError ? "status error" : "status success";
    setTimeout(() => {
      statusMessage.textContent = "";
      statusMessage.className = "status";
    }, duration);
  }

  function getIconPath(platformKey, customName = "") {
    if (platformDetails[platformKey]) {
      return platformDetails[platformKey].icon;
    }
    return platformDetails.custom.icon;
  }

  function getPlatformDisplayName(platformKey, customName = "") {
    if (platformKey === "custom" && customName) {
      return customName;
    }
    return platformDetails[platformKey]?.name || customName || "Link";
  }

  function openModal(profile = null) {
    profileForm.reset();
    customPlatformGroup.style.display = "none";
    profileIdInput.value = "";

    if (profile) {
      modalTitle.textContent = "Edit Social Profile";
      saveProfileBtn.textContent = "Save Changes";
      profileIdInput.value = profile.id;
      platformSelect.value = profile.platform;
      usernameInput.value = profile.username;
      urlInput.value = profile.url;

      if (profile.platform === "custom") {
        customPlatformGroup.style.display = "block";
        customPlatformNameInput.value = profile.customPlatformName || "";
      }
    } else {
      modalTitle.textContent = "Add Social Profile";
      saveProfileBtn.textContent = "Add Profile";
      handlePlatformChange();
    }

    modal.style.display = "flex";
  }

  function closeModal() {
    modal.style.display = "none";
  }

  function handlePlatformChange() {
    const selectedPlatform = platformSelect.value;
    const prefix = platformDetails[selectedPlatform]?.urlPrefix || "";

    if (selectedPlatform === "custom") {
      customPlatformGroup.style.display = "block";
      customPlatformNameInput.required = true;
    } else {
      customPlatformGroup.style.display = "none";
      customPlatformNameInput.required = false;
      customPlatformNameInput.value = "";
    }
  }

  // profile section
  function renderProfileItem(profile) {
    const div = document.createElement("div");
    div.classList.add("profile-item");
    div.dataset.id = profile.id;

    const iconPath = getIconPath(profile.platform, profile.customPlatformName);
    const platformDisplayName = getPlatformDisplayName(
      profile.platform,
      profile.customPlatformName,
    );

    div.innerHTML = `
            <div class="profile-icon">
                <img src="${iconPath}" alt="${platformDisplayName}">
                <!-- Or use: <span class="icon-placeholder">L</span> -->
            </div>
            <div class="profile-info">
                <span class="platform-name">${platformDisplayName}</span>
                <span class="username">${profile.username}</span>
            </div>
            <div class="profile-actions">
                <button class="action-icon copy-btn" title="Copy URL">
                      <img src="icons/copy.png" alt="Delete" width="16" height="16">
                </button>
                <button class="action-icon edit-btn" title="Edit Profile">
                      <img src="icons/edit.png" alt="Delete" width="16" height="16">
                </button>
                <button class="action-icon delete-btn" title="Delete Profile">
                      <img src="icons/delete.png" alt="Delete" width="16" height="16">
                </button>
            </div>
        `;

    // event listener for actions
    div.querySelector(".copy-btn").addEventListener("click", (e) => {
      e.stopPropagation(); // prevent triggering other listeners if nested
      navigator.clipboard
        .writeText(profile.url)
        .then(() => {
          showStatus(`Copied: ${profile.url}`);
        })
        .catch((err) => {
          showStatus("Error copying URL!", true);
          console.error("Copy failed:", err);
        });
    });

    div.querySelector(".edit-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      chrome.storage.local.get(STORAGE_KEY, (data) => {
        const profiles = data[STORAGE_KEY] || [];
        const profileToEdit = profiles.find((p) => p.id === profile.id);
        if (profileToEdit) {
          openModal(profileToEdit);
        } else {
          showStatus("Error: Could not find profile data to edit.", true);
        }
      });
    });

    div.querySelector(".delete-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      if (
        confirm(
          `Are you sure you want to delete the "${platformDisplayName} - ${profile.username}" profile?`,
        )
      ) {
        deleteProfile(profile.id);
      }
    });

    return div;
  }

  function displayProfiles() {
    chrome.storage.local.get(STORAGE_KEY, (data) => {
      profileListContainer.innerHTML = "";
      const profiles = data[STORAGE_KEY] || [];

      if (profiles.length === 0) {
        noProfilesMessage.style.display = "block";
      } else {
        noProfilesMessage.style.display = "none";
        profiles.forEach((profile) => {
          const item = renderProfileItem(profile);
          profileListContainer.appendChild(item);
        });
      }
    });
  }

  // CRUD
  async function saveProfile(profileData) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(STORAGE_KEY, (data) => {
        let profiles = data[STORAGE_KEY] || [];
        const existingIndex = profiles.findIndex(
          (p) => p.id === profileData.id,
        );

        if (existingIndex > -1) {
          profiles[existingIndex] = profileData;
        } else {
          if (!profileData.id) {
            profileData.id = Date.now().toString();
          }
          profiles.push(profileData);
        }

        chrome.storage.local.set({ [STORAGE_KEY]: profiles }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    });
  }

  async function deleteProfile(profileId) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(STORAGE_KEY, (data) => {
        let profiles = data[STORAGE_KEY] || [];
        profiles = profiles.filter((p) => p.id !== profileId);

        chrome.storage.local.set({ [STORAGE_KEY]: profiles }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            showStatus("Profile deleted.");
            displayProfiles(); // re-render the list
            resolve();
          }
        });
      });
    });
  }

  async function resetAllProfiles() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(STORAGE_KEY, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          showStatus("All profiles have been reset.");
          displayProfiles();
          resolve();
        }
      });
    });
  }

  addProfileBtn.addEventListener("click", () => openModal());
  closeModalBtn.addEventListener("click", closeModal);
  resetAllBtn.addEventListener("click", () => {
    if (
      confirm(
        "Are you sure you want to delete ALL saved profiles? This cannot be undone.",
      )
    ) {
      resetAllProfiles().catch((err) =>
        showStatus("Error resetting profiles!", true),
      );
    }
  });

  // close modal if clicked outside the content area
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  // update URL prefix when platform changes
  platformSelect.addEventListener("change", handlePlatformChange);

  // handle form (add or edit)
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const profileData = {
      id: profileIdInput.value || null,
      platform: platformSelect.value,
      username: usernameInput.value.trim(),
      url: urlInput.value.trim(),
      customPlatformName:
        platformSelect.value === "custom"
          ? customPlatformNameInput.value.trim()
          : null,
    };

    if (profileData.platform === "custom" && !profileData.customPlatformName) {
      showStatus("Please enter a name for the custom platform.", true);
      customPlatformNameInput.focus();
      return;
    }
    if (!profileData.username) {
      showStatus("Please enter a username or display text.", true);
      usernameInput.focus();
      return;
    }
    if (!profileData.url) {
      showStatus("Please enter the full URL.", true);
      urlInput.focus();
      return;
    }
    try {
      new URL(profileData.url);
    } catch (_) {
      if (!confirm("The URL seems invalid. Save anyway?")) {
        urlInput.focus();
        return;
      }
    }

    try {
      await saveProfile(profileData);
      showStatus(profileData.id ? "Profile updated!" : "Profile added!");
      closeModal();
      displayProfiles();
    } catch (error) {
      showStatus("Error saving profile!", true);
      console.error("Save failed:", error);
    }
  });

  displayProfiles();
});
