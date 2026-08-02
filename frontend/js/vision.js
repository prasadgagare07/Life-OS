<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My Vision — Diya Path</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Cinzel:wght@600;700&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{background:#04030a;color:#fff;font-family:'Poppins',sans-serif;overflow-x:hidden;}
  body{padding-bottom:110px;}

  .wrap{max-width:560px; margin:0 auto; padding:24px 16px;}
  header.title{text-align:center; margin-bottom:6px;}
  .eyebrow{font-size:10.5px; letter-spacing:3px; font-weight:600; color:#fdba74;}
  h1{font-family:'Cinzel',serif; font-size:26px; letter-spacing:1px; margin-top:6px; color:#fde68a; text-shadow:0 0 16px rgba(253,186,116,.5);}

  .quote-card{margin-top:20px; text-align:center; padding:18px 20px; border-radius:18px; border:1px solid rgba(255,255,255,0.08);
    background:linear-gradient(160deg, rgba(253,186,116,0.15), rgba(74,20,32,0.2));}
  .quote-card p{font-size:14px; line-height:1.6; font-weight:600; color:#fde68a; font-family:'Cinzel',serif;}

  .add-btn{position:fixed; bottom:20px; left:50%; transform:translateX(-50%); border:none; font-weight:700; font-size:12.5px;
    padding:13px 24px; border-radius:999px; cursor:pointer; z-index:10; letter-spacing:.5px;
    background:linear-gradient(135deg,#fdba74,#7c2d12); color:#2b0f0a;}

  .legend{text-align:center; font-size:9.5px; color:#a09cc0; padding:0 14px 2px;}
  .legend b{color:#fde68a;}
  .hint{text-align:center; font-size:8.5px; color:#6b6885; padding-top:2px; margin-bottom:6px;}

  .item-label{font-size:7.8px; margin-top:6px; max-width:76px; line-height:1.25; font-weight:600; color:#fff;
    text-shadow:0 1px 3px rgba(0,0,0,.8); background:rgba(0,0,0,0.32); padding:2px 5px; border-radius:6px; display:inline-block;}

  /* ---- Diya field ---- */
  .diya-field{position:relative; width:100%; border-radius:20px; overflow:hidden; padding:24px 16px 20px;
    background:
      radial-gradient(ellipse at 20% 85%, rgba(253,186,116,0.25), transparent 55%),
      radial-gradient(ellipse at 80% 90%, rgba(219,39,119,0.25), transparent 55%),
      linear-gradient(180deg,#0a0414 0%, #1f0a2e 30%, #3d0f2e 55%, #5c1524 78%, #1a0a0f 100%);
  }
  .diya-field::before{
    content:""; position:absolute; inset:0; pointer-events:none;
    background:radial-gradient(circle at 50% 100%, rgba(255,170,80,0.22), transparent 60%);
    animation: breathe 4.5s ease-in-out infinite;
  }
  @keyframes breathe{0%,100%{opacity:.6;} 50%{opacity:1;}}
  .aurora-wash{position:absolute; inset:-20%; opacity:.35; mix-blend-mode:screen; pointer-events:none;
    background:
      radial-gradient(ellipse 40% 30% at 20% 30%, #f472b6, transparent 60%),
      radial-gradient(ellipse 35% 25% at 75% 20%, #fbbf24, transparent 60%),
      radial-gradient(ellipse 45% 30% at 55% 75%, #a855f7, transparent 60%);
    animation: auroraDrift 14s ease-in-out infinite alternate;
  }
  @keyframes auroraDrift{0%{transform:translate(0,0) scale(1);} 100%{transform:translate(4%,3%) scale(1.08);}}
  .diya-star{position:absolute; width:2px; height:2px; background:#fff; border-radius:50%; animation:dstwinkle 3s ease-in-out infinite;}
  @keyframes dstwinkle{0%,100%{opacity:.15;} 50%{opacity:.9;}}
  .petal-fall{position:absolute; top:-5%; border-radius:0 60% 0 60%; animation: petalFall linear infinite;}
  @keyframes petalFall{
    0%{ transform:translateY(0) translateX(0) rotate(0deg); opacity:0; }
    10%{ opacity:.85; }
    100%{ transform:translateY(560px) translateX(30px) rotate(220deg); opacity:0; }
  }
  .moonglow{position:absolute; top:6%; right:10%; width:80px; height:80px; border-radius:50%;
    background:radial-gradient(circle, #fff7e6, #fde68a55 60%, transparent 100%);
    animation: moonPulse 5s ease-in-out infinite;}
  @keyframes moonPulse{0%,100%{opacity:.7;} 50%{opacity:1;}}
  .ember{position:absolute; bottom:0; border-radius:50%; animation: emberRise linear infinite; filter:blur(0.3px);}
  @keyframes emberRise{ from{transform:translateY(0) translateX(0); opacity:.9;} to{transform:translateY(-320px) translateX(24px); opacity:0;} }
  .rangoli{position:absolute; bottom:-40px; left:50%; transform:translateX(-50%); width:300px; height:300px; border-radius:50%;
    border:1px dashed rgba(253,186,116,0.18); opacity:.55; animation: rangoliSpin 40s linear infinite;}
  .rangoli.r2{width:220px; height:220px; border-color:rgba(244,114,182,0.15); animation-duration:55s; animation-direction:reverse;}
  .rangoli.r3{width:140px; height:140px; border-color:rgba(251,191,36,0.18); animation-duration:30s;}
  @keyframes rangoliSpin{from{transform:translateX(-50%) rotate(0deg);} to{transform:translateX(-50%) rotate(360deg);}}

  .diya-sections{position:relative; z-index:2;}
  .diya-section{margin-bottom:22px;}
  .diya-section:last-child{margin-bottom:2px;}
  .section-label{font-size:10px; letter-spacing:2px; color:#fdba74; font-weight:700; margin-bottom:12px; padding-left:2px; text-transform:uppercase;}
  .diya-row{display:flex; flex-wrap:wrap; gap:18px 14px;}
  .diya{position:relative; width:70px; text-align:center; cursor:pointer;}
  .diya-bowl{width:34px; height:14px; border-radius:0 0 50% 50%; background:linear-gradient(180deg,#a5622a,#5c3413); margin:0 auto; position:relative;}
  .flame{width:22px; height:26px; margin:0 auto -18px; border-radius:50% 50% 50% 50% / 65% 65% 35% 35%;
    display:flex; align-items:center; justify-content:center; font-size:12px; position:relative;}
  .flame.eternal{animation: flicker 2.4s ease-in-out infinite;}
  @keyframes flicker{0%,100%{transform:scale(1); opacity:1;} 50%{transform:scale(0.82); opacity:.82;}}
  .flame.settled{animation: emberGlow 3.6s ease-in-out infinite;}
  @keyframes emberGlow{0%,100%{filter:brightness(1);} 50%{filter:brightness(1.2);}}

  /* ---- celebration overlay ---- */
  .celebrate{position:fixed; inset:0; background:rgba(3,10,18,0.92); display:none; align-items:center; justify-content:center; z-index:70; padding:20px; overflow:hidden;}
  .celebrate.show{display:flex;}
  .celebrate-particles{position:absolute; inset:0; overflow:hidden; pointer-events:none;}
  .particle{position:absolute; animation-name:floatUp; animation-timing-function:ease-out; animation-fill-mode:forwards;}
  @keyframes floatUp{0%{transform:translateY(0) scale(0.5) rotate(0deg); opacity:0;} 12%{opacity:1;} 100%{transform:translateY(-320px) scale(1.15) rotate(20deg); opacity:0;}}
  .mini-chart-burst{position:absolute; left:50%; top:26%; transform:translate(-50%,-50%); z-index:2;}
  .chart-line{stroke-dasharray:160; stroke-dashoffset:160; animation:drawLine 1.1s ease forwards .25s;}
  @keyframes drawLine{to{stroke-dashoffset:0;}}
  .celebrate-card{position:relative; z-index:3; background:rgba(10,10,20,0.92); border:1px solid rgba(255,255,255,0.15); border-radius:22px; padding:30px 24px 24px; text-align:center; max-width:300px; width:100%; box-shadow:0 0 40px rgba(255,255,255,0.08);}
  .celebrate-icon{font-size:44px; animation:iconPop .6s ease;}
  @keyframes iconPop{0%{transform:scale(0);} 60%{transform:scale(1.3);} 100%{transform:scale(1);}}
  .celebrate-card h3{font-family:'Anton',sans-serif; font-size:15px; margin-top:10px; color:#fff;}
  .celebrate-card .tag{font-size:10px; color:#fde68a; margin-top:6px;}
  .celebrate-card button{margin-top:16px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#fff; padding:9px 20px; border-radius:999px; cursor:pointer; font-size:11px;}
</style>
</head>
<body>

<div class="wrap">
  <header class="title">
    <div class="eyebrow">🪔 EVERY DREAM, A LIGHT OF ITS OWN 🪔</div>
    <h1>My Diya Path</h1>
  </header>

  <div class="legend">🔁 <b>Ongoing forever</b> &nbsp;•&nbsp; 🎯 <b>One-time milestone</b></div>
  <div class="hint">Tap any diya to celebrate it ✦</div>

  <div class="diya-field" id="diyaField">
    <div class="aurora-wash"></div>
    <div class="moonglow"></div>
    <div class="rangoli"></div>
    <div class="rangoli r2"></div>
    <div class="rangoli r3"></div>
    <div class="diya-sections" id="diyaSections"></div>
  </div>

  <div class="quote-card">
    <p>A single diya does not fear the dark. It simply keeps burning.</p>
  </div>
</div>

<button class="add-btn" id="addBtn">+ ADD VISION</button>

<div class="celebrate" id="celebrate">
  <div class="celebrate-particles" id="celebrateParticles"></div>
  <div class="celebrate-card">
    <div class="celebrate-icon" id="celebrateIcon">✦</div>
    <h3 id="celebrateText"></h3>
    <div class="tag" id="celebrateTag"></div>
    <button id="closeCelebrateBtn">Close</button>
  </div>
</div>

<script>
  const BASE = [
    { icon:'🛡️', label:'₹1,00,000 Emergency Fund', color:'#2DD4BF', recurring:false, category:'shield', section:'finance' },
    { icon:'📈', label:'Invest ₹20,000/mo', color:'#22C55E', recurring:true, category:'growth', section:'finance' },
    { icon:'💹', label:'SIP ₹15,000/mo', color:'#A3E635', recurring:true, category:'growth', section:'finance' },
    { icon:'🏥', label:'₹1Cr Term + Health Cover', color:'#38BDF8', recurring:false, category:'shield', section:'finance' },
    { icon:'🏡', label:'Bungalow in Chincholi', color:'#F59E0B', recurring:false, category:'build', section:'finance' },
    { icon:'🤝', label:'Help Orphans & Elders', color:'#F472B6', recurring:true, category:'heart', section:'donation' },
    { icon:'🐄', label:'Donate to Gau Shala', color:'#FBBF24', recurring:true, category:'heart', section:'donation' },
    { icon:'💻', label:'High-Income Digital Skill', color:'#06B6D4', recurring:false, category:'skill', section:'skills' },
    { icon:'🧠', label:'Master AI, Leadership & English', color:'#A78BFA', recurring:true, category:'mind', section:'skills' },
    { icon:'📚', label:'1 Book Every Month', color:'#FB923C', recurring:true, category:'knowledge', section:'book' },
    { icon:'💪', label:'Fit, 6-Abs Body', color:'#EF4444', recurring:false, category:'fitness', section:'body' },
  ];

  const SECTIONS = [
    { key:'finance',  label:'💰 Finance' },
    { key:'donation', label:'🤝 Giving' },
    { key:'skills',   label:'🎯 Skills' },
    { key:'book',     label:'📚 Knowledge' },
    { key:'body',     label:'💪 Body' },
  ];

  let visions = BASE.slice();

  // ---------- Celebration engine ----------
  const PARTICLE_SETS = {
    shield:['✅','✨','🛡️'], growth:['💰','💵','📈','✨'], knowledge:['📖','✨','💡'],
    skill:['💻','⚡','✨'], heart:['❤️','💕','✨'], build:['🧱','🎉','🏠','✨'],
    fitness:['💪','💦','🔥'], mind:['🧠','⚡','✨'],
  };
  function spawnParticles(category){
    const layer = document.getElementById('celebrateParticles');
    layer.innerHTML = '';
    const emojis = PARTICLE_SETS[category] || ['✨'];
    for(let i=0;i<26;i++){
      const p=document.createElement('div'); p.className='particle';
      p.textContent = emojis[Math.floor(Math.random()*emojis.length)];
      p.style.left=(8+Math.random()*82)+'%'; p.style.bottom=(Math.random()*10)+'%';
      p.style.fontSize=(14+Math.random()*16)+'px';
      p.style.animationDuration=(1.3+Math.random()*1.4)+'s'; p.style.animationDelay=(Math.random()*0.5)+'s';
      layer.appendChild(p);
    }
    if(category==='growth' || category==='knowledge'){
      const chart=document.createElement('div'); chart.className='mini-chart-burst';
      chart.innerHTML = `<svg viewBox="0 0 100 40" width="150" height="60"><polyline points="0,35 20,28 40,30 60,15 80,18 100,4" fill="none" stroke="#4ade80" stroke-width="3" stroke-linecap="round" class="chart-line"/></svg>`;
      layer.appendChild(chart);
    }
  }
  function showCelebration(v){
    document.getElementById('celebrateIcon').textContent = v.icon;
    document.getElementById('celebrateText').textContent = v.label;
    document.getElementById('celebrateTag').textContent = v.recurring ? '🔁 Ongoing forever' : '🎯 One-time milestone';
    spawnParticles(v.category);
    document.getElementById('celebrate').classList.add('show');
  }
  function closeCelebration(){ document.getElementById('celebrate').classList.remove('show'); }
  document.getElementById('closeCelebrateBtn').addEventListener('click', closeCelebration);
  document.getElementById('celebrate').addEventListener('click',(e)=>{ if(e.target.id==='celebrate') closeCelebration(); });

  // ---------- Render ----------
  function render(){
    const field = document.getElementById('diyaField');
    field.querySelectorAll('.ember,.diya-star,.petal-fall').forEach(n=>n.remove());

    for(let i=0;i<30;i++){
      const s=document.createElement('div'); s.className='diya-star';
      s.style.left=Math.random()*100+'%'; s.style.top=Math.random()*50+'%';
      s.style.animationDelay=(Math.random()*3)+'s';
      field.appendChild(s);
    }
    for(let i=0;i<22;i++){
      const e=document.createElement('div'); e.className='ember';
      const s=2+Math.random()*3;
      e.style.width=s+'px'; e.style.height=s+'px'; e.style.left=Math.random()*100+'%';
      e.style.background = Math.random()>0.5 ? 'rgba(253,186,116,0.85)' : 'rgba(244,114,182,0.75)';
      e.style.animationDuration=(5+Math.random()*5)+'s'; e.style.animationDelay=(Math.random()*5)+'s';
      field.appendChild(e);
    }
    for(let i=0;i<10;i++){
      const p=document.createElement('div'); p.className='petal-fall';
      const s=6+Math.random()*6;
      p.style.width=s+'px'; p.style.height=s+'px'; p.style.left=Math.random()*100+'%';
      p.style.background = Math.random()>0.5 ? '#fb923c' : '#fbbf24';
      p.style.animationDuration=(8+Math.random()*6)+'s'; p.style.animationDelay=(Math.random()*8)+'s';
      field.appendChild(p);
    }

    const sectionsEl = document.getElementById('diyaSections');
    sectionsEl.innerHTML = '';

    SECTIONS.forEach(sec => {
      const items = visions.filter(v => v.section === sec.key);
      if (items.length === 0) return;

      const secDiv = document.createElement('div');
      secDiv.className = 'diya-section';

      const label = document.createElement('div');
      label.className = 'section-label';
      label.textContent = sec.label;
      secDiv.appendChild(label);

      const row = document.createElement('div');
      row.className = 'diya-row';

      items.forEach(v => {
        const node = document.createElement('div');
        node.className = 'diya';
        node.innerHTML = `
          <div class="flame ${v.recurring?'eternal':'settled'}" style="
            background:radial-gradient(circle at 40% 30%, ${v.color}, ${v.color}66 70%);
            box-shadow:0 0 16px ${v.color}aa;
            animation-delay:${(Math.random()*2).toFixed(2)}s;
          ">${v.icon}</div>
          <div class="diya-bowl"></div>
          <div class="item-label">${v.label}</div>
        `;
        node.addEventListener('click', ()=>showCelebration(v));
        row.appendChild(node);
      });

      secDiv.appendChild(row);
      sectionsEl.appendChild(secDiv);
    });
  }

  render();

  // ---------- Add Vision ----------
  document.getElementById('addBtn').addEventListener('click', ()=>{
    const label = prompt('New vision:');
    if(!label) return;
    const recurring = confirm('Is this an ongoing habit (OK) or a one-time milestone (Cancel)?');
    const sectionKey = prompt('Which section? (finance / donation / skills / book / body)', 'finance');
    const palette = ['#2DD4BF','#22C55E','#38BDF8','#F472B6','#FBBF24','#A78BFA','#EF4444','#FB923C'];
    const cats = Object.keys(PARTICLE_SETS);
    const validSection = SECTIONS.some(s=>s.key===sectionKey) ? sectionKey : 'finance';
    const newV = {
      icon:'✦', label,
      color: palette[Math.floor(Math.random()*palette.length)],
      recurring,
      category: cats[Math.floor(Math.random()*cats.length)],
      section: validSection
    };
    visions.push(newV);
    render();
  });
</script>
</body>
</html>
