const WORDS = HebrewWords;
const normalize = HebrewReading.normalize;
const el = id => document.getElementById(id);
let pool = WORDS, index = 0, active = null, timeout = null, successResult=null;
let readingGrade=1;
let wordSolved = false, celebrationTimer, completionTimer, attempts=0, hintsUsed=0;
function speakLetter(letter, word, position, button) {
  if (active || wordSolved) return;
  const synth = window.speechSynthesis;
  if (!synth || !window.SpeechSynthesisUtterance) {
    status('השמעת אותיות אינה זמינה בדפדפן הזה.', 'error'); return;
  }
  synth.cancel();
  if ((normalize(word) === 'פה' && position === 1) ||
      (['תות','סוס'].includes(normalize(word)) && position === 1)) {
    status(normalize(word) === 'פה' ? 'האות ה כאן נחה — אין לה צליל נפרד.' : 'האות וּ כאן מציינת את צליל התנועה אוּ של האות הקודמת.');
    return;
  }
  // Bare consonants must be given a phonetic reading, never a letter name.
  const consonant = normalize(letter);
  const bareSounds = { 'ד':'דְּ', 'ג':'גְּ', 'ן':'נְ', 'נ':'נְ', 'ר':'רְ',
    'ל':'לְ', 'ץ':'צְ', 'ם':'מְ', 'מ':'מְ', 'כ':'כְּ', 'ת':'תְּ',
    'ב':'בְ', 'ש':'שְׁ', 'ס':'סְ' };
  const hasVowel = /[\u05B0-\u05BB\u05C7]/.test(letter);
  let spoken = !hasVowel && bareSounds[consonant] ? bareSounds[consonant] : letter;
  if (['תות','סוס'].includes(normalize(word)) && position === 0) spoken += 'וּ';
  if (normalize(word) === 'כלב' && position === 2) spoken = 'בְ';
  const voice = synth.getVoices().find(v => /^(he|iw)(-|$)/i.test(v.lang));
  if (!voice) { status('אין קול עברי במכשיר. אפשר לקרוא בקול או להיעזר במבוגר.', 'error'); return; }
  const utterance = new window.SpeechSynthesisUtterance(spoken);
  utterance.lang = 'he-IL'; utterance.voice = voice; utterance.rate = .7;
  utterance.onstart = () => button.classList.add('speaking');
  const finish = () => button.classList.remove('speaking');
  utterance.onend = finish;
  utterance.onerror = event => { finish(); if (!['canceled','interrupted'].includes(event.error)) status('לא הצלחנו להשמיע את האות. נסו שוב.', 'error'); };
  synth.speak(utterance);
}
function celebrate() {
  clearTimeout(celebrationTimer); el('celebration').replaceChildren();
  const card = document.querySelector('.card'); card.classList.remove('win');
  void card.offsetWidth; card.classList.add('win');
  for (let i = 0; i < 30; i++) {
    const piece = document.createElement('i'); piece.className = 'confetti';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = ['#ffbe26','#44d5a0','#ff6b92','#59a9ff','#ab79ef'][i % 5];
    piece.style.animationDelay = `${Math.random() * .8}s`;
    piece.style.width = `${7 + Math.random() * 9}px`;
    piece.style.borderRadius = i % 3 === 0 ? '50%' : '2px';
    piece.style.animationDuration = `${2 + Math.random() * 1.2}s`;
    el('celebration').append(piece);
  }
  celebrationTimer = setTimeout(() => { el('celebration').replaceChildren(); card.classList.remove('win'); }, 4100);
}
const HINTS = {
  'דג':['🐟','חי במים ושוחה עם סנפירים.'], 'גן':['🏡🌳🌷','מקום עם צמחים, פרחים ועצים.'],
  'יד':['✋','יש בה חמש אצבעות.'], 'הר':['⛰️','גבוה, ואפשר לטפס עליו.'],
  'סל':['🧺','אפשר לשים בו פירות או חפצים.'], 'גל':['🌊','עולה ויורד על פני המים.'],
  'נר':['🕯️','מדליקים אותו והוא מאיר.'], 'עץ':['🌳','יש לו גזע, ענפים ועלים.'],
  'ים':['🌊🏖️','הרבה מים מלוחים ליד החוף.'], 'פה':['👄','בעזרתו מדברים ואוכלים.'],
  'כד':['🏺','כלי שאפשר למלא במים.'], 'בית':['🏠','מקום שגרים בו.'],
  'כלב':['🐕','חיה שנובחת.'], 'חלב':['🥛','משקה לבן.'], 'ספר':['📖','יש בו דפים וסיפורים.'],
  'ילד':['🧒','אדם צעיר שגדל ולומד.'], 'שמש':['☀️','מאירה ומחממת אותנו ביום.'],
  'דלת':['🚪','פותחים אותה כדי להיכנס לחדר.'], 'תות':['🍓','פרי אדום קטן עם נקודות.'],
  'סוס':['🐎','חיה שאפשר לרכוב עליה.'],
  'חלון':['🪟','דרכו רואים מה קורה בחוץ.'], 'ארון':['🚪','רהיט ששומרים בו בגדים.'],
  'בלון':['🎈','ממלאים אותו באוויר והוא מתנפח.'], 'תפוח':['🍎','פרי עגול, אדום או ירוק.'],
  'חתול':['🐈','חיה שאומרת מיאו.'], 'ארנב':['🐇','חיה עם אוזניים ארוכות.'],
  'סירה':['⛵','כלי קטן ששט על המים.'], 'רכבת':['🚂','נוסעת על פסים ויש לה קרונות.'],
  'שולחן':['🍽️','רהיט שאוכלים או כותבים עליו.'], 'חברים':['🧒🧒','אנשים שאוהבים לשחק יחד.'],
  'פרחים':['🌷🌼','צומחים בגינה ויש להם עלי כותרת.'], 'ילדים':['🧒👧','צעירים שהולכים לגן או לבית הספר.'],
  'ספרים':['📚','יש בהם דפים וסיפורים לקריאה.'], 'עפרון':['✏️','כותבים בו ואפשר למחוק את הכתב.'],
  'מחברת':['📓','כותבים בה שיעורים וציורים.'], 'מטריה':['☂️','פותחים אותה כדי לא להירטב בגשם.']
};
let misses = 0, soundEnabled = true, audio = null;
function prepareAudio() {
  if (!soundEnabled) return;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (Audio && !audio) audio = new Audio();
    if (audio?.state === 'suspended') audio.resume().catch(() => {});
  } catch { /* Sound is optional; reading remains available. */ }
}
function playSound(success) {
  if (!soundEnabled || !audio || audio.state !== 'running') return;
  try {
    const notes = success ? [523.25,659.25,783.99,659.25,783.99,1046.5,783.99,1046.5,1318.51] : [440,349.23,293.66,293.66];
    const start = audio.currentTime;
    notes.forEach((frequency, i) => {
      const tone = audio.createOscillator(), gain = audio.createGain();
      const at = start + i * (success ? .12 : .22);
      tone.type = success ? 'triangle' : 'sine'; tone.frequency.value = frequency;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(success ? .16 : .16, at + .015);
      gain.gain.exponentialRampToValueAtTime(.001, at + .28);
      tone.connect(gain); gain.connect(audio.destination);
      tone.start(at); tone.stop(at + .3);
      tone.onended = () => { tone.disconnect(); gain.disconnect(); };
    });
  } catch { /* No sound device must not affect the answer. */ }
}
function showHint(picture = false) {
  if (wordSolved) return;
  hintsUsed++;
  const [icon, clue] = HINTS[normalize(pool[index])];
  el('hint').hidden = false; el('hint').replaceChildren();
  if (picture) {
    const image = document.createElement('span'); image.className = 'hint-picture';
    image.textContent = icon; image.setAttribute('role','img'); image.setAttribute('aria-label', clue);
    el('hint').append(image);
  }
  const text = document.createElement('div'); text.textContent = clue; el('hint').append(text);
}
el('hint-button').onclick = () => showHint(misses >= 2);
el('sound-button').onclick = () => {
  soundEnabled = !soundEnabled; el('sound-button').setAttribute('aria-pressed', String(soundEnabled));
  el('sound-button').setAttribute('aria-label', soundEnabled ? 'צלילים פעילים' : 'צלילים כבויים');
  el('sound-button').textContent = soundEnabled ? '🔊 צלילים' : '🔇 צלילים';
  if (soundEnabled) { prepareAudio(); playSound(true); }
  else window.speechSynthesis?.cancel();
};
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
function status(message, type = '', transcript = '') {
  el('status').className = 'status ' + type;
  el('status').replaceChildren();
  const line = document.createElement('div'); line.textContent = message; el('status').append(line);
  document.querySelector('.card').classList.toggle('retrying', type === 'retry' && Boolean(transcript));
  if (transcript) {
    const heard = document.createElement('div'); heard.className = 'heard';
    const label = document.createElement('span'); label.className = 'heard-label'; label.textContent = 'שמעתי';
    const text = document.createElement('strong'); text.textContent = transcript;
    heard.append(label); heard.append(text); el('status').prepend(heard);
  }
}
function setBusy(busy) {
  el('mic').classList.toggle('listening', busy); el('mic').setAttribute('aria-pressed', String(busy));
  el('mic-label').textContent = busy ? 'מקשיבים… לחצו לסיום' : 'לוחצים ואומרים';
  document.querySelectorAll('.letter').forEach(b => b.disabled = busy || wordSolved);
  el('adult-submit').disabled = busy || wordSolved;
}
function render() {
  window.speechSynthesis?.cancel();
  stopMedia();
  attempts=0;hintsUsed=0;successResult=null;wordSolved=false;
  el('adult-confirm').checked=false;el('adult-submit').disabled=false;
  misses = 0; el('hint').hidden = true; el('hint').replaceChildren();
  const word = pool[index]; el('word').textContent = word;
  el('meta').textContent = `${normalize(word).length} אותיות`;
  el('letters').replaceChildren(...Array.from(word.normalize('NFD').matchAll(/[\u05D0-\u05EA][\u0591-\u05C7]*/g), (m, position) => {
    const letter = document.createElement('button'); letter.type = 'button'; letter.className = 'letter'; letter.textContent = m[0];
    letter.setAttribute('aria-label', 'השמעת הצליל של ' + m[0]);
    letter.onclick = () => speakLetter(m[0], word, position, letter); return letter;
  }));
  status(Recognition ? 'אמרו את המילה שעל המסך.' : 'אין זיהוי קולי בדפדפן הזה. אפשר לקרוא למבוגר שיאשר.', Recognition ? '' : 'error');
  el('mic').disabled = !Recognition;
}
el('mic').onclick = () => {
  if (wordSolved) return;
  if (active) { active.stop(); el('mic').disabled = true; el('mic-label').textContent = 'בודקים…'; return; }
  if (!Recognition) return;
  prepareAudio(); window.speechSynthesis?.cancel();
  const recognition = new Recognition(); active = recognition;
  recognition.lang = 'he-IL'; recognition.continuous = false; recognition.interimResults = false; recognition.maxAlternatives = 1;
  const target = pool[index]; let resolved = false, retryTranscript = '';
  setBusy(true); status('פותחים את המיקרופון…');
  recognition.onstart = () => { if (active === recognition) status('מקשיבים לכם… אמרו את המילה.'); };
  recognition.onresult = event => {
    if (active !== recognition || resolved) return;
    const transcript = event.results[event.resultIndex][0].transcript;
    resolved = true;
    if (!normalize(transcript)) { status('לא זוהתה מילה בעברית. ננסה שוב?', 'retry'); }
    else if (HebrewReading.matches(transcript,target)) {
      attempts++;
      celebrate();
      status('✓ נכון! כל הכבוד!', 'success', transcript); playSound(true);
      readingSucceeded('speech-transcript', target);
    } else {
      attempts++;retryTranscript = transcript;
      misses++; playSound(false);
      status(misses >= 2 ? 'ננסה שוב עם הרמז!' : 'זו מילה אחרת. ננסה שוב!', 'retry', transcript);
      if (misses >= 2) showHint(true);
    }
  };
  recognition.onerror = event => {
    if (active !== recognition || resolved) return;
    resolved = true;
    const errors = {'not-allowed':'צריך לאפשר שימוש במיקרופון בהגדרות הדפדפן.', 'service-not-allowed':'שירות הזיהוי אינו זמין בדפדפן הזה.', 'audio-capture':'לא נמצא מיקרופון זמין. בדקו שהוא מחובר.', 'no-speech':'לא שמעתי מילה. לחצו ונסו שוב.', 'network':'הזיהוי אינו זמין. נסו ב־Chrome או קראו למבוגר שיאשר.', 'language-not-supported':'שירות הזיהוי בדפדפן הזה אינו תומך בעברית.', 'aborted':'ההאזנה הסתיימה. אפשר לנסות שוב.'};
    status(errors[event.error] || 'הזיהוי לא הצליח. אפשר לנסות שוב.', 'error');
  };
  recognition.onend = () => {
    if (active !== recognition) return;
    clearTimeout(timeout); active = null; setBusy(false); el('mic').disabled = wordSolved;
    if (!resolved) status('לא הצלחתי לזהות מילה. ננסה שוב?', 'retry');
    if (retryTranscript && soundEnabled && window.speechSynthesis && window.SpeechSynthesisUtterance) {
      const voice = window.speechSynthesis.getVoices().find(v => /^(he|iw)(-|$)/i.test(v.lang));
      if (voice) {
        const phrase = new window.SpeechSynthesisUtterance('שמעתי ' + retryTranscript + '. זו לא המילה שעל המסך. ננסה שוב!');
        phrase.lang = 'he-IL'; phrase.voice = voice; phrase.rate = .9;
        window.speechSynthesis.cancel(); window.speechSynthesis.speak(phrase);
      }
    }
  };
  try {
    recognition.start();
    timeout = setTimeout(() => {
      if (active !== recognition) return;
      resolved = true; active = null; recognition.abort(); setBusy(false); el('mic').disabled = wordSolved;
      status('ההאזנה הסתיימה. לחצו כדי לנסות שוב.', 'retry');
    }, 15000);
  } catch { active = null; setBusy(false); status('לא ניתן לפתוח את המיקרופון. בדקו את הרשאות הדפדפן.', 'error'); }
};
window.addEventListener('pagehide', stopMedia);
render();

// Game adapter: the reading UI remains ordinary HTML/CSS/JS.
function stopMedia(){
  if(active){const recognition=active;active=null;recognition.abort();}
  clearTimeout(timeout);clearTimeout(celebrationTimer);clearTimeout(completionTimer);
  window.speechSynthesis?.cancel();
  if(audio){audio.close().catch(()=>{});audio=null;}
}
function readingSucceeded(method,word){
  if(successResult)return;
  wordSolved=true;
  successResult={outcome:'success',method,itemId:normalize(word),attempts,details:{grade:readingGrade,wordLength:normalize(word).length,hintsUsed}};
  el('mic').disabled=true;el('adult-submit').disabled=true;
  // One challenge, one result. The host owns rewards and what happens next.
  completionTimer=setTimeout(()=>Drill.complete(successResult),800);
}
el('adult-submit').onclick=()=>{
  if(wordSolved||!el('adult-confirm').checked)return;
  attempts++;stopMedia();readingSucceeded('adult-confirmed',pool[index]);
  status('✓ הקריאה אושרה. כל הכבוד!', 'success');celebrate();
};
Drill.onStart(params=>{
  readingGrade=params.grade??1;
  const selected=HebrewReading.plan(WORDS,params);pool=selected.pool;index=selected.index;
  soundEnabled=params.sound??true;
  el('sound-button').setAttribute('aria-pressed',String(soundEnabled));
  el('sound-button').setAttribute('aria-label',soundEnabled?'צלילים פעילים':'צלילים כבויים');
  el('sound-button').textContent=soundEnabled?'🔊 צלילים':'🔇 צלילים';
  el('adult-fallback').hidden=params.allowAdultConfirmation===false;
  render();
});
Drill.onDispose(stopMedia);
