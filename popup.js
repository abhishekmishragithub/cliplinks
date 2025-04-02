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

  function createIconElement(profile) {
    const iconValue = profile.displayIcon || profile.platform;

    if (platformDetails[iconValue]) {
      const iconPath = getIconPath(iconValue, profile.customPlatformName);
      const platformName = getPlatformDisplayName(
        iconValue,
        profile.customPlatformName,
      );
      const img = document.createElement("img");
      img.src = iconPath;
      img.alt = platformName;
      return img;
    } else {
      const span = document.createElement("span");
      span.classList.add("profile-emoji-icon");
      span.textContent = iconValue;
      span.setAttribute("aria-label", "Emoji icon");
      return span;
    }
  }

  function renderProfileItem(profile) {
    const div = document.createElement("div");
    div.classList.add("profile-item");
    div.title = `Click to copy: ${profile.url}`;

    const iconContainer = document.createElement("div");
    iconContainer.classList.add("profile-icon");
    const iconElement = createIconElement(profile);
    iconContainer.appendChild(iconElement);

    const platformDisplayName = getPlatformDisplayName(
      profile.platform,
      profile.customPlatformName,
    );

    div.innerHTML = `
          <div class="profile-info">
              <span class="platform-name">${platformDisplayName}</span>
              <span class="username">${profile.username}</span>
          </div>
          <!-- Optional: Add a dedicated copy icon here if needed -->
          <!-- <button class="copy-icon-popup" title="Copy URL">❐</button> -->
      `;

    div.prepend(iconContainer);

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
