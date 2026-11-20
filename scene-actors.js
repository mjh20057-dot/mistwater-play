// Character identity is stable; the activity and framing belong to the scene.
const FRAME='0 0 1024 1536';
const reference=person=>({id:person+'-reference',src:`assets/characters/${person}.png`,person,viewBox:FRAME,width:1024,height:1536,anchor:{x:.5,y:.96},activity:'reference'});
const variant=(person,id,activity,extra={})=>({...reference(person),id,src:`assets/characters/poses/${id}.png`,activity,fallbackSrc:`assets/characters/${person}.png`,...extra});
const PEOPLE=new Set(['fox','deer','badger','otter','hedgehog','cat','rabbit']);

export const SCENE_POSES=Object.freeze({
 'otter-greet':variant('otter','otter-greet','welcome',{anchor:{x:.5,y:1452/1536}}),
 'otter-carry':variant('otter','otter-carry','carry-guest-bag',{anchor:{x:.5,y:1450/1536}}),
 'otter-photos':variant('otter','otter-photos','photo-envelope',{anchor:{x:.5,y:1463/1536}}),
 'otter-serve':variant('otter','otter-serve','serve',{anchor:{x:.5,y:1416/1536}}),
 'hedgehog-plates':variant('hedgehog','hedgehog-plates','clear-table',{anchor:{x:.5,y:1471/1536}}),
 'hedgehog-door':variant('hedgehog','hedgehog-door','check-room',{anchor:{x:.5,y:1467/1536}}),
 'cat-lounge':variant('cat','cat-lounge','lounge',{anchor:{x:.5,y:1477/1536}}),
 'cat-dining':variant('cat','cat-dining','dine',{anchor:{x:.5,y:1472/1536}}),
 'badger-ledger':variant('badger','badger-ledger','front-desk',{anchor:{x:.5,y:1493/1536}}),
 'badger-tea':variant('badger','badger-tea','pour-tea',{anchor:{x:.5,y:1476/1536}}),
 'badger-guard':variant('badger','badger-guard','guard',{anchor:{x:.5,y:1497/1536}}),
 'deer-piano':variant('deer','deer-piano','small-keyboard',{anchor:{x:.5,y:1498/1536}}),
 'rabbit-window':variant('rabbit','rabbit-window','watch-window')
});

export function poseFor(person,state={}){
 if(!PEOPLE.has(person))return null;
 const location=state.location,scene=state.active?.id,stage=state.stage;
 let id;
 if(person==='otter'){
  const carrying=(scene==='forecourtBellboy'&&(state.active?.index??0)>=6)||state.flags?.includes('bellboyHasBag');
  id=['roomMeeting','photoEvening'].includes(scene)?'otter-greet':location==='forecourt'?(carrying?'otter-carry':'otter-greet'):location==='dining'?'otter-serve':'otter-photos';
 }
 if(person==='hedgehog')id=location==='room18'?'hedgehog-door':location==='dining'?'hedgehog-plates':null;
 if(person==='cat')id=location==='dining'?'cat-dining':'cat-lounge';
 if(person==='badger'){
  if(stage==='confrontation'||scene==='confrontation'||stage==='nightLobby')id='badger-guard';
  else if(scene==='badgerHand'||(scene==='arrival'&&(state.active?.index??0)>=8))id='badger-tea';
  else id='badger-ledger';
 }
 if(person==='deer'&&location==='dining'&&scene!=='photoEvening')id='deer-piano';
 if(person==='rabbit'&&location!=='dining')id='rabbit-window';
 return id?SCENE_POSES[id]:reference(person);
}

// The point where the feet (or chair legs) meet the floor stays fixed even
// when the pose uses a different canvas ratio or a different amount of margin.
export function spriteRect(pose,feet,height){
 const [, ,width,frameHeight]=pose.viewBox.split(/\s+/).map(Number);
 const w=height*width/frameHeight;
 return [feet[0]-w*pose.anchor.x,feet[1]-height*pose.anchor.y,w,height];
}

const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function actorSprite(person,state={}){
 const pose=poseFor(person,state);if(!pose)return '';
 const [frameX,frameY,w,h]=pose.viewBox.split(/\s+/).map(Number);
 const footX=frameX+w*pose.anchor.x,footY=frameY+h*pose.anchor.y;
 return `<svg class="scene-actor world-person" viewBox="${esc(pose.viewBox)}" data-person="${person}" data-pose="${pose.id}" data-activity="${pose.activity}" aria-hidden="true"><ellipse class="actor-contact-shadow" cx="${footX}" cy="${footY+6}" rx="145" ry="19" fill="#18251d" opacity=".17"/><image class="scene-actor-image" href="${esc(pose.src)}" width="${pose.width}" height="${pose.height}" ${pose.fallbackSrc?`data-pose-fallback-src="${esc(pose.fallbackSrc)}"`:''}/></svg>`;
}

// During asset preparation a missing activity drawing may use the approved
// character reference. The flag makes that fallback detectable in final QA.
export function recoverActorImage(image){
 if(!image?.matches?.('.scene-actor-image[data-pose-fallback-src]'))return false;
 const fallback=image.getAttribute('data-pose-fallback-src');
 image.removeAttribute('data-pose-fallback-src');
 if(!fallback||image.getAttribute('href')===fallback)return false;
 image.closest('.scene-actor')?.setAttribute('data-pose-fallback','true');
 image.setAttribute('href',fallback);
 return true;
}
if(typeof document!=='undefined')document.addEventListener('error',event=>recoverActorImage(event.target),true);
