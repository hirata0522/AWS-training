'use strict';

var STORAGE_KEY = 'awsTrainingProgress_v1';

function loadProgress(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch(e){ return {}; }
}
function saveProgress(p){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch(e){}
}
function seedIfEmpty(p){
  if (Object.keys(p).length) return p;
  var seed = {
    v1:{attempts:1, correct:1, lastSelf:'known', lastResult:'correct', lastAt:Date.now()},
    v3:{attempts:2, correct:0, lastSelf:'unknown', lastResult:'incorrect', lastAt:Date.now()},
    v6:{attempts:1, correct:1, lastSelf:'known', lastResult:'correct', lastAt:Date.now()},
    p1:{attempts:1, correct:1, lastResult:'correct', lastAt:Date.now()},
    p3:{attempts:2, correct:0, lastResult:'incorrect', lastAt:Date.now()}
  };
  saveProgress(seed);
  return seed;
}

var progress = seedIfEmpty(loadProgress());

function recordResult(id, isCorrect, selfAssessment){
  var rec = progress[id] || {attempts:0, correct:0};
  rec.attempts += 1;
  if (isCorrect) rec.correct += 1;
  rec.lastResult = isCorrect ? 'correct' : 'incorrect';
  if (selfAssessment) rec.lastSelf = selfAssessment;
  rec.lastAt = Date.now();
  progress[id] = rec;
  saveProgress(progress);
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
      .concat(PRACTICE.filter(function(p){return p.domain===key;}).map(function(p){return p.id;}));
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
    .concat(PRACTICE.filter(function(p){return isWeak(p.id);}).map(function(p){return {label:p.text, sub:DOMAINS[p.domain]+' ・ 想定問題'};}));
}
