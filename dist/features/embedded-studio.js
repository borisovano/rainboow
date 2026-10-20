// Let the command center own scrolling while each editor keeps its own layout.
(() => {
  if(window.parent===window||!new URLSearchParams(location.search).has('embedded'))return;
  let previous=0;
  const report=()=>{const height=Math.ceil(document.body.getBoundingClientRect().height);if(height===previous)return;previous=height;parent.postMessage({type:'studio:size',height},location.origin);};
  new ResizeObserver(report).observe(document.body);report();
})();
