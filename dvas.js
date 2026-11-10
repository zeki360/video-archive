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

auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  document.querySelector("#dvas-user-name").textContent = user.displayName || user.email.split("@")[0];
  loadLibrary(user);
});

async function loadLibrary(user) {
  const clipCount = document.querySelector("#clip-count");
  const emptyLibrary = document.querySelector("#empty-library");
  const clipList = document.querySelector("#clip-list");
  try {
    const snapshot = await db.collection("users").doc(user.uid).collection("files")
      .orderBy("createdAt", "desc").get();
    clipCount.textContent = `${snapshot.size} ${snapshot.size === 1 ? "clip" : "clips"}`;
    if (snapshot.empty) {
      emptyLibrary.hidden = false;
      clipList.hidden = true;
      return;
    }
    emptyLibrary.hidden = true;
    clipList.hidden = false;
    clipList.replaceChildren();
    snapshot.forEach((doc) => {
      const file = doc.data();
      const card = document.createElement("button");
      card.type = "button";
      card.className = "dvas-clip-card";
      card.innerHTML = `<span class="dvas-clip-icon" aria-hidden="true">▶</span><span class="dvas-clip-details"><strong></strong><small></small></span>`;
      card.querySelector("strong").textContent = file.name || "Untitled video";
      card.querySelector("small").textContent = formatFileSize(file.size);
      card.addEventListener("click", () => playClip(file, card));
      clipList.appendChild(card);
    });
  } catch (error) {
    console.error("Library could not be loaded.", error);
    emptyLibrary.hidden = false;
    emptyLibrary.querySelector("p").textContent = "Your library could not be loaded.";
    emptyLibrary.querySelector("span").textContent = "Please refresh and try again.";
  }
}

async function playClip(file, card) {
  document.querySelectorAll(".dvas-clip-card.selected").forEach((item) => item.classList.remove("selected"));
  card.classList.add("selected");
  const preview = document.querySelector(".dvas-player-preview");
  preview.innerHTML = "<p>Loading video...</p>";
  try {
    const user = auth.currentUser;
    const token = await user.getIdToken();
    const response = await fetch(`${functionsBaseUrl}/createDownloadUrl`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ objectPath: file.path })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Download URL request failed.");
    preview.innerHTML = "";
    const video = document.createElement("video");
    video.controls = true;
    video.src = result.downloadUrl;
    preview.appendChild(video);
  } catch (error) {
    console.error("Video could not be loaded.", error);
    preview.innerHTML = "<p>Video could not be loaded.</p>";
  }
}

function formatFileSize(size) {
  if (!Number.isFinite(size) || size <= 0) return "Video";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  return `${(size / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

document.querySelector("#place-link").addEventListener("click", () => {
  window.location.href = "dashboard.html";
});

document.querySelector("#upgrade-link").addEventListener("click", () => {
  window.location.href = "upgrade.html";
});

document.querySelector("#upload-button").addEventListener("click", () => {
  document.querySelector("#upload-input").click();
});

document.querySelector("#upload-input").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) alert(`${file.name} is ready to upload. Upload processing will be available soon.`);
});

document.querySelector("#sign-out-button").addEventListener("click", () => {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
});

document.querySelectorAll(".dvas-view-toggle button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".dvas-view-toggle button.active").classList.remove("active");
    button.classList.add("active");
  });
});

document.querySelectorAll(".dvas-info-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".dvas-info-tabs button.active").classList.remove("active");
    button.classList.add("active");
  });
});
