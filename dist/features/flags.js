(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.GameFeatureFlags = api; root.GameFeatures = api.createStore(root); }
})(typeof window !== 'undefined' ? window : globalThis, function() {
  'use strict';
  const STORAGE_KEY = 'moon-rainbow.features.v1';
  const definitions = Object.freeze([
    Object.freeze({id:'pipCharacter', title:'Play as Pip', category:'Characters', defaultValue:false,
      description:'Bring the Blender character into every world, with animated walking, jumping, and a little wave for new powers.'})
  ]);
  const known = id => definitions.some(flag => flag.id === id);
  function sanitize(value) {
    const clean = {};
    if (!value || typeof value !== 'object') return clean;
    for (const flag of definitions) if (typeof value[flag.id] === 'boolean') clean[flag.id] = value[flag.id];
    return clean;
  }
  function parseSearch(search) {
    const params = new URLSearchParams(search || ''), overrides = {};
    for (const flag of definitions) {
      const value = params.get('ff.' + flag.id);
      if (value === '1' || value === 'true') overrides[flag.id] = true;
      if (value === '0' || value === 'false') overrides[flag.id] = false;
    }
    return overrides;
  }
  function createStore(env = {}) {
    let overrides = {}, persistent = true;
    const listeners = new Set();
    const url = parseSearch(env.location?.search);
    function read() {
      let text;
      try {
        if (!env.localStorage) { persistent = false; return {}; }
        text = env.localStorage.getItem(STORAGE_KEY);
      } catch { persistent = false; return {}; }
      try {
        const stored = JSON.parse(text || 'null');
        return stored?.version === 1 ? sanitize(stored.overrides) : {};
      } catch { return {}; }
    }
    overrides = read();
    function snapshot() {
      return definitions.map(flag => {
        const source = Object.hasOwn(url,flag.id) ? 'url' : Object.hasOwn(overrides,flag.id) ? 'browser' : 'default';
        return {...flag, value:source === 'url' ? url[flag.id] : source === 'browser' ? overrides[flag.id] : flag.defaultValue, source};
      });
    }
    function notify() { for (const callback of listeners) callback(snapshot()); }
    function persist() {
      try {
        if (!env.localStorage) throw new Error('Storage unavailable');
        if (Object.keys(overrides).length) env.localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,overrides}));
        else env.localStorage.removeItem(STORAGE_KEY);
        persistent = true;
      } catch { persistent = false; }
      notify(); return persistent;
    }
    const storageChanged = event => {
      if (event.key === STORAGE_KEY || event.key === null) { overrides = read(); notify(); }
    };
    env.addEventListener?.('storage',storageChanged);
    return {
      definitions, snapshot,
      enabled(id) { return snapshot().find(flag => flag.id === id)?.value ?? false; },
      setOverride(id,value) {
        if (!known(id) || (typeof value !== 'boolean' && value !== null)) throw new TypeError('Expected a registered flag and boolean or null');
        if (value === null) delete overrides[id]; else overrides[id] = value;
        return persist();
      },
      reset() { overrides = {}; return persist(); },
      isPersistent() { return persistent; },
      subscribe(callback) { listeners.add(callback); return () => listeners.delete(callback); },
      dispose() { listeners.clear(); env.removeEventListener?.('storage',storageChanged); },
      gameLink(base,stage='earth') {
        const link = new URL(base);
        link.search = ''; link.hash = '';
        link.searchParams.set('stage',['earth','moon','rainbow','maze'].includes(stage)?stage:'earth');
        for (const flag of snapshot()) link.searchParams.set('ff.'+flag.id,flag.value?'1':'0');
        return link.href;
      }
    };
  }
  return {STORAGE_KEY,definitions,parseSearch,createStore};
});
