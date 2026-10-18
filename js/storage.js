'use strict';

// 進捗は試験ごとに分けて保存する（IDは試験内でのみ一意なため）。
// { currentExam:'clf-c02', exams:{ 'clf-c02':{ [itemId]:{attempts, correct, lastSelf, lastResult, lastAt} }, ... } }
var STORAGE_KEY = 'awsTrainingProgress_v2';
// v1 は CLF-C02 のみ・IDをそのままキーにしていた形式。初回だけ CLF-C02 の進捗として引き継ぐ（v1自体は消さない）。
var LEGACY_STORAGE_KEY = 'awsTrainingProgress_v1';
var DEFAULT_EXAM = 'clf-c02';

function loadStore(){
  var s = null;
  try { s = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch(e){}
  if (!s || typeof s !== 'object') s = {};
  if (!s.exams || typeof s.exams !== 'object') s.exams = {};
  if (!s.exams[DEFAULT_EXAM]){
    try {
      var legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));
      if (legacy && typeof legacy === 'object') s.exams[DEFAULT_EXAM] = legacy;
    } catch(e){}
  }
  return s;
}
function saveStore(){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch(e){}
}

var store = loadStore();
var progress = {}; // 選択中の試験の進捗（store.exams[試験キー] への参照）

// 選択中の試験のデータ（useExam で切り替える）
var EXAM, DOMAINS, VOCAB, PRACTICE, MOCK_POOL;

function examKeys(){ return Object.keys(window.EXAMS || {}); }

function useExam(key){
  if (!EXAMS[key]) key = EXAMS[DEFAULT_EXAM] ? DEFAULT_EXAM : examKeys()[0];
  EXAM = EXAMS[key];
  EXAM.key = key;
  DOMAINS = EXAM.DOMAINS;
  VOCAB = EXAM.VOCAB;
  PRACTICE = EXAM.PRACTICE;
  MOCK_POOL = EXAM.MOCK_POOL;
  if (!store.exams[key]) store.exams[key] = {};
  progress = store.exams[key];
  store.currentExam = key;
  saveStore();
}

useExam(store.currentExam || DEFAULT_EXAM);

function recordResult(id, isCorrect, selfAssessment){
  var rec = progress[id] || {attempts:0, correct:0};
  rec.attempts += 1;
  if (isCorrect) rec.correct += 1;
  rec.lastResult = isCorrect ? 'correct' : 'incorrect';
  if (selfAssessment) rec.lastSelf = selfAssessment;
  rec.lastAt = Date.now();
  progress[id] = rec;
  saveStore();
}

function isWeak(id){
  var rec = progress[id];
  if (!rec) return false;
  if (rec.lastResult === 'incorrect') return true;
  if (rec.lastSelf === 'unknown') return true;
  if (rec.attempts > 0 && (rec.correct / rec.attempts) < 0.6) return true;
  return false;
}

function categoryStats(){
  return Object.keys(DOMAINS).map(function(key){
    var ids = VOCAB.filter(function(v){return v.domain===key;}).map(function(v){return v.id;})
      .concat(PRACTICE.filter(function(p){return p.domain===key;}).map(function(p){return p.id;}))
      .concat(MOCK_POOL.filter(function(p){return p.domain===key;}).map(function(p){return p.id;}));
    var attempts=0, correct=0;
    ids.forEach(function(id){ var r = progress[id]; if (r){ attempts+=r.attempts; correct+=r.correct; } });
    return {label:DOMAINS[key], attempts:attempts, correct:correct, pct: attempts ? Math.round(correct/attempts*100) : null};
  });
}
function overallStats(){
  var attempts=0, correct=0;
  Object.keys(progress).forEach(function(id){ attempts+=progress[id].attempts; correct+=progress[id].correct; });
  return {attempts:attempts, correct:correct, pct: attempts ? Math.round(correct/attempts*100) : 0};
}
function weakItems(){
  return VOCAB.filter(function(v){return isWeak(v.id);}).map(function(v){return {label:v.term, sub:DOMAINS[v.domain]+' ・ 単語問題'};})
    .concat(PRACTICE.filter(function(p){return isWeak(p.id);}).map(function(p){return {label:p.text, sub:DOMAINS[p.domain]+' ・ 想定問題'};}))
    .concat(MOCK_POOL.filter(function(p){return isWeak(p.id);}).map(function(p){return {label:p.text, sub:DOMAINS[p.domain]+' ・ 模擬試験プール'};}));
}
