(async () => {
  const link = document.getElementById('redirect-target');
  if (!link) return;
  const target = new URL(link.href);
  try {
    const response = await fetch('/page-map.json');
    if (response.ok) {
      const pages = await response.json();
      const fragment = decodeURIComponent(location.hash.slice(1));
      if (pages[target.pathname]?.anchors.includes(fragment)) target.hash = location.hash;
    }
  } catch { /* The visible canonical link remains usable without JavaScript/network. */ }
  location.replace(target.href);
})();
