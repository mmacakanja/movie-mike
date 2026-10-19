/* Guest-column archive and compact header search. New essays can be added to GUEST_COLUMNS. */
(function(){
  const legacy=window.VISITING_COLUMNIST;
  const columns=[legacy].filter(c=>c&&c.published);
  // New columns can be added above the legacy essay without changing the archive renderer.
  const archive=document.getElementById('columnArchive');
  const links=document.getElementById('columnArchiveLinks');
  const byline=document.getElementById('columnistByline');
  const title=document.getElementById('columnistTitle');
  const body=document.getElementById('columnistBody');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function show(c){
    byline.textContent=[c.author,c.date].filter(Boolean).join(' · ');
    title.textContent=c.title||'Guest column';
    body.innerHTML=(c.paragraphs||[]).map(p=>'<p>'+esc(p)+'</p>').join('');
    links?.querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.column===c.title)));
    document.getElementById('columnist')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  if(archive&&links){
    if(columns.length<2)archive.hidden=true;
    columns.forEach(c=>{
      const b=document.createElement('button');
      b.type='button';b.dataset.column=c.title;
      b.textContent=c.title+' — '+[c.author,c.date].filter(Boolean).join(' · ');
      b.addEventListener('click',()=>show(c));links.appendChild(b);
    });
  }
  const form=document.getElementById('headerSearchForm'),input=document.getElementById('headerSearchInput');
  if(form&&input){
    function search(){
      const target=document.getElementById('topSearchInput');
      if(target){target.value=input.value;target.dispatchEvent(new Event('input',{bubbles:true}));}
      else{const q=document.getElementById('searchInput');if(q){q.value=input.value;q.dispatchEvent(new Event('input',{bubbles:true}));}}
      document.getElementById('explore')?.scrollIntoView({behavior:'smooth'});
    }
    form.addEventListener('submit',e=>{e.preventDefault();search();});
  }
})();
