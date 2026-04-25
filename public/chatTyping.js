(() => {
  const ANSWER_SCROLL_KEY = "cybreach-chat-restore-position";
  const feed = document.querySelector("[data-typing-feed]");
  const choices = document.querySelector("[data-chat-choices]");
  const chatShell = feed?.closest(".chat-shell");

  if (!feed) {
    return;
  }

  const messages = Array.from(feed.querySelectorAll("[data-chat-message]"));
  const storageKey = `cybreach-chat-seen:${feed.dataset.conversationKey || window.location.pathname}`;

  const wait = (duration) =>
    new Promise((resolve) => {
      window.setTimeout(resolve, duration);
    });

  const getSeenCount = () => {
    try {
      const count = Number.parseInt(sessionStorage.getItem(storageKey) || "0", 10);
      return Number.isFinite(count) ? Math.max(count, 0) : 0;
    } catch {
      return 0;
    }
  };

  const setSeenCount = (count) => {
    try {
      sessionStorage.setItem(storageKey, String(count));
    } catch {
      // The animation still works even when sessionStorage is unavailable.
    }
  };

  const markAnswerSubmit = () => {
    try {
      sessionStorage.setItem(ANSWER_SCROLL_KEY, "true");
    } catch {
      // If sessionStorage is blocked, the chat still works; only scroll restore is skipped.
    }
  };

  const consumeAnswerSubmit = () => {
    try {
      const shouldRestore = sessionStorage.getItem(ANSWER_SCROLL_KEY) === "true";
      sessionStorage.removeItem(ANSWER_SCROLL_KEY);
      return shouldRestore;
    } catch {
      return false;
    }
  };

  const setChoicesWaiting = (isWaiting) => {
    if (!choices) {
      return;
    }

    choices.classList.toggle("is-waiting", isWaiting);

    for (const button of choices.querySelectorAll("button")) {
      button.disabled = isWaiting;
    }
  };

  const scrollToBottom = (behavior = "smooth") => {
    feed.scrollTo({
      top: feed.scrollHeight,
      behavior,
    });
  };

  const scrollToBottomAfterLayout = (behavior = "auto") => {
    window.requestAnimationFrame(() => {
      scrollToBottom(behavior);
    });
  };

  const restoreChatPositionAfterAnswer = () => {
    if (!consumeAnswerSubmit()) {
      return;
    }

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const target = chatShell || feed;
    const restore = () => {
      target.scrollIntoView({ block: "start", behavior: "auto" });
      scrollToBottom("auto");
    };

    window.requestAnimationFrame(() => {
      restore();
      window.setTimeout(restore, 80);
    });
  };

  const getTypingDelay = (message) => {
    const textLength = message.textContent.trim().length;
    return Math.min(10000, Math.max(550, textLength * 23));
  };

  const createTypingIndicator = (message) => {
    const author = message.querySelector(".message-author")?.textContent || "";
    const indicator = document.createElement("article");
    const bubble = document.createElement("div");

    indicator.className = "message incoming typing-indicator";
    indicator.setAttribute("aria-label", author ? `${author} typing` : "Typing");

    if (author) {
      const authorElement = document.createElement("span");
      authorElement.className = "message-author";
      authorElement.textContent = author;
      indicator.append(authorElement);
    }

    bubble.className = "typing-bubble";
    bubble.setAttribute("aria-hidden", "true");

    for (let index = 0; index < 3; index += 1) {
      const dot = document.createElement("span");
      dot.className = "typing-dot";
      bubble.append(dot);
    }

    indicator.append(bubble);

    return indicator;
  };

  const revealMessage = (message) => {
    message.classList.remove("is-pending");
    message.classList.add("is-revealing");
    scrollToBottom();

    window.setTimeout(() => {
      message.classList.remove("is-revealing");
    }, 260);
  };

  const playTypingSequence = async (startIndex) => {
    setChoicesWaiting(true);

    for (let index = startIndex; index < messages.length; index += 1) {
      const message = messages[index];
      const isIncoming = message.classList.contains("incoming");

      if (isIncoming) {
        const typingIndicator = createTypingIndicator(message);
        feed.insertBefore(typingIndicator, message);
        scrollToBottom();
        await wait(getTypingDelay(message));
        typingIndicator.remove();
      } else {
        await wait(180);
      }

      revealMessage(message);
      setSeenCount(index + 1);
      await wait(170);
    }

    setChoicesWaiting(false);
  };

  const initialize = () => {
    if (!messages.length) {
      return;
    }

    const storedSeenCount = getSeenCount();
    const seenCount = storedSeenCount > messages.length ? 0 : storedSeenCount;
    feed.classList.add("is-typing-prepared");

    for (const [index, message] of messages.entries()) {
      if (index < seenCount) {
        message.classList.remove("is-pending");
      }
    }

    scrollToBottomAfterLayout("auto");
    restoreChatPositionAfterAnswer();

    if (seenCount >= messages.length) {
      setChoicesWaiting(false);
      return;
    }

    playTypingSequence(seenCount);
  };

  choices?.addEventListener("submit", markAnswerSubmit);
  initialize();
})();
