(() => {
  const flags = window.GameFeatures;
  const list = document.getElementById('flag-list');
  const stage = document.getElementById('stage');
  const play = document.getElementById('play');
  const status = document.getElementById('save-status');
  function link() { return flags.gameLink(new URL('../',location.href).href,stage.value); }
  function refreshLink() { play.href = link(); document.getElementById('copy-fallback').hidden = true; document.getElementById('copy-status').textContent = ''; }
  function render() {
    list.replaceChildren();
    const snapshot = flags.snapshot();
    document.getElementById('enabled-count').textContent = snapshot.filter(flag=>flag.value).length+' enabled';
    for (const flag of snapshot) {
      const card = document.createElement('article'); card.className = 'flag-card'+(flag.value?' enabled':'');
      // Registry values are rendered as text; contributed metadata cannot insert markup.
      const top = document.createElement('div'); top.className = 'flag-card-top';
      const category = document.createElement('span'); category.className = 'pill'; category.textContent = flag.category.toUpperCase();
      const label = document.createElement('label'); label.className = 'toggle';
      const toggle = document.createElement('input'); toggle.id = 'flag-'+flag.id; toggle.type = 'checkbox'; toggle.checked = flag.value; toggle.setAttribute('role','switch'); toggle.setAttribute('aria-label',flag.title);
      const track = document.createElement('span'); track.className = 'toggle-track'; track.setAttribute('aria-hidden','true');
      const state = document.createElement('span'); state.textContent = flag.value?'On':'Off'; state.setAttribute('aria-hidden','true');
      label.append(toggle,track,state); top.append(category,label);
      const heading = document.createElement('h3'); heading.textContent = flag.title;
      const description = document.createElement('p'); description.textContent = flag.description;
      const details = document.createElement('div'); details.className = 'flag-details';
      const key = document.createElement('code'); key.textContent = flag.id;
      const defaultValue = document.createElement('span'); defaultValue.textContent = 'Default: '+(flag.defaultValue?'on':'off');
      const source = document.createElement('span'); source.textContent = flag.source==='url'?'Pinned by this URL':flag.source==='browser'?'Your browser setting':'Using default';
      details.append(key,defaultValue,source); card.append(top,heading,description,details); list.append(card);
      toggle.disabled = flag.source === 'url';
      toggle.addEventListener('change',() => { flags.setOverride(flag.id,toggle.checked); document.getElementById('flag-'+flag.id).focus(); });
    }
    status.textContent = flags.isPersistent() ? 'Changes save automatically in this browser and update open game tabs.' : 'Browser storage is unavailable. These settings are temporary; use a test link to carry them into the game.';
    if (snapshot.some(flag=>flag.source==='url')) status.textContent = 'This page has pinned URL settings. Open /feature-flags/ without query parameters to edit your saved switches.';
    refreshLink();
  }
  flags.subscribe(render);
  stage.addEventListener('change',refreshLink);
  document.getElementById('reset').addEventListener('click',()=>flags.reset());
  document.getElementById('copy').addEventListener('click',async()=>{
    try { await navigator.clipboard.writeText(link()); document.getElementById('copy-status').textContent='Test link copied. It includes the world and every flag.'; }
    catch { const field=document.getElementById('copy-fallback');field.value=link();field.hidden=false;field.focus();field.select();document.getElementById('copy-status').textContent='Copy the selected test link below.'; }
  });
  render();
})();
