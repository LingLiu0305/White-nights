import { chapters } from './content.js';
export const SAVE_KEY = 'white-nights-progress-v1';
const integerIn=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
export function createState(saved) {
  const completed=integerIn(saved?.completed,-1,chapters.length-1)?saved.completed:-1;
  const chapter=integerIn(saved?.chapter,0,Math.min(completed+1,chapters.length-1))?saved.chapter:0;
  const line=integerIn(saved?.line,0,chapters[chapter].lines.length-1)?saved.line:0;
  return {chapter,line,completed,mode:'map'};
}
export function transition(state,event) {
  switch(event.type) {
    case 'START': {
      const chapter=event.chapter;
      if(state.mode!=='map'||!integerIn(chapter,0,Math.min(state.completed+1,chapters.length-1))) return state;
      return {...state,chapter,line:chapter===state.chapter?state.line:0,mode:'travel'};
    }
    case 'ARRIVE': return state.mode==='travel'?{...state,mode:'reading'}:state;
    case 'NEXT':
      if(state.mode!=='reading') return state;
      if(state.line+1<chapters[state.chapter].lines.length) return {...state,line:state.line+1};
      return {...state,mode:'end',completed:Math.max(state.completed,state.chapter)};
    case 'MAP':
      if(state.mode==='end') return {...state,mode:'map',chapter:Math.min(state.completed+1,chapters.length-1),line:0};
      return {...state,mode:'map'};
    case 'RESET': return createState();
    default:return state;
  }
}
export function readSave(storage) {
  try {return JSON.parse(storage.getItem(SAVE_KEY));} catch {return null;}
}
export function writeSave(storage,state) {
  try {storage.setItem(SAVE_KEY,JSON.stringify(state));return true;} catch {return false;}
}
