import {chapters} from './content.js';
import {interactionById} from './interactions.js';
const asset=name=>`${import.meta.env.BASE_URL}assets/${name}`;
// This view owns no story position. Every meaningful action goes through the reducer.
export function createInteractionView({dialog,getState,dispatch,onFinish,onSuspend,onMap}){
 const $=s=>dialog.querySelector(s);
 let current=null,scrollTimer;
 function positionHotspots(){
  const img=$('.event-image'),layer=$('.event-scene');if(!img.naturalWidth)return;
  const scale=Math.max(layer.clientWidth/img.naturalWidth,layer.clientHeight/img.naturalHeight);
  const ox=(layer.clientWidth-img.naturalWidth*scale)/2,oy=(layer.clientHeight-img.naturalHeight*scale)/2;
  dialog.querySelectorAll('.event-hotspot').forEach(button=>{
   const x=ox+Number(button.dataset.x)*img.naturalWidth*scale,y=oy+Number(button.dataset.y)*img.naturalHeight*scale;
   button.style.left=`${x}px`;button.style.top=`${y}px`;button.hidden=x<24||y<100||x>layer.clientWidth-24||y>layer.clientHeight-24;
  });
 }
 const observer=new ResizeObserver(positionHotspots);observer.observe($('.event-scene'));
 $('.event-image').onload=positionHotspots;
 $('.event-image').onerror=()=>{$('.event-image').hidden=true;$('.event-image-status').hidden=false;};
 function selectObject(object){
  if(getState().mode!=='interaction')return;
  dispatch({type:'INTERACTION_OBJECT',object:object.id});
  $('#event-object-name').textContent=object.name;$('#event-object-text').textContent=object.text;
  dialog.querySelectorAll('[data-object]').forEach(button=>{const active=button.dataset.object===object.id;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));});
  for(const button of dialog.querySelectorAll('.event-object-list button')){
   const seen=getState().interactions[current.id].seen.includes(button.dataset.object);
   button.querySelector('small').textContent=seen?'Look again':'Observe';
  }
 }
 function render(){
  const state=getState(),a=state.activeInteraction;current=interactionById(a?.id);if(!current)return;
  clearTimeout(scrollTimer);dialog.dataset.kind=current.kind;dialog.dataset.phase=a.phase;
  $('#event-title').textContent=current.title;$('#event-hint').textContent=current.hint||'Morning · A letter';
  const img=$('.event-image');img.hidden=false;$('.event-image-status').hidden=true;
  const src=asset(current.image||'morning-room.png');if(img.getAttribute('src')!==src)img.src=src;
  $('#event-observe').hidden=current.kind!=='observe';$('#event-letter').hidden=current.kind!=='letter';
  $('#event-action-stage').hidden=!['accept','turn'].includes(current.kind);
  $('#event-dialogue').hidden=current.kind!=='letter'||a.replay;
  $('#event-continue').textContent=a.replay?'Return to reading':current.kind==='letter'?(current.id==='morning-read-letter'?'Continue reading':'Fold the letter'):'Continue story';
  $('#event-continue').hidden=current.kind==='letter'&&a.phase==='envelope';
  $('#event-skip').hidden=a.replay||current.kind==='letter';
  const layer=$('.event-hotspots');layer.replaceChildren();$('.event-object-list').replaceChildren();
  if(current.kind==='observe'){
   $('#event-object-name').textContent='A moment to notice';$('#event-object-text').textContent='Choose a detail in the scene, or continue whenever you are ready.';
   for(const object of current.objects){
    const hotspot=document.createElement('button');hotspot.className='event-hotspot';hotspot.dataset.x=object.x;hotspot.dataset.y=object.y;hotspot.dataset.object=object.id;
    hotspot.setAttribute('aria-label',`Observe ${object.name.toLowerCase()}`);hotspot.setAttribute('aria-pressed','false');hotspot.innerHTML='<span aria-hidden="true">◇</span>';
    const label=document.createElement('span');label.className='hotspot-label';label.textContent=object.name;hotspot.append(label);hotspot.onclick=()=>selectObject(object);layer.append(hotspot);
    const button=document.createElement('button');button.dataset.object=object.id;button.setAttribute('aria-pressed','false');
    const name=document.createElement('span');name.textContent=object.name;const small=document.createElement('small');small.textContent=state.interactions[current.id]?.seen.includes(object.id)?'Look again':'Observe';
    button.append(name,small);button.onclick=()=>selectObject(object);$('.event-object-list').append(button);
   }
  }
  if(current.kind==='letter'){
   $('#open-letter').hidden=a.phase!=='envelope';$('#letter-paper').hidden=a.phase!=='paper';
   $('.letter-signature').hidden=current.id!=='morning-letter-return';
   const body=$('#letter-body');body.replaceChildren();
   for(const id of current.paragraphs){const p=document.createElement('p');p.textContent=chapters[state.chapter].lines.find(line=>line.id===id).en;body.append(p);}
   requestAnimationFrame(()=>{if(getState().activeInteraction?.id===current?.id)$('#letter-paper').scrollTop=a.scrollRatio*($('#letter-paper').scrollHeight-$('#letter-paper').clientHeight)});
  }
  if(current.kind==='accept'||current.kind==='turn'){
   $('#event-hint').textContent=current.hint;
   $('#event-action').textContent=current.kind==='accept'?'Take the letter':'Look toward the footsteps';
   $('#event-action').className=current.kind==='accept'?'envelope-button':'attention-button';
   $('#event-figure').hidden=current.kind!=='turn';
   $('#event-continue').hidden=true;
  }
  if(!dialog.open)dialog.showModal();
  positionHotspots();$('#event-title').focus({preventScroll:true});
 }
 $('#open-letter').onclick=()=>{dispatch({type:'INTERACTION_PHASE',phase:'paper'});render();$('#letter-paper').focus()};
 $('#event-continue').onclick=()=>onFinish(current.id,{});
 $('#event-skip').onclick=()=>onFinish(current.id,{skip:true});
 $('#event-dialogue').onclick=()=>onFinish(current.id,{dialogue:true});
 $('#event-pause').onclick=onSuspend;$('#event-map').onclick=onMap;
 $('#event-action').onclick=()=>onFinish(current.id,{});
 dialog.addEventListener('cancel',event=>{event.preventDefault();onSuspend()});
 $('#letter-paper').onscroll=()=>{clearTimeout(scrollTimer);const el=$('#letter-paper');const ratio=el.scrollTop/Math.max(1,el.scrollHeight-el.clientHeight);dispatch({type:'INTERACTION_SCROLL',ratio},false);scrollTimer=setTimeout(()=>dispatch({type:'INTERACTION_SCROLL',ratio}),200)};
 return {render,close(){clearTimeout(scrollTimer);dialog.close();current=null;},destroy(){observer.disconnect()}};
}
