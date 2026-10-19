/* Movie Mike guest columns — newest first; Issue 1 retained intact in columnist.js. */
(function(){
  const previous=window.VISITING_COLUMNIST;
  const latest={
  "published": true,
  "sectionHeadline": "AMC and the City",
  "sectionDek": "Bella returns with more movies, more opinions, and absolutely no allegiance to Mike’s seven-point scale.",
  "author": "Bella Macakanja",
  "date": "19 Oct 2026",
  "title": "AMC and the City — Issue No. 2",
  "intro": [
    "Hey friends, foes, Dafoes! I’m sure you all missed me. I’ve watched innumerable movies in the past month (a very numerable value, I might add) and have returned to report my most recent opinions, shocks, scars, and obsessions. As always, my opinions are knee-jerk and not to be taken earnestly unless you agree with them. Xoxo.",
    "Because I really have watched a lot since my last column (which speaks only to how committed I am to the arts, and apparently not to this website), I’m posting the full list with star ratings (out of five), plus comments wherever I please or have something snide to say. Hope you can keep up with my five-star ratings after you’ve all been converted to the seven layers of hell system.",
    "Sorry the list isn’t more thorough, but if I try to write more concisely or with more wit, it starts to feel like a chore, and I already have a job, so that’s not happening. If you’re surprised by the movies I consumed in my free time, remember I was freakishly sick for about a week in September and should not be judged for being antisocial."
  ],
  "reviews": [
    [
      "The Ballad of Buster Scruggs",
      3.5,
      "Buster Scruggs is an Avengers-level threat."
    ],
    [
      "The Dog Stars",
      3,
      "About a virus where hot people are immune. Ridley Scott made a Jacob Elordi edit that was two hours long. The streets are calling him “Midley Scott.”"
    ],
    [
      "The Aviator",
      3,
      "Solid movie about an extremely normal guy just being a cool dude: flying planes, dating teenagers, drinking milk, making movies, and having crippling disorders (that can be traced to visions of American success ingrained in childhood), exacerbated by an industry and culture that celebrates wealth, progress, and Alec Baldwin."
    ],
    [
      "The Place Beyond the Pines",
      4,
      "More people should see this."
    ],
    [
      "Stand by Me",
      5,
      ""
    ],
    [
      "Rocky",
      5,
      "Is this really a five-star movie? Yes. Fight me. Fight Rocky. You’ll lose."
    ],
    [
      "The Weight",
      3.5,
      "McKinley said, “I need one of the best actors of the 21st century with a bird last name,” and the casting director said, “Here’s two.”"
    ],
    [
      "The Candidate",
      4,
      "Please watch this! Satire about elections and Redford being hot. Robert Redford died at 89. Great age to be president."
    ],
    [
      "Two Weeks Notice",
      2.5,
      "Donald Trump was in this…"
    ],
    [
      "The Aristocats",
      null,
      "Not rated, for posterity’s sake."
    ],
    [
      "Primetime",
      3.5,
      "Somebody get these PREDATORS outta here!!! Great cinematography. I have been on Skylar’s train since 2019. I <3 u, Decoy Dan."
    ],
    [
      "Bud Abbott and Lou Costello Meet Frankenstein",
      null,
      "Not rated to avoid an argument. (3 stars.)"
    ],
    [
      "The Mummy",
      3,
      "International treasure."
    ],
    [
      "A Talent for Murder",
      4,
      "“I know a homo when I see one.” — Helen Mirren, 2026"
    ],
    [
      "Oasis: Don’t Look Back in Anger",
      4,
      "God, I love English people. I wish they were real."
    ],
    [
      "Digger",
      2,
      "So much to say here. Call me. I wanted to like it more, but there was much more volume than depth (dig a little!). The message was shallow (I don’t need two hours on how climate change is bad, our government is inept, and art about tragedy matters). But I love Jesse Plemons and his fuck-ass haircut. (Sorry for the language, Dad. I really don’t know how else to describe it.)"
    ],
    [
      "Steel Magnolias",
      4.5,
      "Called my mom as soon as this ended, and she didn’t answer. :("
    ]
  ],
  "outro": [
    "I dare you to guess which two movies are the responsibility of a Nevada visitor. No money, but a crisp handshake for any correct responses. Hope I made at least half of you exhale through your nose today (not a full laugh; I didn’t try that hard).",
    "See you in a month, like your cinemenstrual cycle <3 (I see this line getting cut). Okay, love u, bye."
  ]
};
  window.VISITING_COLUMNIST=latest;
  const columns=[latest,previous].filter(c=>c&&c.published);
  const archive=document.getElementById('columnArchive');
  const links=document.getElementById('columnArchiveLinks');
  const byline=document.getElementById('columnistByline');
  const title=document.getElementById('columnistTitle');
  const body=document.getElementById('columnistBody');
  const headline=document.getElementById('columnistHeadline');
  const dek=document.getElementById('columnistDek');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function stars(n){
    if(n===null)return '';
    let out='<span class="bella-stars" role="img" aria-label="'+n+' out of 5 stars">';
    for(let i=0;i<5;i++){
      const amount=Math.max(0,Math.min(1,n-i));
      out+='<span class="bella-star '+(amount===1?'full':amount===0?'empty':'half')+'">★</span>';
    }
    return out+'</span>';
  }
  function show(c,scroll=false){
    if(!byline||!title||!body)return;
    byline.textContent=[c.author,c.date].filter(Boolean).join(' · ');
    title.textContent=c.title||'Guest column';
    if(headline)headline.textContent=c.sectionHeadline||'A different seat in the theater';
    if(dek)dek.textContent=c.sectionDek||'Occasional guest essays, alternate verdicts and friendly dissent.';
    if(c.reviews){
      body.innerHTML=c.intro.map(p=>'<p>'+esc(p)+'</p>').join('')+
        '<div class="bella-review-list">'+c.reviews.map(([name,rating,comment])=>
          '<div class="bella-review"><div class="bella-review-head"><strong>'+esc(name)+'</strong>'+stars(rating)+'</div>'+
          (comment?'<p>'+esc(comment)+'</p>':'')+'</div>').join('')+'</div>'+
        c.outro.map(p=>'<p>'+esc(p)+'</p>').join('');
    }else{
      body.innerHTML=(c.paragraphs||[]).map(p=>'<p>'+esc(p)+'</p>').join('');
    }
    links?.querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.column===c.title)));
    if(scroll)document.getElementById('columnist')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  if(archive&&links){
    archive.hidden=columns.length<2;
    links.replaceChildren();
    columns.forEach(c=>{
      const b=document.createElement('button');
      b.type='button';b.dataset.column=c.title;
      b.textContent=c.title+' — '+[c.author,c.date].filter(Boolean).join(' · ');
      b.addEventListener('click',()=>show(c,true));links.appendChild(b);
    });
  }
  show(latest);
  const form=document.getElementById('headerSearchForm'),input=document.getElementById('headerSearchInput');
  if(form&&input)form.addEventListener('submit',e=>{
    e.preventDefault();
    const target=document.getElementById('topSearchInput')||document.getElementById('searchInput');
    if(target){target.value=input.value;target.dispatchEvent(new Event('input',{bubbles:true}));}
    document.getElementById('explore')?.scrollIntoView({behavior:'smooth'});
  });
})();
