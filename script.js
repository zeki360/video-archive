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

const form = document.querySelector("#login-form");
const errorMessage = document.querySelector("#form-error");
const passwordInput = document.querySelector("#password");
const passwordToggle = document.querySelector(".password-toggle");
const signupForm = document.querySelector("#signup-form");
const signupLink = document.querySelector(".signup-copy a");
const backLink = document.querySelector(".back-link");
const signupError = document.querySelector("#signup-error");

passwordToggle.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  passwordToggle.textContent = isPassword ? "Hide" : "Show";
  passwordToggle.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
  passwordToggle.setAttribute("aria-pressed", String(isPassword));
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  errorMessage.textContent = "";
  const email = document.querySelector("#email");
  if (!email.value.trim() || !passwordInput.value.trim()) {
    errorMessage.textContent = "Please enter your email and password.";
    (!email.value.trim() ? email : passwordInput).focus();
    return;
  }
  const submitButton = form.querySelector(".submit-button");
  submitButton.disabled = true;
  auth.signInWithEmailAndPassword(email.value.trim(), passwordInput.value)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      errorMessage.className = "form-error";
      errorMessage.textContent = getAuthErrorMessage(error);
    })
    .finally(() => {
      submitButton.disabled = false;
    });
});

signupLink.addEventListener("click", (event) => {
  event.preventDefault();
  form.hidden = true;
  document.querySelector(".signup-copy").hidden = true;
  signupForm.hidden = false;
  document.querySelector("#signup-name").focus();
});

backLink.addEventListener("click", () => {
  signupForm.hidden = true;
  document.querySelector(".signup-copy").hidden = false;
  form.hidden = false;
  document.querySelector("#email").focus();
});

signupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  signupError.textContent = "";

  const name = document.querySelector("#signup-name");
  const email = document.querySelector("#signup-email");
  const signupPassword = document.querySelector("#signup-password");
  const confirmPassword = document.querySelector("#signup-confirm-password");

  if (!name.value.trim() || !email.value.trim() || !signupPassword.value || !confirmPassword.value) {
    signupError.textContent = "Please complete all fields.";
    (!name.value.trim() ? name : !email.value.trim() ? email : !signupPassword.value ? signupPassword : confirmPassword).focus();
    return;
  }
  if (!email.validity.valid) {
    signupError.textContent = "Please enter a valid email address.";
    email.focus();
    return;
  }
  if (signupPassword.value.length < 8) {
    signupError.textContent = "Your password must be at least 8 characters.";
    signupPassword.focus();
    return;
  }
  if (signupPassword.value !== confirmPassword.value) {
    signupError.textContent = "Passwords do not match.";
    confirmPassword.focus();
    return;
  }
  const submitButton = signupForm.querySelector(".submit-button");
  submitButton.disabled = true;
  auth.createUserWithEmailAndPassword(email.value.trim(), signupPassword.value)
    .then((credential) => credential.user.updateProfile({ displayName: name.value.trim() }))
    .then(() => {
      signupError.className = "form-success";
      signupError.textContent = "Account created successfully. You can now sign in.";
      signupForm.reset();
    })
    .catch((error) => {
      signupError.className = "form-error";
      signupError.textContent = getAuthErrorMessage(error);
    })
    .finally(() => {
      submitButton.disabled = false;
    });

});

document.querySelector(".forgot-link").addEventListener("click", (event) => {
  event.preventDefault();
  const email = document.querySelector("#email");
  errorMessage.className = "form-error";
  errorMessage.textContent = "";
  if (!email.value.trim() || !email.validity.valid) {
    errorMessage.textContent = "Enter your email first to reset your password.";
    email.focus();
    return;
  }
  auth.sendPasswordResetEmail(email.value.trim())
    .then(() => {
      errorMessage.className = "form-success";
      errorMessage.textContent = "Password reset email sent.";
    })
    .catch((error) => {
      errorMessage.textContent = getAuthErrorMessage(error);
    });
});

function getAuthErrorMessage(error) {
  const messages = {
    "auth/email-already-in-use": "An account already exists for this email.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/weak-password": "Choose a stronger password with at least 6 characters.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/operation-not-allowed": "Email and password sign-in is not enabled for this project yet."
  };
  return messages[error.code] || "Authentication failed. Please try again.";
}
