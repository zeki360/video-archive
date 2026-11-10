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

auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  document.querySelector("#upgrade-user-name").textContent = user.displayName || user.email.split("@")[0];
});

document.querySelector("#place-link").addEventListener("click", () => { window.location.href = "dashboard.html"; });
document.querySelector("#dvas-link").addEventListener("click", () => { window.location.href = "dvas.html"; });
document.querySelector("#sign-out-button").addEventListener("click", () => {
  auth.signOut().then(() => { window.location.href = "index.html"; });
});
document.querySelector("#upload-button").addEventListener("click", () => { document.querySelector("#upload-input").click(); });
document.querySelector("#upload-input").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) alert(`${file.name} is ready to upload. Upload processing will be available soon.`);
});
document.querySelectorAll(".billing-toggle button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".billing-toggle button.active").classList.remove("active");
    button.classList.add("active");
  });
});
