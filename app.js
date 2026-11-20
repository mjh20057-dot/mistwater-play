import {focusIdentity,findFocusedControl,focusModalControl,trapModalTab,nativeActivation} from './ui-focus.js';
import {CAST,FACTS,LOCATIONS,SCRIPTS,STAGE_LABELS} from './story.js';
import {SAVE_KEY,createState,reduce,parseSave,currentLine,has,flagged,canConfront,objectives,missingPreparation,pairKey} from './engine.js';
import {journeyMarkup,mountJourney} from './journey.js';
import {actorSprite} from './scene-actors.js';
import {photoStrip,photoDetail} from './evidence-photos.js';
import {explorationTargets,explorationMarkup,mountExploration,positionExploration} from './exploration.js';

const root=document.getElementById('app');
const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const path=key=>'assets/characters/'+CAST[key].image;
let modalReturnFocus=null;
let state=null,mode='title',modal=null,lastActor=null,toastTimer,pianoInput=[],hintOpen=new Set(),lastCue='';
let journeyController=null;
const explorationCameras=new Map();
let storageAvailable=true;
function readStorage(key){try{return localStorage.getItem(key);}catch{storageAvailable=false;return null;}}
function writeStorage(key,value){try{localStorage.setItem(key,value);return true;}catch{storageAvailable=false;return false;}}
let saved=parseSave(readStorage(SAVE_KEY));
let settings={sound:true,assist:false,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches};
try{Object.assign(settings,JSON.parse(readStorage('mistwater-settings-v1')||'{}'));}catch{}

const ICONS={
  crest:'<path d="m12 2 1.8 5.6L19 9l-5.2 1.5L12 16l-1.8-5.5L5 9l5.2-1.4Z"/><path d="M3 18q4-3 9 0t9 0M3 22q4-3 9 0t9 0"/>',
  book:'<path d="M12 5C8 2 4 3 2 4v16c3-2 7-2 10 0 3-2 7-2 10 0V4c-3-2-7-2-10 1Z"/><path d="M12 5v15M5 8h4M5 11h4M15 8h4M15 11h4"/>',
  chat:'<path d="M20 14a7 7 0 0 1-7 5H8l-5 3 1-6A8 8 0 0 1 3 5c4-4 13-4 17 1a7 7 0 0 1 0 8Z"/><path d="M7 10h.01M12 10h.01M17 10h.01"/>',
  settings:'<path d="m10 2 4 0 1 3 3 1 3-1 2 4-2 2v3l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-3L1 9l2-4 3 1 3-1Z"/><circle cx="12" cy="12" r="3"/>',
  arrow:'<path d="M4 12h15m-5-5 5 5-5 5"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',
  pin:'<path d="M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 1 1 14 0Z"/><circle cx="12" cy="9" r="2"/>',
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  key:'<circle cx="8" cy="7" r="5"/><path d="M8 12v10m0-4h5m-5 3h4"/>',
  photo:'<rect x="3" y="3" width="18" height="18" rx="1"/><circle cx="8" cy="8" r="1.5"/><path d="m4 17 5-5 4 3 3-5 5 7"/>',
  frame:'<rect x="3" y="2" width="18" height="20"/><rect x="6" y="5" width="12" height="14"/><path d="m9 16 3-5 3 5"/>',
  receipt:'<path d="M5 2h14v20l-3-2-4 2-4-2-3 2V2Z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  letter:'<rect x="2" y="5" width="20" height="14" rx="1"/><path d="m3 6 9 7 9-7"/>',
  hand:'<path d="M6 13V9a1.5 1.5 0 0 1 3 0V5a1.5 1.5 0 0 1 3 0V3a1.5 1.5 0 0 1 3 0v3a1.5 1.5 0 0 1 3 0v7c0 6-3 8-7 8-3 0-4-2-6-5l-2-3a1.5 1.5 0 0 1 2-2Z"/>',
  badge:'<path d="m12 2 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z"/><ellipse cx="12" cy="16" rx="9" ry="6"/><path d="M4 16q4-4 8 0t8 0"/>',
  door:'<path d="M4 22V2h16v20M8 22V5h9v17M3 22h18"/><circle cx="14" cy="14" r=".8"/>',
  music:'<path d="M9 18V4l11-2v14M9 8l11-2"/><ellipse cx="6" cy="19" rx="3" ry="2"/><ellipse cx="17" cy="17" rx="3" ry="2"/>',
  shoe:'<path d="M4 4h7v8c3 2 5 3 9 3 2 0 2 5 0 5H4V4Z"/><path d="M4 17h17M11 9h3M11 12h4"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  bell:'<path d="M5 16h14l-2-3V9a5 5 0 0 0-10 0v4l-2 3Zm4 4h6M12 2v2"/>',
  bag:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M7 7v14M17 7v14M10 13h4"/>',
  check:'<path d="m4 12 5 5L20 5"/>',compare:'<path d="M3 5h7v14H3zM14 5h7v14h-7zM8 2h8M8 22h8"/>',
  sound:'<path d="m3 9 5 0 5-5v16l-5-5H3V9Z"/><path d="M17 8q4 4 0 8M20 5q7 7 0 14"/>',
  camera:'<path d="M3 6h4l2-3h6l2 3h4v15H3V6Z"/><circle cx="12" cy="13" r="4"/>',
  moon:'<path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z"/>',
  flag:'<path d="M5 22V3q5-3 9 0t7 0v10q-4 3-7 0t-9 0"/>'
};
function icon(name){return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]||ICONS.letter}</svg>`;}

let audio;
function audioContext(){
  if(!settings.sound)return null;
  try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});return audio;}catch{return null;}
}
function tone(freq,duration=.55,delay=0,volume=.075){
  const ctx=audioContext();if(!ctx)return;
  const t=ctx.currentTime+delay,osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type='triangle';osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+duration+.04);
}
function motif(){tone(261.63,.7,0);tone(329.63,.7,.3);tone(392,.85,1.05);}
function bellSound(){tone(587.33,1.25,0,.035);tone(1174.66,1.1,.01,.012);tone(587.33,1.3,.65,.035);}
function knock(){tone(100,.1,0,.08);tone(115,.1,.24,.07);}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3100);}
function persist(){if(!state)return;writeStorage(SAVE_KEY,JSON.stringify(state));saved=state;}
function dispatch(action){
  const old=state;state=reduce(state,action);pianoInput=[];
  const gained=state.facts.filter(id=>!old.facts.includes(id));persist();render();
  if(gained.length)toast('수첩에 남겼습니다 · '+gained.map(id=>FACTS[id].title).join(', '));
  const line=currentLine(state),cue=(state.active?.id||'')+':'+state.active?.index;
  if(cue!==lastCue){lastCue=cue;if(line?.text?.includes('종이 두 번'))bellSound();if(line?.text?.includes('똑. 똑.'))knock();if(line?.text?.includes('두 음. 잠깐'))motif();}
}
function startNew(){state=createState();mode='play';modal=null;lastActor=null;pianoInput=[];audioContext();persist();render();}
function continueGame(){if(!saved)return;state=parseSave(saved);if(!state)return;mode='play';modal=null;audioContext();render();}
function knownCast(){if(!state)return Object.keys(CAST);if(['journey','overlook'].includes(state.stage))return ['fox'];if(state.stage==='forecourt')return ['fox','otter'];if(['arrival','lobby'].includes(state.stage))return ['fox','badger','otter'];if(state.stage==='dinnerReady')return ['fox','deer','badger','otter'];return Object.keys(CAST);}
function baseScene(){const place=LOCATIONS[state?.location||'lobby']||LOCATIONS.lobby;return {...place,bg:SCRIPTS[state?.active?.id]?.background||place.bg};}
function isNight(){return state&&state.active?.id!=='morning'&&['sleep','nightLobby','nightRoom','nightListen','wallFound','complete'].includes(state.stage);}
function actor(){
if(!state?.active||['roadJourney','lakeApproach','nightBag','nightWindow','nightDoor','nightWall','finale'].includes(state.active.id))return null;
  const script=SCRIPTS[state.active.id],past=[...script.lines.slice(0,state.active.index+1),...(state.active.branch?.lines.slice(0,state.active.branch.index+1)||[])];
  const current=currentLine(state);if(current?.offscreen)return null;
  return [...past].reverse().find(line=>line.speaker&&line.speaker!=='fox'&&!line.offscreen)?.speaker||null;
}

function topbar(){return `<header class="topbar"><div class="brand-small">${icon('crest')}<span>물안개 호텔</span></div>${mode==='play'?'<div class="chapter-count">CHAPTER ONE · 어젯밤 함께 식사한 손님</div>':''}<nav class="top-actions" aria-label="게임 메뉴">${mode==='play'?`<button class="quiet-button" data-act="journal" aria-label="여행 수첩 열기">${icon('book')}<span class="button-label">수첩</span></button><button class="quiet-button icon-only" data-act="log" aria-label="지난 대화 보기">${icon('chat')}</button>`:''}<button class="quiet-button icon-only" data-act="settings" aria-label="설정 열기">${icon('settings')}</button></nav></header>`;}
function titleScreen(){return `<div class="game-shell title-bg ${settings.reduced?'reduced-motion':''}"><div class="scene-art" style="background-image:url('assets/backgrounds/lobby.png')"></div><div class="scene-shade"></div><div class="grain"></div>${topbar()}<img class="title-hero" src="${path('fox')}" alt="황토색 코트와 청록색 목도리를 한 여우 여행자"><section class="title-content"><div class="eyebrow">A LAKESIDE MYSTERY</div><h1>물안개 <span>호텔</span></h1><div class="title-rule"></div><div class="title-sub">제1화<br>어젯밤 함께 식사한 손님</div><p class="title-copy">어제는 분명 이곳에 있었습니다.<br>그런데 아무도 그 손님을 기억하지 못합니다.</p><div class="title-buttons"><button class="primary-button" data-act="new">처음으로 문을 열다 ${icon('arrow')}</button>${saved?`<button class="text-button" data-act="continue">${icon('key')} 남겨 둔 이야기에서 계속</button>`:''}<button class="text-button" data-act="journey-replay">여정 다시 보기</button></div></section><footer class="title-footer"><span>${storageAvailable?'이 기기에 이야기가 자동으로 저장됩니다.':'이 브라우저에서는 자동 저장을 사용할 수 없습니다.'}</span><span>EPISODE 01 · v0.4.1</span></footer></div>`;}

function question(){
  const stage=state.stage;
  if(stage==='overlook')return '바다를 뒤로하고, 엽서 속 호텔로.';
  if(stage==='forecourt')return '불이 켜진 창문 뒤에는 누가 있을까?';
  if(stage==='lobby')return '이 호텔에는 어떤 이야기가 남아 있을까?';
  if(stage==='dinnerReady')return '옆방 손님과 저녁 약속이 생겼다.';
  if(stage==='photoReady')return '호수가 보이는 곳에서 사진을 남기자.';
  if(stage==='sleep')return '내일 아침에도 같은 자리에 앉을 수 있겠지.';
  if(stage==='investigate')return state.deduction?'이제 지배인의 말에 근거를 대 볼 수 있다.':'그 손님은 정말 처음부터 없었던 걸까?';
  if(stage==='nightLobby')return '지배인은 누구에게 불려 가는 걸까?';
  if(stage==='nightRoom')return '내 방은 그대로일까?';
  if(stage==='nightListen')return '어제 들었던 곡이 어디에서 나는 걸까?';
  return '벽 너머에서 누군가 응답하고 있다.';
}
function primaryEvent(){
  const map={overlook:['lakeApproach','호숫길을 따라 호텔로'],forecourt:['hotelDoor','호텔 문을 열기'],lobby:['roomMeeting','객실로 올라가기'],dinnerReady:['dinner','저녁 식사하러 가기'],photoReady:['photoEvening','호숫가 회랑으로'],sleep:['morning','아침을 맞이하기'],nightLobby:['nightLobby','로비에 잠시 머무르기'],nightRoom:['nightBag','17호로 돌아가기'],wallFound:['finale','벽을 한 번 두드린다']};
  return map[state.stage]||null;
}
function navigation(){
  if(state.stage!=='investigate')return '';
  const items=[['lobby','로비','key'],['dining','식당','receipt'],['room18','18호','door'],['gallery','옛 사진','frame'],['room17','내 방','moon']];
  return `<nav class="location-nav" aria-label="호텔 안 이동">${items.map(([id,name,i])=>`<button data-act="move" data-location="${id}" class="${state.location===id?'active':''}" aria-current="${state.location===id?'location':'false'}">${icon(i)}${name}</button>`).join('')}</nav>`;
}
function exploreView(){
  const primary=primaryEvent(),physical=primary&&explorationTargets(state).some(t=>t.scene===primary[0]);
  return '<div class="scene-strap"><span>인물과 사물을 직접 살펴보세요. <span class="pointer-help">H · 탐색 도움</span></span></div><div class="explore-bottom"><div class="question-card"><small>지금 남은 의문</small><p>'+question()+'</p></div>'+navigation()+'<div class="advance-card">'+(primary&&!physical?'<button class="primary-button" data-act="scene" data-scene="'+primary[0]+'">'+primary[1]+' '+icon('arrow')+'</button>':'')+(state.stage==='investigate'?'<button class="'+(canConfront(state)?'primary-button':'quiet-button')+'" data-act="'+(canConfront(state)?'scene':'theory')+'" '+(canConfront(state)?'data-scene="confrontation"':'')+'>'+(canConfront(state)?'지배인과 대면하기':'수첩에서 가설 정리')+' '+icon(canConfront(state)?'arrow':'book')+'</button>':'')+'</div></div>';
}
function dialogueView(){
  const line=currentLine(state);if(!line)return '';
  const person=CAST[line.speaker],speaker=person?person.name:'',role=person?.role||'';
  let controls='';
  if(line.type==='choice'||line.type==='statement')controls=`<div class="choice-panel">${line.options.map((opt,i)=>`<button class="choice-button" data-act="${line.type==='choice'?'choice':'statement'}" data-index="${i}"><span class="choice-number">${i+1}</span><span>${esc(opt.text)}</span></button>`).join('')}</div>`;
  if(line.type==='piano')controls=`<div class="piano-controls">${['낮은 음','가운데 음','높은 음'].map((n,i)=>`<button class="piano-key ${pianoInput.includes(i)?'pressed':''}" data-act="piano-key" data-note="${i}" aria-label="${n} 치기">${i+1} · ${n}</button>`).join('')}<div class="piano-mini"><button data-act="listen-motif">다시 듣기</button><button data-act="special">듣고 넘어가기</button></div></div><div class="note-dots" aria-label="${pianoInput.length}개의 음을 눌렀습니다">${[0,1,2].map(i=>`<span class="${i<pianoInput.length?'filled':''}"></span>`).join('')}</div>`;
  if(line.type==='camera')controls=`<div class="camera-action"><button class="small-primary" data-act="camera">${icon('camera')} 자동 촬영 시작</button></div>`;
  if(line.type==='present')controls=`<div class="camera-action"><button class="small-primary" data-act="present-picker">${icon('book')} 자료를 골라 제시하기</button></div>`;
  return `<section class="dialogue-wrap ${line.type?'interactive':''}" aria-label="현재 대화">${speaker?`<div class="speaker-tag ${line.thought?'thought':''}">${esc(line.thought?'여우의 생각':speaker)}${!line.thought?`<small>${esc(role)}</small>`:''}</div>`:''}<div class="dialogue-box"><p class="dialogue-text ${line.thought?'thought':''} ${!line.speaker?'narration':''}" ${!line.type?'data-act="advance"':''}>${esc(line.text)}</p>${controls}${state.feedback?`<p class="dialogue-feedback" role="status">${esc(state.feedback)}</p>`:''}<div class="dialogue-footer"><button data-act="log">지난 대화</button>${!line.type?`<div class="footer-flex"><button data-act="skip">대화 넘기기</button><button class="advance-indicator" data-act="advance" aria-label="다음 대사">다음 ${icon('arrow')}</button></div>`:`<span>${line.type==='present'?'관찰한 사실을 근거로 답합니다.':line.type==='choice'?'마음이 가는 쪽을 고릅니다.':line.type==='camera'?'사진 세 장을 자동으로 남깁니다.':'틀려도 다시 생각할 수 있습니다.'}</span>`}</div></div></section>`;
}
function endingView(){return `<section class="ending-content"><div class="ending-card">${icon('crest')}<div class="eyebrow">CHAPTER ONE · END</div><h1>무슨 소리를<br>들으셨습니까?</h1><p>사진 속 동행자는 지배인이었습니다.<br>그리고 사라진 손님은 아직 이 호텔 안에 있습니다.</p><p class="end-question">다음 이야기 · 벽 너머의 방</p><div class="ending-actions"><button class="quiet-button" data-act="journal">${icon('book')} 남긴 기록 보기</button><button class="quiet-button" data-act="title">타이틀로 돌아가기 ${icon('arrow')}</button></div></div></section>`;}
function playScreen(){
  if(currentLine(state)?.type==='journey')return '<div class="game-shell cinematic-shell">'+journeyMarkup(currentLine(state)?.journey||'outbound')+'</div>';
  const place=baseScene(),person=actor(),enter=person!==lastActor;lastActor=person;
  const world=state.stage!=='complete'&&!['roadJourney','lakeApproach'].includes(state.active?.id)&&['coast','forecourt','lobby','dining','corridor','guestHall','room18','room17','gallery'].includes(state.location);
  return '<div class="game-shell '+(world?'exploring ':'')+(world&&state.active?'world-dialogue ':'')+(isNight()?'night ':'')+(settings.reduced?'reduced-motion':'')+'" data-stage="'+state.stage+'" data-scene="'+(state.active?.id||'explore')+'"><div class="scene-art" style="background-image:url(\'assets/backgrounds/'+place.bg+'.png\')"></div>'+(world?explorationMarkup(state,place.bg,{assist:settings.assist,escape:esc,interactive:!state.active,focusPerson:person}):'')+'<div class="scene-shade"></div><div class="grain"></div>'+topbar()+'<div class="scene-top"><div class="location-chip">'+icon('pin')+esc(place.title)+'</div><div class="time-chip">'+esc(state.active?.id==='morning'?'둘째 날 · 아침':STAGE_LABELS[state.stage]||'둘째 날')+'</div></div>'+(person&&!world?'<div class="character character-frame '+person+' '+(enter?'enter':'')+'" role="img" aria-label="'+esc(CAST[person].role+' '+CAST[person].name)+'">'+actorSprite(person,state)+'</div>':'')+(state.stage==='complete'?endingView():state.active?dialogueView():exploreView())+'<span class="loading-mark" aria-live="off">'+(storageAvailable?'기록 저장됨':'자동 저장 불가')+'</span></div>';
}

function renderFactArt(id){
  if(['order','bill'].includes(id))return `<div class="paper-art ${id}"><span class="paper-stamp">물안개 호텔 · ${id==='order'?'주방 주문':'식사 계산'}</span>4번 테이블<br>저녁 7시<br>${id==='order'?'버섯 수프 &nbsp; 1<br>호박 수프 &nbsp; 1<br>식기 두 벌':'1인 식사'}<span class="paper-mark">${id==='order'?'원래 주문':'손님용'}</span></div>`;
  if(id==='note')return `<div class="paper-art"><span class="paper-stamp">창가 테이블에 남은 쪽지</span>내일 아침에도<br>이 자리라면 좋겠습니다.<br><br>마지막 음은<br>서두르지 마세요.</div>`;
  if(id==='help')return `<div class="paper-art"><span class="paper-stamp">악보 뒷면</span>아직 여기 있습니다.<br><br>문밖 사람에게<br>말하지 마세요.</div>`;
  if(id==='photo')return photoStrip();
  if(id==='hand')return `<div class="hand-art" role="img" aria-label="끝마디가 짧은 지배인의 오른손 검지"></div>`;
  if(id==='badge')return `<div class="badge-art">${icon('badge')}</div>`;
  if(id==='group')return `<div class="group-art" role="img" aria-label="같은 배지를 단 여러 관계자들의 옛 단체사진"><div class="blurred-figure"></div><img src="${path('badger')}" alt="지배인"><img src="${path('hedgehog')}" alt="객실 담당자"><div class="blurred-figure"></div></div>`;
  if(id==='portrait')return `<div class="paper-art"><span class="paper-stamp">옛 주인을 기리며</span>마지막까지<br>손님 곁을 지킨 분을<br>기리며.</div>`;
  return '';
}
function factDetail(id,compact=false){const f=FACTS[id];if(!f)return '';return `<article><div class="fact-heading"><h3>${esc(f.title)}</h3><span class="fact-kind">${esc(f.kind)}</span></div><p class="source-note">${esc(f.source)}</p>${renderFactArt(id)}<div class="detail-copy">${esc(f.text)}</div></article>`;}
function knownFacts(){return state?.facts||[];}
function journalBody(){
  if(modal.tab==='people')return peopleBody();
  if(modal.tab==='notes')return notesBody();
  if(modal.tab==='theory')return theoryBody();
  const ids=knownFacts();
  if(!modal.selected||!has(state,modal.selected))modal.selected=ids[ids.length-1]||null;
  let detail=modal.selected?factDetail(modal.selected):`<div class="empty-detail">${icon('book')}아직 남긴 자료가 없습니다.<br>직접 살펴본 사실을 여기에 기록합니다.</div>`;
  if(modal.compare){
    if(modal.compareIds.length===2)detail=`<p class="source-note">나란히 놓고, 같은 점과 다른 점을 찾아보세요.</p><div class="compare-grid">${modal.compareIds.map(id=>factDetail(id,true)).join('')}</div>`;
    else detail=`<div class="empty-detail">${icon('compare')}함께 볼 자료 두 개를 골라 주세요.<br>${modal.compareIds.length===1?esc(FACTS[modal.compareIds[0]].title)+'을 골랐습니다.':'왼쪽 목록에서 고를 수 있습니다.'}</div>`;
  }
  if(modal.photoDetail)detail=photoDetail(modal.photoDetail)||detail;
  return `<div class="journal-body"><aside class="fact-list" aria-label="확인한 자료 목록"><div class="fact-group-label">이번 여정 · ${ids.length}개의 기록</div>${ids.map(id=>`<button class="fact-card ${modal.selected===id&&!modal.compare?'active':''} ${modal.compareIds.includes(id)?'compare-selected':''}" data-act="fact-select" data-fact="${id}" aria-pressed="${modal.compare?modal.compareIds.includes(id):modal.selected===id}">${icon(FACTS[id].icon)}<span>${esc(FACTS[id].title)}</span>${modal.compareIds.includes(id)?`<span class="index">${modal.compareIds.indexOf(id)+1}</span>`:''}</button>`).join('')}</aside><section class="fact-detail">${detail}</section></div>`;
}
function peopleBody(){const ids=knownCast(),person=CAST[modal.person||'fox'];return `<div class="journal-body"><aside class="people-list">${ids.map(id=>`<button class="person-card" data-act="person-select" data-person="${id}"><img src="${path(id)}" alt=""><span>${esc(CAST[id].name)} · ${esc(CAST[id].role)}</span></button>`).join('')}</aside><section class="fact-detail"><div class="person-detail"><img src="assets/characters/${person.image}" alt="${person.name}"><div><div class="person-role">${person.role}</div><h3 class="person-name">${person.name}</h3><p class="person-description">${person.description}</p>${state.stage==='investigate'&&!['여우','사슴'].includes(person.name)?`<button class="paper-button" data-act="interview" data-person="${modal.person||'fox'}">${icon('chat')} 이야기 나누기</button>`:''}</div></div></section></div>`;}
function notesBody(){
  const rows=objectives(state);
  if(!rows.length)return `<div class="journal-body full"><div class="notes-pane"><h3>지금 남은 생각</h3><p class="detail-copy">${esc(question())}</p><div class="fine-divider"></div><p class="source-note">직접 본 것과 들은 말을 기록해 둡니다.<br>다음에 확인할 의문이 생기면 여기에 남깁니다.</p>${has(state,'bell')?'<p class="detail-copy">두 번 울리는 종은 누가 지배인을 부르는 걸까?</p>':''}</div></div>`;
  return `<div class="journal-body full"><section class="notes-pane"><h3>아직 풀리지 않은 의문</h3>${rows.map((r,i)=>`<article class="question-row ${r.done?'done':''}"><h4>${icon(r.done?'check':'flag')}${esc(r.title)}</h4>${!r.done?`<button data-act="hint" data-index="${i}">${hintOpen.has(i)?'힌트 접기':'조금 더 생각해 보기'}</button>${hintOpen.has(i)?`<p>${esc(r.hint)}</p>`:''}`:'<p>이 의문을 확인할 근거가 모였다.</p>'}</article>`).join('')}</section></div>`;
}
function theoryBody(){
  if(state.stage!=='investigate')return `<div class="journal-body full"><div class="empty-detail">${icon('book')}확인한 사실을 충분히 모은 뒤<br>누가 무엇을 했는지 정리합니다.</div></div>`;
  return `<div class="journal-body full"><section class="theory-pane"><h3>사진 속에서 무슨 일이 있었을까?</h3><p>배지와 손의 특징, 사진의 시각, 각자의 행적을 함께 생각해 봅니다. 지금 확인한 사실만으로 설명해 보세요.</p><div class="theory-form"><div class="theory-line"><label for="theory-person">누가</label><select id="theory-person"><option value="">인물을 고른다</option><option value="badger" ${modal.theory?.person==='badger'?'selected':''}>지배인이</option><option value="otter" ${modal.theory?.person==='otter'?'selected':''}>벨보이가</option><option value="hedgehog" ${modal.theory?.person==='hedgehog'?'selected':''}>객실 담당자가</option></select></div><div class="theory-line"><label for="theory-place">어디서</label><select id="theory-place"><option value="">장소를 고른다</option><option value="office" ${modal.theory?.place==='office'?'selected':''}>사무실에서</option><option value="corridor" ${modal.theory?.place==='corridor'?'selected':''}>호숫가 회랑에서</option><option value="room18" ${modal.theory?.place==='room18'?'selected':''}>18호에서</option></select></div><div class="theory-line"><label for="theory-event">무엇을</label><select id="theory-event"><option value="">행동을 고른다</option><option value="left" ${modal.theory?.event==='left'?'selected':''}>음악가를 혼자 떠나보냈다</option><option value="met" ${modal.theory?.event==='met'?'selected':''}>음악가를 만났다</option><option value="harmed" ${modal.theory?.event==='harmed'?'selected':''}>음악가를 해쳤다</option></select></div></div><div class="theory-evidence">사진이 보여 주는 일과, 아직 모르는 일을 구분합니다.<br>기록을 나란히 읽고, 필요한 행적도 확인해 두세요.</div>${state.deduction?'<div class="solved-note">지배인은 사진을 찍은 시각에 음악가를 만났다.<br>사무실에만 있었다는 설명과 충돌한다. 이제 직접 근거를 제시할 수 있다.</div>':''}${state.feedback?`<div class="dialogue-feedback" role="status">${esc(state.feedback)}</div>`:''}<button class="small-primary" data-act="deduce">${icon('check')} 가설 확인하기</button>${canConfront(state)?'<button class="small-primary red" style="margin-left:8px" data-act="start-confrontation">지배인과 대면하기</button>':''}</section></div>`;
}
function journalModal(){
  const present=modal.present;
  return `<section class="modal journal" role="dialog" aria-modal="true" aria-label="${present?'자료 제시':'여행 수첩'}"><header class="modal-header"><div><h2>${present?'어떤 자료를 제시할까?':'여행 수첩'}</h2><p>${present?esc(currentLine(state)?.text||'상대의 말과 자료를 비교해 보세요.'):esc(STAGE_LABELS[state.stage]||'이번 여정')+' · 확인한 사실과 남은 의문'}</p></div><button class="close-button" data-act="close-modal" aria-label="수첩 닫기">${icon('close')}</button></header>${!present?`<nav class="journal-tabs" aria-label="수첩 항목">${[['facts','자료','letter'],['people','사람','chat'],['notes','메모','flag'],...(state.stage==='investigate'?[['theory','가설','compare']]:[])].map(([id,label,i])=>`<button class="${modal.tab===id?'active':''}" data-act="journal-tab" data-tab="${id}">${icon(i)}${label}</button>`).join('')}<span class="journal-count">${knownFacts().length}개의 기록</span></nav>`:''}${journalBody()}<footer class="journal-footer">${modal.tab==='facts'?`${!present?`<span class="compare-help">${modal.compare?'함께 볼 자료 두 개를 고릅니다.':'사실과 추론을 구분해 기록합니다.'}</span><button class="paper-button ${modal.compare?'active':''}" data-act="compare-toggle">${icon('compare')}${modal.compare?'한 장만 보기':'나란히 읽기'}</button>`:`<span class="compare-help">관찰한 사실을 근거로 제시합니다.</span><button class="small-primary" data-act="present-fact" ${!modal.selected?'disabled':''}>이 자료 제시하기 ${icon('arrow')}</button>`}`:`<span class="compare-help">${modal.tab==='theory'?'가설은 자료로 뒷받침해야 합니다.':'기록은 이 기기에 자동으로 남습니다.'}</span>`}<button class="paper-button" data-act="close-modal">닫기</button></footer></section>`;
}
function topics(person){
  if(person==='badger')return [
    ['badgerTime','어젯밤의 행적을 묻는다'],['badgerHand','차를 따르는 손을 살펴본다'],
    ...(has(state,'order')?[['badgerMeal','달라진 식사 기록을 보여 준다']]:[]),
    ...(has(state,'photo')?[['badgerPhotoEarly','사진 속 인물에 관해 묻는다']]:[])
  ];
  if(person==='otter')return [
    ...(!has(state,'photo')?[['photoReceive','인화된 사진을 받는다']]:[]),['otterCasual','어젯밤 복도에 관해 묻는다'],
    ...(has(state,'footprints')?[['otterDeny','18호에 들어간 적 있는지 묻는다']]:[]),
    ...(has(state,'footprints')?[['otterFootprints','18호의 발자국을 보여 준다']]:[]),
    ...(has(state,'maidCleaning')&&flagged(state,'otterCleaningClaim')?[['otterConfess','혼자 청소했다는 설명을 제시한다']]:[])
  ];
  if(person==='hedgehog')return [
    ['maidCleaning','18호를 누가 청소했는지 묻는다'],
    ...(has(state,'photo')||has(state,'group')?[['maidBadge','옛 배지에 관해 묻는다']]:[]),['maidHands','리넨을 접는 모습을 살펴본다']
  ];
  if(person==='cat')return [
    ['catCasual','어제 식당에 관해 묻는다'],...(flagged(state,'otterConfessed')?[['catAlibi','19시 40분의 벨보이 행적을 확인한다']]:[])
  ];
  return [['rabbitCasual','어젯밤 소리에 관해 묻는다']];
}
function interviewModal(){const person=CAST[modal.person];return `<section class="modal interview" role="dialog" aria-modal="true" aria-label="${person.name}와 대화"><header class="modal-header"><div><h2>${person.name}</h2><p>${person.role} · 직접 들은 말부터 확인한다</p></div><button class="close-button" data-act="close-modal" aria-label="대화 메뉴 닫기">${icon('close')}</button></header><div class="interview-body"><div class="interview-image" role="img" aria-label="${person.name}">${actorSprite(modal.person,state)}</div><div class="interview-topics">${topics(modal.person).map(([id,text])=>`<button class="topic-button" data-act="topic" data-scene="${id}">${icon('chat')}${esc(text)}</button>`).join('')}<button class="topic-button" data-act="person-present" data-person="${modal.person}">${icon('book')} 수첩의 자료를 직접 보여 준다</button></div></div></section>`;}
function logModal(){return `<section class="modal log-modal" role="dialog" aria-modal="true" aria-label="지난 대화"><header class="modal-header"><div><h2>지나온 대화</h2><p>읽었던 말과 직접 고른 대답</p></div><button class="close-button" data-act="close-modal" aria-label="대화 기록 닫기">${icon('close')}</button></header><div class="log-body">${state.log.length?state.log.map(line=>`<article class="log-entry"><strong>${line.thought?'여우의 생각':CAST[line.speaker]?.name||'이야기'}</strong><p>${esc(line.text)}</p></article>`).join(''):'<div class="empty-detail">아직 지나온 대화가 없습니다.</div>'}</div></section>`;}
function settingsModal(){return `<section class="modal settings" role="dialog" aria-modal="true" aria-label="게임 설정"><header class="modal-header"><div><h2>잠시 쉬어 가기</h2><p>읽고 생각하는 속도는 자유롭습니다.</p></div><button class="close-button" data-act="close-modal" aria-label="설정 닫기">${icon('close')}</button></header><div class="settings-body">${[['sound','소리','세 음의 연주와 종, 문 두드림'],['assist','탐색 위치 도움','살펴볼 수 있는 곳에 은은한 테두리를 표시합니다.'],['reduced','움직임 줄이기','인물과 창의 짧은 등장 효과를 줄입니다.']].map(([id,title,desc])=>`<div class="setting-row"><div><strong>${title}</strong><p>${desc}</p></div><button class="toggle ${settings[id]?'on':''}" data-act="toggle-setting" data-setting="${id}" role="switch" aria-checked="${!!settings[id]}" aria-label="${title}"></button></div>`).join('')}<div class="keyboard-help">Enter / Space · 다음 대사　　1~3 · 선택과 건반<br>N · 수첩　　L · 지난 대화　　Esc · 창 닫기</div><div class="settings-links">${mode==='play'?'<button data-act="title">타이틀로 돌아가기</button><button data-act="export">진행 기록 내보내기</button>':'<span class="technical-note">저장된 진행은 이 브라우저에 남습니다.</span>'}</div></div></section>`;}
function confirmModal(){return `<section class="modal confirm" role="dialog" aria-modal="true" aria-label="새 이야기 시작 확인"><h2>처음부터 다시 시작할까요?</h2><p>이 기기에 저장된 진행이 새 이야기로 바뀝니다.<br>기존 진행을 남기려면 먼저 설정에서 내보낼 수 있습니다.</p><div class="confirm-actions"><button class="paper-button" data-act="close-modal">돌아가기</button><button class="small-primary red" data-act="confirm-new">처음부터 시작</button></div></section>`;}
function modalView(){if(!modal)return '';let body='';if(modal.type==='journal')body=journalModal();if(modal.type==='interview')body=interviewModal();if(modal.type==='log')body=logModal();if(modal.type==='settings')body=settingsModal();if(modal.type==='confirm')body=confirmModal();return `<div class="modal-backdrop" data-act="backdrop">${body}</div>`;}
function render(){
  const oldModal=$('.modal'),focused=document.activeElement;
  const preferred=oldModal?.contains(focused)?focusIdentity(focused):null;
  if(modal&&!oldModal)modalReturnFocus=focusIdentity(focused);
  const previous=$('.exploration-viewport');if(previous){const max=previous.scrollWidth-previous.clientWidth;explorationCameras.set(previous.dataset.place,max?previous.scrollLeft/max:.5);}
  journeyController?.destroy();journeyController=null;
  root.innerHTML=(mode==='replay'?`<div class="game-shell cinematic-shell">${journeyMarkup('replay')}</div>`:mode==='title'?titleScreen():playScreen())+modalView();
  mountExploration($('.exploration-viewport'),explorationCameras);
  if(modal){$('.game-shell')?.setAttribute('inert','');focusModal(preferred);}
  else if(oldModal){const back=modalReturnFocus;modalReturnFocus=null;requestAnimationFrame(()=>findFocusedControl(root,back)?.focus({preventScroll:true}));}
  if(mode==='replay'||(mode==='play'&&currentLine(state)?.type==='journey'))journeyController=mountJourney($('.journey-screen'),{audioContext,reduced:settings.reduced,checkpoint:mode==='play'?(state.active?.journeyCheckpoint||0):0,onCheckpoint:elapsed=>{if(mode==='play'&&currentLine(state)?.type==='journey'){state.active.journeyCheckpoint=elapsed;persist();}},onDone:()=>{if(mode==='replay'){mode='title';render();}else dispatch({type:'SPECIAL'});}});
}
function focusModal(preferred=null){requestAnimationFrame(()=>focusModalControl($('.modal'),preferred));}
function openJournal(tab='facts',selected=null,present=false,target=null){modal={type:'journal',tab,selected,compare:false,compareIds:[],person:'fox',present,target,photoDetail:null,theory:{}};render();}
function openInterview(person){if(!CAST[person]||['fox','deer'].includes(person))return;modal={type:'interview',person};render();}
function closeModal(){modal=null;render();}
function presentToPerson(person,id){
  if(person==='badger'){
    if(['order','bill'].includes(id))return 'badgerMeal';if(id==='hand')return 'badgerHand';if(id==='photo')return 'badgerPhotoEarly';if(id==='claim')return 'badgerTime';
  }
  if(person==='otter'){
    if(id==='footprints')return 'otterFootprints';if(id==='maidCleaning'&&flagged(state,'otterCleaningClaim'))return 'otterConfess';
  }
  if(person==='hedgehog'&&['photo','group','badge'].includes(id))return 'maidBadge';
  if(person==='cat'&&flagged(state,'otterConfessed')&&['photo','metal','footprints','otterTimeline'].includes(id))return 'catAlibi';
  return null;
}
root.addEventListener('click',event=>{
  const button=event.target.closest('[data-act]');if(!button||button.disabled)return;
  const a=button.dataset.act;
  if(a==='journey-replay'){mode='replay';modal=null;audioContext();render();return;}
  if(a==='journey-pause'){journeyController?.toggle();return;}
  if(a==='journey-next'){journeyController?.next();return;}
  if(a==='journey-skip'){journeyController?.finish();return;}
  if(a==='backdrop'){if(event.target===button)closeModal();return;}
  if(a==='new'){if(saved){modal={type:'confirm'};render();}else startNew();return;}
  if(a==='confirm-new'){startNew();return;}
  if(a==='continue'){continueGame();return;}
  if(a==='settings'){modal={type:'settings'};render();return;}
  if(a==='close-modal'){closeModal();return;}
  if(a==='title'){modal=null;mode='title';render();return;}
  if(a==='toggle-setting'){const key=button.dataset.setting;settings[key]=!settings[key];writeStorage('mistwater-settings-v1',JSON.stringify(settings));if(key==='sound'&&settings.sound)tone(329.63);render();return;}
  if(a==='export'){
    if(!state)return;const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='물안개호텔_1화_진행기록.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('진행 기록을 내보냈습니다.');return;
  }
  if(!state)return;
  if(a==='journal'){openJournal();return;}
  if(a==='theory'){openJournal('theory');return;}
  if(a==='fact'){openJournal('facts',button.dataset.fact);return;}
  if(a==='log'){modal={type:'log'};render();requestAnimationFrame(()=>{const el=$('.log-body');if(el)el.scrollTop=el.scrollHeight;});return;}
  if(a==='journal-tab'){modal.tab=button.dataset.tab;modal.photoDetail=null;state.feedback='';render();return;}
  if(a==='person-select'){modal.person=button.dataset.person;render();return;}
  if(a==='fact-select'){
    const id=button.dataset.fact;modal.selected=id;modal.photoDetail=null;
    if(modal.compare){if(modal.compareIds.includes(id))modal.compareIds=modal.compareIds.filter(x=>x!==id);else modal.compareIds=[...modal.compareIds,id].slice(-2);if(modal.compareIds.length===2)state=reduce(state,{type:'COMPARE',ids:modal.compareIds});persist();}
    render();return;
  }
  if(a==='compare-toggle'){modal.compare=!modal.compare;modal.compareIds=modal.compare&&modal.selected?[modal.selected]:[];modal.photoDetail=null;render();return;}
  if(a==='photo-detail'){modal.photoDetail=button.dataset.detail;render();return;}
  if(a==='photo-back'){modal.photoDetail=null;render();return;}
  if(a==='hint'){const i=Number(button.dataset.index);if(hintOpen.has(i))hintOpen.delete(i);else hintOpen.add(i);render();return;}
  if(a==='interview'){openInterview(button.dataset.person);return;}
  if(a==='person-present'){openJournal('facts',null,true,button.dataset.person);return;}
  if(a==='present-picker'){openJournal('facts',null,true);return;}
  if(a==='present-fact'){
    const id=modal.selected,target=modal.target;modal=null;
    if(target){const scene=presentToPerson(target,id);if(scene)dispatch({type:'SCENE',id:scene});else{render();toast('이 자료에 관해서는 새로운 설명을 듣지 못했다. 다른 사실과 연결해 보자.');}}
    else dispatch({type:'PRESENT',id});return;
  }
  if(a==='topic'||a==='scene'){modal=null;dispatch({type:'SCENE',id:button.dataset.scene});return;}
  if(a==='move'){dispatch({type:'MOVE',location:button.dataset.location});return;}
  if(a==='advance'){dispatch({type:'ADVANCE'});return;}
  if(a==='skip'){dispatch({type:'SKIP'});return;}
  if(a==='choice'){dispatch({type:'CHOICE',index:Number(button.dataset.index)});return;}
  if(a==='statement'){dispatch({type:'STATEMENT',index:Number(button.dataset.index)});return;}
  if(a==='special'){dispatch({type:'SPECIAL'});return;}
  if(a==='camera'){tone(150,.08);dispatch({type:'SPECIAL'});const f=document.createElement('div');f.className='flash';$('.game-shell').append(f);setTimeout(()=>f.remove(),750);return;}
  if(a==='listen-motif'){motif();return;}
  if(a==='piano-key'){
    const i=Number(button.dataset.note);tone([261.63,329.63,392][i]);
    if(i!==pianoInput.length){pianoInput=[];toast('다시 천천히. 낮은 음, 가운데 음, 그리고 높은 음.');render();return;}
    pianoInput.push(i);if(pianoInput.length===3){dispatch({type:'SPECIAL'});}else render();return;
  }
  if(a==='deduce'){
    const values={person:$('#theory-person').value,place:$('#theory-place').value,event:$('#theory-event').value};modal.theory=values;
    dispatch({type:'DEDUCE',...values});if(state.deduction)toast('확인한 사실을 바탕으로 가설을 세웠습니다.');return;
  }
  if(a==='start-confrontation'){modal=null;dispatch({type:'SCENE',id:'confrontation'});return;}
});

document.addEventListener('keydown',event=>{
  if(event.ctrlKey||event.metaKey||event.altKey||event.isComposing)return;
  const tag=document.activeElement?.tagName;
  if(event.key==='Escape'&&modal){event.preventDefault();closeModal();return;}
  if(event.key==='Tab'&&modal){trapModalTab(event,$('.modal'),document.activeElement);return;}
  if(['INPUT','SELECT','TEXTAREA'].includes(tag))return;
  if(modal)return;
  if(nativeActivation(event,document.activeElement))return;
  if(mode==='replay'||(mode==='play'&&currentLine(state)?.type==='journey')){
    if(event.key===' '||event.key==='Escape'){event.preventDefault();journeyController?.toggle();}
    if(event.key==='Enter'){event.preventDefault();journeyController?.next();}
    return;
  }
  if(mode!=='play'||!state)return;
  if(event.key.toLowerCase()==='h'&&!state.active){event.preventDefault();$('.exploration-world')?.classList.add('show-explore-help');return;}
  if(event.key.toLowerCase()==='n'){event.preventDefault();openJournal();return;}
  if(event.key.toLowerCase()==='l'){event.preventDefault();modal={type:'log'};render();return;}
  const line=currentLine(state);
  if(['Enter',' '].includes(event.key)&&state.active&&!line?.type){event.preventDefault();dispatch({type:'ADVANCE'});return;}
  const index=Number(event.key)-1;
  if(index>=0&&index<9&&line?.type==='choice'){event.preventDefault();dispatch({type:'CHOICE',index});return;}
  if(index>=0&&index<9&&line?.type==='statement'){event.preventDefault();dispatch({type:'STATEMENT',index});return;}
  if(index>=0&&index<3&&line?.type==='piano'){event.preventDefault();document.querySelector(`[data-act="piano-key"][data-note="${index}"]`)?.click();}
});
document.addEventListener('keyup',event=>{if(event.key.toLowerCase()==='h'&&!settings.assist)$('.exploration-world')?.classList.remove('show-explore-help');});
window.addEventListener('resize',()=>positionExploration($('.exploration-viewport'),explorationCameras));
window.addEventListener('blur',()=>{if(!settings.assist)$('.exploration-world')?.classList.remove('show-explore-help');});
render();
for(const image of ['assets/backgrounds/dining.png','assets/backgrounds/bedroom.png',...['coastal-road','ford-car','ford-interior','hotel-exterior'].map(key=>'assets/backgrounds/'+key+'.png'),path('badger'),path('deer')]){const img=new Image();img.src=image;}
