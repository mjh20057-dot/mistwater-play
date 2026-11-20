import { SCRIPTS, FACTS, REQUIRED_FACTS, REQUIRED_PAIRS } from './story.js';

export const SAVE_KEY = 'mistwater-chapter1-save-v1';
const unique = list => [...new Set(list)];
export const has = (state, id) => state.facts.includes(id);
export const flagged = (state, id) => state.flags.includes(id);
export const pairKey = pair => [...pair].sort().join('|');
export function createState() {
  return { version:1, stage:'journey', location:'coast', facts:[], flags:[], comparisons:[], deduction:false, active:{id:'roadJourney',index:0,branch:null}, log:[], steps:0, savedAt:Date.now(), feedback:'' };
}
export function currentLine(state) {
  if (!state.active) return null;
  return state.active.branch ? state.active.branch.lines[state.active.branch.index] : SCRIPTS[state.active.id]?.lines[state.active.index];
}
function record(state, line) {
  if (!line || !line.text) return;
  state.log.push({speaker:line.speaker ?? null,text:line.text,thought:!!line.thought});
  if(state.log.length>1500) state.log=state.log.slice(-1500);
}
function grant(state, ids=[]) { state.facts=unique([...state.facts,...ids.filter(id=>FACTS[id])]); }
export function startScene(state,id) {
  if (!SCRIPTS[id]) return state;
  state.active={id,index:0,branch:null}; state.feedback='';
  if(SCRIPTS[id].location) state.location=SCRIPTS[id].location;
  return state;
}
function finish(state) {
  const script=SCRIPTS[state.active.id];
  grant(state,script.grants); state.flags=unique([...state.flags,...(script.flags||[])]);
  state.active=null;state.feedback='';
  switch(script.end) {
    case 'journey_done':state.stage='overlook';state.location='coast';break;
    case 'forecourt_ready':state.stage='forecourt';state.location='forecourt';break;
    case 'enter_hotel':state.stage='arrival';startScene(state,'arrival');break;
    case 'arrival_done': state.stage='lobby'; break;
    case 'room_meeting_done': state.stage='dinnerReady';state.location='room17';break;
    case 'dinner_done': state.stage='photoReady'; break;
    case 'photo_evening_done': state.stage='sleep';state.location='room17';break;
    case 'morning_done': state.stage='investigate';break;
    case 'confrontation_done': state.stage='nightLobby';state.flags=unique([...state.flags,'confronted']);break;
    case 'night_lobby_done':state.stage='nightRoom';break;
    case 'night_bag_done':state.stage='nightListen';break;
    case 'wall_found':state.stage='wallFound';break;
    case 'chapter_complete':state.stage='complete';break;
  }
}
function advanceDraft(state, force=false) {
  const line=currentLine(state); if(!line)return;
  if(line.type&&!force)return;
  record(state,line); state.feedback='';
  if(state.active.branch) {
    state.active.branch.index++;
    if(state.active.branch.index>=state.active.branch.lines.length) {state.active.branch=null;state.active.index++;}
  } else state.active.index++;
  if(!state.active.branch&&state.active.index>=SCRIPTS[state.active.id].lines.length)finish(state);
}
export function missingPreparation(state) {
  const facts=REQUIRED_FACTS.filter(id=>!has(state,id));
  const pairs=REQUIRED_PAIRS.filter(p=>!state.comparisons.includes(pairKey(p)));
  return {facts,pairs};
}
export function canConfront(state) {
  const m=missingPreparation(state);
  return state.stage==='investigate'&&state.deduction&&!m.facts.length&&!m.pairs.length;
}
export function reduce(state,action) {
  const next=structuredClone(state);next.feedback='';
  switch(action.type) {
    case 'ADVANCE':advanceDraft(next);break;
    case 'SKIP': {
      let limit=0;
      while(next.active && !currentLine(next)?.type && limit++<300)advanceDraft(next);
      break;
    }
    case 'CHOICE': {
      const line=currentLine(next); if(line?.type!=='choice')break;
      const option=line.options[action.index];if(!option)break;
      record(next,{speaker:'fox',text:option.text});
      if(option.reply?.length)next.active.branch={lines:option.reply,index:0};else advanceDraft(next,true);
      break;
    }
    case 'SPECIAL': {
      const line=currentLine(next);
      if(['piano','camera','journey'].includes(line?.type))advanceDraft(next,true);
      break;
    }
    case 'PRESENT': {
      const line=currentLine(next);
      if(line?.type!=='present'||!has(next,action.id))break;
      if(action.id===line.expected){record(next,{speaker:'fox',text:'제시한 자료: '+FACTS[action.id].title});advanceDraft(next,true);}
      else next.feedback='이 자료만으로는 지금의 말을 반박하기 어렵다. '+line.hint;
      break;
    }
    case 'STATEMENT': {
      const line=currentLine(next);if(line?.type!=='statement')break;
      const option=line.options[action.index];if(!option)break;
      if(option.correct)advanceDraft(next,true);else next.feedback='그 말은 확인한 사실과 충돌하지 않는다. 사진의 시각과 지배인의 행적을 다시 생각해 보자.';
      break;
    }
    case 'SCENE': {
      if(next.active||!SCRIPTS[action.id])break;
      if(action.id==='confrontation'&&!canConfront(next)){startScene(next,'notEnough');break;}
      const allowedEvents={lakeApproach:['overlook'],hotelDoor:['forecourt'],roadPostcard:['overlook'],roadSign:['overlook'],roadQuiet:['overlook'],fordDetail:['forecourt'],facadeLook:['forecourt'],pavilionLook:['forecourt'],forecourtBellboy:['forecourt'],roomMeeting:['lobby'],dinner:['dinnerReady'],photoEvening:['photoReady'],morning:['sleep'],nightLobby:['nightLobby'],nightBag:['nightRoom'],nightWall:['nightListen'],finale:['wallFound']};
      if(allowedEvents[action.id]&&!allowedEvents[action.id].includes(next.stage))break;
      const introductory=['keys','group','portrait'];
      const ownRoom=['ownDesk','ownBag'];
      if(!allowedEvents[action.id]&&action.id!=='confrontation'){
        if(introductory.includes(action.id)&&!['lobby','investigate'].includes(next.stage))break;
        if(ownRoom.includes(action.id)&&!['dinnerReady','investigate'].includes(next.stage))break;
        if(['nightWindow','nightDoor'].includes(action.id)&&next.stage!=='nightListen')break;
        if(![...introductory,...ownRoom,'nightWindow','nightDoor'].includes(action.id)&&next.stage!=='investigate')break;
      }
      if(['otterDeny','otterFootprints'].includes(action.id)&&!has(next,'footprints'))break;
      if(action.id==='otterConfess'&&(!has(next,'maidCleaning')||!flagged(next,'otterCleaningClaim')))break;
      if(action.id==='catAlibi'&&!flagged(next,'otterConfessed'))break;
      if(action.id==='maidBadge'&&!has(next,'photo')&&!has(next,'group'))break;
      if(action.id==='confrontation')next.stage='confrontation';
      startScene(next,action.id);break;
    }
    case 'MOVE': {
      if(next.active||!['lobby','dining','gallery','room18','room17'].includes(action.location))break;
      if(next.stage==='investigate') {
        if(action.location==='room18'&&!flagged(next,'entered18'))startScene(next,'room18Entry');
        else if(next.location==='room18'&&action.location!=='room18'&&!flagged(next,'roomExitSeen'))startScene(next,'roomExit');
        else next.location=action.location;
      } else if(next.stage==='lobby'&&['lobby','gallery'].includes(action.location)) next.location=action.location;
      break;
    }
    case 'COMPARE': {
      const ids=unique(action.ids||[]);if(ids.length!==2||ids.some(id=>!has(next,id)))break;
      next.comparisons=unique([...next.comparisons,pairKey(ids)]);break;
    }
    case 'DEDUCE': {
      if(next.stage!=='investigate')break;
      if(action.person==='badger'&&action.place==='corridor'&&action.event==='met') {
        const missing=missingPreparation(next);
        if(missing.facts.length||missing.pairs.length) next.feedback='가설은 세웠다. 대면 전에 사진의 특징과 각자의 행적을 확인하고, 기록을 나란히 읽어 근거를 준비하자.';
        else {next.deduction=true;next.flags=unique([...next.flags,'deduced']);}
      } else if(action.event==='harmed')next.feedback='지금 사진으로 확인할 수 있는 것은 두 사람이 만났다는 사실이다. 이후에 무슨 일이 있었는지는 아직 모른다.';
      else if(action.person==='otter')next.feedback='벨보이가 방에 들어온 시각과 사진을 찍은 시각은 다르다. 고양이의 설명과 비교해 보자.';
      else next.feedback='사진 속 배지와 오른손, 지배인의 행적을 함께 살펴보자. 관찰한 사실보다 앞선 결론은 아직 내릴 수 없다.';
      break;
    }
  }
  next.steps++;next.savedAt=Date.now();return next;
}

export function parseSave(raw) {
  try {
    const saved=typeof raw==='string'?JSON.parse(raw):raw;
    if(!saved||saved.version!==1||!Array.isArray(saved.facts)||!Array.isArray(saved.flags)||!Array.isArray(saved.comparisons)||!Array.isArray(saved.log))return null;
    if(!['journey','overlook','forecourt','arrival','lobby','dinnerReady','photoReady','sleep','investigate','confrontation','nightLobby','nightRoom','nightListen','wallFound','complete'].includes(saved.stage))return null;
    if(!['coast','forecourt','lobby','gallery','dining','corridor','guestHall','room18','room17'].includes(saved.location))return null;
    if(saved.active){const script=SCRIPTS[saved.active.id];if(!script||!Number.isInteger(saved.active.index)||!script.lines[saved.active.index])return null;if(saved.active.branch&&(!Array.isArray(saved.active.branch.lines)||!saved.active.branch.lines[saved.active.branch.index]))return null;}
    return {...createState(),...saved,location:saved.active?.id==='photoEvening'?'corridor':saved.active?.id==='roomMeeting'?'guestHall':saved.location,facts:unique(saved.facts.filter(id=>FACTS[id])),flags:unique(saved.flags),comparisons:unique(saved.comparisons)};
  }catch{return null;}
}

export function objectives(state) {
  const m=missingPreparation(state);
  if(state.stage==='investigate')return [
    {title:'다르게 적힌 식사 기록',done:has(state,'order')&&state.comparisons.includes(pairKey(['order','bill'])),hint:'식당에 남은 원래 주문과 현재 계산서를 나란히 읽어 본다.'},
    {title:'18호에 들어간 사람',done:has(state,'metal')&&has(state,'otterTimeline'),hint:'방의 흔적과 청소한 사람의 설명을 바탕으로 벨보이에게 자료를 제시한다. 사진 시각의 행적은 다른 손님에게도 확인한다.'},
    {title:'사진 속 배지와 오른손',done:has(state,'badge')&&state.comparisons.includes(pairKey(['photo','hand'])),hint:'옛 단체사진, 객실 담당자의 배지, 지배인의 손을 확인한다. 사진과 손의 관찰을 나란히 놓는다.'},
    {title:'지배인이 말한 시간',done:has(state,'claim'),hint:'프런트에서 어젯밤의 행적을 묻는다.'},
    {title:'사실만으로 가설 세우기',done:state.deduction,hint:m.facts.length||m.pairs.length?'위 의문들의 근거를 먼저 준비한 뒤 수첩에서 가설을 조합한다.':'수첩의 가설에서 누가, 어디서, 무엇을 했는지 정리한다.'}
  ];
  return [];
}
