(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector("[data-theme-toggle]");
  const updateThemeButton = () => {
    if (!themeButton) return;
    const isLight = root.dataset.theme === "light";
    themeButton.textContent = isLight ? "Dark" : "Light";
    themeButton.setAttribute("aria-pressed", String(isLight));
    themeButton.setAttribute("aria-label", isLight ? "Use dark theme" : "Use light theme");
  };

  updateThemeButton();
  themeButton?.addEventListener("click", () => {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try {
      localStorage.setItem("licoarc-theme", next);
    } catch {}
    updateThemeButton();
  });

  const form = document.querySelector("[data-search]");
  if (!form) return;
  const input = form.querySelector("input");
  const panel = form.querySelector("[data-search-panel]");
  const status = form.querySelector("[data-search-status]");
  const results = form.querySelector("[data-search-results]");
  input.setAttribute("aria-keyshortcuts", "/");
  let entriesPromise;

  const getEntries = () => {
    entriesPromise ??= fetch("/search-index.json", { credentials: "same-origin" })
      .then((response) => {
        if (!response.ok) throw new Error("search-index");
        return response.json();
      });
    return entriesPromise;
  };

  const close = () => {
    panel.hidden = true;
    results.replaceChildren();
  };

  const render = async () => {
    const query = input.value.trim().toLocaleLowerCase("en");
    if (!query) {
      status.textContent = "Type a title, heading, or protocol term.";
      results.replaceChildren();
      panel.hidden = false;
      return;
    }

    try {
      const entries = await getEntries();
      const matches = entries.filter((entry) => entry.search.includes(query)).slice(0, 8);
      results.replaceChildren();
      for (const entry of matches) {
        const link = document.createElement("a");
        link.href = entry.url;
        const title = document.createElement("strong");
        title.textContent = entry.title;
        const summary = document.createElement("span");
        summary.textContent = entry.summary;
        link.append(title, summary);
        const item = document.createElement("li");
        item.append(link);
        results.append(item);
      }
      status.textContent = matches.length
        ? String(matches.length) + " result" + (matches.length === 1 ? "." : "s.")
        : "No matching documentation. Open the documentation index to browse every chapter.";
      panel.hidden = false;
    } catch {
      status.textContent = "Search is unavailable. Open the documentation index to browse every chapter.";
      results.replaceChildren();
      panel.hidden = false;
    }
  };

  input.addEventListener("input", render);
  input.addEventListener("focus", render);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
      input.blur();
    }
    if (event.key === "ArrowDown") {
      const first = results.querySelector("a");
      if (first) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await render();
    results.querySelector("a")?.click();
  });
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isEditing = target instanceof HTMLElement &&
      (target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName));
    if (event.defaultPrevented || event.key !== "/" || event.altKey || event.ctrlKey || event.metaKey || isEditing) return;
    event.preventDefault();
    input.focus();
    input.select();
  });
  document.addEventListener("click", (event) => {
    if (!form.contains(event.target)) close();
  });
})();
