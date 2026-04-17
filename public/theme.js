(() => {
  const THEME_KEY = "cybreach-appearance";
  const themeToggleButton = document.querySelector("[data-theme-toggle]");
  const themeLabel = document.querySelector("[data-theme-label]");

  const getCurrentTheme = () =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light";

  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;

    if (!themeToggleButton || !themeLabel) {
      return;
    }

    const nextTheme = theme === "dark" ? "light" : "dark";
    themeLabel.textContent = nextTheme === "dark" ? "Dark mode" : "Light mode";
    themeToggleButton.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
    themeToggleButton.setAttribute("aria-pressed", String(theme === "dark"));
  };

  applyTheme(getCurrentTheme());

  if (!themeToggleButton) {
    return;
  }

  themeToggleButton.addEventListener("click", () => {
    const nextTheme = getCurrentTheme() === "dark" ? "light" : "dark";

    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch {
      // Ignore localStorage failures and still switch for the current page view.
    }

    applyTheme(nextTheme);
  });
})();
