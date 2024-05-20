const form = document.getElementById("form");
const messageTag = document.getElementById("message");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirm-password");
const notification = document.getElementById("notification");
const submitButton = document.getElementById("submit");

const passwordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/;

form.style.display = "none";

let token, id;

window.addEventListener("DOMContentLoaded", async () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => {
      return searchParams.get(prop);
    },
  });

  id = params.id;
  token = params.token;

  const res = await fetch("/auth/verify-password-reset-token", {
    method: "POST",
    body: JSON.stringify({ token, id }),
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
  });

  if (!res.ok) {
    const { message } = await res.json();
    messageTag.innerText = message;
    messageTag.classList.add("error");
    return;
  }
  messageTag.style.display = "none";
  form.style.display = "block";
});

const displayNotification = (message, type) => {
  notification.style.display = "block";
  notification.innerText = message;
  notification.classList.add(type);
};

const handleSubmit = async (evt) => {
  evt.preventDefault();

  if (password.value.length < 8) {
    return displayNotification(
      "Password should not be less 8 characters",
      "error"
    );
  }

  if (!passwordRegex.test(password.value)) {
    return displayNotification(
      "Password should contain at least 1 small letter, one capital letter, and one alphanumeric character",
      "error"
    );
  }

  if (!confirmPassword.value.trim()) {
    return displayNotification("Please confirm password", "error");
  }

  if (password.value !== confirmPassword.value) {
    return displayNotification(
      "Password and confirm password do not match",
      "error"
    );
  }

  submitButton.disabled = true;
  submitButton.innerText = "Resetting password...";

  const res = await fetch("/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
    body: JSON.stringify({ id, token, password: password.value }),
  });

  submitButton.disabled = false;
  submitButton.innerText = "Reset password";

  if (!res.ok) {
    const { message } = await res.json();
    return displayNotification(message, "error");
  }

  messageTag.style.display = "block";
  messageTag.innerText = "Password update successful";
  form.style.display = "none";
};

form.addEventListener("submit", handleSubmit);
