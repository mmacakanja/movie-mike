const MOVIES = window.MOVIES || [];
const labels={o:'Originality / Voice',d:'Degree of Difficulty',a:'Artistry / Cinematography',e:'Emotional Resonance',p:'Plot / Story / Acting'};
const keys=['o','d','a','e','p'];
const fmt=n=>Number(n).toFixed(1);
const average=arr=>arr.reduce((a,b)=>a+b,0)/arr.length;
const metadata=new Map();
let metadataEnabled=true;
let loadedMetadata=0;

const TITLE_ALIASES={
  'Maverick':'Top Gun: Maverick',
  'Banshees of Inisherin':'The Banshees of Inisherin',
  'TAR':'Tár',
  'John Wick 1':'John Wick',
  'John Wick 2':'John Wick: Chapter 2',
  'John Wick 3':'John Wick: Chapter 3 – Parabellum',
  'John Wick 4':'John Wick: Chapter 4',
  'Harry Potter 7':'Harry Potter and the Deathly Hallows: Part 1',
  'Harry Potter 8':'Harry Potter and the Deathly Hallows: Part 2',
  'Avatar 3':'Avatar: Fire and Ash',
  '2001 Space Odyssey':'2001: A Space Odyssey',
  'LA Confidential':'L.A. Confidential',
  'Licorice':'Licorice Pizza',
  "Nonna's":'Nonnas'
};

function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function mdata(m){return metadata.get(m.title) || null;}
function posterFallback(title){return `<div class="poster-fallback"><strong>${esc(title)}</strong></div>`;}
function posterHtml(m,cls=''){
  const md=mdata(m);
  return md?.poster ? `<img class="${cls}" src="${md.poster}" alt="Poster for ${esc(m.title)}" loading="lazy">` : posterFallback(m.title);
}
function metaLine(m){
  const md=mdata(m); if(!md)return 'Metadata loading…';
  return [md.year,md.genres?.[0],md.director].filter(Boolean).join(' · ') || 'Movie metadata unavailable';
}

async function fetchMetadata(m){
  if(metadata.has(m.title) || !metadataEnabled)return metadata.get(m.title);
  const cacheKey='moviemike:tmdb:'+m.title;
  try{
    const cached=localStorage.getItem(cacheKey);
    if(cached){const parsed=JSON.parse(cached); metadata.set(m.title,parsed); loadedMetadata++; return parsed;}
  }catch(e){}
  try{
    const q=encodeURIComponent(TITLE_ALIASES[m.title] || m.title);
    const r=await fetch(`/api/tmdb?title=${q}`);
    if(!r.ok){
      if(r.status===503||r.status===500){metadataEnabled=false;updateMetadataStatus();}
      throw new Error('metadata unavailable');
    }
    const md=await r.json();
    metadata.set(m.title,md); loadedMetadata++;
    try{localStorage.setItem(cacheKey,JSON.stringify(md));}catch(e){}
    return md;
  }catch(e){return null;}
}

function updateMetadataStatus(){
  const box=document.getElementById('metadataNotice'),status=document.getElementById('metadataStatus');
  if(!metadataEnabled){status.textContent='not configured yet — add TMDB_READ_TOKEN in Vercel to enable posters, genres, year, director, cast and runtime.';return;}
  status.textContent=`${loadedMetadata} of ${MOVIES.length} titles enriched`;
  if(loadedMetadata>0)box.classList.add('ready');
}

async function enrichBatch(list,rerender=true){
  const queue=[...list];
  const workers=Array.from({length:5},async()=>{
    while(queue.length&&metadataEnabled){const m=queue.shift();await fetchMetadata(m);updateMetadataStatus();}
  });
  await Promise.all(workers);
  populateGenreFilter();renderGenreStats();
  if(rerender){renderPantheon();renderRecent();renderMovies();renderHeroPosters();}
}

function openMovie(m){
  const dialog=document.getElementById('movieDialog');
  const md=mdata(m);
  const details=md ? `<div class="dialog-meta">${esc([md.year,md.runtime?md.runtime+' min':'',...(md.genres||[])].filter(Boolean).join(' · '))}</div>
    ${md.overview?`<p class="dialog-overview">${esc(md.overview)}</p>`:''}
    ${md.director?`<div class="credit-line"><strong>Director:</strong> ${esc(md.director)}</div>`:''}
    ${md.cast?.length?`<div class="credit-line"><strong>Cast:</strong> ${esc(md.cast.join(', '))}</div>`:''}` : `<div class="dialog-meta">Movie metadata not loaded.</div>`;
  document.getElementById('dialogContent').innerHTML=`<div class="dialog-layout"><div class="dialog-poster">${posterHtml(m)}</div><div class="dialog-main"><span class="eyebrow">MOVIE MIKE RATING</span><div class="dialog-score">${fmt(m.score)}</div><h2>${esc(m.title)}</h2>${details}<div class="detail-scores">${keys.map(k=>`<div class="detail-row"><span>${labels[k]}</span><div class="detail-track"><i style="width:${Math.min(m[k],8)/8*100}%"></i></div><strong>${m[k]}</strong></div>`).join('')}</div></div></div>`;
  dialog.showModal();
  if(!md) fetchMetadata(m).then(()=>{ if(dialog.open) openMovie(m); });
}

document.getElementById('dialogClose').onclick=()=>document.getElementById('movieDialog').close();
document.getElementById('movieDialog').addEventListener('click',e=>{if(e.target.id==='movieDialog')e.target.close()});
document.addEventListener('click',e=>{const card=e.target.closest('[data-title]');if(!card)return;const m=MOVIES.find(x=>x.title===decodeURIComponent(card.dataset.title));if(m)openMovie(m)});

const avgScore=average(MOVIES.map(m=>m.score));
const maxScore=Math.max(...MOVIES.map(m=>m.score));
document.getElementById('heroStats').innerHTML=`<div class="hero-stat"><strong>${MOVIES.length}</strong><span>unique movies</span></div><div class="hero-stat"><strong>${fmt(avgScore)}</strong><span>average aggregate</span></div><div class="hero-stat"><strong>${fmt(maxScore)}</strong><span>highest aggregate</span></div>`;

const pantheon=[...MOVIES].sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title)).slice(0,12);
const recent=[...MOVIES].sort((a,b)=>b.sourceRow-a.sourceRow).slice(0,12);
function renderPantheon(){document.getElementById('pantheonGrid').innerHTML=pantheon.map(m=>`<article class="feature-card" data-title="${encodeURIComponent(m.title)}"><div class="feature-art">${posterHtml(m)}<div class="feature-score">${fmt(m.score)}</div></div><div class="card-body"><div class="card-title">${esc(m.title)}</div><div class="metadata-line">${esc(metaLine(m))}</div><div class="mini-scores">${keys.map(k=>`<div class="mini-score" title="${labels[k]}: ${m[k]}"><i style="width:${Math.min(m[k],8)/8*100}%"></i></div>`).join('')}</div></div></article>`).join('')}
function renderRecent(){document.getElementById('recentGrid').innerHTML=recent.map(m=>{const md=mdata(m);const style=md?.poster?` style="background-image:url('${md.poster}')"`:'';return `<article class="recent-card" data-title="${encodeURIComponent(m.title)}"${style}><div class="recent-card-inner"><span class="score-pill">${fmt(m.score)}</span><div><strong>${esc(m.title)}</strong><div class="metadata-line">${esc(metaLine(m))}</div></div></div></article>`}).join('')}
function renderHeroPosters(){const picks=pantheon.slice(0,3).filter(m=>mdata(m)?.poster);document.getElementById('heroPosterStack').innerHTML=picks.map(m=>`<div class="hero-poster"><img src="${mdata(m).poster}" alt=""></div>`).join('')}
renderPantheon();renderRecent();

const categoryAverages=Object.fromEntries(keys.map(k=>[k,average(MOVIES.map(m=>m[k]))]));
const toughest=keys.slice().sort((a,b)=>categoryAverages[a]-categoryAverages[b])[0];
const easiest=keys.slice().sort((a,b)=>categoryAverages[b]-categoryAverages[a])[0];
document.getElementById('statCards').innerHTML=`<div class="stat-card"><strong>${MOVIES.length}</strong><span>unique movies rated</span></div><div class="stat-card"><strong>${fmt(avgScore)}</strong><span>average aggregate</span></div><div class="stat-card"><strong>${fmt(categoryAverages[toughest])}</strong><span>toughest: ${labels[toughest]}</span></div><div class="stat-card"><strong>${fmt(categoryAverages[easiest])}</strong><span>most generous: ${labels[easiest]}</span></div>`;
document.getElementById('categoryBars').innerHTML=keys.map(k=>`<div class="bar-row"><span>${labels[k]}</span><div class="bar-track"><i style="width:${categoryAverages[k]/8*100}%"></i></div><strong>${fmt(categoryAverages[k])}</strong></div>`).join('');

const intBins=Array.from({length:9},(_,i)=>i);
const intCounts=intBins.map(n=>MOVIES.filter(m=>m.score>=n && (n===8?m.score<=8:m.score<n+1)).length);
const maxCount=Math.max(...intCounts);
document.getElementById('distribution').innerHTML=intBins.map((n,i)=>`<div class="dist-col"><div class="dist-bar" title="${intCounts[i]} movies from ${n}.0 to ${n===8?'8.0':(n+1)+'.0'}" style="height:${intCounts[i]/maxCount*210}px"></div><div class="dist-label">${n}</div></div>`).join('');

function populateGenreFilter(){
  const current=document.getElementById('genreFilter').value;
  const genres=[...new Set([...metadata.values()].flatMap(x=>x?.genres||[]))].sort();
  document.getElementById('genreFilter').innerHTML='<option value="all">All genres</option>'+genres.map(g=>`<option value="${esc(g)}">${esc(g)}</option>`).join('');
  if(genres.includes(current))document.getElementById('genreFilter').value=current;
}
function renderGenreStats(){
  const counts={}; for(const md of metadata.values())for(const g of md?.genres||[])counts[g]=(counts[g]||0)+1;
  const rows=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,14);
  document.getElementById('genreStats').innerHTML=rows.length?rows.map(([g,n])=>`<span class="genre-chip">${esc(g)} <strong>${n}</strong></span>`).join(''):'<span class="panel-note">Configure TMDB to populate genres.</span>';
}
renderGenreStats();

let visible=40;
function filteredMovies(){
  const q=document.getElementById('searchInput').value.trim().toLowerCase();
  const score=document.getElementById('scoreFilter').value;
  const cat=document.getElementById('categoryFilter').value;
  const genre=document.getElementById('genreFilter').value;
  const sort=document.getElementById('sortSelect').value;
  let list=MOVIES.filter(m=>{const md=mdata(m);const hay=[m.title,md?.director,...(md?.cast||[])].filter(Boolean).join(' ').toLowerCase();return hay.includes(q)});
  if(score==='under4')list=list.filter(m=>m.score<4);else if(score!=='all')list=list.filter(m=>m.score>=Number(score));
  if(cat!=='all')list=list.filter(m=>m[cat]>=6);
  if(genre!=='all')list=list.filter(m=>(mdata(m)?.genres||[]).includes(genre));
  if(sort==='scoreDesc')list.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title));
  if(sort==='scoreAsc')list.sort((a,b)=>a.score-b.score||a.title.localeCompare(b.title));
  if(sort==='recent')list.sort((a,b)=>b.sourceRow-a.sourceRow);
  if(sort==='az')list.sort((a,b)=>a.title.localeCompare(b.title));
  if(sort==='genre')list.sort((a,b)=>(mdata(a)?.genres?.[0]||'zzz').localeCompare(mdata(b)?.genres?.[0]||'zzz')||a.title.localeCompare(b.title));
  if(sort==='yearDesc')list.sort((a,b)=>(mdata(b)?.year||0)-(mdata(a)?.year||0)||a.title.localeCompare(b.title));
  if(sort==='yearAsc')list.sort((a,b)=>(mdata(a)?.year||9999)-(mdata(b)?.year||9999)||a.title.localeCompare(b.title));
  return list;
}
function renderMovies(reset=false){
  if(reset)visible=40;
  const list=filteredMovies();
  document.getElementById('resultCount').textContent=`${list.length} movie${list.length===1?'':'s'}`;
  const shown=list.slice(0,visible);
  document.getElementById('movieGrid').innerHTML=shown.map(m=>`<article class="movie-card" data-title="${encodeURIComponent(m.title)}"><div class="movie-poster">${posterHtml(m)}<div class="movie-score">${fmt(m.score)}</div></div><div class="movie-card-copy"><div class="movie-title">${esc(m.title)}</div><div class="movie-meta">${esc(metaLine(m))}</div><div class="category-dots">${keys.map(k=>`<span title="${labels[k]}: ${m[k]}">${m[k]}</span>`).join('')}</div></div></article>`).join('');
  document.getElementById('loadMore').style.display=visible<list.length?'block':'none';
  enrichBatch(shown,false);
}
['searchInput','scoreFilter','categoryFilter','genreFilter','sortSelect'].forEach(id=>document.getElementById(id).addEventListener(id==='searchInput'?'input':'change',()=>renderMovies(true)));
document.getElementById('loadMore').onclick=()=>{visible+=40;renderMovies()};
renderMovies();updateMetadataStatus();

// First enrich the most visible titles, then quietly fill the rest so genre sorting becomes complete.
(async()=>{
  await enrichBatch([...new Map([...pantheon,...recent,...MOVIES.slice(0,40)].map(m=>[m.title,m])).values()]);
  if(metadataEnabled) enrichBatch(MOVIES.filter(m=>!metadata.has(m.title)));
})();
