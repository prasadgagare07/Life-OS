// =======================================
// LifeOS — Fitness (localStorage-driven)
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

function ymd(d){
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
function todayKey(){ return ymd(new Date()); }

function blankEntry(date){
  return {
    date, weight:null, steps:0, water_l:0, protein_g:0, sleep_hours:0,
    workout_done:false, workout_minutes:0, locked:false,
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
// archive it into history and start a fresh (unlocked) one.
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

// ---------- Rules / scoring (generalised over any entry) ----------

function ruleCompleted(entry, rule){
  if (rule.type === 'derived') return (entry[rule.field] || 0) >= rule.goal;
  return !!(entry.rules && entry.rules[rule.key]);
}
function completedCount(entry){
  entry = entry || today;
  return RULES.filter(r => ruleCompleted(entry, r)).length;
}
function scoreOf(entry){ return completedCount(entry) * 10; }

// ---------- Toast / prompt helpers ----------

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

// today's data is locked once saved, until the next calendar day
function checkLock(){
  if (today.locked) {
    showToast("Today is locked — come back tomorrow!", 'error');
    return true;
  }
  return false;
}

// ---------- Rendering ----------

function renderRules(){
  const list = document.getElementById('rulesList');
  list.innerHTML = RULES.map((r, i) => {
    const done = ruleCompleted(today, r);
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
      if (checkLock()) return;
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

  document.getElementById('rulesCount').textContent = `${completedCount(today)}/10`;
  document.getElementById('lockIndicator').textContent = today.locked ? '🔒 Locked' : '';
}

function renderScoreAndStreak(){
  const score = scoreOf(today);
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
    const key = ymd(d);
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

// ---------- Save / lock button ----------

function refreshSaveButton(){
  const btn = document.getElementById('saveDayBtn');
  if (today.locked) {
    btn.textContent = '✅ Saved for Today';
    btn.disabled = true;
    btn.classList.add('saved');
  } else {
    btn.textContent = '💾 Save Today';
    btn.disabled = false;
    btn.classList.remove('saved');
  }
  document.body.classList.toggle('locked-day', !!today.locked);
}

document.getElementById('saveDayBtn').addEventListener('click', () => {
  if (today.locked) return;
  if (!confirm("Once saved, today's fitness data can't be edited until tomorrow. Continue?")) return;
  today.locked = true;
  saveToday();
  renderAll();
  showToast('Day saved — see you tomorrow!', 'success');
});

// ---------- Progress chart (Weight / Steps / Workout / Score) ----------

let chartMetric = 'weight';

const METRIC_CONFIG = {
  weight:  { unit:'',  color:'#F5C542', requiresValue:true,  field:'weight' },
  steps:   { unit:'',  color:'#34C759', requiresValue:false, field:'steps' },
  workout: { unit:'m', color:'#F5C542', requiresValue:false, field:'workout_minutes' },
  score:   { unit:'',  color:'#A56BFF', requiresValue:false, field:null },
};

function metricValue(entry, metric){
  if (metric === 'score') return scoreOf(entry);
  return entry[METRIC_CONFIG[metric].field] || 0;
}

function chartEntries(metric){
  const all = [...history, today].sort((a,b) => a.date < b.date ? -1 : 1);
  if (METRIC_CONFIG[metric].requiresValue) {
    return all.filter(e => e.weight != null);
  }
  return all;
}

function renderChart(){
  const cfg = METRIC_CONFIG[chartMetric];
  const entries = chartEntries(chartMetric).slice(-8);
  const svg = document.getElementById('weightChart');
  const yAxis = document.getElementById('yAxis');
  const xAxis = document.getElementById('xAxis');

  if (entries.length < 1) {
    svg.innerHTML = '';
    yAxis.innerHTML = '';
    xAxis.innerHTML = `<span style="margin:auto;">No ${chartMetric} data yet</span>`;
    return;
  }

  const values = entries.map(e => metricValue(e, chartMetric));
  let max, min;
  if (chartMetric === 'score') {
    max = 100; min = 0;
  } else {
    max = Math.ceil(Math.max(...values, 1) * 1.15);
    min = chartMetric === 'weight' ? Math.floor(Math.min(...values)) - 1 : 0;
    if (max === min) max = min + 1;
  }

  yAxis.innerHTML = [4,3,2,1,0].map(i => {
    const v = min + (max-min)*i/4;
    return `<span>${chartMetric === 'weight' ? Math.round(v) : Math.round(v)}${cfg.unit}</span>`;
  }).join('');

  const n = entries.length;
  const stepX = n > 1 ? 200 / (n - 1) : 0;
  const points = entries.map((e, i) => {
    const x = n > 1 ? i * stepX : 100;
    const v = metricValue(e, chartMetric);
    const y = 90 - ((v - min) / (max - min)) * 80;
    return { x, y, v, date: e.date };
  });

  let svgHtml = '';
  [10,32,54,76,98].forEach(y => {
    svgHtml += `<line x1="0" y1="${y}" x2="200" y2="${y}" stroke="#232323" stroke-width="1"/>`;
  });
  svgHtml += `<polyline points="${points.map(p => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="${cfg.color}" stroke-width="2.5"/>`;
  points.forEach((p, i) => {
    const isLast = i === points.length - 1;
    svgHtml += `<circle cx="${p.x}" cy="${p.y}" r="${isLast ? 4 : 3}" fill="${cfg.color}" ${isLast ? 'stroke="#000" stroke-width="1"' : ''}/>`;
  });
  svg.innerHTML = svgHtml;

  const labelPoints = n <= 5 ? points : [points[0], points[Math.floor(n/3)], points[Math.floor(2*n/3)], points[n-1]];
  xAxis.innerHTML = labelPoints.map((p, i) => {
    const [yy,mm,dd] = p.date.split('-').map(Number);
    const d = new Date(yy, mm-1, dd);
    const label = i === labelPoints.length - 1 && p.date === todayKey() ? 'Today' : d.toLocaleDateString('en-US', { day:'numeric', month:'short' });
    return `<span>${label}</span>`;
  }).join('');
}

document.querySelectorAll('#chartTabs span').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('#chartTabs span').forEach(t => t.classList.remove('on'));
    tab.classList.add('on');
    chartMetric = tab.dataset.metric;
    renderChart();
  });
});

// ---------- Calendar (with month navigation) ----------

let calView = (() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; })();

function renderCalendar(){
  const { y, m } = calView;
  const monthName = new Date(y, m, 1).toLocaleDateString('en-US', { month:'long', year:'numeric' }).toUpperCase();
  document.getElementById('calMonth').textContent = `📅 ${monthName}`;

  const byDate = {};
  history.forEach(h => byDate[h.date] = h);
  byDate[today.date] = today;

  const firstDay = new Date(y, m, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday-first
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

  const now = new Date();
  const isCurrentMonth = (y === now.getFullYear() && m === now.getMonth());
  document.getElementById('calNext').disabled = isCurrentMonth;
}

document.getElementById('calPrev').addEventListener('click', () => {
  calView.m--;
  if (calView.m < 0) { calView.m = 11; calView.y--; }
  renderCalendar();
});
document.getElementById('calNext').addEventListener('click', () => {
  const now = new Date();
  if (calView.y === now.getFullYear() && calView.m === now.getMonth()) return;
  calView.m++;
  if (calView.m > 11) { calView.m = 0; calView.y++; }
  renderCalendar();
});

// ---------- Consistency ----------

function computeConsistency(days){
  const all = [...history, today];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const cutoffKey = ymd(cutoff);
  const relevant = all.filter(e => e.date >= cutoffKey && e.date <= todayKey());
  if (relevant.length === 0) return 0;
  const avgScore = relevant.reduce((sum, e) => sum + scoreOf(e), 0) / relevant.length;
  return Math.round(avgScore);
}

function renderConsistency(){
  const byDate = {};
  history.forEach(h => byDate[h.date] = h);
  byDate[today.date] = today;

  let html = '';
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = ymd(d);
    const entry = byDate[key];
    const score = entry ? scoreOf(entry) : 0;
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    const isToday = key === todayKey();
    html += `
      <div class="bar-col">
        <div class="bar${isToday ? ' today' : ''}" style="height:${Math.max(score, 4)}%"></div>
        <div class="bar-val">${score}</div>
        <div class="bar-label">${label}</div>
      </div>`;
  }
  document.getElementById('consistencyBars').innerHTML = html;

  document.getElementById('weekConsistency').textContent = computeConsistency(7) + '%';
  document.getElementById('monthConsistency').textContent = computeConsistency(30) + '%';
}

// ---------- Achievements ----------

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

// ---------- Photos ----------

function renderPhotos(){
  document.querySelectorAll('.photo-slot').forEach(slot => {
    const key = slot.dataset.slot;
    if (photos[key]) {
      slot.classList.add('has-photo');
      slot.style.backgroundImage = `url(${photos[key]})`;
    }
  });
}

// ---------- Master render ----------

function renderAll(){
  refreshSaveButton();
  renderRules();
  renderScoreAndStreak();
  renderWeight();
  renderSummary();
  renderChart();
  renderCalendar();
  renderConsistency();
  renderAchievements();
}

// ---------- Interactions ----------

document.getElementById('weightVal').addEventListener('click', () => {
  if (checkLock()) return;
  const val = promptNumber('Current weight', today.weight ?? '', 'kg');
  if (val === null) return;
  today.weight = val;
  if (startWeight === null) { startWeight = val; saveJSON('lifeos_fitness_start_weight', startWeight); }
  saveToday();
  renderAll();
  showToast('Weight updated', 'success');
});

// Goal weight is a standing target, not part of the daily lock
document.getElementById('goalVal').addEventListener('click', () => {
  const val = promptNumber('Goal weight', goalWeight, 'kg');
  if (val === null) return;
  goalWeight = val;
  saveJSON('lifeos_fitness_goal', goalWeight);
  renderAll();
  showToast('Goal updated', 'success');
});

document.getElementById('stepsVal').addEventListener('click', () => {
  if (checkLock()) return;
  const val = promptNumber('Steps today', today.steps, '');
  if (val === null) return;
  today.steps = val; saveToday(); renderAll();
});

document.getElementById('waterVal').addEventListener('click', () => {
  if (checkLock()) return;
  const val = promptNumber('Water intake', today.water_l, 'L');
  if (val === null) return;
  today.water_l = val; saveToday(); renderAll();
});

document.getElementById('proteinVal').addEventListener('click', () => {
  if (checkLock()) return;
  const val = promptNumber('Protein intake', today.protein_g, 'g');
  if (val === null) return;
  today.protein_g = val; saveToday(); renderAll();
});

document.getElementById('workoutCard').addEventListener('click', () => {
  if (checkLock()) return;
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

// Photo uploads (not covered by the daily lock)
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
