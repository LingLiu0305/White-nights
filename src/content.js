// Original Chinese abridgment after Dostoevsky, informed by Garnett's translation.
// This is not a quotation from a published Chinese translation.
import {storyText} from './story-text.js';
import {chaptersEn,locationsEn,speakersEn} from './content-en.js';
export const locations = [
  {id:'home', name:'梦想家的住处', en:'THE LITTLE ROOM', position:[-7,0,4], number:'01', description:'一间熟悉得近乎停滞的小屋。每天的散步从这里开始，梦想也从这里出发。', note:'故事里的住处 · 地图位置为示意'},
  {id:'canal', name:'河岸的栏杆', en:'THE EMBANKMENT', position:[2.5,0,1.3], number:'02', description:'水流从栏杆下经过。初次相遇、倾听与等待，让一段普通的河岸成为两个人的约定。', note:'四夜的主要会面地点'},
  {id:'house', name:'娜斯坚卡家附近', en:'HER NEIGHBOURHOOD', position:[7,0,-4], number:'03', description:'街巷深处是一所小房子。她与祖母一起生活，也在这里开始讲述关于等待的往事。', note:'人物背景地点 · 介绍不推进故事'},
  {id:'bridge', name:'夜间散步的街巷', en:'THE NIGHT WALK', position:[0,0,-5.5], number:'04', description:'桥连接着两岸，也连接着散步时断断续续的谈话。这里的路线是文学地图的空间示意。', note:'散步路线 · 非历史街区复原'},
];
export const chapters = [
 {id:'night-1',label:'第一夜',roman:'I',title:'从孤独走向相遇',en:'BEFORE WE MET',place:'canal',image:'canal-night.png',tint:'first',route:[[-7,4],[-3,4],[-3,1.3],[2.5,1.3]],ending:'明天。同样的地方。'},
 {id:'night-2',label:'第二夜',roman:'II',title:'让另一个人走进来',en:'A LIFE SHARED IN WORDS',place:'canal',image:'canal-night.png',tint:'second',route:[[-7,4],[-3,4],[-3,-5.5],[3,-5.5],[3,1.3]],ending:'一封信，和两种不同的等待。'},
 {id:'night-3',label:'第三夜',roman:'III',title:'站在同一处等待',en:'WAITING FOR DIFFERENT FUTURES',place:'canal',image:'canal-night.png',tint:'third',route:[[7,-4],[4,-4],[4,1.3],[2.5,1.3]],ending:'雨停以后，我们还会在这里。'},
 {id:'night-4',label:'第四夜',roman:'IV',title:'差一点到来的明天',en:'THE TOMORROW WE ALMOST HAD',place:'canal',image:'canal-night.png',tint:'fourth',route:[[-7,4],[-3,4],[-3,1.3],[2.5,1.3]],ending:'河水仍然向前流去。'},
 {id:'morning',label:'清晨',roman:'V',title:'那一刻并非虚构',en:'A MOMENT THAT WAS REAL',place:'home',image:'morning-room.png',tint:'morning',route:[[2.5,1.3],[-3,1.3],[-3,4],[-7,4]],ending:'白夜 · 完'},
];
for(const place of locations)Object.assign(place,locationsEn[place.id]);
for(const chapter of chapters){
 const translation=chaptersEn[chapter.id];
 chapter.labelEn=translation.labelEn;chapter.endingEn=translation.endingEn;
 chapter.lines=storyText[chapter.id].map(line=>({...line,speakerEn:speakersEn[line.speaker]}));
}
