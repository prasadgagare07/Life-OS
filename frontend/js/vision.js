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
