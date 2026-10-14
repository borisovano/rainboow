(function(root){
  function register(registry){
    registry.register('practice',{name:'Practice',groups:['untimed'],dismissible:false});
    registry.register('timed',{extends:'practice',name:'Enemy encounter',groups:['timed']});
    registry.register('bridge',{extends:'practice',name:'Bridge gate',groups:['untimed','gates']});
    registry.register('rainbow',{extends:'practice',name:'Rainbow challenge',groups:['untimed','rainbow']});
    registry.register('maze',{extends:'practice',name:'Maze challenge',groups:['untimed','maze']});
    return registry;
  }
  root.MathDialogPresets={register};
})(globalThis);
