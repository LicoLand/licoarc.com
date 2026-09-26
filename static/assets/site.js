(() => {
  const root = document.documentElement;
  root.classList.add('has-js');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const themeButton = document.querySelector('[data-theme-toggle]');
  const updateThemeButton = () => {
    if (!themeButton) return;
    const isLight = root.dataset.theme === 'light';
    themeButton.querySelector('[data-theme-label]').textContent = isLight ? 'Dark' : 'Light';
    themeButton.setAttribute('aria-pressed', String(isLight));
    themeButton.setAttribute('aria-label', isLight ? 'Use dark theme' : 'Use light theme');
  };
  updateThemeButton();
  themeButton?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('licoarc-theme', root.dataset.theme); } catch {}
    updateThemeButton();
    document.dispatchEvent(new CustomEvent('licoarc:theme'));
  });

  const motionButton = document.querySelector('[data-motion-toggle]');
  let motionPaused = root.dataset.motion === 'paused';
  const updateMotion = () => {
    const paused = motionPaused || reducedMotion.matches;
    root.dataset.motion = paused ? 'paused' : 'active';
    if (motionButton) {
      motionButton.setAttribute('aria-pressed', String(paused));
      motionButton.querySelector('[data-motion-label]').textContent = reducedMotion.matches
        ? 'Reduced motion' : paused ? 'Play motion' : 'Pause motion';
      motionButton.disabled = reducedMotion.matches;
    }
    document.dispatchEvent(new CustomEvent('licoarc:motion', { detail: { paused } }));
  };
  updateMotion();
  motionButton?.addEventListener('click', () => {
    motionPaused = !motionPaused;
    try { localStorage.setItem('licoarc-motion', motionPaused ? 'paused' : 'active'); } catch {}
    updateMotion();
  });
  reducedMotion.addEventListener('change', updateMotion);

  const menu = document.querySelector('.site-menu');
  menu?.addEventListener('click', (event) => {
    if (event.target.closest('a')) menu.open = false;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu?.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });

  const story = document.querySelector('[data-signal-story]');
  const storySteps = [...document.querySelectorAll('[data-story-step]')];
  const setStage = (step) => {
    story.dataset.stage = step.dataset.storyStep;
    for (const button of storySteps) button.setAttribute('aria-pressed', String(button === step));
  };
  for (const step of storySteps) {
    step.addEventListener('click', () => setStage(step));
    step.addEventListener('keydown', (event) => {
      const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
      if (!delta) return;
      event.preventDefault();
      const next = storySteps[(storySteps.indexOf(step) + delta + storySteps.length) % storySteps.length];
      next.focus();
      setStage(next);
    });
  }

  if ('IntersectionObserver' in window) {
    const reveals = new IntersectionObserver((entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.25 });
    document.querySelectorAll('[data-reveal]').forEach((node) => reveals.observe(node));
    if (story) {
      const storyVisibility = new IntersectionObserver(([entry]) => {
        story.classList.toggle('is-visible', entry.isIntersecting);
      });
      storyVisibility.observe(story);
    }
  }

  if (document.body.classList.contains('doc')) {
    let scheduled = false;
    const updateProgress = () => {
      const distance = root.scrollHeight - innerHeight;
      root.style.setProperty('--reading-progress', distance > 0 ? String(Math.min(1, Math.max(0, scrollY / distance))) : '1');
      scheduled = false;
    };
    const scheduleProgress = () => {
      if (!scheduled) { scheduled = true; requestAnimationFrame(updateProgress); }
    };
    addEventListener('scroll', scheduleProgress, { passive: true });
    addEventListener('resize', scheduleProgress, { passive: true });
    updateProgress();
  }

  const form = document.querySelector('[data-search]');
  if (!form) return;
  const input = form.querySelector('input');
  const panel = form.querySelector('[data-search-panel]');
  const status = form.querySelector('[data-search-status]');
  const results = form.querySelector('[data-search-results]');
  input.setAttribute('aria-keyshortcuts', '/');
  input.setAttribute('aria-controls', 'search-panel');
  input.setAttribute('aria-expanded', 'false');
  panel.id = 'search-panel';
  let entriesPromise;
  let revision = 0;
  const getEntries = () => {
    entriesPromise ??= fetch('/search-index.json', { credentials: 'same-origin' })
      .then((response) => {
        if (!response.ok) throw new Error('search-index');
        return response.json();
      }).catch((error) => { entriesPromise = undefined; throw error; });
    return entriesPromise;
  };
  const open = () => {
    panel.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  };
  const close = () => {
    revision++;
    panel.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    results.replaceChildren();
  };
  const render = async () => {
    const current = ++revision;
    const query = input.value.trim().toLocaleLowerCase('en');
    results.replaceChildren();
    if (!query) {
      status.textContent = 'Type a title, heading, or protocol term.';
      open();
      return false;
    }
    status.textContent = 'Searching the documentation…';
    open();
    try {
      const entries = await getEntries();
      if (current !== revision) return false;
      const matches = entries.filter((entry) => entry.search.includes(query)).slice(0, 8);
      const fragment = document.createDocumentFragment();
      for (const entry of matches) {
        const link = document.createElement('a');
        link.href = entry.url;
        const title = document.createElement('strong');
        title.textContent = entry.title;
        const summary = document.createElement('span');
        summary.textContent = entry.summary;
        link.append(title, summary);
        const item = document.createElement('li');
        item.append(link);
        fragment.append(item);
      }
      results.replaceChildren(fragment);
      status.textContent = matches.length ? `${matches.length} result${matches.length === 1 ? '' : 's'}.`
        : 'No matching documentation. Browse all chapters in Documentation.';
      return matches.length > 0;
    } catch {
      if (current !== revision) return false;
      status.textContent = 'Search is unavailable. Browse all chapters in Documentation, or type again to retry.';
      results.replaceChildren();
      return false;
    }
  };
  input.addEventListener('input', render);
  input.addEventListener('focus', render);
  form.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { close(); input.focus(); input.blur(); }
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    const links = [...results.querySelectorAll('a')];
    if (!links.length) return;
    event.preventDefault();
    const index = links.indexOf(document.activeElement);
    if (event.key === 'ArrowUp' && index === 0) input.focus();
    else if (index < 0) links[event.key === 'ArrowDown' ? 0 : links.length - 1].focus();
    else links[(index + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length].focus();
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const hasResults = await render();
    if (hasResults && !panel.hidden) results.querySelector('a')?.click();
  });
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const isEditing = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName));
    if (event.defaultPrevented || event.key !== '/' || event.altKey || event.ctrlKey || event.metaKey || isEditing) return;
    event.preventDefault(); input.focus(); input.select();
  });
  document.addEventListener('click', (event) => { if (!form.contains(event.target)) close(); });
  form.addEventListener('focusout', () => {
    queueMicrotask(() => { if (!form.contains(document.activeElement)) close(); });
  });
})();
