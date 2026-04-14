document.documentElement.removeAttribute("data-theme");
localStorage.removeItem("movieDekhoTheme");

const getFallbackPath = () => {
  const pageName = window.location.pathname.split("/").pop() || "index.html";
  const params = new URLSearchParams(window.location.search);
  const movieId = params.get("movie");
  const showId = params.get("show");
  const nextParams = new URLSearchParams();

  if (movieId) {
    nextParams.set("movie", movieId);
  }

  if (showId) {
    nextParams.set("show", showId);
  }

  const withParams = (path) => {
    const query = nextParams.toString();
    return query ? `${path}?${query}` : path;
  };

  switch (pageName) {
    case "movie-details.html":
      return "index.html";
    case "showtime.html":
      return movieId ? `movie-details.html?movie=${encodeURIComponent(movieId)}` : "index.html";
    case "movie.html":
      return movieId ? `showtime.html?movie=${encodeURIComponent(movieId)}` : "index.html";
    case "food.html":
      return withParams("movie.html");
    case "confirm.html":
    case "payment-failed.html":
      return withParams("food.html");
    case "user-dashboard.html":
    case "user-login.html":
    case "admin-login.html":
    case "admin-dashboard.html":
      return "index.html";
    default:
      return "index.html";
  }
};

const initBackButton = () => {
  const pageName = window.location.pathname.split("/").pop() || "index.html";

  if (pageName === "index.html") {
    return;
  }

  const header = document.querySelector("header");

  if (!header || document.querySelector("[data-page-back-wrap]")) {
    return;
  }

  const backWrap = document.createElement("div");
  backWrap.className = "page-back-wrap";
  backWrap.dataset.pageBackWrap = "true";

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "page-back-button";
  backButton.textContent = "Back";

  backButton.addEventListener("click", () => {
    const hasSameOriginReferrer = Boolean(document.referrer)
      && document.referrer.startsWith(window.location.origin);

    if (window.history.length > 1 && hasSameOriginReferrer) {
      window.history.back();
      return;
    }

    window.location.href = getFallbackPath();
  });

  backWrap.appendChild(backButton);
  header.insertAdjacentElement("afterend", backWrap);
};

document.addEventListener("DOMContentLoaded", initBackButton);
