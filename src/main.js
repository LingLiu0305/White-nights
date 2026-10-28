import '@fontsource-variable/nunito-sans';
import '@fontsource-variable/nunito-sans/wght-italic.css';
import '@fontsource/lilita-one/latin-400.css';
import '@fontsource/caveat/500.css';
import './style.css';
import './home.css';
import './reader-stage.css';
import './interaction-stage.css';
import {chapters,locations} from './content.js';
import {createState,transition,readSave,writeSave} from './story.js';
import {createMap} from './map.js';
import {interactionAt,pendingInteraction,interactionById,unlockedMemories,keepsakeCandidates} from './interactions.js';
import {createInteractionView} from './interaction-view.js';
import {memories,memoryAt} from './memories.js';
import {createMemoryView} from './memory-view.js';
import {Soundtrack} from './music.js';

const $=s=>document.querySelector(s);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let storage;try{storage=window.localStorage}catch{}
const saved=readSave(storage);
let state=createState(saved),selected=state.chapter,typing=false,typeTimer,toastTimer,map;
let imageToken=0,placeRequest=0;
const asset=name=>`${import.meta.env.BASE_URL}assets/${name}`;
const mapView=$('#map-view'),reader=$('#reader');
let memoryHistoryTrigger=null,memoryHistoryScroll=0;
const memoryView=createMemoryView({dialog:$('#memory-dialog'),getState:()=>state,dispatch,onReturn:()=>{if(memoryHistoryTrigger){const trigger=memoryHistoryTrigger;memoryHistoryTrigger=null;showDialog($('#history-dialog'));$('#history-content').scrollTop=memoryHistoryScroll;trigger.focus({preventScroll:true})}else $('#memory-open').focus({preventScroll:true})}});
const eventView=createInteractionView({dialog:$('#interaction-dialog'),getState:()=>state,dispatch,onFinish:finishInteraction,onSuspend:suspendInteraction,onMap:returnToMap});
// A missing portrait must never hide the speaker's name or interrupt the story.
document.querySelectorAll('.speaker-portrait img').forEach(img=>{
  img.addEventListener('error',()=>img.parentElement.classList.add('portrait-missing'));
  if(img.complete&&!img.naturalWidth)img.parentElement.classList.add('portrait-missing');
});
function notify(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,4200)}
function dispatch(event,persist=true){state=transition(state,event);if(persist)save()}
function save(){if(!writeSave(storage,state)){$('#save-status').hidden=false;$('#save-status').textContent='Progress cannot be saved on this device. You can still read.'}}
function showDialog(dialog){placeRequest++;map?.clearWalkKeys();dialog.showModal();}
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.querySelectorAll('.close-dialog,.close-dialog-inline').forEach(button=>button.onclick=()=>dialog.close());
  dialog.addEventListener('close',()=>{const active=document.activeElement;if(state.mode==='map'&&(!active||active===document.body||dialog.contains(active)))($('#map-canvas canvas')||$('#start-story')).focus({preventScroll:true})});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
});
function labelFor(index){return `${state.cursors[index]>0?'Continue':index<=state.completed?'Reread':'Begin'} ${chapters[index].labelEn}`;}
const sentenceCase=text=>text.charAt(0)+text.slice(1).toLowerCase();
function renderMap(){
  placeRequest++;
  mapView.hidden=false;mapView.inert=false;reader.hidden=true;$('#travel-overlay').hidden=true;
  document.body.classList.remove('is-reading','is-travelling');map?.pause(false);map?.setChapter(selected);
  const chapter=chapters[selected];
  mapView.dataset.chapterTint=chapter.tint;
  $('#chapter-label').textContent=chapter.labelEn;
  $('#chapter-title-en').textContent=sentenceCase(chapter.en);
  const start=$('#start-story');start.innerHTML=`${labelFor(selected)} <span aria-hidden="true">↗</span>`;start.disabled=false;
  $('#chapter-list').replaceChildren();
  chapters.forEach((c,index)=>{
    const button=document.createElement('button');button.className=`chapter-tab ${selected===index?'active':''}`;
    button.disabled=index>state.completed+1;button.setAttribute('aria-label',`${c.labelEn}: ${sentenceCase(c.en)}${button.disabled?', locked':''}`);
    button.setAttribute('aria-current',selected===index?'step':'false');
    button.innerHTML=`<span>${index===4?'Morning':`Night ${c.roman}`}</span><span class="chapter-state" aria-hidden="true">${index<=state.completed?'✓':''}</span>`;
    button.onclick=()=>{selected=index;renderMap()};$('#chapter-list').append(button);
  });
  updateMemoryMarkers();$('#memories-open').hidden=state.completed<4&&!Object.keys(state.keptLines).length;save();
}
function updateMemoryMarkers(){for(const place of locations){const latest=unlockedMemories(place.id,state.completed).at(-1);const button=$(`#place-buttons [data-place="${place.id}"]`);if(button){button.querySelector('.new-memory')?.remove();if(latest&&state.placeMemorySeen[place.id]!==latest.after){const small=document.createElement('small');small.className='new-memory';small.textContent='New memory';button.append(small)}}}}
function selectPlace(id){
  if(state.mode!=='map')return;
  const place=locations.find(l=>l.id===id);if(!place)return;
  const request=++placeRequest;
  $('#places-dialog').close();
  $('#place-en').textContent=sentenceCase(place.en);
  const memories=unlockedMemories(id,state.completed),latest=memories.at(-1);
  $('#place-description-en').textContent=latest?.text||place.descriptionEn;$('#place-note-en').textContent=latest?'A memory of these nights':place.noteEn;
  $('#earlier-memories').hidden=!memories.length;$('#earlier-memories').open=false;
  const history=$('#place-memory-history');history.replaceChildren();
  for(const text of [place.descriptionEn,...memories.slice(0,-1).map(m=>m.text)]){const p=document.createElement('p');p.textContent=text;history.append(p)}
  const button=$('#place-start');button.hidden=chapters[selected].place!==id;
  button.textContent=`${labelFor(selected)} ↗`;button.onclick=()=>{$('#location-dialog').close();startChapter(selected)};
  const open=()=>{if(request===placeRequest&&state.mode==='map'&&!document.querySelector('dialog[open]')){dispatch({type:'PLACE_READ',id});updateMemoryMarkers();showDialog($('#location-dialog'))}};
  if(map)map.focusPlace(id,open);else open();
}
for(const location of locations){
  const button=document.createElement('button');button.className='place-link';button.dataset.place=location.id;button.setAttribute('aria-label',`Place: ${sentenceCase(location.en)}`);
  button.innerHTML=`${sentenceCase(location.en)}<span class="place-arrow" aria-hidden="true">↗</span>`;
  button.onclick=()=>selectPlace(location.id);$('#place-buttons').append(button);
}
function fallback(){
  map?.pause(true);map=null;mapView.classList.remove('scene-entering');mapView.classList.add('intro-complete','has-fallback');
  $('#map-fallback').hidden=false;$('#map-canvas').hidden=true;$('#reset-view').hidden=true;$('#walk-status').hidden=true;
  document.querySelector('.map-hint').textContent='Open Places to explore';
}
map=createMap($('#map-canvas'),{initialPlayer:state.mapPlayer,onWalk:player=>{state=transition(state,{type:'PLAYER',player});save()},onSelect:selectPlace,onFail:fallback,onNearby:id=>{
  const status=$('#walk-status');status.hidden=!id;
  if(id)status.textContent=`${sentenceCase(locations.find(place=>place.id===id).en)} · Enter to ${chapters[selected].place===id?(selected===4?'return':'meet her'):'explore'}`;
}});
function startChapter(index){
  placeRequest++;
  const next=transition(state,{type:'START',chapter:index});if(next===state)return;
  state=next;selected=index;save();
  $('#travel-roman').textContent=chapters[index].roman;
  $('#travel-title').textContent=chapters[index].labelEn;
  $('#travel-subtitle').textContent=sentenceCase(chapters[index].en);
  $('#travel-overlay').hidden=false;mapView.inert=true;document.body.classList.add('is-travelling');
  $('#skip-travel').focus();
  if(map)map.travel(chapters[index].route,arrive);else queueMicrotask(arrive);
}
function arrive(){
  if(state.mode!=='travel')return;state=transition(state,{type:'ARRIVE'});save();
  map?.pause(true);$('#travel-overlay').hidden=true;mapView.hidden=true;reader.hidden=false;
  document.body.classList.remove('is-travelling');document.body.classList.add('is-reading');
  reader.dataset.tint=chapters[state.chapter].tint;
  $('#reader-chapter').textContent=chapters[state.chapter].labelEn;
  $('#reader-subtitle').textContent=sentenceCase(chapters[state.chapter].en);
  currentImage='';reader.focus({preventScroll:true});renderLine();if(state.activeInteraction)openInteraction(state.activeInteraction.id);
}
let currentImage='';
function setBackground(name){
  if(currentImage===name)return;currentImage=name;
  const token=++imageToken,background=$('#scene-backdrop'),img=new Image();
  background.style.backgroundImage='none';
  img.onload=()=>{if(token===imageToken)background.style.backgroundImage=`url("${img.src}")`};
  img.onerror=()=>{if(token===imageToken)notify('The illustration could not load. You can keep reading.')};
  img.src=asset(name);
}
const speakerName=line=>line.speakerEn==='Inner voice'?'The Dreamer':line.speakerEn;
function showText(line,fraction=1){
  $('#dialogue-en').textContent=line.en.slice(0,Math.ceil(line.en.length*fraction));
}
function finishTyping(){clearInterval(typeTimer);typing=false;showText(chapters[state.chapter].lines[state.line]);$('#dialogue').setAttribute('aria-busy','false');$('#memory-open').disabled=false;}
function renderLine(){
  clearInterval(typeTimer);const chapter=chapters[state.chapter],line=chapter.lines[state.line];
  setBackground(line.image||chapter.image);
  $('#reading-scene').textContent=line.sectionEn;
  $('#previous-line').disabled=state.line===0;
  $('#chapter-end').hidden=true;$('#reading-deck').hidden=false;
  const voice=line.speakerEn==='The Dreamer'?'left':['The young woman','Nastenka'].includes(line.speakerEn)?'right':'narration';
  $('#reading-deck').dataset.voice=voice;
  $('#portrait-left').hidden=voice!=='left';$('#portrait-right').hidden=voice!=='right';
  $('#right-speaker-name').textContent=line.speakerEn;
  $('#speaker').textContent=speakerName(line);$('#speaker').hidden=line.speakerEn==='Narration';
  $('#line-count').textContent=`${String(state.line+1).padStart(2,'0')} / ${String(chapter.lines.length).padStart(2,'0')}`;
  $('#reading-progress').style.width=`${(state.line+1)/chapter.lines.length*100}%`;
  $('#dialogue').classList.toggle('inner-voice',line.speakerEn==='Inner voice');
  $('#dialogue-measure').textContent=line.en;
  $('#dialogue').scrollTop=0;
  const memory=memoryAt(chapter.id,line.id);$('#memory-open').hidden=!memory;$('#memory-open').disabled=!!memory&&!reduced;$('#memory-open').onclick=()=>{if(memory){memoryHistoryTrigger=null;memoryView.open(memory.id)}};
  const letterMoment=chapter.id==='morning'&&line.speakerEn==='Nastenka’s letter'?interactionById(line.id==='morning-p006'?'morning-letter-return':'morning-read-letter'):null;
  const moment=interactionAt(chapter.id,line.id)||letterMoment,record=moment&&state.interactions[moment.id];
  $('#replay-interaction').classList.toggle('letter-reopen',!!letterMoment);$('#replay-interaction').hidden=!record&&!letterMoment;$('#replay-interaction').textContent=letterMoment?'Open the letter ↗':record?.status==='active'?'Resume this moment ↗':'Replay this moment ↗';
  $('#replay-interaction').onclick=()=>{finishTyping();openInteraction(moment.id,!!letterMoment||record?.status!=='active')};
  if(reduced){finishTyping();return;}
  let count=0;typing=true;showText(line,0);$('#dialogue').setAttribute('aria-busy','true');
  typeTimer=setInterval(()=>{count+=4;showText(line,Math.min(count/line.en.length,1));if(count>=line.en.length)finishTyping()},28);
}
function nextLine(){
  if(state.mode!=='reading')return;
  if(typing){finishTyping();return;}
  const pending=pendingInteraction(state,chapters[state.chapter].id,chapters[state.chapter].lines[state.line].id);
  if(pending){openInteraction(pending.id);return;}
  state=transition(state,{type:'NEXT'});save();
  if(state.mode==='end'){
    $('#reading-deck').hidden=true;$('#chapter-end').hidden=false;
    $('#end-label').textContent=`End of ${chapters[state.chapter].labelEn}`;
    $('#end-title-en').textContent=chapters[state.chapter].endingEn;
    renderKeepsakes();$('#end-memories').hidden=state.completed<4;$('#end-map').focus({preventScroll:true});
  }else renderLine();
}
function openInteraction(id,replay=false){
  dispatch({type:'INTERACTION_OPEN',id,replay});
  if(state.mode!=='interaction')return;
  clearInterval(typeTimer);typing=false;
  map?.clearWalkKeys();$('#reading-deck').hidden=true;eventView.render();
  if(id==='n4-footsteps'&&state.activeInteraction.phase==='observe')music.footsteps();
}
function finishInteraction(id,options){
  const before=state;dispatch({type:'INTERACTION_FINISH',id,...options});if(state===before)return;
  eventView.close();renderLine();reader.focus({preventScroll:true});
}
function suspendInteraction(){
  dispatch({type:'INTERACTION_SUSPEND'});eventView.close();renderLine();finishTyping();$('#replay-interaction').focus();
}
function returnToMap(){
  eventView.close();
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
$('#reset-view').onclick=()=>{placeRequest++;map?.reset()};
$('#next-line').onclick=nextLine;
$('#previous-line').onclick=previousLine;
// Keep prose selectable: a double-click must never turn the page on its first click.
// Finish the typewriter before the browser begins a selection gesture.
$('#dialogue').onpointerdown=()=>{if(typing)finishTyping()};
$('#back-map').onclick=returnToMap;$('#end-map').onclick=returnToMap;
$('#history-open').onclick=()=>{
  const content=$('#history-content');content.replaceChildren();
  chapters[state.chapter].lines.slice(0,Math.max(state.line,state.readThrough[state.chapter])+1).forEach(line=>{
    const section=document.createElement('section'),name=document.createElement('small'),english=document.createElement('p');
    name.textContent=speakerName(line);
    english.textContent=line.en;english.lang='en';
    if(line.speakerEn!=='Narration')section.append(name);
    section.append(english);
    const memory=memoryAt(chapters[state.chapter].id,line.id);
    if(memory&&Object.hasOwn(state.memories,memory.id)){const button=document.createElement('button');button.className='history-memory';button.textContent='Revisit her memory ↗';button.onclick=()=>{memoryHistoryTrigger=button;memoryHistoryScroll=content.scrollTop;$('#history-dialog').close();memoryView.open(memory.id)};section.append(button)}
    const response=interactionAt(chapters[state.chapter].id,line.id);const choice=state.interactions[response?.id]?.choice;
    if(response?.kind==='choice'&&choice){const paragraph=document.createElement('p');paragraph.className='history-response';paragraph.textContent=response.choices.find(c=>c.id===choice)?.response||'';section.append(paragraph)}
    content.append(section);
  });
  showDialog($('#history-dialog'));content.scrollTop=content.scrollHeight;
};
function makeKeepsakeChoices(chapterIndex,container,onSelect){
  const chapter=chapters[chapterIndex];container.replaceChildren();
  for(const id of keepsakeCandidates[chapter.id]){
    const line=chapter.lines.find(l=>l.id===id),button=document.createElement('button');
    button.className='keepsake-choice';button.textContent=line.en;
    button.setAttribute('aria-pressed',String(state.keptLines[chapter.id]===id));
    button.onclick=()=>{dispatch({type:'KEEP_LINE',chapterId:chapter.id,lineId:id});onSelect()};container.append(button);
  }
}
function renderKeepsakes(){
  makeKeepsakeChoices(state.chapter,$('#keepsake-choices'),()=>{renderKeepsakes();$('#keepsake-choices [aria-pressed="true"]').focus({preventScroll:true})});
  $('#keepsake-status').textContent=state.keptLines[chapters[state.chapter].id]?'Kept for you. Choose another to replace it.':'';
}
function renderMemories(){
 const container=$('#memories-content');container.replaceChildren();
 $('#memories-empty').hidden=Object.keys(state.keptLines).length>0;
 for(const [chapterId,lineId] of Object.entries(state.keptLines)){
  const ci=chapters.findIndex(c=>c.id===chapterId),chapter=chapters[ci];
  const section=document.createElement('section'),title=document.createElement('h3'),quote=document.createElement('blockquote'),edit=document.createElement('details'),summary=document.createElement('summary'),options=document.createElement('div');
  title.textContent=chapter.labelEn;quote.textContent=chapter.lines.find(l=>l.id===lineId).en;summary.textContent='Choose another sentence';edit.append(summary,options);
  makeKeepsakeChoices(ci,options,()=>{quote.textContent=chapter.lines.find(l=>l.id===state.keptLines[chapterId]).en;makeKeepsakeChoices(ci,options,()=>renderMemories());edit.open=false;summary.focus()});
  section.append(title,quote,edit);container.append(section);
 }
}
function openMemories(){renderMemories();showDialog($('#memories-dialog'))}
$('#memories-open').onclick=openMemories;$('#end-memories').onclick=openMemories;
$('#about-open').onclick=()=>showDialog($('#about-dialog'));
$('#places-open').onclick=()=>showDialog($('#places-dialog'));
$('#reset-progress').onclick=()=>{$('#about-dialog').close();showDialog($('#reset-dialog'))};
$('#restart-story-home').onclick=()=>showDialog($('#reset-dialog'));
$('#confirm-reset').onclick=()=>{$('#reset-dialog').close();state=transition(state,{type:'RESET'});selected=0;map?.resetStory();renderMap();notify('A new beginning.');openIntro()};
document.addEventListener('keydown',e=>{
  if(document.querySelector('dialog[open]'))return;
  if(state.mode==='map'&&map&&e.target.matches('#map-canvas canvas')){
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){
      e.preventDefault();map.setWalkKey(e.code,true);return;
    }
    if(e.code==='Enter'&&!e.repeat&&!e.target.closest('button,a')){
      if(map.exploreNearby())e.preventDefault();return;
    }
  }
  if(e.repeat)return;
  if((e.code==='Space'||e.code==='ArrowRight'||e.code==='ArrowLeft')&&state.mode==='reading'){
    if(e.target.closest('button,a,input,select,textarea'))return;
    e.preventDefault();if(e.code==='ArrowLeft')previousLine();else nextLine();
  }
});
document.addEventListener('keyup',e=>{if(e.code.startsWith('Arrow'))map?.setWalkKey(e.code,false)});
document.addEventListener('focusin',e=>{if(!e.target.matches('#map-canvas canvas'))map?.clearWalkKeys()});
window.addEventListener('blur',()=>map?.clearWalkKeys());
document.addEventListener('visibilitychange',()=>{if(document.hidden)map?.clearWalkKeys()});
const music=new Soundtrack();
const musicButtons=[$('#sound'),$('#reader-sound'),$('#intro-sound')];
function updateMusicControls(){
  musicButtons.forEach((button,index)=>{button.setAttribute('aria-pressed',String(music.playing));button.setAttribute('aria-label',`${music.playing?'Pause':'Play'} ${index?'reading music':'music'}`)});
  $('#intro-sound').textContent=music.playing?'Sound on':'Sound off';
  $('#sound-label').textContent=music.playing?'Sound on':'Sound off';
  $('#reader-sound').textContent=music.playing?'Pause':'Sound';
}
async function toggleMusic(){
  musicButtons.forEach(button=>button.disabled=true);
  try{
    if(music.playing)await music.stop();else{await music.start();notify(music.volume===0?'Music is on at zero volume. Adjust it in the reader.':'Music is on.')}
  }catch{notify('Music could not start. Please try again.')}
  finally{updateMusicControls();musicButtons.forEach(button=>button.disabled=false);}
}
musicButtons.forEach(button=>button.onclick=toggleMusic);
$('#music-volume').oninput=e=>music.setVolume(Number(e.target.value)/100);
window.addEventListener('pagehide',()=>{map?.clearWalkKeys();save();music.dispose().catch(()=>{})});
document.addEventListener('visibilitychange',()=>{map?.pause(document.hidden||!['map','intro'].includes(state.mode))});
function openIntro(){
  state=transition(state,{type:'INTRO'});map?.clearWalkKeys();
  mapView.classList.add('intro-complete');document.body.classList.add('showing-intro');
  $('#intro-dialog').showModal();$('#intro-title').focus();
}
function closeIntro(){
  $('#intro-dialog').close();document.body.classList.remove('showing-intro');
  state=transition(state,{type:'INTRO_DONE'});renderMap();
  notify('Use the arrow keys to walk. Press Enter near a place to explore.');
  ($('#map-canvas canvas')||$('#start-story')).focus({preventScroll:true});
}
$('#intro-enter').onclick=closeIntro;$('#intro-skip').onclick=closeIntro;
$('#intro-dialog').addEventListener('cancel',e=>{e.preventDefault();closeIntro()});
$('#intro-dialog').onclick=e=>e.stopPropagation();
$('#intro-replay').onclick=()=>{$('#about-dialog').close();openIntro()};
renderMap();
if(!state.introSeen)openIntro();
if(map&&state.introSeen){mapView.classList.add('scene-entering');map.introduce(()=>{mapView.classList.remove('scene-entering');mapView.classList.add('intro-complete')})}
if(saved?.editionUpdated)notify('Expanded story: your unlocked chapters are kept.');
