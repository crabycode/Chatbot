(() => {
  const toggleButtons = document.querySelectorAll("[data-password-toggle]");

  if (!toggleButtons.length) {
    return;
  }

  const applyVisibility = (input, button, isVisible) => {
    input.type = isVisible ? "text" : "password";
    button.classList.toggle("is-visible", isVisible);
    button.setAttribute("aria-pressed", String(isVisible));
    button.setAttribute(
      "aria-label",
      isVisible ? "Скрий паролата" : "Покажи паролата",
    );
  };

  for (const button of toggleButtons) {
    const selector = button.dataset.passwordToggle;
    const input = selector
      ? document.querySelector(selector)
      : button.closest(".password-input-wrap")?.querySelector("input");

    if (!(input instanceof HTMLInputElement)) {
      continue;
    }

    applyVisibility(input, button, input.type === "text");

    button.addEventListener("click", () => {
      applyVisibility(input, button, input.type === "password");
    });
  }
})();
