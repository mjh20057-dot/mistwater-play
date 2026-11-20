import {JOURNEY_SHOTS} from './prologue.js';

export const JOURNEY_DURATION=JOURNEY_SHOTS.reduce((n,s)=>n+s.duration,0);
const JOURNEY_ROUTES={outbound:['coast','interior'],arrival:['coastFar','hotel'],replay:JOURNEY_SHOTS.map(shot=>shot.kind)};
function normalizeRoute(route){return Object.hasOwn(JOURNEY_ROUTES,route)?route:'outbound';}
export function shotsForJourney(route='outbound'){return JOURNEY_ROUTES[normalizeRoute(route)].map(kind=>JOURNEY_SHOTS.find(shot=>shot.kind===kind));}
export function durationForJourney(route='outbound'){return shotsForJourney(route).reduce((total,shot)=>total+shot.duration,0);}
const A='M 165 918 C 450 793 905 745 1198 655 C 1390 598 1482 534 1383 481 C 1286 431 913 433 697 400 C 582 382 554 348 640 322 C 710 300 821 290 930 274';
const B='M 1377 247 C 1442 221 1550 203 1543 169 C 1538 146 1459 133 1450 113 C 1439 84 1540 74 1656 37';
// Wheel contact stays in the paved parking aisle at the left of the forecourt.
const HOTEL='M -190 795 C 80 795 310 784 525 765';

export function journeyMarkup(route='outbound'){
  route=normalizeRoute(route);
  const sequence=shotsForJourney(route);
  const panels={
    coast:`<div class="journey-shot coast-shot" data-shot="coast"><svg viewBox="0 0 1672 941" preserveAspectRatio="xMidYMid meet" role="img" aria-label="굽이진 해안도로를 달리는 낡은 포드차"><image href="assets/backgrounds/coastal-road.png" width="1672" height="941"/><path id="coast-drive-a" d="${A}" fill="none" stroke="none"/><g data-car="coast"><ellipse cx="0" cy="23" rx="63" ry="15" fill="#17221b" opacity=".32"/><image href="assets/backgrounds/ford-car.png" x="-105" y="-66" width="210" height="105"/></g></svg><div class="journey-mist"></div></div>`,
    interior:`<div class="journey-shot interior-shot" data-shot="interior"><img src="assets/backgrounds/ford-interior.png" alt="핸들을 잡은 여우와 낡은 포드의 운전석"><div class="windshield-light"></div></div>`,
    coastFar:`<div class="journey-shot coast-far-shot" data-shot="coastFar"><svg viewBox="0 0 1672 941" preserveAspectRatio="xMidYMid meet" role="img" aria-label="먼 숲 쪽으로 굽어지는 길과 포드차"><image href="assets/backgrounds/coastal-road.png" width="1672" height="941"/><path id="coast-drive-b" d="${B}" fill="none" stroke="none"/><g data-car="coastFar"><image href="assets/backgrounds/ford-car.png" x="-105" y="-66" width="210" height="105"/></g></svg><div class="journey-mist far"></div></div>`,
    hotel:`<div class="journey-shot arrival-shot" data-shot="hotel"><svg viewBox="0 0 1672 941" preserveAspectRatio="xMidYMid meet" role="img" aria-label="호텔 앞 포장된 주차 진입로를 따라 들어와 멈추는 포드차"><image href="assets/backgrounds/hotel-exterior.png" width="1672" height="941"/><path id="hotel-parking-route" d="${HOTEL}" fill="none" stroke="none"/><g data-car="hotel"><ellipse cx="0" cy="5" rx="155" ry="17" fill="#17221b" opacity=".25"/><image href="assets/backgrounds/ford-car.png" x="-185" y="-168" width="370" height="185"/></g></svg></div>`
  };
  return `<section class="journey-screen" data-journey-route="${route}" aria-label="해안도로에서 호텔까지의 여정">
    <div class="journey-wash"></div>
    <div class="journey-film">
      ${sequence.map(shot=>panels[shot.kind]).join('')}
    </div>
    <div class="journey-letterbox top"></div><div class="journey-letterbox bottom"></div>
    <div class="journey-heading"><span class="journey-chapter">물안개 호텔 · 프롤로그</span><span data-journey-place>${sequence[0].eyebrow}</span></div>
    <div class="journey-caption"><span data-journey-caption>${sequence[0].caption}</span><div class="journey-progress" aria-label="프롤로그 진행"><span></span></div></div>
    <div class="journey-controls"><button type="button" data-act="journey-pause" aria-label="프롤로그 잠시 멈추기">잠시 멈춤</button><button type="button" data-act="journey-next">다음 장면</button><button type="button" data-act="journey-skip">건너뛰기</button></div>
  </section>`;
}

export function mountJourney(element,{onDone,audioContext,reduced=false,checkpoint=0,onCheckpoint}={}){
  if(!element)return null;
  const sequence=shotsForJourney(element.dataset.journeyRoute),duration=durationForJourney(element.dataset.journeyRoute);
  let elapsed=Math.min(Math.max(Number.isFinite(checkpoint)?checkpoint:0,0),duration-1),lastTime=0,frame=0,paused=!!reduced,alive=true,loaded=false,current=-1;
  let oscillator,gain,filter,noiseSource,noiseGain;
  const shots=[...element.querySelectorAll('[data-shot]')],paths={coast:element.querySelector('#coast-drive-a'),coastFar:element.querySelector('#coast-drive-b')};
  const caption=element.querySelector('[data-journey-caption]'),place=element.querySelector('[data-journey-place]'),progress=element.querySelector('.journey-progress span'),pauseButton=element.querySelector('[data-act="journey-pause"]');
  function audioStart(){
    if(oscillator||paused)return;
    const ctx=audioContext?.();if(!ctx)return;
    try{
      oscillator=ctx.createOscillator();gain=ctx.createGain();filter=ctx.createBiquadFilter();
      oscillator.type='sawtooth';oscillator.frequency.value=47;filter.type='lowpass';filter.frequency.value=115;gain.gain.value=.009;
      oscillator.connect(filter);filter.connect(gain);gain.connect(ctx.destination);oscillator.start();
      const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()-.5)*.22;
      noiseSource=ctx.createBufferSource();noiseSource.buffer=buffer;noiseSource.loop=true;noiseGain=ctx.createGain();noiseGain.gain.value=.018;noiseSource.connect(noiseGain);noiseGain.connect(ctx.destination);noiseSource.start();
    }catch{audioStop();}
  }
  function audioStop(){try{oscillator?.stop();noiseSource?.stop();oscillator?.disconnect();gain?.disconnect();noiseSource?.disconnect();noiseGain?.disconnect();filter?.disconnect();}catch{}oscillator=null;noiseSource=null;}
  function shotAt(time){let start=0;for(let i=0;i<sequence.length;i++){const shot=sequence[i];if(time<start+shot.duration)return {index:i,shot,start,ratio:(time-start)/shot.duration};start+=shot.duration;}return {index:sequence.length-1,shot:sequence.at(-1),start:duration-sequence.at(-1).duration,ratio:1};}
  function paint(){
    const {index,shot,ratio}=shotAt(elapsed);
    if(index!==current){current=index;onCheckpoint?.(elapsed);for(const el of shots)el.classList.toggle('active',el.dataset.shot===shot.kind);caption.textContent=shot.caption;place.textContent=shot.eyebrow;}
    progress.style.width=`${Math.min(elapsed/duration*100,100)}%`;
    element.dataset.shot=shot.kind;element.dataset.paused=String(paused);
    pauseButton.textContent=paused?'계속 보기':'잠시 멈춤';pauseButton.setAttribute('aria-label',paused?'프롤로그 계속 보기':'프롤로그 잠시 멈추기');
    if(shot.kind==='coast'||shot.kind==='coastFar'){
      const path=paths[shot.kind],length=path.getTotalLength(),t=reduced ? 0.46 : Math.max(.001,Math.min(.999,ratio));
      const p=path.getPointAtLength(length*t),p2=path.getPointAtLength(Math.min(length,length*t+4));
      let angle=Math.atan2(p2.y-p.y,p2.x-p.x)*180/Math.PI;const left=Math.cos(angle*Math.PI/180)<0;if(left)angle=angle>0?angle-180:angle+180;
      const size=shot.kind==='coast'?1.05-.65*t:.31-.12*t;
      const car=element.querySelector(`[data-car="${shot.kind}"]`);car.setAttribute('transform',`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${(angle*.42).toFixed(2)}) scale(${left?-size:size} ${size})`);
      car.style.opacity=String(reduced ? 1 : Math.min(1,Math.max(.15,ratio*12)));
    }
    const interior=element.querySelector('.interior-shot>img');if(interior)interior.style.transform=reduced?'none':`scale(1.035) translate(${Math.sin(elapsed*.0017)*.65}px,${Math.sin(elapsed*.008)*.9}px)`;
    if(shot.kind==='hotel'){
      const path=element.querySelector('#hotel-parking-route');
      const parkingProgress=reduced ? 1 : Math.min(1,ratio/.25);
      const eased=1-Math.pow(1-parkingProgress,3),p=path.getPointAtLength(path.getTotalLength()*eased);
      element.querySelector('[data-car="hotel"]').setAttribute('transform',`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
      element.dataset.arrivalParked=String(parkingProgress===1);
      if(parkingProgress===1)audioStop();
    }
    if(oscillator&&gain){const ctx=oscillator.context;oscillator.frequency.setTargetAtTime(45+Math.sin(elapsed*.0009)*5+(shot.kind==='interior'?4:0),ctx.currentTime,.1);gain.gain.setTargetAtTime(paused?0:.009,ctx.currentTime,.08);}
  }
  function tick(time){if(!alive)return;if(lastTime&&loaded&&!paused&&!document.hidden)elapsed+=Math.min(time-lastTime,120);lastTime=time;paint();if(elapsed>=duration){finish();return;}frame=requestAnimationFrame(tick);}
  function finish(){if(!alive)return;destroy();onDone?.();}
  function destroy(){if(!alive)return;alive=false;cancelAnimationFrame(frame);audioStop();}
  function toggle(){paused=!paused;lastTime=0;if(paused)audioStop();else audioStart();onCheckpoint?.(elapsed);paint();}
  function next(){if(!alive)return;const at=shotAt(elapsed);elapsed=at.start+at.shot.duration;if(elapsed>=duration)finish();else paint();}
  const sources=['coastal-road','ford-car','ford-interior','hotel-exterior'];
  Promise.allSettled(sources.map(key=>{const image=new Image();image.src=`assets/backgrounds/${key}.png`;return image.decode();})).then(()=>{if(!alive)return;loaded=true;audioStart();paint();});
  frame=requestAnimationFrame(tick);
  return {destroy,toggle,next,finish,get elapsed(){return elapsed;},get paused(){return paused;}};
}
