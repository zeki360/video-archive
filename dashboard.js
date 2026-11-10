const firebaseConfig = {
  apiKey: "AIzaSyBsEk60rd2Se7V8g1DgVdHb4NMWLXKek20",
  authDomain: "video-archive-1f8b8.firebaseapp.com",
  projectId: "video-archive-1f8b8",
  storageBucket: "digitalvideoarchive",
  messagingSenderId: "275453770187",
  appId: "1:275453770187:web:c0e807fa08677bee4b1e4e",
  measurementId: "G-ZB2865NPK1"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const functionsBaseUrl = "https://us-central1-negativespro-27781.cloudfunctions.net";

async function callStorageFunction(functionName, body) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Please sign in before accessing storage.");
  }
  const token = await user.getIdToken();
  const response = await fetch(`${functionsBaseUrl}/${functionName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Storage request failed.");
  }
  return result;
}

auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  document.querySelector("#dashboard-user-name").textContent = user.displayName || user.email.split("@")[0];
});

document.querySelector("#sign-out-button").addEventListener("click", () => {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
});

document.querySelector("#upload-button").addEventListener("click", () => {
  document.querySelector("#upload-input").click();
});

document.querySelector("#upload-input").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const user = auth.currentUser;
  const status = document.querySelector("#upload-status");
  if (!user) {
    status.textContent = "Please sign in before uploading.";
    status.className = "upload-status error";
    return;
  }
  status.className = "upload-status";
  status.textContent = "Uploading 0%";
  try {
    const contentType = file.type || "video/mp4";
    const { objectPath, uploadUrl } = await callStorageFunction("createUploadUrl", {
      fileName: file.name,
      contentType
    });
    await uploadFile(uploadUrl, file, contentType, (progress) => {
      status.textContent = `Uploading ${progress}%`;
    });
    const uploadId = objectPath.split("/").pop().split("-")[0];
    try {
      await db.collection("users").doc(user.uid).collection("files").doc(uploadId).set({
        name: file.name,
        path: objectPath,
        contentType,
        size: file.size,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: "uploaded"
      });
      status.className = "upload-status success";
      status.textContent = "Upload complete.";
    } catch (error) {
      console.error("Upload metadata could not be saved.", error);
      status.className = "upload-status error";
      status.textContent = "The file uploaded, but its details could not be saved.";
    }
  } catch (error) {
    console.error("Video upload failed.", error);
    status.className = "upload-status error";
    status.textContent = error.message || "Upload failed. Please try again.";
  }
  event.target.value = "";
});

function uploadFile(uploadUrl, file, contentType, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", uploadUrl);
    request.setRequestHeader("Content-Type", contentType);
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round(event.loaded / event.total * 100));
      }
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
      } else {
        reject(new Error(`Storage upload returned HTTP ${request.status}.`));
      }
    });
    request.addEventListener("error", () => reject(new Error("Storage upload blocked by the bucket. Check bucket CORS settings.")));
    request.send(file);
  });
}

async function getDownloadUrl(objectPath) {
  const { downloadUrl } = await callStorageFunction("createDownloadUrl", { objectPath });
  return downloadUrl;
}

const connectionsModal = document.querySelector("#connections-modal");
const inviteForm = document.querySelector("#invite-form");
const inviteEmail = document.querySelector("#invite-email");
const inviteFeedback = document.querySelector("#invite-feedback");

document.querySelectorAll(".connections-button, .manage-link").forEach((button) => {
  button.addEventListener("click", () => {
    connectionsModal.hidden = false;
    inviteFeedback.textContent = "";
    inviteEmail.focus();
  });
});

document.querySelectorAll("[data-close-connections]").forEach((button) => {
  button.addEventListener("click", () => {
    connectionsModal.hidden = true;
  });
});

inviteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!inviteEmail.validity.valid) {
    inviteFeedback.className = "invite-feedback error";
    inviteFeedback.textContent = "Enter a valid email address.";
    return;
  }
  inviteFeedback.className = "invite-feedback success";
  inviteFeedback.textContent = `Invite ready to send to ${inviteEmail.value.trim()}.`;
  inviteForm.reset();
});

document.querySelectorAll(".activity-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelector(".activity-tab.active").classList.remove("active");
    tab.classList.add("active");
  });
});

document.querySelectorAll(".dashboard-nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelector(".dashboard-nav-link.active").classList.remove("active");
    link.classList.add("active");
  });
});

document.querySelector("#dvas-link").addEventListener("click", () => {
  window.location.href = "dvas.html";
});

document.querySelector("#upgrade-link").addEventListener("click", () => {
  window.location.href = "upgrade.html";
});

document.querySelector(".collapse-button").addEventListener("click", (event) => {
  const sidebar = document.querySelector(".showcase-sidebar");
  const isCollapsed = sidebar.classList.toggle("collapsed");
  event.currentTarget.textContent = isCollapsed ? "›" : "‹";
  event.currentTarget.setAttribute("aria-label", isCollapsed ? "Expand showcase" : "Collapse showcase");
});
