import {memoryById} from './memories.js';
const asset=name=>`${import.meta.env.BASE_URL}assets/${name}`;
export function createMemoryView({dialog,getState,dispatch,onReturn}){
 const $=s=>dialog.querySelector(s);let current=null;
 function position(){
  const img=$('#memory-image'),stage=$('.memory-scene');if(!img.naturalWidth)return;
  const scale=Math.max(stage.clientWidth/img.naturalWidth,stage.clientHeight/img.naturalHeight);
  const ox=(stage.clientWidth-img.naturalWidth*scale)/2,oy=(stage.clientHeight-img.naturalHeight*scale)/2;
  dialog.querySelectorAll('.memory-hotspot').forEach(el=>{let x=ox+Number(el.dataset.x)*img.naturalWidth*scale,y=oy+Number(el.dataset.y)*img.naturalHeight*scale;el.style.left=`${x}px`;el.style.top=`${y}px`;el.hidden=x<25||x>stage.clientWidth-25||y<120||y>stage.clientHeight-25});
 }
 const observer=new ResizeObserver(position);observer.observe($('.memory-scene'));
 const img=$('#memory-image');img.onload=position;img.onerror=()=>{img.hidden=true;$('#memory-image-status').hidden=false};
 function choose(object){
  dispatch({type:'MEMORY_SEEN',id:current.id,object:object.id});
  $('#memory-response h3').textContent=object.name;$('#memory-response p').textContent=object.text;
  dialog.querySelectorAll('[data-memory-object]').forEach(el=>{el.classList.toggle('selected',el.dataset.memoryObject===object.id);el.setAttribute('aria-pressed',String(el.dataset.memoryObject===object.id))});
  for(const el of dialog.querySelectorAll('#memory-objects button'))el.querySelector('small').textContent=getState().memories[current.id]?.includes(el.dataset.memoryObject)?'Look again':'Observe';
 }
 function open(id){
  current=memoryById(id);if(!current)return;
  dispatch({type:'MEMORY_SEEN',id});img.hidden=false;$('#memory-image-status').hidden=true;img.src=asset(current.image);
  $('#memory-title').textContent=current.title;$('#memory-response h3').textContent='A moment from her past';$('#memory-response p').textContent='Choose a detail to look closer, or return to her story.';
  $('#memory-hotspots').replaceChildren();$('#memory-objects').replaceChildren();
  for(const object of current.objects){
   const button=document.createElement('button');button.className='memory-hotspot';button.dataset.x=object.x;button.dataset.y=object.y;button.dataset.memoryObject=object.id;button.setAttribute('aria-label',`Observe ${object.name}`);button.setAttribute('aria-pressed','false');button.textContent='◇';button.onclick=()=>choose(object);$('#memory-hotspots').append(button);
   const item=document.createElement('button');item.dataset.memoryObject=object.id;item.setAttribute('aria-pressed','false');const name=document.createElement('span'),small=document.createElement('small');name.textContent=object.name;small.textContent=getState().memories[current.id]?.includes(object.id)?'Look again':'Observe';item.append(name,small);item.onclick=()=>choose(object);$('#memory-objects').append(item);
  }
  if(!dialog.open)dialog.showModal();position();$('#memory-title').focus({preventScroll:true});
 }
 $('#memory-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{current=null;onReturn()});
 return {open};
}
