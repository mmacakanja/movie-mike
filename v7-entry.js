/* Movie Mike v7 loader: preserves the existing application and layers v7 enhancements on top. */
(function(){
  const css=document.createElement('link');
  css.rel='stylesheet';
  css.href='/v7.css?v=7.0.0';
  document.head.appendChild(css);

  const core=document.createElement('script');
  core.src='/app-core.js?v=6.3-core';
  core.onload=()=>{
    const v7=document.createElement('script');
    v7.src='/v7.js?v=7.0.0';
    document.body.appendChild(v7);
  };
  document.body.appendChild(core);
})();
