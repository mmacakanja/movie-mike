/* Movie Mike private first-party audience analytics. */
(function(){
  function track(type,value){
    try{
      const body=JSON.stringify({type,value:value||null});
      fetch('/api/analytics-event',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
    }catch(_){}
  }
  let lastMovie='',lastMovieAt=0;
  document.addEventListener('click',e=>{
    const genre=e.target.closest('[data-genre]');
    if(genre){try{track('genre_selected',decodeURIComponent(genre.dataset.genre));}catch(_){}}
    const card=e.target.closest('[data-title],[data-v7-title]');
    if(card){
      try{
        const title=decodeURIComponent(card.dataset.title||card.dataset.v7Title||'');
        if(title && (title!==lastMovie||Date.now()-lastMovieAt>2500)){
          lastMovie=title;lastMovieAt=Date.now();track('movie_opened',title);
        }
      }catch(_){}
    }
  },true);
  document.getElementById('genreFilter')?.addEventListener('change',e=>{
    if(e.target.value!=='all')track('genre_selected',e.target.value);
  });
  let timer;
  document.getElementById('searchInput')?.addEventListener('input',e=>{
    clearTimeout(timer);
    if(e.target.value.trim())timer=setTimeout(()=>track('movie_search'),1300);
  });
  document.getElementById('topSearchForm')?.addEventListener('submit',()=>track('movie_search'));
  const column=document.getElementById('columnist');
  if(column && 'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(x=>x.isIntersecting)){track('guest_column_viewed');observer.disconnect();}
    },{threshold:.35});
    observer.observe(column);
  }
  const box=document.getElementById('owner');
  if(!box)return;
  const details=document.createElement('details');
  details.className='owner-box';
  details.style.marginTop='18px';
  details.innerHTML='<summary><span><span class="eyebrow">OWNER TOOLS · PRIVATE</span><strong>Audience Analytics</strong></span><span class="owner-toggle">Open</span></summary><div class="owner-content"><p>Movie clicks, searches, genres, and guest-column activity. For total visitors and geography, use Vercel Analytics.</p><form id="audienceLogin" style="display:flex;gap:10px;flex-wrap:wrap;align-items:end"><label>Owner passcode<input id="audienceSecret" type="password" autocomplete="current-password" required></label><label>Period<select id="audiencePeriod"><option value="7">Last 7 days</option><option value="30" selected>Last 30 days</option><option value="90">Last 90 days</option><option value="0">All time</option></select></label><button class="button primary" type="submit">View analytics</button></form><p id="audienceStatus" class="panel-note" role="status"></p><div id="audienceReport"></div></div>';
  box.appendChild(details);
  const form=details.querySelector('#audienceLogin'),report=details.querySelector('#audienceReport'),status=details.querySelector('#audienceStatus');
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function rows(items,key){
    if(!items?.length)return '<p class="panel-note">No events yet.</p>';
    return '<ol>'+items.map(x=>'<li>'+escape(x[key])+' — <strong>'+Number(x.count).toLocaleString()+'</strong></li>').join('')+'</ol>';
  }
  form.addEventListener('submit',async e=>{
    e.preventDefault();status.textContent='Loading…';report.replaceChildren();
    const secret=details.querySelector('#audienceSecret').value;
    try{
      const response=await fetch('/api/analytics-report',{method:'POST',headers:{'Content-Type':'application/json','x-admin-secret':secret},body:JSON.stringify({days:Number(details.querySelector('#audiencePeriod').value)}),cache:'no-store'});
      if(!response.ok){status.textContent=response.status===401?'Incorrect owner passcode.':'Unable to load analytics ('+response.status+').';return;}
      const data=await response.json();
      const counts=Object.fromEntries(data.totals.map(x=>[x.event_type,Number(x.count)]));
      status.textContent='Updated just now. Counts represent actions, not unique visitors.';
      report.innerHTML='<div class="stat-cards" style="margin:18px 0">'+[['Movie views','movie_opened'],['Searches','movie_search'],['Genre selections','genre_selected'],['Column views','guest_column_viewed']].map(([label,key])=>'<div class="panel"><strong style="font-size:1.6rem">'+(counts[key]||0).toLocaleString()+'</strong><p>'+label+'</p></div>').join('')+'</div><div class="stat-panels"><div class="panel"><h3>Most viewed movies</h3>'+rows(data.movies,'title')+'</div><div class="panel"><h3>Popular genres</h3>'+rows(data.genres,'genre')+'</div></div><div class="panel" style="margin-top:18px"><h3>Activity by day (Chicago time)</h3>'+rows(data.daily,'day')+'</div>';
    }catch(_){status.textContent='Unable to reach analytics server.';}
  });
})();
