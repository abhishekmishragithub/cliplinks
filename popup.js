document.addEventListener("DOMContentLoaded", () => {
  const linksListContainer = document.getElementById("links-list");
  const noProfilesMessage = document.getElementById(
    "no-profiles-popup-message",
  );
  const settingsBtn = document.getElementById("settings-btn");
  const copyFeedback = document.getElementById("copy-feedback");

  const STORAGE_KEY = "socialProfiles";

  const platformDetails = {
    linkedin: { name: "LinkedIn", icon: "icons/linkedin.png" },
    twitter: { name: "X / Twitter", icon: "icons/x.png" },
    github: { name: "GitHub", icon: "icons/github.png" },
    website: { name: "Website", icon: "icons/website.png" },
    youtube: { name: "YouTube", icon: "icons/youtube.png" },
    custom: { name: "Custom", icon: "icons/custom.png" },
  };

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

  let feedbackTimeout;
  function showFeedback(message, isError = false) {
    copyFeedback.textContent = message;
    copyFeedback.className = isError ? "feedback error" : "feedback success";

    clearTimeout(feedbackTimeout);

    feedbackTimeout = setTimeout(() => {
      copyFeedback.textContent = "";
      copyFeedback.className = "feedback";
    }, 1500); // Clear message after 1.5 seconds
  }

  function renderProfileItem(profile) {
    const div = document.createElement("div");
    div.classList.add("profile-item");
    div.title = `Click to copy: ${profile.url}`;

    const iconPath = getIconPath(profile.platform, profile.customPlatformName);
    const platformDisplayName = getPlatformDisplayName(
      profile.platform,
      profile.customPlatformName,
    );

    const iconElement = `<img src="${iconPath}" alt="${platformDisplayName}">`;
    // const iconElement = `<span class="icon-placeholder">?</span>`; //  placeholder

    div.innerHTML = `
            <div class="profile-icon">
                ${iconElement}
            </div>
            <div class="profile-info">
                <span class="platform-name">${platformDisplayName}</span>
                <span class="username">${profile.username}</span>
            </div>
        `;

    // click listener to the whole item for copying
    div.addEventListener("click", () => {
      navigator.clipboard
        .writeText(profile.url)
        .then(() => {
          showFeedback("Copied!");
        })
        .catch((err) => {
          showFeedback("Error copying!", true);
          console.error("Popup copy failed:", err);
        });
    });

    return div;
  }

  function displayProfiles() {
    chrome.storage.local.get(STORAGE_KEY, (data) => {
      linksListContainer.innerHTML = "";
      const profiles = data[STORAGE_KEY] || [];

      if (!noProfilesMessage) {
        console.error("Could not find the template message element reference!");
        return;
      }

      if (profiles.length === 0) {
        // add the original message element back into the container
        linksListContainer.appendChild(noProfilesMessage);
        noProfilesMessage.style.display = "block";
        copyFeedback.textContent = ""; // Clear feedback if no links
      } else {
        // noProfilesMessage.style.display = "none";
        profiles.forEach((profile) => {
          const item = renderProfileItem(profile);
          linksListContainer.appendChild(item);
        });
        // copyFeedback.textContent = 'Click item to copy';
      }
    });
  }

  settingsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
    window.close(); // Close the popup after opening options
  });

  displayProfiles();
});
