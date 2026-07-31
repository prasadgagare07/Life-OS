// =======================================
// LifeOS — Fitness (localStorage-driven,
// same pattern as daily-standards.js)
// =======================================

const RULES = [
  { key:'steps_rule',   label:'10,000 Steps',                 icon:'👟', color:'#34C759', type:'derived', field:'steps',     goal:10000, unit:'' },
  { key:'junk',          label:'No Junk Food',                 icon:'🍔', color:'#FF453A', type:'manual' },
  { key:'clean_diet',    label:'Clean Diet Followed',          icon:'🥗', color:'#34C759', type:'manual' },
  { key:'protein_rule',  label:'Protein Goal Achieved (100g+)',icon:'🍗', color:'#FF453A', type:'derived', field:'protein_g', goal:100,   unit:'g' },
  { key:'no_sugar',      label:'No Sugary Drinks / Soda',      icon:'🥤', color:'#FF453A', type:'manual' },
  { key:'late_night',    label:'No Late-Night Eating (9 PM)',  icon:'🌙', color:'#A56BFF', type:'manual' },
  { key:'calorie_goal',  label:'Calorie Goal Met',             icon:'🔥', color:'#FF6A00', type:'manual' },
  { key:'sleep_rule',    label:'7-8 Hours Sleep',              icon:'😴', color:'#A56BFF', type:'derived', field:'sleep_hours', goal:7,   unit:'h' },
  { key:'water_rule',    label:'Water Goal Achieved (3L+)',    icon:'💧', color:'#32ADE6', type:'derived', field:'water_l',   goal:3,     unit:'L' },
  { key:'screen_free',   label:'Screen-Free Before Bed',       icon:'📵', color:'#2FE0D0', type:'manual' },
];

function todayKey(){
  const d = new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}

function blankEntry(date){
  return {
    date, weight:null, steps:0, water_l:0, protein_g:0, sleep_hours:0,
    workout_done:false, workout_minutes:0,
    rules:{ junk:false, clean_diet:false, no_sugar:false, late_night:false, calorie_goal:false, screen_free:false }
  };
}

function loadJSON(key, fallback){
  try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
  catch { return fallback; }
}
function saveJSON(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

let goalWeight = loadJSON('lifeos_fitness_goal', 80);
let startWeight = loadJSON('lifeos_fitness_start_weight', null);
let history = loadJSON('lifeos_fitness_history', []); // array of finished-day entries
let bestStreak = loadJSON('lifeos_fitness_best_streak', 0);
let photos = loadJSON('lifeos_fitness_photos', {});
let today = loadJSON('lifeos_fitness_today', null);

// Day rollover: if the stored "today" entry is from a previous day,
// archive it into history and start a fresh one.
(function rollover(){
  const key = todayKey();
  if (!today) { today = blankEntry(key); saveJSON('lifeos_fitness_today', today); return; }
  if (today.date !== key) {
    history.push(today);
    history = history.slice(-120);
    saveJSON('lifeos_fitness_history', history);
    today = blankEntry(key);
    saveJSON('lifeos_fitness_today', today);
  }
})();

function saveToday(){ saveJSON('lifeos_fitness_today', today); }

function ruleCompleted(rule){
  if (rule.type === 'derived') return (today[rule.field] || 0) >= rule.goal;
  return !!today.rules[rule.key];
}

function completedCount(){
  return RULES.filter(ruleCompleted).length;
}

function showToast(message, type=''){
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`.trim();
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function promptNumber(label, current, unit){
  const raw = prompt(`${label}${unit ? ' (' + unit + ')' : ''}`, current ?? '');
  if (raw === null) return null;
  const n = Number(raw);
  if (isNaN(n) || n < 0) { showToast('Enter a valid number', 'error'); return null; }
  return n;
}

// ---------- Rendering ----------

function renderRules(){
  const list = document.getElementById('rulesList');
  list.innerHTML = RULES.map((r, i) => {
    const done = ruleCompleted(r);
    const sub = r.type === 'derived'
      ? `<span class="sub">${today[r.field] || 0}${r.unit} / ${r.goal}${r.unit}</span>`
      : '';
    return `
      <div class="rule-row ${done ? 'done' : ''}" data-key="${r.key}" data-type="${r.type}" data-field="${r.field || ''}">
        <span class="num">${i+1}</span>
        <span class="badge" style="background:${r.color}26;">${r.icon}</span>
        <span class="txt">${r.label}${sub}</span>
        <span class="chk">${done ? '✓' : ''}</span>
      </div>`;
  }).join('');

  list.querySelectorAll('.rule-row').forEach(row => {
    row.addEventListener('click', () => {
      const key = row.dataset.key;
      const type = row.dataset.type;
      if (type === 'manual') {
        today.rules[key] = !today.rules[key];
        saveToday();
        renderAll();
      } else {
        const rule = RULES.find(r => r.key === key);
        const val = promptNumber(rule.label, today[rule.field], rule.unit);
        if (val !== null) {
          today[rule.field] = val;
          saveToday();
          renderAll();
        }
      }
    });
  });

  document.getElementById('rulesCount').textContent = `${completedCount()}/10`;
}

function renderScoreAndStreak(){
  const score = completedCount() * 10;
  document.getElementById('scoreNum').textContent = score;
  const ring = document.getElementById('scoreRing');
  const offset = 220 - (220 * score / 100);
  ring.style.strokeDashoffset = offset;

  const streak = computeStreak();
  if (streak > bestStreak) { bestStreak = streak; saveJSON('lifeos_fitness_best_streak', bestStreak); }
  document.getElementById('streakNum').textContent = streak;
  document.getElementById('bestStreak').textContent = `Best: ${bestStreak} Days`;
}

function computeStreak(){
  const days = new Set(history.filter(h => h.workout_done).map(h => h.date));
  if (today.workout_done) days.add(today.date);

  let streak = 0;
  let d = new Date();
  if (!days.has(todayKey())) d.setDate(d.getDate() - 1);

  while (true) {
    const key = d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
    if (days.has(key)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

function renderWeight(){
  document.getElementById('weightVal').innerHTML = today.weight != null ? `${today.weight}<sub>kg</sub>` : `—<sub>kg</sub>`;
  document.getElementById('goalVal').textContent = `GOAL: ${goalWeight} kg`;

  let pct = 0;
  if (today.weight != null && startWeight != null) {
    const totalToChange = startWeight - goalWeight;
    const doneSoFar = startWeight - today.weight;
    pct = totalToChange !== 0 ? (doneSoFar / totalToChange) * 100 : 0;
  }
  pct = Math.max(0, Math.min(100, pct));
  document.getElementById('goalBar').style.width = pct + '%';
}

function renderSummary(){
  document.getElementById('stepsVal').innerHTML = `${(today.steps||0).toLocaleString()}<br><small>/ 10,000</small>`;
  document.getElementById('stepsBar').style.width = Math.min(100, (today.steps||0) / 10000 * 100) + '%';

  document.getElementById('waterVal').innerHTML = `${(today.water_l||0)} L<br><small>/ 5.0 L</small>`;
  document.getElementById('waterBar').style.width = Math.min(100, (today.water_l||0) / 5 * 100) + '%';

  document.getElementById('proteinVal').innerHTML = `${(today.protein_g||0)} g<br><small>/ 140 g</small>`;
  document.getElementById('proteinBar').style.width = Math.min(100, (today.protein_g||0) / 140 * 100) + '%';

  document.getElementById('workoutVal').innerHTML = today.workout_done
    ? `Done<br><small>${today.workout_minutes||0} min</small>`
    : `Not Done<br><small>0 min</small>`;
  document.getElementById('workoutBar').style.width = today.workout_done ? '100%' : '0%';
}

function allEntries(){
  return [...history, today].filter(e => e.weight != null).sort((a,b) => a.date < b.date ? -1 : 1);
}

function renderChart(){
  const entries = allEntries().slice(-8);
  const svg = document.getElementById('weightChart');
  const yAxis = document.getElementById('yAxis');
  const xAxis = document.getElementById('xAxis');

  if (entries.length < 1) {
    svg.innerHTML = '';
    yAxis.innerHTML = '';
    xAxis.innerHTML = '<span style="margin:auto;">Log your weight to see progress</span>';
    return;
  }

  const weights = entries.map(e => e.weight);
  let max = Math.ceil(Math.max(...weights)) + 1;
  let min = Math.floor(Math.min(...weights)) - 1;
  if (max === min) { max += 1; min -= 1; }

  yAxis.innerHTML = [4,3,2,1,0].map(i => `<span>${Math.round(min + (max-min)*i/4)}</span>`).join('');

  const n = entries.length;
  const stepX = n > 1 ? 200 / (n - 1) : 0;
  const points = entries.map((e, i) => {
    const x = n > 1 ? i * stepX : 100;
    const y = 90 - ((e.weight - min) / (max - min)) * 80;
    return { x, y, weight: e.weight, date: e.date };
  });

  let svgHtml = '';
  [10,32,54,76,98].forEach(y => {
    svgHtml += `<line x1="0" y1="${y}" x2="200" y2="${y}" stroke="#232323" stroke-width="1"/>`;
  });
  svgHtml += `<polyline points="${points.map(p => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="#F5C542" stroke-width="2.5"/>`;
  points.forEach((p, i) => {
    const isLast = i === points.length - 1;
    svgHtml += `<circle cx="${p.x}" cy="${p.y}" r="${isLast ? 4 : 3}" fill="#F5C542" ${isLast ? 'stroke="#000" stroke-width="1"' : ''}/>`;
  });
  svg.innerHTML = svgHtml;

  const labelPoints = n <= 5 ? points : [points[0], points[Math.floor(n/3)], points[Math.floor(2*n/3)], points[n-1]];
  xAxis.innerHTML = labelPoints.map((p, i) => {
    const d = new Date(p.date + 'T00:00:00');
    const label = i === labelPoints.length - 1 && p.date === todayKey() ? 'Today' : d.toLocaleDateString('en-US', { day:'numeric', month:'short' });
    return `<span>${label}</span>`;
  }).join('');
}

function renderCalendar(){
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const monthName = now.toLocaleDateString('en-US', { month:'long', year:'numeric' }).toUpperCase();
  document.getElementById('calMonth').textContent = `📅 ${monthName}`;

  const byDate = {};
  history.forEach(h => byDate[h.date] = h);
  byDate[today.date] = today;

  const firstDay = new Date(y, m, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayStr = todayKey();

  let html = ['M','T','W','T','F','S','S'].map(d => `<span class="d">${d}</span>`).join('');
  for (let i = 0; i < startOffset; i++) html += `<span class="n"></span>`;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const entry = byDate[dateStr];
    let cls = 'n';
    if (dateStr === todayStr) cls += ' today';
    if (entry && entry.workout_done) cls += ' done';
    else if (dateStr < todayStr && entry) cls += ' miss';
    html += `<span class="${cls}">${day}</span>`;
  }
  document.getElementById('calGrid').innerHTML = html;
}

function renderAchievements(){
  const allWorkoutDays = [...history, today].filter(e => e.workout_done);
  const totalWorkouts = allWorkoutDays.length;
  const maxSteps = Math.max(0, ...[...history, today].map(e => e.steps || 0));

  const achievements = [
    { icon:'🥇', label:'First Workout', unlocked: totalWorkouts >= 1 },
    { icon:'🔥', label:'7 Day Streak',  unlocked: bestStreak >= 7 },
    { icon:'💪', label:'30 Workouts',   unlocked: totalWorkouts >= 30 },
    { icon:'👟', label:'10K Steps',     unlocked: maxSteps >= 10000 },
  ];

  document.getElementById('achRow').innerHTML = achievements.map(a => `
    <div class="ach ${a.unlocked ? 'unlocked' : ''}" title="${a.label}${a.unlocked ? ' — unlocked' : ' — locked'}">
      ${a.unlocked ? a.icon : '🔒'}
    </div>
  `).join('');
}

function renderPhotos(){
  document.querySelectorAll('.photo-slot').forEach(slot => {
    const key = slot.dataset.slot;
    if (photos[key]) {
      slot.classList.add('has-photo');
      slot.style.backgroundImage = `url(${photos[key]})`;
    }
  });
}

function renderAll(){
  renderRules();
  renderScoreAndStreak();
  renderWeight();
  renderSummary();
  renderChart();
  renderCalendar();
  renderAchievements();
}

// ---------- Interactions ----------

document.getElementById('weightVal').addEventListener('click', () => {
  const val = promptNumber('Current weight', today.weight ?? '', 'kg');
  if (val === null) return;
  today.weight = val;
  if (startWeight === null) { startWeight = val; saveJSON('lifeos_fitness_start_weight', startWeight); }
  saveToday();
  renderAll();
  showToast('Weight updated', 'success');
});

document.getElementById('goalVal').addEventListener('click', () => {
  const val = promptNumber('Goal weight', goalWeight, 'kg');
  if (val === null) return;
  goalWeight = val;
  saveJSON('lifeos_fitness_goal', goalWeight);
  renderAll();
  showToast('Goal updated', 'success');
});

document.getElementById('stepsVal').addEventListener('click', () => {
  const val = promptNumber('Steps today', today.steps, '');
  if (val === null) return;
  today.steps = val; saveToday(); renderAll();
});

document.getElementById('waterVal').addEventListener('click', () => {
  const val = promptNumber('Water intake', today.water_l, 'L');
  if (val === null) return;
  today.water_l = val; saveToday(); renderAll();
});

document.getElementById('proteinVal').addEventListener('click', () => {
  const val = promptNumber('Protein intake', today.protein_g, 'g');
  if (val === null) return;
  today.protein_g = val; saveToday(); renderAll();
});

document.getElementById('workoutCard').addEventListener('click', () => {
  today.workout_done = !today.workout_done;
  if (today.workout_done) {
    const mins = promptNumber('Workout duration', today.workout_minutes || 30, 'min');
    today.workout_minutes = mins !== null ? mins : 30;
  } else {
    today.workout_minutes = 0;
  }
  saveToday();
  renderAll();
});

// Photo uploads
const photoInput = document.getElementById('photoInput');
let pendingSlot = 'current';

document.querySelectorAll('.photo-slot').forEach(slot => {
  slot.addEventListener('click', () => {
    pendingSlot = slot.dataset.slot;
    photoInput.click();
  });
});
document.getElementById('addPhotosBtn').addEventListener('click', () => {
  pendingSlot = 'current';
  photoInput.click();
});

photoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    photos[pendingSlot] = reader.result;
    saveJSON('lifeos_fitness_photos', photos);
    renderPhotos();
    showToast('Photo saved', 'success');
  };
  reader.readAsDataURL(file);
  photoInput.value = '';
});

document.getElementById('calendarBtn').addEventListener('click', () => {
  document.querySelector('.split .panel:nth-child(2)').scrollIntoView({ behavior:'smooth', block:'center' });
});

// ---------- Init ----------
renderAll();
renderPhotos();
