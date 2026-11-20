import {actorSprite,poseFor,spriteRect} from './scene-actors.js';
import {scenePlacement} from './scene-blocking.js';

const W=1672,H=941;
const target=(label,rect,extra)=>({label,rect,...extra});
const npc=(label,person,x,y,h=280,extra={})=>target(label,[x,y,h*.54,h],{person,actor:person,act:'interview',...extra});
const have=(s,id)=>s.facts.includes(id);

export function explorationTargets(s){
 if(!s||s.active)return [];
 if(s.stage==='overlook')return [
  target('안내 엽서',[340,708,160,105],{scene:'roadPostcard',fact:'travelPostcard'}),
  target('호숫길 표지판',[1490,480,150,210],{scene:'roadSign',prop:'sign'}),
  target('바다와 바람',[25,210,480,290],{scene:'roadQuiet'}),
  target('호숫길을 따라 호텔로',[1340,80,310,235],{scene:'lakeApproach',exit:true})
 ];
 if(s.stage==='forecourt')return [
  target('낡은 포드',[340,597,370,185],{scene:'fordDetail',fact:'ford',prop:'ford'}),
  target('호텔 위층의 창문',[1280,160,300,210],{scene:'facadeLook',fact:'facade'}),
  target('호숫가의 작은 지붕',[336,470,150,95],{scene:'pavilionLook',fact:'pavilion'}),
  target('호텔 문을 열기',[1195,505,120,185],{scene:'hotelDoor',exit:true}),
  npc('마중 나온 벨보이','otter',1010,475,270,{act:'scene',scene:'forecourtBellboy',rect:[1010,475,180,270],feet:[1100,728]})
 ];
 const wall=[target('객실 열쇠판',[1480,220,180,245],{scene:'keys',fact:'keys'}),target('옛 단체사진',[874,228,110,87],{scene:'group',fact:'group'}),target('옛 주인의 초상화',[1020,213,78,118],{scene:'portrait',fact:'portrait',prop:'portrait'})];
 if(s.stage==='lobby')return [...wall,target('객실로 올라가기',[1110,325,240,225],{scene:'roomMeeting',exit:true})];
 if(s.stage==='dinnerReady')return [target('창가의 책상',[570,410,520,155],{scene:'ownDesk'}),target('파란 끈의 가방',[842,634,165,155],{scene:'ownBag'}),target('저녁 식사하러 가기',[1550,155,120,500],{scene:'dinner',exit:true})];
 if(s.stage==='investigate'){
  if(s.location==='lobby')return [
   npc(have(s,'photo')?'사진을 건넨 벨보이':'인화된 사진 받기','otter',1100,440,270,{act:have(s,'photo')?'interview':'scene',scene:'photoReceive',fact:'photo'}),
   npc('지배인에게 묻기','badger',1380,465,320),npc('객실 담당자','hedgehog',935,580,270),npc('고양이 투숙객','cat',390,422,290),npc('토끼 투숙객','rabbit',708,458,255),...wall
  ];
  if(s.location==='gallery')return [wall[1],wall[2],npc('배지를 가진 직원','hedgehog',1040,530,280)];
  if(s.location==='dining')return [
   target('주방 주문 쪽지',[1490,300,80,55],{scene:'order',fact:'order',prop:'pinned-receipt'}),target('손님용 계산서',[430,636,78,48],{scene:'bill',fact:'bill',prop:'receipt'}),
   npc('객실 담당자','hedgehog',1450,493,265),npc('고양이에게 묻기','cat',806,480,260),npc(have(s,'photo')?'벨보이에게 묻기':'인화된 사진 받기','otter',1218,510,275,{act:have(s,'photo')?'interview':'scene',scene:'photoReceive',fact:'photo'})
  ];
  if(s.location==='room18')return [target('책상 아래',[680,535,390,210],{scene:'roomDesk',fact:'paperBand'}),target('벽장과 바닥',[1140,150,200,240],{scene:'roomWardrobe',fact:'wardrobe'}),target('문 안쪽의 발자국',[1530,695,115,145],{scene:'roomFootprints',fact:'footprints',prop:'footprints'}),target('침대와 선반',[45,375,540,415],{scene:'roomBed'}),npc('청소에 관해 묻기','hedgehog',1390,430,285)];
  return [target('아침 약속 쪽지',[785,442,140,65],{act:'fact',fact:'note'}),target('내 가방',[842,634,165,155],{scene:'ownBag'})];
 }
 if(s.stage==='nightListen')return [target('창문 쪽 소리',[645,20,400,395],{scene:'nightWindow'}),target('복도 문 쪽 소리',[1552,112,120,520],{scene:'nightDoor'}),target('벽장 뒤의 소리',[1140,140,315,550],{scene:'nightWall'})];
 return [];
}

const propSvg=(body,view='0 0 100 100')=>`<svg class="world-prop" viewBox="${view}" aria-hidden="true">${body}</svg>`;
function prop(kind){
 if(kind==='ford')return '<img class="world-car" src="assets/backgrounds/ford-car.png" alt="" draggable="false">';
 if(kind==='postcard')return propSvg('<g transform="rotate(-8 50 30)"><rect x="3" y="5" width="92" height="51" rx="1" fill="#cfb98b" stroke="#6d583c" stroke-width="2"/><rect x="8" y="10" width="82" height="39" fill="#83918a"/><path d="M9 39 37 23 56 35 76 18 90 31V49H8Z" fill="#4e6557"/><path d="M42 37V24l14-7 16 9v11" fill="#a28a65"/><path d="M38 26 56 13l20 15" fill="#594d3e"/><path d="M10 45H89" stroke="#a9b9a4" stroke-width="3"/></g>','0 0 100 62');
 if(kind==='sign')return propSvg('<defs><linearGradient id="sign-wood" x2="1" y2="1"><stop stop-color="#5d4935"/><stop offset="1" stop-color="#2e3025"/></linearGradient></defs><path d="M48 41h13l-3 153H47Z" fill="#544332" stroke="#302a22"/><path d="M5 12 137 4l20 28-19 25L6 61Z" fill="url(#sign-wood)" stroke="#ac9165" stroke-width="2"/><path d="m25 27 4 10 11 1-9 6 2 11-8-7-9 7 3-11-9-6 12-1Z" fill="#bfaa73"/><path d="M52 25h72M52 34h55M52 43h65" stroke="#cbb994" stroke-width="3" opacity=".7"/>','0 0 165 210');
 if(kind==='pinned-receipt')return propSvg('<rect x="8" y="8" width="84" height="57" rx="1" fill="#ddcba7" stroke="#95764e" stroke-width="1.5"/><path d="M23 26h52M23 36h52M23 46h42M23 56h46" stroke="#8d7b5b" stroke-width="1.5"/><circle cx="50" cy="9" r="4" fill="#795139" stroke="#c2a263"/>','0 0 100 70');
 if(kind==='receipt')return propSvg('<path d="M9 15 85 7 96 46 11 54Z" fill="#342e22" opacity=".25"/><path d="M7 12 84 5 93 43 9 51Z" fill="#d9c9a5" stroke="#a18a63" stroke-width="1.5"/><path d="m21 20 49-5m-47 12 50-5m-49 13 39-4m-38 11 45-5" stroke="#8d7b5b" opacity=".65" stroke-width="1.6"/>','0 0 100 60');
 if(kind==='portrait')return propSvg('<defs><radialGradient id="old-portrait"><stop stop-color="#8d7854"/><stop offset="1" stop-color="#302e22"/></radialGradient></defs><ellipse cx="39" cy="53" rx="36" ry="50" fill="#a58142" stroke="#57452d" stroke-width="4"/><ellipse cx="39" cy="53" rx="29" ry="43" fill="url(#old-portrait)" stroke="#d0ac61" stroke-width="2"/><path d="M17 87q1-28 17-32c-15-23 1-42 14-29 10 11 3 24-2 29 14 5 17 18 16 32" fill="#25271f" opacity=".9"/><rect x="10" y="108" width="59" height="7" fill="#aa8e58"/>','0 0 78 118');
 if(kind==='footprints')return propSvg('<g fill="#5a4938" opacity=".55" transform="rotate(18 50 50)"><ellipse cx="35" cy="22" rx="10" ry="18"/><ellipse cx="34" cy="46" rx="8" ry="7"/><ellipse cx="68" cy="58" rx="10" ry="18"/><ellipse cx="67" cy="82" rx="8" ry="7"/></g>');
 return '';
}
function sceneVisualTargets(s){
 if(!s)return [];
 const base={...s,active:null};
 const scene=s.active?.id,index=s.active?.index??0;
 const wall=()=>explorationTargets({...base,stage:'lobby'}).filter(t=>!t.exit);
 if(s.stage==='confrontation'||s.active?.id==='confrontation')return [...wall(),npc('지배인','badger',1380,465,320)];
 if(s.location==='forecourt')return explorationTargets({...base,stage:'forecourt'});
 if(s.location==='lobby'&&(['arrival','lobby'].includes(s.stage)||s.active?.id==='arrival'))return [...wall(),target('객실로 올라가기',[1110,325,240,225],{scene:'roomMeeting',exit:true}),npc('지배인','badger',1380,465,320)];
 if(s.location==='lobby'&&s.stage==='nightLobby')return [
  ...wall(),npc('벨보이','otter',1100,440,270),...(scene==='nightLobby'&&index>=4?[]:[npc('지배인','badger',1380,465,320)]),npc('객실 담당자','hedgehog',935,580,270)
 ];
 if(s.location==='corridor'){
  const photographed=s.active?.id==='photoEvening'&&(s.active.index??0)>=6;
  return photographed?[npc('벨보이','otter',1070,480,270)]:[npc('음악가','deer',650,460,285),npc('투숙객','rabbit',940,490,255)];
 }
 if(s.location==='dining'){
  const targets=explorationTargets({...base,stage:'investigate'});
  const evening=s.active?.id==='dinner'||s.active?.id==='photoEvening'||['dinnerReady','photoReady'].includes(s.stage);
  if(evening)return [...targets.filter(t=>t.actor),...(scene==='photoEvening'&&index>=6?[]:[npc('음악가','deer',625,445,285)]),npc('투숙객','rabbit',1010,450,245)];
  if(scene==='morning'&&index>=5)return [...targets,npc('지배인','badger',1015,400,285)];
  return targets;
 }
 if(s.active?.id==='roomMeeting')return [npc('벨보이','otter',1280,430,270),...((s.active.index??0)>=2?[npc('음악가','deer',1460,390,290)]:[])];
 return explorationTargets(base);
}

function actorBounds(t,s){
 if(!t.actor)return t.rect;
 const placement=scenePlacement(t.actor,s);
 const feet=placement?.feet||t.feet||[t.rect[0]+t.rect[2]/2,t.rect[1]+t.rect[3]];
 return spriteRect(poseFor(t.actor,s),feet,placement?.height||t.rect[3]);
}
function decorations(s){
 if(s.location==='guestHall')return '<span class="guest-door-number room17-number" aria-hidden="true">17</span><span class="guest-door-number room18-number" aria-hidden="true">18</span>';
 if(s.stage==='overlook')return '<img class="road-parked-car" src="assets/backgrounds/ford-car.png" alt="" draggable="false">';
 if(s.location==='room17')return '<svg class="room-bag-cord" viewBox="0 0 165 155" aria-hidden="true"><path d="M71 20q-13-14-14-3t14 2q14-15 16-5T72 20m0 0 5 110" fill="none" stroke="#253d39" stroke-width="4"/><path d="M71 20q-13-14-14-3t14 2q14-15 16-5T72 20m0 0 5 110" fill="none" stroke="#557b80" stroke-width="2"/></svg>';
 return '';
}
const pct=(v,total)=>`${(v/total*100).toFixed(4)}%`;
export function explorationMarkup(s,bg,{interactive=true,assist=false,escape=x=>x,focusPerson=null}={}){
 const e=escape,targets=sceneVisualTargets(s);
 const depth=t=>t.actor?(scenePlacement(t.actor,s)?.feet[1]??t.feet?.[1]??t.rect[1]+t.rect[3]):-1;
 targets.sort((a,b)=>depth(a)-depth(b));
 const key=t=>[t.act||'scene',t.scene||'',t.person||'',t.fact||'',t.label].join('|');
 const actions=new Set((interactive?explorationTargets(s):[]).map(key));
 const markup=targets.map(t=>{
  const rect=actorBounds(t,s),enabled=actions.has(key(t));
  const action=enabled?`data-act="${t.act||'scene'}" ${t.scene?`data-scene="${t.scene}"`:''} ${t.person?`data-person="${t.person}"`:''} ${t.fact?`data-fact="${t.fact}"`:''}`:'disabled tabindex="-1" aria-hidden="true"';
  return `<button type="button" class="world-target ${t.actor?'person-target':''} ${t.exit?'exit-target':''} ${t.fact&&have(s,t.fact)?'observed':''}" style="left:${pct(rect[0],W)};top:${pct(rect[1],H)};width:${pct(rect[2],W)};height:${pct(rect[3],H)}" ${action} aria-label="${e(t.label)}">${t.actor?actorSprite(t.actor,s):t.prop?prop(t.prop):''}<span class="target-focus" aria-hidden="true"></span></button>`;
 }).join('');
 const pan=interactive?'<button class="pan-edge left" data-pan="-1" aria-label="풍경 왼쪽으로 보기">‹</button><button class="pan-edge right" data-pan="1" aria-label="풍경 오른쪽으로 보기">›</button>':'';
 return `<section class="exploration-viewport ${interactive?'':'scene-dialogue-world'}" data-place="${s.location}" data-interactive="${interactive}" data-focus-person="${focusPerson||''}" ${interactive?'aria-label="주변 풍경. 인물과 사물을 직접 눌러 살펴볼 수 있습니다."':'aria-hidden="true"'}><div class="exploration-world ${interactive&&assist?'show-explore-help':''}" style="--world-ratio:${W/H}"><img class="world-background" src="assets/backgrounds/${bg}.png" alt="" draggable="false">${decorations(s)}${markup}</div>${pan}</section>`;
}

export function positionExploration(viewport,cameras){
 if(!viewport)return;
 const key=viewport.dataset.place;
 const camera=cameras.get(key)??(key==='forecourt'?(viewport.clientWidth<650?.96:.54):key==='lobby'?.96:.5);
 viewport.scrollLeft=Math.max(0,viewport.scrollWidth-viewport.clientWidth)*camera;
 if(viewport.dataset.interactive==='false'){
  const person=viewport.dataset.focusPerson;
  const actor=person&&viewport.querySelector('[data-person="'+person+'"]');
  if(actor){
   const r=actor.getBoundingClientRect(),v=viewport.getBoundingClientRect();
   if(r.left<v.left+24||r.right>v.right-24){
    viewport.scrollLeft+=r.left+r.width/2-v.left-v.width/2;
    const max=viewport.scrollWidth-viewport.clientWidth;
    cameras.set(key,max?viewport.scrollLeft/max:.5);
   }
  }
  return;
 }
}

export function mountExploration(viewport,cameras){
 if(!viewport)return;
 const key=viewport.dataset.place;
 positionExploration(viewport,cameras);
 if(viewport.dataset.interactive==='false')return;
 const update=()=>{const max=viewport.scrollWidth-viewport.clientWidth;cameras.set(key,max?viewport.scrollLeft/max:.5);viewport.classList.toggle('can-pan-left',viewport.scrollLeft>8);viewport.classList.toggle('can-pan-right',viewport.scrollLeft<max-8);};
 viewport.addEventListener('scroll',update,{passive:true});
 viewport.addEventListener('click',event=>{const pan=event.target.closest('[data-pan]');if(pan){event.stopPropagation();viewport.scrollBy({left:Number(pan.dataset.pan)*viewport.clientWidth*.65,behavior:'smooth'});}});
 let drag=null;
 viewport.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse'||event.button!==0||event.target.closest('button'))return;drag={x:event.clientX,left:viewport.scrollLeft};viewport.setPointerCapture(event.pointerId);viewport.classList.add('panning');});
 viewport.addEventListener('pointermove',event=>{if(drag)viewport.scrollLeft=drag.left+drag.x-event.clientX;});
 const end=()=>{drag=null;viewport.classList.remove('panning');};viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);
 viewport.addEventListener('focusin',event=>{const t=event.target.closest('.world-target');if(!t||!t.matches(':focus-visible'))return;const r=t.getBoundingClientRect(),v=viewport.getBoundingClientRect();if(r.left<v.left+24)viewport.scrollLeft-=v.left+24-r.left;if(r.right>v.right-24)viewport.scrollLeft+=r.right-v.right+24;});
 update();
}
