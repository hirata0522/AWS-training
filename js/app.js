'use strict';

function findVocab(id){ return VOCAB.filter(function(v){return v.id===id;})[0]; }
function findPractice(id){ return PRACTICE.filter(function(p){return p.id===id;})[0]; }

function arraysEqualSet(a, b){
  if (a.length !== b.length) return false;
  var sa = a.slice().sort(), sb = b.slice().sort();
  for (var i=0;i<sa.length;i++){ if (sa[i] !== sb[i]) return false; }
  return true;
}

function getQuestionView(item){
  if (item.type === 'vocab'){
    return {text:item.ref.q.text, choices:item.ref.q.choices, type:'single', correct:[item.ref.q.correct], why:item.ref.q.why};
  }
  return {text:item.ref.text, choices:item.ref.choices, type:item.ref.type, correct:item.ref.correct, why:item.ref.why};
}

function renderBreakdown(choices, correct, why){
  return '<div class="why-list">' + choices.map(function(label, idx){
    var ok = correct.indexOf(idx) !== -1;
    return '<div class="why-row"><span class="why-mark '+(ok?'ok':'ng')+'">'+(ok?'✓':'✕')+'</span>'+
      '<span><b>'+label+'</b><br>'+why[idx]+'</span></div>';
  }).join('') + '</div>';
}

var ICON_VOCAB = '<svg class="mode-icon" viewBox="0 0 24 24"><rect x="3" y="6" width="15" height="12" rx="2.5"></rect><rect class="cutout" x="6.5" y="3" width="15" height="12" rx="2.5" style="fill:var(--surface)"></rect></svg>';
var ICON_PRACTICE = '<svg class="mode-icon" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2.5"></rect><line x1="8" y1="8.5" x2="16" y2="8.5"></line><line x1="8" y1="12.5" x2="16" y2="12.5"></line><line x1="8" y1="16.5" x2="13" y2="16.5"></line></svg>';
var ICON_MOCK = '<svg class="mode-icon" viewBox="0 0 24 24"><circle cx="12" cy="13.5" r="7.5"></circle><line x1="12" y1="13.5" x2="12" y2="9.5"></line><line x1="12" y1="13.5" x2="15" y2="15.5"></line><line x1="9.5" y1="3" x2="14.5" y2="3"></line><line x1="12" y1="3" x2="12" y2="6"></line></svg>';
var ICON_STATS = '<svg class="mode-icon" viewBox="0 0 24 24"><line x1="5" y1="19" x2="5" y2="11"></line><line x1="12" y1="19" x2="12" y2="6"></line><line x1="19" y1="19" x2="19" y2="14"></line><line x1="2.5" y1="19" x2="21.5" y2="19"></line></svg>';
var ICON_BACK = '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>';
var ICON_HOME = '<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/></svg>';

var state = {view:'home'};
var mock = null;
var timerTick = null;

function startSession(kind){
  var items;
  if (kind === 'vocab') items = VOCAB.map(function(v){return {type:'vocab', ref:v};});
  else if (kind === 'practice') items = PRACTICE.map(function(p){return {type:'practice', ref:p};});
  else {
    items = VOCAB.filter(function(v){return isWeak(v.id);}).map(function(v){return {type:'vocab', ref:v};})
      .concat(PRACTICE.filter(function(p){return isWeak(p.id);}).map(function(p){return {type:'practice', ref:p};}));
  }
  state = {
    view:'session', kind:kind, items:items, index:0,
    step: items.length && items[0].type === 'vocab' ? 'assess' : 'answer',
    selfAssessment:null, selected:[], correctCount:0, total:items.length, lastCorrect:null
  };
  render();
}

function sessionNext(){
  state.index += 1;
  if (state.index >= state.total){
    state.view = 'sessionComplete';
    render();
    return;
  }
  state.selected = [];
  state.selfAssessment = null;
  state.lastCorrect = null;
  state.step = state.items[state.index].type === 'vocab' ? 'assess' : 'answer';
  render();
}

function handleAssess(value){
  state.selfAssessment = value;
  state.step = 'answer';
  render();
}

function toggleChoice(idx){
  var item = state.items[state.index];
  var qv = getQuestionView(item);
  if (qv.type === 'single'){
    state.selected = [idx];
  } else {
    var i = state.selected.indexOf(idx);
    if (i === -1) state.selected.push(idx); else state.selected.splice(i, 1);
  }
  render();
}

function submitAnswer(){
  var item = state.items[state.index];
  var qv = getQuestionView(item);
  var isCorrect = arraysEqualSet(state.selected, qv.correct);
  state.lastCorrect = isCorrect;
  state.step = 'feedback';
  if (isCorrect) state.correctCount += 1;
  recordResult(item.ref.id, isCorrect, item.type === 'vocab' ? state.selfAssessment : null);
  render();
}

function startMock(){
  mock = {index:0, answers:{}, timeLeft:300, finished:false};
  state = {view:'mockIntro'};
  render();
}
function beginMockPlay(){
  state = {view:'mock'};
  render();
  runTimer();
}
function runTimer(){
  clearTimer();
  timerTick = setInterval(function(){
    mock.timeLeft -= 1;
    var el = document.getElementById('mockTimer');
    if (el){
      el.textContent = formatTime(mock.timeLeft);
      el.classList.toggle('low', mock.timeLeft <= 30);
    }
    if (mock.timeLeft <= 0){
      clearTimer();
      finishMock();
    }
  }, 1000);
}
function clearTimer(){ if (timerTick){ clearInterval(timerTick); timerTick = null; } }
function formatTime(sec){
  sec = Math.max(0, sec);
  var m = Math.floor(sec/60), s = sec%60;
  return (m<10?'0':'')+m+':'+(s<10?'0':'')+s;
}

function mockToggleChoice(idx){
  var q = PRACTICE[mock.index];
  var cur = mock.answers[q.id] || [];
  if (q.type === 'single'){
    mock.answers[q.id] = [idx];
  } else {
    var i = cur.indexOf(idx);
    if (i === -1) cur.push(idx); else cur.splice(i,1);
    mock.answers[q.id] = cur;
  }
  render();
}
function mockNav(dir){
  if (dir === 'prev' && mock.index > 0){ mock.index -= 1; render(); }
  else if (dir === 'next' && mock.index < PRACTICE.length - 1){ mock.index += 1; render(); }
  else if (dir === 'submit'){ clearTimer(); finishMock(); }
}
function finishMock(){
  var results = PRACTICE.map(function(q){
    var selected = mock.answers[q.id] || [];
    var isCorrect = selected.length > 0 && arraysEqualSet(selected, q.correct);
    recordResult(q.id, isCorrect, null);
    return {q:q, selected:selected, isCorrect:isCorrect};
  });
  mock.results = results;
  mock.score = results.filter(function(r){return r.isCorrect;}).length;
  state = {view:'mockResults'};
  render();
}

function topbar(title, opts){
  opts = opts || {};
  var left = opts.home
    ? ''
    : '<button class="iconbtn" data-action="home" aria-label="ホームへ戻る">'+ICON_BACK+'</button>';
  var right = opts.progress ? '<span class="progress-tag">'+opts.progress+'</span>' : '';
  return '<div class="topbar">'+left+'<h1>'+title+'</h1>'+right+'</div>';
}

function screenHome(){
  return topbar('AWS資格ドリル', {home:true}) +
    '<main>'+
      '<div class="fade-in">'+
        '<p class="eyebrow">CLF-C02 ・ Cloud Practitioner</p>'+
        '<h2 class="hero-title">今日のドリル</h2>'+
        '<p class="hero-sub">単語・想定問題・模擬試験から選んで学習を始めましょう。</p>'+
      '</div>'+
      '<div class="mode-grid fade-in">'+
        modeCard('vocab', ICON_VOCAB, '単語問題', 'ヒントなしで分かるか即答 → 選択問題で確認')+
        modeCard('practice', ICON_PRACTICE, '想定問題', '単一・複数選択に対応。回答ごとに解説を表示')+
        modeCard('mockIntroNav', ICON_MOCK, '模擬試験', '本番形式。タイマー付きで最後にまとめて採点')+
        modeCard('stats', ICON_STATS, '進捗・統計', '分野別の正答率と苦手項目を確認')+
      '</div>'+
    '</main>';
}
function modeCard(action, icon, title, desc){
  return '<button class="mode-card" data-action="'+action+'">'+
    '<span class="mode-icon-wrap">'+icon+'</span>'+
    '<span class="mode-text"><strong>'+title+'</strong><span>'+desc+'</span></span>'+
  '</button>';
}

function screenSession(){
  var item = state.items[state.index];
  var title = state.kind === 'vocab' ? '単語問題' : (state.kind === 'practice' ? '想定問題' : '苦手項目の復習');
  var domainLabel = DOMAINS[item.ref.domain];
  var body = '';

  if (item.type === 'vocab' && state.step === 'assess'){
    body =
      '<div class="fade-in" style="display:flex;flex-direction:column;gap:1rem;">'+
        '<span class="chip">'+domainLabel+'</span>'+
        '<div class="term-card">'+
          '<div class="term-word">'+item.ref.term+'</div>'+
          '<div class="term-hint">ヒントなしで、意味が分かるか答えてください</div>'+
        '</div>'+
        '<div class="assess-row">'+
          '<button class="assess-btn" data-action="assess" data-value="known">分かる</button>'+
          '<button class="assess-btn" data-action="assess" data-value="unknown">分からない</button>'+
        '</div>'+
      '</div>';
    return topbar(title, {progress:(state.index+1)+' / '+state.total}) + '<main>'+body+'</main>';
  }

  var qv = getQuestionView(item);
  var locked = state.step === 'feedback';
  var choiceShape = qv.type === 'multi' ? 'square' : 'circle';

  var choicesHtml = qv.choices.map(function(label, idx){
    var classes = ['choice'];
    var picked = state.selected.indexOf(idx) !== -1;
    if (picked && !locked) classes.push('picked');
    if (locked){
      if (qv.correct.indexOf(idx) !== -1) classes.push('correct');
      else if (picked) classes.push('wrong');
    }
    return '<button class="'+classes.join(' ')+'" data-shape="'+choiceShape+'" '+
      (locked ? 'data-locked="1"' : 'data-action="toggleChoice" data-index="'+idx+'"')+'>'+
      '<span class="mark"></span><span>'+label+'</span>'+
    '</button>';
  }).join('');

  var hint = qv.type === 'multi' ? '<div class="q-multi-hint">当てはまるものをすべて選択してください（複数選択）</div>' : '';

  var feedback = '';
  if (locked){
    feedback = '<div class="feedback-panel fade-in">'+
      '<p class="feedback-title '+(state.lastCorrect ? 'ok' : 'ng')+'">'+(state.lastCorrect ? '正解' : '不正解')+'</p>'+
      renderBreakdown(qv.choices, qv.correct, qv.why)+
    '</div>';
  }

  body =
    '<div class="fade-in" style="display:flex;flex-direction:column;gap:1rem;">'+
      '<div class="q-meta"><span class="chip">'+domainLabel+'</span></div>'+
      '<p class="q-text">'+qv.text+'</p>'+
      hint+
      '<div class="choice-list">'+choicesHtml+'</div>'+
      feedback+
    '</div>';

  var bottomBar = '';
  if (!locked){
    bottomBar = '<div class="bottom-bar"><button class="btn btn-primary" data-action="submitAnswer" '+
      (state.selected.length === 0 ? 'disabled' : '')+'>回答する</button></div>';
  } else {
    bottomBar = '<div class="bottom-bar"><button class="btn btn-primary" data-action="next">次へ</button></div>';
  }

  return topbar(title, {progress:(state.index+1)+' / '+state.total}) + '<main>'+body+'</main>' + bottomBar;
}

function screenSessionComplete(){
  var title = state.kind === 'vocab' ? '単語問題' : (state.kind === 'practice' ? '想定問題' : '苦手項目の復習');
  return topbar(title, {home:true}) +
    '<main>'+
      '<div class="fade-in" style="display:flex;flex-direction:column;gap:1.1rem;align-items:center;text-align:center;padding-top:2rem;">'+
        '<p class="eyebrow">完了</p>'+
        '<div class="score-tile" style="width:100%;">'+
          '<div class="score-num">'+state.correctCount+' / '+state.total+'</div>'+
          '<div class="score-label">正解</div>'+
        '</div>'+
        '<p class="hero-sub">お疲れさまでした。続けて他のモードも試せます。</p>'+
      '</div>'+
    '</main>'+
    '<div class="bottom-bar">'+
      '<button class="btn btn-ghost" data-action="stats">統計を見る</button>'+
      '<button class="btn btn-primary" data-action="home">ホームへ</button>'+
    '</div>';
}

function screenMockIntro(){
  return topbar('模擬試験', {}) +
    '<main>'+
      '<div class="fade-in" style="display:flex;flex-direction:column;gap:1.1rem;">'+
        '<p class="eyebrow">CLF-C02 ・ 本番形式</p>'+
        '<h2 class="hero-title" style="font-size:1.4rem;">模擬試験を開始します</h2>'+
        '<p class="hero-sub">全'+PRACTICE.length+'問 ・ 制限時間 5:00。回答中はフィードバックが表示されず、終了後にまとめて採点・解説を確認します。</p>'+
      '</div>'+
    '</main>'+
    '<div class="bottom-bar"><button class="btn btn-primary" data-action="beginMock">開始する</button></div>';
}

function screenMock(){
  var q = PRACTICE[mock.index];
  var selected = mock.answers[q.id] || [];
  var choiceShape = q.type === 'multi' ? 'square' : 'circle';
  var choicesHtml = q.choices.map(function(label, idx){
    var picked = selected.indexOf(idx) !== -1;
    return '<button class="choice'+(picked?' picked':'')+'" data-shape="'+choiceShape+'" data-action="mockChoice" data-index="'+idx+'">'+
      '<span class="mark"></span><span>'+label+'</span>'+
    '</button>';
  }).join('');
  var hint = q.type === 'multi' ? '<div class="q-multi-hint">当てはまるものをすべて選択してください（複数選択）</div>' : '';
  var dots = PRACTICE.map(function(_, i){
    var cls = [];
    if (mock.answers[PRACTICE[i].id] && mock.answers[PRACTICE[i].id].length) cls.push('answered');
    if (i === mock.index) cls.push('current');
    return '<span class="'+cls.join(' ')+'"></span>';
  }).join('');

  var body =
    '<div class="fade-in" style="display:flex;flex-direction:column;gap:1rem;">'+
      '<div class="q-meta"><span class="chip">'+DOMAINS[q.domain]+'</span><span class="timer" id="mockTimer">'+formatTime(mock.timeLeft)+'</span></div>'+
      '<p class="q-text">'+q.text+'</p>'+
      hint+
      '<div class="choice-list">'+choicesHtml+'</div>'+
      '<div class="mock-nav-dots">'+dots+'</div>'+
    '</div>';

  var isLast = mock.index === PRACTICE.length - 1;
  var bottomBar = '<div class="bottom-bar">'+
    '<button class="btn btn-ghost" data-action="mockPrev" '+(mock.index===0?'disabled':'')+'>前へ</button>'+
    (isLast
      ? '<button class="btn btn-primary" data-action="mockSubmit">提出する</button>'
      : '<button class="btn btn-primary" data-action="mockNext">次へ</button>')+
  '</div>';

  return topbar('模擬試験 ・ 問 '+(mock.index+1)+'/'+PRACTICE.length, {}) + '<main>'+body+'</main>' + bottomBar;
}

function screenMockResults(){
  var items = mock.results.map(function(r){
    var yourAns = r.selected.length ? r.selected.map(function(i){return r.q.choices[i];}).join(' / ') : '（未回答）';
    return '<div class="review-item">'+
      '<div class="review-head"><span class="chip">'+DOMAINS[r.q.domain]+'</span>'+
        '<span class="tag-result '+(r.isCorrect?'tag-ok':'tag-ng')+'">'+(r.isCorrect?'正解':'不正解')+'</span></div>'+
      '<p style="margin:0;font-weight:700;font-family:\'Zen Kaku Gothic New\',sans-serif;font-size:.92rem;">'+r.q.text+'</p>'+
      '<p class="review-line">あなたの回答: <b>'+yourAns+'</b></p>'+
      renderBreakdown(r.q.choices, r.q.correct, r.q.why)+
    '</div>';
  }).join('');

  return topbar('模擬試験の結果', {home:true}) +
    '<main>'+
      '<div class="score-tile fade-in"><div class="score-num">'+mock.score+' / '+PRACTICE.length+'</div><div class="score-label">正解</div></div>'+
      '<div style="display:flex;flex-direction:column;gap:.7rem;" class="fade-in">'+items+'</div>'+
    '</main>'+
    '<div class="bottom-bar">'+
      '<button class="btn btn-ghost" data-action="stats">統計を見る</button>'+
      '<button class="btn btn-primary" data-action="home">ホームへ</button>'+
    '</div>';
}

function screenStats(){
  var cats = categoryStats();
  var overall = overallStats();
  var weak = weakItems();

  var catsHtml = cats.map(function(c){
    var pct = c.pct === null ? 0 : c.pct;
    var pctLabel = c.pct === null ? '未着手' : c.pct+'%';
    return '<div class="stat-row">'+
      '<div class="stat-row-head"><span>'+c.label+'</span><span>'+pctLabel+'</span></div>'+
      '<div class="bar-track"><div class="bar-fill" style="width:'+pct+'%"></div></div>'+
    '</div>';
  }).join('');

  var weakHtml = weak.length
    ? '<div class="weak-list">'+weak.map(function(w){
        return '<div class="weak-row"><span class="wtext">'+truncate(w.label, 40)+'<small>'+w.sub+'</small></span><span class="chip chip-critical">苦手</span></div>';
      }).join('')+'</div>'
    : '<p class="empty-note">現在、苦手項目はありません。</p>';

  return topbar('進捗・統計', {}) +
    '<main>'+
      '<div class="overall-stat fade-in">'+
        '<div class="score-tile"><div class="score-num">'+overall.pct+'%</div><div class="score-label">総合正答率</div></div>'+
        '<div class="score-tile"><div class="score-num">'+overall.attempts+'</div><div class="score-label">総解答数</div></div>'+
      '</div>'+
      '<div class="fade-in" style="display:flex;flex-direction:column;gap:.9rem;">'+
        '<p class="section-label">分野別の正答率</p>'+catsHtml+
      '</div>'+
      '<div class="fade-in" style="display:flex;flex-direction:column;gap:.7rem;">'+
        '<p class="section-label">苦手な項目</p>'+weakHtml+
      '</div>'+
    '</main>'+
    '<div class="bottom-bar">'+
      '<button class="btn btn-primary" data-action="reviewWeak" '+(weak.length===0?'disabled':'')+'>苦手項目だけで復習する</button>'+
    '</div>';
}

function truncate(s, n){ return s.length > n ? s.slice(0, n) + '…' : s; }

function render(){
  clearTimer();
  var app = document.getElementById('app');
  var html = '';
  switch(state.view){
    case 'home': html = screenHome(); break;
    case 'session': html = screenSession(); break;
    case 'sessionComplete': html = screenSessionComplete(); break;
    case 'mockIntro': html = screenMockIntro(); break;
    case 'mock': html = screenMock(); break;
    case 'mockResults': html = screenMockResults(); break;
    case 'stats': html = screenStats(); break;
    default: html = screenHome();
  }
  app.innerHTML = html;
  if (state.view === 'mock') runTimer();
}

document.getElementById('app').addEventListener('click', function(e){
  var el = e.target.closest('[data-action]');
  if (!el) return;
  var action = el.getAttribute('data-action');
  switch(action){
    case 'home': clearTimer(); state = {view:'home'}; render(); break;
    case 'vocab': startSession('vocab'); break;
    case 'practice': startSession('practice'); break;
    case 'reviewWeak': startSession('weak'); break;
    case 'stats': state = {view:'stats'}; render(); break;
    case 'mockIntroNav': startMock(); break;
    case 'beginMock': beginMockPlay(); break;
    case 'assess': handleAssess(el.getAttribute('data-value')); break;
    case 'toggleChoice': toggleChoice(parseInt(el.getAttribute('data-index'),10)); break;
    case 'submitAnswer': submitAnswer(); break;
    case 'next': sessionNext(); break;
    case 'mockChoice': mockToggleChoice(parseInt(el.getAttribute('data-index'),10)); break;
    case 'mockPrev': mockNav('prev'); break;
    case 'mockNext': mockNav('next'); break;
    case 'mockSubmit': mockNav('submit'); break;
  }
});

render();
