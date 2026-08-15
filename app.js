let MOVIES = [...(window.MOVIES || [])];
const labels={o:'Originality / Voice',d:'Degree of Difficulty',a:'Artistry / Cinematography',e:'Emotional Resonance',p:'Plot / Story / Acting'};
const shortLabels={o:'Originality',d:'Difficulty',a:'Artistry',e:'Emotion',p:'Story'};
const keys=['o','d','a','e','p'];
const fmt=n=>Number(n).toFixed(1);
const average=arr=>arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0;
const metadata=new Map(), criticData=new Map();
let metadataEnabled=true, criticEnabled=true, commentsEnabled=true, loadedMetadata=0;

const TITLE_ALIASES={
  'Odyssey':'The Odyssey',
  'Maverick':'Top Gun: Maverick','Banshees of Inisherin':'The Banshees of Inisherin','TAR':'Tár',
  'John Wick 1':'John Wick','John Wick 2':'John Wick: Chapter 2','John Wick 3':'John Wick: Chapter 3 – Parabellum','John Wick 4':'John Wick: Chapter 4',
  'Harry Potter 1':'Harry Potter and the Sorcerer’s Stone','Harry Potter 7':'Harry Potter and the Deathly Hallows: Part 1','Harry Potter 8':'Harry Potter and the Deathly Hallows: Part 2',
  'Avatar 3':'Avatar: Fire and Ash','2001 Space Odyssey':'2001: A Space Odyssey','LA Confidential':'L.A. Confidential','Licorice':'Licorice Pizza',"Nonna's":'Nonnas'
};
const YEAR_HINTS={'Odyssey':2026};

function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function mdata(m){return metadata.get(m.title)||null}
function ratingText(v){return Number(v)>7?'7+':String(Math.max(0,Math.round(Number(v))))}
function ratingClass(v){return Number(v)>7?' rating-plus':''}
function ratingColor(v){
  const x=Math.max(1,Math.min(7,Number(v)||1));
  const hue=((x-1)/6)*120; // red -> green
  return `hsl(${hue} 68% 43%)`;
}
function scoreColor(v){const x=Math.max(1,Math.min(7,Number(v)||1));return ratingColor(x)}
function ratingBadge(v,extra=''){return `<span class="rating-badge${ratingClass(v)} ${extra}" style="--rating:${ratingColor(v)}">${ratingText(v)}</span>`}
function posterFallback(title){return `<div class="poster-fallback"><strong>${esc(title)}</strong></div>`}
function posterHtml(m,cls=''){const md=mdata(m);return md?.poster?`<img class="${cls}" src="${md.poster}" alt="Poster for ${esc(m.title)}" loading="lazy">`:posterFallback(m.title)}
function metaLine(m){const md=mdata(m);if(!md)return 'Metadata loading…';return [md.year,md.genres?.[0],md.director].filter(Boolean).join(' · ')||'Movie metadata unavailable'}

async function fetchSheetMovies(){
  try{const r=await fetch('/api/sheet');if(!r.ok)return;const d=await r.json();if(Array.isArray(d.movies)&&d.movies.length){MOVIES=d.movies.map((m,i)=>({...m,sourceRow:m.sourceRow||i+2}));}}
  catch(e){}
}
async function fetchMetadata(m){
  if(metadata.has(m.title)||!metadataEnabled)return metadata.get(m.title);
  const cacheKey='moviemike:tmdb:v3:'+m.title;
  try{const c=localStorage.getItem(cacheKey);if(c){const x=JSON.parse(c);metadata.set(m.title,x);loadedMetadata++;return x}}catch(e){}
  try{
    const q=encodeURIComponent(TITLE_ALIASES[m.title]||m.title);const y=YEAR_HINTS[m.title]?`&year=${YEAR_HINTS[m.title]}`:'';
    const r=await fetch(`/api/tmdb?title=${q}${y}`);if(!r.ok){if(r.status===503)metadataEnabled=false;throw 0}
    const md=await r.json();metadata.set(m.title,md);loadedMetadata++;try{localStorage.setItem(cacheKey,JSON.stringify(md))}catch(e){}return md;
  }catch(e){return null}
}
async function fetchCritic(m){
  if(criticData.has(m.title)||!criticEnabled)return criticData.get(m.title);
  const md=mdata(m); if(!md)return null;
  try{
    const q=md.imdbId?`imdbId=${encodeURIComponent(md.imdbId)}`:`title=${encodeURIComponent(TITLE_ALIASES[m.title]||m.title)}`;
    const r=await fetch(`/api/critic?${q}`);if(!r.ok){if(r.status===503)criticEnabled=false;throw 0}
    const d=await r.json();criticData.set(m.title,d);return d;
  }catch(e){return null}
}
function updateMetadataStatus(){
  const s=document.getElementById('metadataStatus');
  if(!metadataEnabled){s.textContent='TMDB not configured — add TMDB_READ_TOKEN for posters, genres and credits.';return}
  s.textContent=`${loadedMetadata} of ${MOVIES.length} titles enriched`;
}
async function enrichBatch(list,rerender=true){
  const queue=[...list];const workers=Array.from({length:6},async()=>{while(queue.length&&metadataEnabled){await fetchMetadata(queue.shift());updateMetadataStatus()}});await Promise.all(workers);
  populateGenreFilter();renderGenreStats();if(rerender)renderAll();
}

function categoryScores(m){return keys.map(k=>Number(m[k]))}
function collectionDefs(){return [
  {id:'beautiful',title:'Beautiful but Hollow',dek:'High artistry; lower emotional resonance.',test:m=>m.a>=6&&m.e<=4,sort:(a,b)=>b.a-a.a||a.e-b.e},
  {id:'heart',title:'All Heart',dek:'Films that hit hardest emotionally.',test:m=>m.e>=6,sort:(a,b)=>b.e-a.e||b.score-a.score},
  {id:'fences',title:'Swinging for the Fences',dek:'The most ambitious and difficult undertakings.',test:m=>m.d>=6,sort:(a,b)=>b.d-a.d||b.score-a.score},
  {id:'complete',title:'The Complete Package',dek:'Strong across every dimension, with no obvious weak link.',test:m=>Math.min(...categoryScores(m))>=5&&m.score>=5.6,sort:(a,b)=>b.score-a.score},
  {id:'originals',title:'Originals',dek:'The strongest and most distinctive voices.',test:m=>m.o>=6,sort:(a,b)=>b.o-a.o||b.score-a.score},
  {id:'no',title:'Mike Says No',dek:'The movies at the bottom of the Mike scale.',test:m=>m.score<=3.2,sort:(a,b)=>a.score-b.score}
]}
function compactCard(m){return `<article class="compact-card" data-title="${encodeURIComponent(m.title)}"><div class="compact-art">${posterHtml(m)}<span class="compact-score" style="--score:${scoreColor(m.score)}">${fmt(m.score)}</span></div><div class="compact-copy"><strong>${esc(m.title)}</strong><small>${esc(metaLine(m))}</small></div></article>`}
function renderCollections(){document.getElementById('collectionGrid').innerHTML=collectionDefs().map(c=>{const picks=MOVIES.filter(c.test).sort(c.sort).slice(0,8);return `<section class="collection-block"><div class="collection-head"><div><span class="eyebrow">CURATED BY THE SCORES</span><h3>${c.title}</h3></div><p>${c.dek}</p></div><div class="compact-row">${picks.map(compactCard).join('')}</div></section>`}).join('')}

function renderHeroStats(){const avg=average(MOVIES.map(m=>m.score)),max=Math.max(...MOVIES.map(m=>m.score));document.getElementById('heroStats').innerHTML=`<div class="hero-stat"><strong>${MOVIES.length}</strong><span>unique movies</span></div><div class="hero-stat"><strong>${fmt(avg)}</strong><span>average aggregate</span></div><div class="hero-stat"><strong>${fmt(max)}</strong><span>highest aggregate</span></div>`}
function pantheon(){return [...MOVIES].sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title)).slice(0,12)}
function recent(){return [...MOVIES].sort((a,b)=>b.sourceRow-a.sourceRow).slice(0,12)}
function renderPantheon(){document.getElementById('pantheonGrid').innerHTML=pantheon().map(compactCard).join('')}
function renderRecent(){document.getElementById('recentGrid').innerHTML=recent().map(compactCard).join('')}
function renderHeroPosters(){const p=pantheon().slice(0,3).filter(m=>mdata(m)?.poster);document.getElementById('heroPosterStack').innerHTML=p.map(m=>`<div class="hero-poster"><img src="${mdata(m).poster}" alt=""></div>`).join('')}

function populateGenreFilter(){const el=document.getElementById('genreFilter'),cur=el.value;const genres=[...new Set([...metadata.values()].flatMap(x=>x?.genres||[]))].sort();el.innerHTML='<option value="all">All genres</option>'+genres.map(g=>`<option value="${esc(g)}">${esc(g)}</option>`).join('');if(genres.includes(cur))el.value=cur}
function renderGenreStats(){const counts={};for(const md of metadata.values())for(const g of md?.genres||[])counts[g]=(counts[g]||0)+1;const rows=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,14);document.getElementById('genreStats').innerHTML=rows.length?rows.map(([g,n])=>`<span class="genre-chip">${esc(g)} <strong>${n}</strong></span>`).join(''):'<span class="panel-note">Configure TMDB to populate genres.</span>'}

let visible=56;
function filteredMovies(){
  const q=document.getElementById('searchInput').value.trim().toLowerCase(),score=document.getElementById('scoreFilter').value,cat=document.getElementById('categoryFilter').value,genre=document.getElementById('genreFilter').value,sort=document.getElementById('sortSelect').value;
  let list=MOVIES.filter(m=>{const md=mdata(m);return [m.title,md?.director,...(md?.cast||[])].filter(Boolean).join(' ').toLowerCase().includes(q)});
  if(score==='under4')list=list.filter(m=>m.score<4);else if(score!=='all')list=list.filter(m=>m.score>=Number(score));
  if(cat!=='all')list=list.filter(m=>m[cat]>=6);if(genre!=='all')list=list.filter(m=>(mdata(m)?.genres||[]).includes(genre));
  if(sort==='scoreDesc')list.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title));
  if(sort==='scoreAsc')list.sort((a,b)=>a.score-b.score||a.title.localeCompare(b.title));
  if(sort==='recent')list.sort((a,b)=>b.sourceRow-a.sourceRow);if(sort==='az')list.sort((a,b)=>a.title.localeCompare(b.title));
  if(sort==='genre')list.sort((a,b)=>((mdata(a)?.genres?.[0]||'ZZZ').localeCompare(mdata(b)?.genres?.[0]||'ZZZ'))||a.title.localeCompare(b.title));
  if(sort==='yearDesc')list.sort((a,b)=>(mdata(b)?.year||0)-(mdata(a)?.year||0));if(sort==='yearAsc')list.sort((a,b)=>(mdata(a)?.year||9999)-(mdata(b)?.year||9999));return list;
}
function movieCard(m){const md=mdata(m);return `<article class="movie-card" data-title="${encodeURIComponent(m.title)}"><div class="movie-poster">${posterHtml(m)}<span class="movie-score" style="--score:${scoreColor(m.score)}">${fmt(m.score)}</span></div><div class="movie-card-copy"><div class="movie-title">${esc(m.title)}</div><div class="movie-meta">${esc(metaLine(m))}</div><div class="category-dots">${keys.map(k=>ratingBadge(m[k])).join('')}</div></div></article>`}
function renderMovies(){const all=filteredMovies();document.getElementById('resultCount').textContent=`${all.length} movie${all.length===1?'':'s'}`;document.getElementById('movieGrid').innerHTML=all.slice(0,visible).map(movieCard).join('');document.getElementById('loadMore').hidden=visible>=all.length}
function renderStats(){
  const avg=average(MOVIES.map(m=>m.score));const avgs=Object.fromEntries(keys.map(k=>[k,average(MOVIES.map(m=>Math.min(m[k],7)))]));const tough=keys.slice().sort((a,b)=>avgs[a]-avgs[b])[0],easy=keys.slice().sort((a,b)=>avgs[b]-avgs[a])[0];
  document.getElementById('statCards').innerHTML=`<div class="stat-card"><strong>${MOVIES.length}</strong><span>unique movies rated</span></div><div class="stat-card"><strong>${fmt(avg)}</strong><span>average aggregate</span></div><div class="stat-card"><strong>${fmt(avgs[tough])}</strong><span>toughest: ${labels[tough]}</span></div><div class="stat-card"><strong>${fmt(avgs[easy])}</strong><span>most generous: ${labels[easy]}</span></div>`;
  document.getElementById('categoryBars').innerHTML=keys.map(k=>`<div class="bar-row"><span>${labels[k]}</span><div class="bar-track"><i style="width:${avgs[k]/7*100}%;background:${ratingColor(avgs[k])}"></i></div><strong>${fmt(avgs[k])}</strong></div>`).join('');
  const bins=Array.from({length:8},(_,i)=>i),counts=bins.map(n=>MOVIES.filter(m=>m.score>=n&&(n===7?m.score<=8:m.score<n+1)).length),mx=Math.max(...counts);
  document.getElementById('distribution').innerHTML=bins.map((n,i)=>`<div class="dist-col"><div class="dist-bar" title="${counts[i]} movies" style="height:${counts[i]/mx*210}px;background:${ratingColor(Math.max(1,n))}"></div><div class="dist-label">${n}</div></div>`).join('');
}

async function loadComments(title){
  const area=document.getElementById('commentsList');area.innerHTML='<p class="panel-note">Loading comments…</p>';
  try{const r=await fetch(`/api/comments?title=${encodeURIComponent(title)}`);if(!r.ok){commentsEnabled=false;throw 0}const d=await r.json();area.innerHTML=d.comments?.length?d.comments.map(c=>`<div class="comment"><strong>${esc(c.display_name)}</strong><span>${new Date(c.created_at).toLocaleDateString()}</span><p>${esc(c.body)}</p></div>`).join(''):'<p class="panel-note">No comments yet. A dangerous amount of consensus.</p>'}
  catch(e){area.innerHTML='<p class="panel-note">Comments are optional. Connect a free Neon database in Vercel to turn them on.</p>'}
}
async function openMovie(m){
  const dialog=document.getElementById('movieDialog'),md=mdata(m);let critic=criticData.get(m.title);
  const detail=md?`<div class="dialog-meta">${esc([md.year,md.runtime?md.runtime+' min':'',...(md.genres||[])].filter(Boolean).join(' · '))}</div>${md.overview?`<p class="dialog-overview">${esc(md.overview)}</p>`:''}${md.director?`<div class="credit-line"><strong>Director:</strong> ${esc(md.director)}</div>`:''}${md.cast?.length?`<div class="credit-line"><strong>Cast:</strong> ${esc(md.cast.join(', '))}</div>`:''}`:'<div class="dialog-meta">Movie metadata not loaded.</div>';
  document.getElementById('dialogContent').innerHTML=`<div class="dialog-layout"><div class="dialog-poster">${posterHtml(m)}</div><div class="dialog-main"><span class="eyebrow">MOVIE MIKE RATING</span><div class="score-comparison"><div><span>MIKE</span><strong style="color:${scoreColor(m.score)}">${fmt(m.score)}</strong><small>/ 7-ish</small></div><div><span>METACRITIC</span><strong id="criticScore">${critic?.metacritic??'—'}</strong><small>/ 100</small></div></div><h2>${esc(m.title)}</h2>${detail}<div class="detail-scores">${keys.map(k=>`<div class="detail-row"><span>${labels[k]}</span><div class="detail-track"><i style="width:${Math.min(m[k],7)/7*100}%;background:${ratingColor(m[k])}"></i></div>${ratingBadge(m[k])}</div>`).join('')}</div><section class="comments"><h3>Comments</h3><div id="commentsList"></div><form id="commentForm" class="comment-form"><input name="name" maxlength="60" placeholder="Your name" required><textarea name="body" maxlength="800" placeholder="Your comment" required></textarea><button class="button primary" type="submit">Post comment</button></form></section></div></div>`;
  dialog.showModal();loadComments(m.title);
  document.getElementById('commentForm').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target);const r=await fetch('/api/comments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:m.title,name:fd.get('name'),body:fd.get('body')})});if(r.ok){e.target.reset();loadComments(m.title)}else alert('Comments are not configured yet.')};
  if(!md){const got=await fetchMetadata(m);if(got&&dialog.open)return openMovie(m)}
  if(md&&!critic){critic=await fetchCritic(m);if(critic&&dialog.open){const el=document.getElementById('criticScore');if(el)el.textContent=critic.metacritic??'—'}}
}

function openAddReview(){document.getElementById('reviewDialog').showModal()}
async function submitReview(e){e.preventDefault();const fd=new FormData(e.target);const payload={title:fd.get('title'),o:Number(fd.get('o')),d:Number(fd.get('d')),a:Number(fd.get('a')),e:Number(fd.get('e')),p:Number(fd.get('p'))};const secret=fd.get('secret');const r=await fetch('/api/sheet',{method:'POST',headers:{'Content-Type':'application/json','x-admin-secret':secret},body:JSON.stringify(payload)});const msg=document.getElementById('reviewMessage');if(r.ok){msg.textContent='Saved to Google Sheets. Refresh to see it once the Sheet bridge is configured for live reads.';e.target.reset()}else{msg.textContent='Not saved. Configure the Google Sheet bridge and admin secret in Vercel first.'}}

function renderAll(){renderHeroStats();renderPantheon();renderRecent();renderCollections();renderMovies();renderStats();renderGenreStats();renderHeroPosters()}

document.getElementById('dialogClose').onclick=()=>document.getElementById('movieDialog').close();
document.getElementById('reviewClose').onclick=()=>document.getElementById('reviewDialog').close();
document.getElementById('addReviewBtn').onclick=openAddReview;document.getElementById('reviewForm').onsubmit=submitReview;
document.addEventListener('click',e=>{const card=e.target.closest('[data-title]');if(!card)return;const m=MOVIES.find(x=>x.title===decodeURIComponent(card.dataset.title));if(m)openMovie(m)});
['searchInput','sortSelect','scoreFilter','categoryFilter','genreFilter'].forEach(id=>document.getElementById(id).addEventListener(id==='searchInput'?'input':'change',()=>{visible=56;renderMovies()}));
document.getElementById('loadMore').onclick=()=>{visible+=56;renderMovies()};

(async function init(){await fetchSheetMovies();renderAll();enrichBatch([...pantheon(),...recent(),...MOVIES.slice(0,80)].filter((m,i,a)=>a.findIndex(x=>x.title===m.title)===i));setTimeout(()=>enrichBatch(MOVIES.filter(m=>!metadata.has(m.title)),false),1200)})();
