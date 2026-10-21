import './style.css';
import {chapters,locations} from './content.js';
import {createState,transition,readSave,writeSave} from './story.js';
import {createMap} from './map.js';

const $=s=>document.querySelector(s);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let storage;try{storage=window.localStorage}catch{}
let state=createState(readSave(storage)),selected=state.chapter,typing=false,typeTimer,toastTimer,map;
let imageToken=0;
const asset=name=>`${import.meta.env.BASE_URL}assets/${name}`;
const mapView=$('#map-view'),reader=$('#reader');
function notify(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,4200)}
function save(){if(!writeSave(storage,state))$('#save-status').textContent='本机暂时无法保存进度，本次阅读仍可继续。'}
function showDialog(dialog){dialog.showModal();}
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.querySelectorAll('.close-dialog,.close-dialog-inline').forEach(button=>button.onclick=()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
});
function labelFor(index){return `${state.cursors[index]>0?'继续':index<=state.completed?'重读':'开始'}${chapters[index].label}`;}
function renderMap(){
  mapView.hidden=false;mapView.inert=false;reader.hidden=true;$('#travel-overlay').hidden=true;
  document.body.classList.remove('is-reading','is-travelling');map?.pause(false);map?.setChapter(selected);
  const chapter=chapters[selected];
  $('#chapter-number').textContent=String(selected+1).padStart(2,'0');
  $('#chapter-label').textContent=chapter.label;$('#chapter-title').textContent=chapter.title;
  $('#chapter-title-en').textContent=chapter.en;
  const start=$('#start-story');start.innerHTML=`${labelFor(selected)} <span aria-hidden="true">↗</span>`;start.disabled=false;
  $('#chapter-list').replaceChildren();
  chapters.forEach((c,index)=>{
    const button=document.createElement('button');button.className=`chapter-tab ${selected===index?'active':''}`;
    button.disabled=index>state.completed+1;button.setAttribute('aria-label',`${c.label}：${c.title}${button.disabled?'，尚未解锁':''}`);
    button.setAttribute('aria-current',selected===index?'step':'false');
    button.innerHTML=`<span class="chapter-roman">${c.roman}</span><span class="chapter-tab-copy"><strong>${c.label}</strong><small>${c.title}</small></span><span class="chapter-state">${index<=state.completed?'✓':button.disabled?'·':'↗'}</span>`;
    button.onclick=()=>{selected=index;renderMap()};$('#chapter-list').append(button);
  });
  save();
}
function selectPlace(id){
  if(state.mode!=='map')return;
  const place=locations.find(l=>l.id===id);if(!place)return;
  $('#place-en').textContent=`${place.number} / ${place.en}`;$('#place-name').textContent=place.name;
  $('#place-description').textContent=place.description;$('#place-note').textContent=place.note;
  $('#place-description-en').textContent=place.descriptionEn;$('#place-note-en').textContent=place.noteEn;
  const button=$('#place-start');button.hidden=chapters[selected].place!==id;
  button.textContent=`走进${chapters[selected].label} ↗`;button.onclick=()=>{$('#location-dialog').close();startChapter(selected)};
  showDialog($('#location-dialog'));
}
for(const location of locations){
  const button=document.createElement('button');button.className='place-link';button.setAttribute('aria-label',`地点：${location.name}`);
  button.innerHTML=`<span>${location.number}</span>${location.name}<span class="place-arrow">↗</span>`;
  button.onclick=()=>selectPlace(location.id);$('#place-buttons').append(button);
}
function fallback(){
  map?.pause(true);map=null;
  $('#map-fallback').hidden=false;$('#map-canvas').hidden=true;$('#reset-view').hidden=true;
  document.querySelector('.map-hint').textContent='点击下方地点按钮探索故事';
}
map=createMap($('#map-canvas'),{onSelect:selectPlace,onFail:fallback});
function startChapter(index){
  const next=transition(state,{type:'START',chapter:index});if(next===state)return;
  state=next;selected=index;save();
  $('#travel-roman').textContent=chapters[index].roman;$('#travel-title').textContent=chapters[index].label;
  $('#travel-overlay').hidden=false;mapView.inert=true;document.body.classList.add('is-travelling');
  $('#skip-travel').focus();
  if(map)map.travel(chapters[index].route,arrive);else queueMicrotask(arrive);
}
function arrive(){
  if(state.mode!=='travel')return;state=transition(state,{type:'ARRIVE'});save();
  map?.pause(true);$('#travel-overlay').hidden=true;mapView.hidden=true;reader.hidden=false;
  document.body.classList.remove('is-travelling');document.body.classList.add('is-reading');
  reader.dataset.tint=chapters[state.chapter].tint;
  $('#reader-chapter').textContent=`${chapters[state.chapter].label} · ${chapters[state.chapter].title}`;
  $('#reader-subtitle').textContent=`${chapters[state.chapter].labelEn} · ${chapters[state.chapter].en}`;
  const token=++imageToken,background=$('#scene-backdrop'),img=new Image();
  background.style.backgroundImage='none';
  img.onload=()=>{if(token===imageToken)background.style.backgroundImage=`url("${img.src}")`};
  img.onerror=()=>{if(token===imageToken)notify('背景暂时无法载入，文字阅读可继续。')};
  img.src=asset(chapters[state.chapter].image);
  reader.focus({preventScroll:true});renderLine();
}
function showText(line,fraction=1){
  $('#dialogue-zh').textContent=line.text.slice(0,Math.ceil(line.text.length*fraction));
  $('#dialogue-en').textContent=line.en.slice(0,Math.ceil(line.en.length*fraction));
}
function finishTyping(){clearInterval(typeTimer);typing=false;showText(chapters[state.chapter].lines[state.line]);$('#dialogue').setAttribute('aria-busy','false');}
function renderLine(){
  clearInterval(typeTimer);const chapter=chapters[state.chapter],line=chapter.lines[state.line];
  $('#chapter-end').hidden=true;$('#dialogue-wrap').hidden=false;
  $('#speaker').textContent=`${line.speaker} · ${line.speakerEn}`;$('#speaker').dataset.kind=['独白','旁白'].includes(line.speaker)?'narration':'dialogue';
  $('#line-count').textContent=`${String(state.line+1).padStart(2,'0')} / ${String(chapter.lines.length).padStart(2,'0')}`;
  $('#reading-progress').style.width=`${(state.line+1)/chapter.lines.length*100}%`;
  $('#silhouettes').dataset.visual=line.visual;
  $('#dialogue').classList.toggle('inner-voice',line.speaker==='独白');
  $('#dialogue').scrollTop=0;
  if(reduced){finishTyping();return;}
  let count=0;typing=true;showText(line,0);$('#dialogue').setAttribute('aria-busy','true');
  typeTimer=setInterval(()=>{count+=2;showText(line,Math.min(count/line.text.length,1));if(count>=line.text.length)finishTyping()},28);
}
function nextLine(){
  if(state.mode!=='reading')return;
  if(typing){finishTyping();return;}
  state=transition(state,{type:'NEXT'});save();
  if(state.mode==='end'){
    $('#dialogue-wrap').hidden=true;$('#chapter-end').hidden=false;$('#silhouettes').dataset.visual='empty';
    $('#end-label').textContent=`${chapters[state.chapter].label} · 终`;
    $('#end-title').textContent=chapters[state.chapter].ending;
    $('#end-title-en').textContent=chapters[state.chapter].endingEn;
    $('#end-map').focus({preventScroll:true});
  }else renderLine();
}
function returnToMap(){
  clearInterval(typeTimer);typing=false;state=transition(state,{type:'MAP'});selected=state.chapter;
  renderMap();$('#start-story').focus({preventScroll:true});
}
$('#start-story').onclick=()=>startChapter(selected);
$('#skip-travel').onclick=()=>{if(map)map.finishTravel();else arrive()};
$('#reset-view').onclick=()=>map?.reset();
$('#next-line').onclick=nextLine;
$('#dialogue').onclick=nextLine;
$('#back-map').onclick=returnToMap;$('#end-map').onclick=returnToMap;
$('#history-open').onclick=()=>{
  const content=$('#history-content');content.replaceChildren();
  chapters[state.chapter].lines.slice(0,state.line+1).forEach(line=>{
    const section=document.createElement('section'),name=document.createElement('small'),text=document.createElement('p'),english=document.createElement('p');
    name.textContent=`${line.speaker} · ${line.speakerEn}`;text.textContent=line.text;text.lang='zh-CN';
    english.textContent=line.en;english.lang='en';english.className='translation';
    section.append(name,text,english);content.append(section);
  });
  showDialog($('#history-dialog'));content.scrollTop=content.scrollHeight;
};
$('#about-open').onclick=()=>showDialog($('#about-dialog'));
$('#reset-progress').onclick=()=>{$('#about-dialog').close();showDialog($('#reset-dialog'))};
$('#confirm-reset').onclick=()=>{$('#reset-dialog').close();state=transition(state,{type:'RESET'});selected=0;renderMap();notify('新的夜晚，从这里开始。');$('#start-story').focus()};
document.addEventListener('keydown',e=>{
  if(e.repeat||document.querySelector('dialog[open]'))return;
  if((e.code==='Space'||e.code==='ArrowRight')&&state.mode==='reading'){
    if(e.target.closest('button,a,input,select,textarea'))return;
    e.preventDefault();nextLine();
  }
});
// User-initiated ambient chord. Audio is synthesized locally; no recordings are used.
let audio=null;
$('#sound').onclick=async()=>{
  const button=$('#sound');button.disabled=true;
  try{
    if(audio){await audio.close();audio=null;button.setAttribute('aria-pressed','false');button.setAttribute('aria-label','开启环境音');$('#sound-label').textContent='环境音 · 关';}
    else{
      const Context=window.AudioContext||window.webkitAudioContext;audio=new Context();await audio.resume();
      const gain=audio.createGain();gain.gain.setValueAtTime(0,audio.currentTime);gain.gain.linearRampToValueAtTime(.025,audio.currentTime+2);gain.connect(audio.destination);
      [110,164.81,220].forEach((frequency,i)=>{const osc=audio.createOscillator();osc.frequency.value=frequency;osc.detune.value=i*2-2;osc.connect(gain);osc.start()});
      button.setAttribute('aria-pressed','true');button.setAttribute('aria-label','关闭环境音');$('#sound-label').textContent='环境音 · 开';
    }
  }catch{if(audio)await audio.close().catch(()=>{});audio=null;notify('此浏览器暂时无法播放声音，故事可继续阅读。')}
  finally{button.disabled=false;}
};
document.addEventListener('visibilitychange',()=>{map?.pause(document.hidden||state.mode==='reading'||state.mode==='end')});
renderMap();
