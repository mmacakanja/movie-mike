/* Movie Mike v7 enhancements */
(function(){
  const SHOW_COUNT=12;
  const LOAD_STEP=12;

  function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function bySourceRow(a,b){return Number(b.sourceRow||0)-Number(a.sourceRow||0);}

  function installWhatsNew(){
    if(document.querySelector('.v7-whats-new'))return;
    const hero=document.querySelector('.hero');
    if(!hero)return;
    const c=window.VISITING_COLUMNIST||{};
    const latest=(window.MOVIES||[]).slice().sort(bySourceRow).slice(0,3);
    const box=document.createElement('section');
    box.className='v7-whats-new';
    box.innerHTML=`<div class="v7-whats-new-inner">
      <div class="v7-featured-column">
        <div class="v7-kicker"><span class="v7-pulse"></span>What’s new at Movie Mike</div>
        <h2>${c.published?`Bella takes the wheel: <em>${esc(c.title||'Guest column')}</em>`:'Fresh movies, fresh arguments.'}</h2>
        <span class="v7-byline">${c.published?esc([c.author,c.date].filter(Boolean).join(' · ')):'MOVIE MIKE UPDATE'}</span>
        <p>${c.published?'The guest chair is occupied—and apparently the spreadsheet is now under ideological attack. Read Bella Macakanja’s inaugural column, then decide whether Mike gets his website back.':'A quick guide to the latest additions and changes.'}</p>
        ${c.published?'<a class="v7-button" href="#columnist">Read the guest column →</a>':''}
      </div>
      <div class="v7-update-list">
        <h3>Also new</h3>
        <div class="v7-update"><span class="v7-update-label">Telluride 2026</span><a href="#telluride">Festival update and six featured films →</a><p>Mike’s post-festival picks, release dates, ratings and critic scores.</p></div>
        <div class="v7-update"><span class="v7-update-label">Latest reviews</span><div class="v7-latest-links">${latest.map(m=>`<button type="button" data-v7-title="${encodeURIComponent(m.title)}">${esc(m.title)}</button>`).join('')}</div><p>The most recently added ratings from the live Google Sheet.</p></div>
      </div>
    </div>`;
    hero.insertAdjacentElement('afterend',box);
  }

  function promoteColumnist(){
    const el=document.getElementById('columnist');
    if(el)el.classList.add('v7-columnist-promoted');
  }

  function removeOriginals(){
    document.querySelectorAll('.collection-block').forEach(block=>{
      const h=block.querySelector('h3');
      if(h&&h.textContent.trim()==='Originals')block.remove();
    });
  }

  function clampAllMovies(){
    const grid=document.getElementById('movieGrid');
    const btn=document.getElementById('loadMore');
    if(!grid||!btn)return;
    const cards=[...grid.children];
    if(cards.length<=SHOW_COUNT)return;
    cards.slice(SHOW_COUNT).forEach(c=>c.classList.add('v7-collapsed'));
    let shown=SHOW_COUNT;
    const fresh=btn.cloneNode(true);
    btn.replaceWith(fresh);
    fresh.hidden=cards.length<=SHOW_COUNT;
    fresh.textContent='Show more';
    fresh.onclick=()=>{
      shown=Math.min(shown+LOAD_STEP,cards.length);
      cards.slice(0,shown).forEach(c=>c.classList.remove('v7-collapsed'));
      fresh.hidden=shown>=cards.length;
    };
  }

  function openNamedMovie(title){
    const card=[...document.querySelectorAll('[data-title]')].find(el=>decodeURIComponent(el.dataset.title||'')===title);
    if(card){card.click();return;}
    const top=document.getElementById('topSearchInput');
    if(top){top.value=title;top.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('explore')?.scrollIntoView({behavior:'smooth'});}
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-v7-title]');
    if(b){openNamedMovie(decodeURIComponent(b.dataset.v7Title));}
  });

  function patchRenderedContent(){removeOriginals();clampAllMovies();}

  const observer=new MutationObserver(()=>patchRenderedContent());
  function boot(){
    installWhatsNew();
    promoteColumnist();
    patchRenderedContent();
    const collections=document.getElementById('collectionGrid');
    const movies=document.getElementById('movieGrid');
    if(collections)observer.observe(collections,{childList:true,subtree:true});
    if(movies)observer.observe(movies,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot); else boot();
})();
