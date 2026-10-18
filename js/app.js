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
    return {id:item.ref.id, text:item.ref.q.text, choices:item.ref.q.choices, type:'single', correct:[item.ref.q.correct], why:item.ref.q.why, source:item.ref.source};
  }
  return item.ref;
}

// ---- 解答形式ごとの処理 ----
// single/multi: 回答は選んだ選択肢の添字の配列
// ordering: 回答は items の添字を並べた配列（items はデータ上で正しい順に並んでいる）
// matching: 回答は prompts ごとに選んだ options の添字（未選択は -1）
function emptyAnswer(q){
  return q.type === 'matching' ? q.prompts.map(function(){return -1;}) : [];
}
function isAnswerComplete(q, ans){
  if (!ans) return false;
  if (q.type === 'ordering') return ans.length === q.items.length;
  if (q.type === 'matching') return ans.every(function(a){return a !== -1;});
  return ans.length > 0;
}
function isAnswerCorrect(q, ans){
  if (!isAnswerComplete(q, ans)) return false;
  if (q.type === 'ordering') return ans.every(function(v, i){return v === i;});
  if (q.type === 'matching') return ans.every(function(v, i){return v === q.correct[i];});
  return arraysEqualSet(ans, q.correct);
}
function applyAnswerOp(q, ans, op, a, b){
  ans = ans.slice();
  if (op === 'choice'){
    if (q.type === 'single') return [a];
    var i = ans.indexOf(a);
    if (i === -1) ans.push(a); else ans.splice(i, 1);
  } else if (op === 'orderPick'){
    if (ans.indexOf(a) === -1) ans.push(a);
  } else if (op === 'orderRemove'){
    var j = ans.indexOf(a);
    if (j !== -1) ans.splice(j, 1);
  } else if (op === 'match'){
    ans[a] = b;
  }
  return ans;
}

// 並び替え問題の選択肢の表示順（再描画しても変わらないよう問題ごとに固定。正解順のままにはしない）
var orderShuffles = {};
function orderDisplay(q){
  if (!orderShuffles[q.id]){
    var idx = q.items.map(function(_, i){return i;});
    var s = idx;
    for (var t = 0; t < 10; t++){
      s = shuffleCopy(idx);
      if (s.some(function(v, i){return v !== i;})) break;
    }
    orderShuffles[q.id] = s;
  }
  return orderShuffles[q.id];
}

function answerHint(q){
  if (q.type === 'multi') return '<div class="q-multi-hint">当てはまるものをすべて選択してください（複数選択）</div>';
  if (q.type === 'ordering') return '<div class="q-multi-hint">最初の手順から順にタップしてください（並べたものをタップすると取り消し）</div>';
  if (q.type === 'matching') return '<div class="q-multi-hint">それぞれに当てはまるものを選んでください（使わない選択肢もあります）</div>';
  return '';
}

// 回答入力欄。locked のときは操作不可にし、正誤を色で示す（showResult）
function renderAnswerInput(q, ans, locked){
  if (q.type === 'ordering') return renderOrderingInput(q, ans, locked);
  if (q.type === 'matching') return renderMatchingInput(q, ans, locked);
  var choiceShape = q.type === 'multi' ? 'square' : 'circle';
  return '<div class="choice-list">' + q.choices.map(function(label, idx){
    var classes = ['choice'];
    var picked = ans.indexOf(idx) !== -1;
    if (picked && !locked) classes.push('picked');
    if (locked){
      if (q.correct.indexOf(idx) !== -1) classes.push('correct');
      else if (picked) classes.push('wrong');
    }
    return '<button class="'+classes.join(' ')+'" data-shape="'+choiceShape+'" '+
      (locked ? 'data-locked="1"' : 'data-action="choice" data-index="'+idx+'"')+'>'+
      '<span class="mark"></span><span>'+label+'</span>'+
    '</button>';
  }).join('') + '</div>';
}

function renderOrderingInput(q, ans, locked){
  var slots = q.items.map(function(_, pos){
    var picked = ans[pos];
    if (picked === undefined){
      return '<div class="order-slot empty"><span class="order-num">'+(pos+1)+'</span><span class="order-placeholder">未選択</span></div>';
    }
    var cls = 'order-slot filled';
    if (locked) cls += picked === pos ? ' correct' : ' wrong';
    return '<button class="'+cls+'" '+(locked ? 'data-locked="1"' : 'data-action="orderRemove" data-index="'+picked+'"')+'>'+
      '<span class="order-num">'+(pos+1)+'</span><span>'+q.items[picked]+'</span></button>';
  }).join('');
  var rest = locked ? '' : orderDisplay(q).filter(function(i){return ans.indexOf(i) === -1;}).map(function(i){
    return '<button class="choice" data-shape="circle" data-action="orderPick" data-index="'+i+'"><span class="mark"></span><span>'+q.items[i]+'</span></button>';
  }).join('');
  return '<div class="order-slots">'+slots+'</div>' + (rest ? '<div class="choice-list">'+rest+'</div>' : '');
}

function renderMatchingInput(q, ans, locked){
  return '<div class="match-list">' + q.prompts.map(function(prompt, pi){
    var cls = 'match-row';
    if (locked) cls += ans[pi] === q.correct[pi] ? ' correct' : ' wrong';
    var opts = '<option value="-1"'+(ans[pi] === -1 ? ' selected' : '')+'>選択してください</option>' +
      q.options.map(function(o, oi){
        return '<option value="'+oi+'"'+(ans[pi] === oi ? ' selected' : '')+'>'+o+'</option>';
      }).join('');
    return '<div class="'+cls+'"><p class="match-prompt">'+prompt+'</p>'+
      '<select class="match-select" data-prompt="'+pi+'"'+(locked ? ' disabled' : '')+'>'+opts+'</select></div>';
  }).join('') + '</div>';
}

// 回答後の解説（全選択肢・全手順・全組み合わせについて正誤と理由を表示）
function renderBreakdown(q, ans){
  if (q.type === 'ordering'){
    return '<div class="why-list">' + q.items.map(function(label, pos){
      var ok = ans[pos] === pos;
      var yours = ok || ans[pos] === undefined ? '' : '<br><small class="your-answer">あなたの回答: '+q.items[ans[pos]]+'</small>';
      return '<div class="why-row"><span class="why-mark '+(ok?'ok':'ng')+'">'+(ok?'✓':'✕')+'</span>'+
        '<span><b>'+(pos+1)+'. '+label+'</b><br>'+q.why[pos]+yours+'</span></div>';
    }).join('') + '</div>';
  }
  if (q.type === 'matching'){
    return '<div class="why-list">' + q.prompts.map(function(prompt, pi){
      var ok = ans[pi] === q.correct[pi];
      var yours = ok ? '' : '<br><small class="your-answer">あなたの回答: '+(ans[pi] === -1 ? '（未選択）' : q.options[ans[pi]])+'</small>';
      return '<div class="why-row"><span class="why-mark '+(ok?'ok':'ng')+'">'+(ok?'✓':'✕')+'</span>'+
        '<span><b>'+prompt+' → '+q.options[q.correct[pi]]+'</b><br>'+q.why[pi]+yours+'</span></div>';
    }).join('') + '</div>';
  }
  return '<div class="why-list">' + q.choices.map(function(label, idx){
    var ok = q.correct.indexOf(idx) !== -1;
    return '<div class="why-row"><span class="why-mark '+(ok?'ok':'ng')+'">'+(ok?'✓':'✕')+'</span>'+
      '<span><b>'+label+'</b><br>'+q.why[idx]+'</span></div>';
  }).join('') + '</div>';
}

function renderSource(source){
  if (!source) return '';
  return '<p class="source-line">出典: <a href="'+source.url+'" target="_blank" rel="noopener">'+source.label+'</a></p>';
}

function shuffleCopy(arr){
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--){
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
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

var SESSION_SIZE_OPTIONS = [10, 20, 50];

function screenSessionSetup(kind){
  var pool = kind === 'vocab' ? VOCAB : PRACTICE;
  var title = kind === 'vocab' ? '単語問題' : '想定問題';
  var options = SESSION_SIZE_OPTIONS.filter(function(n){ return n < pool.length; });
  if (pool.length) options.push(pool.length);
  var buttonsHtml = !pool.length ? '<p class="empty-note">まだ問題がありません。</p>' : options.map(function(n){
    return '<button class="assess-btn" data-action="startSessionCount" data-kind="'+kind+'" data-count="'+n+'">'+
      (n === pool.length ? '全'+n+'問' : n+'問')+
    '</button>';
  }).join('');
  return topbar(title, {}) +
    '<main>'+
      '<div class="fade-in" style="display:flex;flex-direction:column;gap:1.1rem;">'+
        '<p class="eyebrow">'+EXAM.code+'</p>'+
        '<h2 class="hero-title" style="font-size:1.4rem;">何問出題しますか？</h2>'+
        '<p class="hero-sub">プール全'+pool.length+'問の中からランダムに出題します。</p>'+
        '<div class="assess-row" style="flex-wrap:wrap;">'+buttonsHtml+'</div>'+
      '</div>'+
    '</main>';
}

function startSession(kind, count){
  var items;
  if (kind === 'vocab') items = shuffleCopy(VOCAB).slice(0, count || VOCAB.length).map(function(v){return {type:'vocab', ref:v};});
  else if (kind === 'practice') items = shuffleCopy(PRACTICE).slice(0, count || PRACTICE.length).map(function(p){return {type:'practice', ref:p};});
  else {
    items = VOCAB.filter(function(v){return isWeak(v.id);}).map(function(v){return {type:'vocab', ref:v};})
      .concat(PRACTICE.filter(function(p){return isWeak(p.id);}).map(function(p){return {type:'practice', ref:p};}))
      .concat(MOCK_POOL.filter(function(p){return isWeak(p.id);}).map(function(p){return {type:'practice', ref:p};}));
  }
  orderShuffles = {};
  state = {
    view:'session', kind:kind, items:items, index:0,
    step: items.length && items[0].type === 'vocab' ? 'assess' : 'answer',
    selfAssessment:null, selected: items.length ? emptyAnswer(getQuestionView(items[0])) : [],
    correctCount:0, total:items.length, lastCorrect:null
  };
  if (!items.length) state = {view:'home'};
  render();
}

function sessionNext(){
  state.index += 1;
  if (state.index >= state.total){
    state.view = 'sessionComplete';
    render();
    return;
  }
  state.selected = emptyAnswer(getQuestionView(state.items[state.index]));
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

// 回答の操作（選択肢のタップ・並び替え・組み合わせの選択）。セッションと模擬試験で共通
function answerOp(op, a, b){
  if (state.view === 'mock'){
    var mq = mock.questions[mock.index];
    mock.answers[mq.id] = applyAnswerOp(mq, mock.answers[mq.id] || emptyAnswer(mq), op, a, b);
  } else if (state.view === 'session' && state.step === 'answer'){
    state.selected = applyAnswerOp(getQuestionView(state.items[state.index]), state.selected, op, a, b);
  } else {
    return;
  }
  render();
}

function submitAnswer(){
  var item = state.items[state.index];
  var qv = getQuestionView(item);
  if (!isAnswerComplete(qv, state.selected)) return;
  var isCorrect = isAnswerCorrect(qv, state.selected);
  state.lastCorrect = isCorrect;
  state.step = 'feedback';
  if (isCorrect) state.correctCount += 1;
  recordResult(item.ref.id, isCorrect, item.type === 'vocab' ? state.selfAssessment : null);
  render();
}

// 本番の出題数・試験時間は各試験データの mock に定義。プールが少ない場合は問題数に比例して時間を短縮する
function startMock(){
  var full = EXAM.mock.questions, fullSeconds = EXAM.mock.minutes * 60;
  var n = Math.min(full, MOCK_POOL.length);
  if (!n) return;
  var questions = shuffleCopy(MOCK_POOL).slice(0, n);
  var seconds = Math.round(fullSeconds * n / full);
  orderShuffles = {};
  mock = {questions:questions, index:0, answers:{}, timeLeft:seconds, totalSeconds:seconds, finished:false};
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

function mockNav(dir){
  if (dir === 'prev' && mock.index > 0){ mock.index -= 1; render(); }
  else if (dir === 'next' && mock.index < mock.questions.length - 1){ mock.index += 1; render(); }
  else if (dir === 'submit'){ clearTimer(); finishMock(); }
}
function finishMock(){
  var results = mock.questions.map(function(q){
    var selected = mock.answers[q.id] || emptyAnswer(q);
    var isCorrect = isAnswerCorrect(q, selected);
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
  return topbar('AWS資格勉強', {home:true}) +
    '<main>'+
      '<div class="fade-in">'+
        examSwitch()+
        '<p class="eyebrow">'+EXAM.code+' ・ '+EXAM.name+'</p>'+
        '<h2 class="hero-title">学習を始める</h2>'+
        '<p class="hero-sub">単語・想定問題・模擬試験から選んで学習を始めましょう。</p>'+
      '</div>'+
      '<div class="mode-grid fade-in">'+
        modeCard('vocabSetup', ICON_VOCAB, '単語問題', 'ヒントなしで分かるか即答 → 選択問題で確認')+
        modeCard('practiceSetup', ICON_PRACTICE, '想定問題', '選択・並び替え・組み合わせ。回答ごとに解説を表示')+
        modeCard('mockIntroNav', ICON_MOCK, '模擬試験', '本番形式。タイマー付きで最後にまとめて採点')+
        modeCard('stats', ICON_STATS, '進捗・統計', '分野別の正答率と苦手項目を確認')+
      '</div>'+
    '</main>';
}
// 試験の切り替え（試験が1つしかない場合は表示しない）
function examSwitch(){
  var keys = examKeys();
  if (keys.length < 2) return '';
  return '<div class="exam-switch" role="tablist">' + keys.map(function(k){
    var active = k === EXAM.key;
    return '<button class="exam-tab'+(active?' active':'')+'" role="tab" aria-selected="'+active+'" data-action="switchExam" data-exam="'+k+'">'+EXAMS[k].code+'</button>';
  }).join('') + '</div>';
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

  var feedback = '';
  if (locked){
    feedback = '<div class="feedback-panel fade-in">'+
      '<p class="feedback-title '+(state.lastCorrect ? 'ok' : 'ng')+'">'+(state.lastCorrect ? '正解' : '不正解')+'</p>'+
      renderBreakdown(qv, state.selected)+
      renderSource(qv.source)+
    '</div>';
  }

  body =
    '<div class="fade-in" style="display:flex;flex-direction:column;gap:1rem;">'+
      '<div class="q-meta"><span class="chip">'+domainLabel+'</span></div>'+
      '<p class="q-text">'+qv.text+'</p>'+
      answerHint(qv)+
      renderAnswerInput(qv, state.selected, locked)+
      feedback+
    '</div>';

  var bottomBar = '';
  if (!locked){
    bottomBar = '<div class="bottom-bar"><button class="btn btn-primary" data-action="submitAnswer" '+
      (isAnswerComplete(qv, state.selected) ? '' : 'disabled')+'>回答する</button></div>';
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
  var minutes = Math.round(mock.totalSeconds / 60);
  return topbar('模擬試験', {}) +
    '<main>'+
      '<div class="fade-in" style="display:flex;flex-direction:column;gap:1.1rem;">'+
        '<p class="eyebrow">'+EXAM.code+' ・ 本番形式</p>'+
        '<h2 class="hero-title" style="font-size:1.4rem;">模擬試験を開始します</h2>'+
        '<p class="hero-sub">全'+mock.questions.length+'問 ・ 制限時間 '+minutes+'分（本番は'+EXAM.mock.questions+'問・'+EXAM.mock.minutes+'分）。回答中はフィードバックが表示されず、終了後にまとめて採点・解説を確認します。</p>'+
      '</div>'+
    '</main>'+
    '<div class="bottom-bar"><button class="btn btn-primary" data-action="beginMock">開始する</button></div>';
}

function screenMock(){
  var q = mock.questions[mock.index];
  var selected = mock.answers[q.id] || emptyAnswer(q);
  var dots = mock.questions.map(function(qq, i){
    var cls = [];
    if (isAnswerComplete(qq, mock.answers[qq.id])) cls.push('answered');
    if (i === mock.index) cls.push('current');
    return '<span class="'+cls.join(' ')+'"></span>';
  }).join('');

  var body =
    '<div class="fade-in" style="display:flex;flex-direction:column;gap:1rem;">'+
      '<div class="q-meta"><span class="chip">'+DOMAINS[q.domain]+'</span><span class="timer" id="mockTimer">'+formatTime(mock.timeLeft)+'</span></div>'+
      '<p class="q-text">'+q.text+'</p>'+
      answerHint(q)+
      renderAnswerInput(q, selected, false)+
      '<div class="mock-nav-dots">'+dots+'</div>'+
    '</div>';

  var isLast = mock.index === mock.questions.length - 1;
  var bottomBar = '<div class="bottom-bar">'+
    '<button class="btn btn-ghost" data-action="mockPrev" '+(mock.index===0?'disabled':'')+'>前へ</button>'+
    (isLast
      ? '<button class="btn btn-primary" data-action="mockSubmit">提出する</button>'
      : '<button class="btn btn-primary" data-action="mockNext">次へ</button>')+
  '</div>';

  return topbar('模擬試験 ・ 問 '+(mock.index+1)+'/'+mock.questions.length, {}) + '<main>'+body+'</main>' + bottomBar;
}

function screenMockResults(){
  var items = mock.results.map(function(r){
    // 並び替え・組み合わせは解説の各行に「あなたの回答」を表示する
    var choiceType = r.q.type === 'single' || r.q.type === 'multi';
    var yourAns = !isAnswerComplete(r.q, r.selected) ? '（未回答）'
      : choiceType ? r.selected.map(function(i){return r.q.choices[i];}).join(' / ') : null;
    return '<div class="review-item">'+
      '<div class="review-head"><span class="chip">'+DOMAINS[r.q.domain]+'</span>'+
        '<span class="tag-result '+(r.isCorrect?'tag-ok':'tag-ng')+'">'+(r.isCorrect?'正解':'不正解')+'</span></div>'+
      '<p style="margin:0;font-weight:700;font-family:\'Zen Kaku Gothic New\',sans-serif;font-size:.92rem;">'+r.q.text+'</p>'+
      (yourAns === null ? '' : '<p class="review-line">あなたの回答: <b>'+yourAns+'</b></p>')+
      renderBreakdown(r.q, r.selected)+
      renderSource(r.q.source)+
    '</div>';
  }).join('');

  return topbar('模擬試験の結果', {home:true}) +
    '<main>'+
      '<div class="score-tile fade-in"><div class="score-num">'+mock.score+' / '+mock.questions.length+'</div><div class="score-label">正解</div></div>'+
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
    case 'sessionSetup': html = screenSessionSetup(state.kind); break;
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
    case 'vocabSetup': state = {view:'sessionSetup', kind:'vocab'}; render(); break;
    case 'practiceSetup': state = {view:'sessionSetup', kind:'practice'}; render(); break;
    case 'startSessionCount': startSession(el.getAttribute('data-kind'), parseInt(el.getAttribute('data-count'),10)); break;
    case 'reviewWeak': startSession('weak'); break;
    case 'stats': state = {view:'stats'}; render(); break;
    case 'mockIntroNav': startMock(); break;
    case 'beginMock': beginMockPlay(); break;
    case 'assess': handleAssess(el.getAttribute('data-value')); break;
    case 'switchExam': useExam(el.getAttribute('data-exam')); state = {view:'home'}; render(); break;
    case 'choice':
    case 'orderPick':
    case 'orderRemove': answerOp(action, parseInt(el.getAttribute('data-index'),10)); break;
    case 'submitAnswer': submitAnswer(); break;
    case 'next': sessionNext(); break;
    case 'mockPrev': mockNav('prev'); break;
    case 'mockNext': mockNav('next'); break;
    case 'mockSubmit': mockNav('submit'); break;
  }
});

// 組み合わせ問題のプルダウン
document.getElementById('app').addEventListener('change', function(e){
  var el = e.target;
  if (!el.classList.contains('match-select')) return;
  answerOp('match', parseInt(el.getAttribute('data-prompt'),10), parseInt(el.value,10));
});

render();
