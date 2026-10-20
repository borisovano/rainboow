// Preserve explicit feature overrides when entering a direct world endpoint.
(() => {
  const stage = document.currentScript.dataset.stage;
  const target = new URL('../',location.href);
  target.search = location.search;
  target.searchParams.set('stage',stage);
  location.replace(target.href);
})();
