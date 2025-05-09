document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (
    (username === "admin" && password === "2025DEVChallenge") ||
    (username === "newuser" && password === "2025DEVChallenge")
  ) {
    localStorage.setItem("user", username);
    window.location.href = "index.html";
  } else {
    document.getElementById("error").classList.remove("hidden");
  }
});
