import './style.css';
import {chapters,locations} from './content.js';
import {createState,transition,readSave,writeSave} from './story.js';
import {createMap} from './map.js';
import {Soundtrack} from './music.js';

const $=s=>document.querySelector(s);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let storage;try{storage=window.localStorage}catch{}
const saved=readSave(storage);
let state=createState(saved),selected=state.chapter,typing=false,typeTimer,toastTimer,map;
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
  $('#places-dialog').close();
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
  $('#travel-subtitle').textContent=index===4?'沿着清晨的路，回到那间小屋。':'沿着记忆里的路，走向今夜。';
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
  currentImage='';reader.focus({preventScroll:true});renderLine();
}
let currentImage='';
function setBackground(name){
  if(currentImage===name)return;currentImage=name;
  const token=++imageToken,background=$('#scene-backdrop'),img=new Image();
  background.style.backgroundImage='none';
  img.onload=()=>{if(token===imageToken)background.style.backgroundImage=`url("${img.src}")`};
  img.onerror=()=>{if(token===imageToken)notify('背景暂时无法载入，文字阅读可继续。')};
  img.src=asset(name);
}
function showText(line,fraction=1){
  $('#dialogue-zh').textContent=line.text.slice(0,Math.ceil(line.text.length*fraction));
  $('#dialogue-en').textContent=line.en.slice(0,Math.ceil(line.en.length*fraction));
}
function finishTyping(){clearInterval(typeTimer);typing=false;showText(chapters[state.chapter].lines[state.line]);$('#dialogue').setAttribute('aria-busy','false');}
function renderLine(){
  clearInterval(typeTimer);const chapter=chapters[state.chapter],line=chapter.lines[state.line];
  setBackground(line.image||chapter.image);
  $('#reading-scene').textContent=`${line.section} / ${line.sectionEn}`;
  $('#previous-line').disabled=state.line===0;
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
function previousLine(){
  if(state.mode!=='reading')return;
  const previous=transition(state,{type:'PREVIOUS'});if(previous===state)return;
  state=previous;save();renderLine();finishTyping();
}
$('#start-story').onclick=()=>startChapter(selected);
$('#skip-travel').onclick=()=>{if(map)map.finishTravel();else arrive()};
$('#reset-view').onclick=()=>map?.reset();
$('#next-line').onclick=nextLine;
$('#previous-line').onclick=previousLine;
// Keep prose selectable: a double-click must never turn the page on its first click.
// Finish the typewriter before the browser begins a selection gesture.
$('#dialogue').onpointerdown=()=>{if(typing)finishTyping()};
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
$('#places-open').onclick=()=>showDialog($('#places-dialog'));
$('#reset-progress').onclick=()=>{$('#about-dialog').close();showDialog($('#reset-dialog'))};
$('#confirm-reset').onclick=()=>{$('#reset-dialog').close();state=transition(state,{type:'RESET'});selected=0;renderMap();notify('新的夜晚，从这里开始。');$('#start-story').focus()};
document.addEventListener('keydown',e=>{
  if(e.repeat||document.querySelector('dialog[open]'))return;
  if((e.code==='Space'||e.code==='ArrowRight'||e.code==='ArrowLeft')&&state.mode==='reading'){
    if(e.target.closest('button,a,input,select,textarea'))return;
    e.preventDefault();if(e.code==='ArrowLeft')previousLine();else nextLine();
  }
});
const music=new Soundtrack();
const musicButtons=[$('#sound'),$('#reader-sound')];
function updateMusicControls(){
  musicButtons.forEach((button,index)=>{button.setAttribute('aria-pressed',String(music.playing));button.setAttribute('aria-label',`${music.playing?'关闭':'开启'}${index?'阅读音乐':'环境音'}`)});
  $('#sound-label').textContent=music.playing?'音乐 · 开':'音乐 · 关';
  $('#reader-sound').textContent=music.playing?'Ⅱ':'♫';
}
async function toggleMusic(){
  musicButtons.forEach(button=>button.disabled=true);
  try{
    if(music.playing)await music.stop();else{await music.start();notify(music.volume===0?'音乐已开启；音量为零，可在阅读页调高。':'音乐已开启。若仍无声，请检查浏览器标签页静音和系统音量。')}
  }catch{notify('音乐未能启动，请再次点击播放；文字阅读可以继续。')}
  finally{updateMusicControls();musicButtons.forEach(button=>button.disabled=false);}
}
musicButtons.forEach(button=>button.onclick=toggleMusic);
$('#music-volume').oninput=e=>music.setVolume(Number(e.target.value)/100);
window.addEventListener('pagehide',()=>music.dispose().catch(()=>{}));
document.addEventListener('visibilitychange',()=>{map?.pause(document.hidden||state.mode==='reading'||state.mode==='end')});
renderMap();
if(saved?.editionUpdated)notify('故事已扩写：保留已解锁章节，从新的开场开始阅读。');
