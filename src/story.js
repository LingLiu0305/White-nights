import { chapters } from './content.js';
export const SAVE_KEY = 'white-nights-progress-v1';
export const TEXT_REVISION = 2;
const integerIn=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
export function createState(saved) {
  const completed=integerIn(saved?.completed,-1,chapters.length-1)?saved.completed:-1;
  const chapter=integerIn(saved?.chapter,0,Math.min(completed+1,chapters.length-1))?saved.chapter:0;
  const line=integerIn(saved?.line,0,chapters[chapter].lines.length-1)?saved.line:0;
  const cursors=chapters.map((c,index)=>{
    if(index>completed+1)return 0;
    const cursor=saved?.cursors?.[index];
    return integerIn(cursor,0,c.lines.length-1)?cursor:index===chapter?line:0;
  });
  return {chapter,line:cursors[chapter],cursors,completed,mode:'map',textRevision:TEXT_REVISION};
}
export function transition(state,event) {
  switch(event.type) {
    case 'START': {
      const chapter=event.chapter;
      if(state.mode!=='map'||!integerIn(chapter,0,Math.min(state.completed+1,chapters.length-1))) return state;
      return {...state,chapter,line:state.cursors[chapter],mode:'travel'};
    }
    case 'ARRIVE': return state.mode==='travel'?{...state,mode:'reading'}:state;
    case 'PREVIOUS':
      if(state.mode!=='reading'||state.line===0)return state;
      return {...state,line:state.line-1,cursors:state.cursors.map((v,i)=>i===state.chapter?state.line-1:v)};
    case 'NEXT':
      if(state.mode!=='reading') return state;
      if(state.line+1<chapters[state.chapter].lines.length) return {...state,line:state.line+1,cursors:state.cursors.map((v,i)=>i===state.chapter?state.line+1:v)};
      return {...state,mode:'end',completed:Math.max(state.completed,state.chapter),cursors:state.cursors.map((v,i)=>i===state.chapter?0:v)};
    case 'MAP':
      if(state.mode==='end') {
        const chapter=Math.min(state.completed+1,chapters.length-1);
        return {...state,mode:'map',chapter,line:state.cursors[chapter]};
      }
      return {...state,mode:'map'};
    case 'RESET': return createState();
    default:return state;
  }
}
export function readSave(storage) {
  try {
    const saved=JSON.parse(storage.getItem(SAVE_KEY));
    // Paragraph numbers from the short edition no longer refer to the same text.
    // Preserve chapter unlocks, while introducing the revised story from its beginning.
    if(saved&&saved.textRevision!==TEXT_REVISION)return {completed:saved.completed,chapter:0,line:0,textRevision:TEXT_REVISION,editionUpdated:true};
    return saved;
  } catch {return null;}
}
export function writeSave(storage,state) {
  try {storage.setItem(SAVE_KEY,JSON.stringify({...state,textRevision:TEXT_REVISION}));return true;} catch {return false;}
}
