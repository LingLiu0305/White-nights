import {test,expect} from '@playwright/test';
import {chapters} from '../src/content.js';

async function skipMoment(page){
 if(await page.locator('#interaction-dialog').isVisible()){
  const classic=page.locator('#event-dialogue');
  const skip=page.locator('#event-skip');await (await classic.isVisible()?classic:await skip.isVisible()?skip:page.locator('#event-continue')).click();
 }
}
async function advance(page){await page.locator('#next-line').click();await skipMoment(page)}

// No external font service should be required: fonts are bundled with the app.
test.beforeEach(async({page})=>{
  await page.addLocatorHandler(page.locator('#intro-dialog[open]'),async()=>{await page.locator('#intro-skip').click()});
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//,route=>route.abort());
});

test('map to first night, history, reload and completion',async({page})=>{
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('#map-fallback')).toBeHidden();
  await page.screenshot({path:'test-results/map-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'Explore places'}).click();
  await page.getByRole('button',{name:'Place: The embankment',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Place introduction'})).toBeVisible();
  await expect(page.locator('#place-description-en')).toContainText('Water passes');
  await page.getByRole('button',{name:'Close introduction'}).click();
  await page.getByRole('button',{name:'Begin First Night',exact:true}).click();
  await expect(page.locator('#reader')).toBeVisible();
  await expect(page.locator('#dialogue')).toContainText(chapters[0].lines[0].en);
  await advance(page);
  await expect(page.locator('#dialogue')).toContainText('street corners');
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[1].en);
  await expect(page.locator('#scene-backdrop')).not.toHaveCSS('background-image','none');
  await page.screenshot({path:'test-results/reading-desktop.png'});
  await page.getByRole('button',{name:'Reading history'}).click();
  await expect(page.getByRole('dialog',{name:'Reading history'})).toContainText(chapters[0].lines[0].en);
  await expect(page.getByRole('dialog',{name:'Reading history'})).toContainText(chapters[0].lines[0].en);
  await page.keyboard.press('Escape');
  await page.reload();
  await page.getByRole('button',{name:'Continue First Night',exact:true}).click();
  await expect(page.locator('#dialogue')).toContainText('street corners');
  for(let i=1;i<chapters[0].lines.length;i++) await advance(page);
  await expect(page.locator('#chapter-end')).toBeVisible();
  await page.getByRole('button',{name:'Return to map and continue'}).click();
  await expect(page.getByRole('button',{name:'Begin Second Night',exact:true})).toBeEnabled();
  expect(errors).toEqual([]);
});

test('arrow keys walk the dreamer; nearby places respond to Enter',async({page})=>{
  await page.goto('/');
  await expect(page.locator('#walk-status')).toContainText('The little room');
  await page.locator('#map-canvas canvas').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog',{name:'Place introduction'})).toContainText('The little room');
  await page.keyboard.press('Escape');
  await page.locator('#map-canvas canvas').focus();
  await page.keyboard.down('w');
  await page.waitForTimeout(650);
  await page.keyboard.up('w');
  await expect(page.locator('#walk-status')).toContainText('The little room');
  await page.keyboard.down('ArrowUp');
  await expect(page.locator('#walk-status')).toBeHidden({timeout:10000});
  await page.keyboard.up('ArrowUp');
  await expect(page.locator('#walk-status')).toBeHidden();
  await page.keyboard.down('ArrowDown');
  await expect(page.locator('#walk-status')).toContainText('The little room',{timeout:10000});
  await page.keyboard.up('ArrowDown');
  await expect(page.locator('#walk-status')).toContainText('The little room');
  await page.screenshot({path:'test-results/map-walking.png'});
});

test('homepage restart asks first, then clears the story',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Begin First Night',exact:true}).click();
  await advance(page);
  await page.getByRole('button',{name:'Back to map',exact:true}).click();
  await expect(page.getByRole('button',{name:'Continue First Night',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Restart the whole story'}).click();
  await page.getByRole('button',{name:'Keep my place'}).click();
  await expect(page.getByRole('button',{name:'Continue First Night',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Restart the whole story'}).click();
  await page.getByRole('button',{name:'Confirm restart'}).click();
  await expect(page.getByRole('button',{name:'Begin First Night',exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button',{name:'Begin First Night',exact:true})).toBeVisible();
});

test('returning to a chapter from its destination does not stall travel',async({page})=>{
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  await page.getByRole('button',{name:'Begin First Night',exact:true}).click();
  await expect(page.locator('#reader')).toBeVisible({timeout:10000});
  await page.getByRole('button',{name:'Back to map',exact:true}).click();
  await expect(page.getByRole('button',{name:'Begin First Night',exact:true})).toBeVisible();
  // The reading cursor is still at paragraph one, so the label remains Begin.
  // The character, however, is already standing at the chapter destination.
  await page.getByRole('button',{name:'Begin First Night',exact:true}).click();
  await expect(page.locator('#reader')).toBeVisible({timeout:5000});
  expect(errors).toEqual([]);
});

test('tablet map keeps the walking prompt clear of the chapter title',async({page})=>{
  await page.setViewportSize({width:768,height:1024});
  await page.goto('/');
  const prompt=await page.locator('#walk-status').boundingBox();
  const title=await page.locator('#chapter-title-en').boundingBox();
  expect(prompt.y+prompt.height).toBeLessThan(title.y);
});

test('fallback map works without WebGL and failed background still shows text',async({page})=>{
  await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes('webgl')?null:original.call(this,type,...args)}});
  await page.route(`**/assets/${chapters[0].lines[0].image}`,r=>r.abort());
  await page.goto('/');
  await expect(page.locator('#map-fallback')).toBeVisible();
  await page.getByRole('button',{name:'Begin First Night',exact:true}).click();
  await expect(page.locator('#dialogue')).toContainText(chapters[0].lines[0].en);
});

test('mobile layout, keyboard reading and reset',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/map-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Begin First Night',exact:true}).click();
  await page.locator('#reader').focus();
  await page.keyboard.press('Space');await skipMoment(page);
  await expect(page.locator('#dialogue')).toContainText('street corners');
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[1].en);
  await expect(page.locator('#scene-backdrop')).not.toHaveCSS('background-image','none');
  await page.screenshot({path:'test-results/reading-mobile.png'});
  const mobileWords=await page.locator('#dialogue').boundingBox(),mobileNext=await page.locator('#next-line').boundingBox();
  expect(mobileNext.y).toBeGreaterThan(mobileWords.y+mobileWords.height);
  await page.getByRole('button',{name:'Back to map',exact:true}).click();
  await page.getByRole('button',{name:'About the story ↗'}).click();
  await page.getByRole('button',{name:'Restart story'}).click();
  await page.getByRole('button',{name:'Confirm restart'}).click();
  await expect(page.getByRole('button',{name:'Begin First Night',exact:true})).toBeVisible();
});

test('all five chapters reach the fixed ending in English',async({page})=>{
  test.setTimeout(120000);
  await page.goto('/');
  for(const chapter of chapters){
    await page.getByRole('button',{name:`Begin ${chapter.labelEn}`,exact:true}).click();
    for(let index=0;index<chapter.lines.length;index++){
      await expect(page.locator('#reader')).not.toContainText(/[\u3400-\u9fff]/);
      await expect(page.locator('#dialogue-en')).toHaveText(chapter.lines[index].en);
      if(chapter.id==='night-4'&&chapter.lines[index].visual==='leaving'&&chapter.lines[index-1]?.visual!=='leaving')await page.screenshot({path:'test-results/fourth-night.png'});
      await advance(page);
    }
    await expect(page.locator('#end-title-en')).toHaveText(chapter.endingEn);
    await page.getByRole('button',{name:'Return to map and continue'}).click();
  }
  await expect(page.locator('.chapter-tab:disabled')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Reread Morning',exact:true})).toBeEnabled();
});

test('ordinary motion, duplicate start, skip and reveal text before advancing',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  await page.locator('#start-story').evaluate(button=>{button.click();button.click()});
  await expect(page.locator('#travel-overlay')).toBeVisible();
  await page.getByRole('button',{name:'Skip transition ↗'}).click();
  await page.locator('#next-line').dispatchEvent('click');await skipMoment(page);
  await expect(page.locator('#line-count')).toHaveText(`01 / ${chapters[0].lines.length}`);
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[0].en);
  await advance(page);
  await expect(page.locator('#line-count')).toHaveText(`02 / ${chapters[0].lines.length}`);
});

test('storage denied shows feedback and keeps reading available',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('storage denied')}}));
  await page.goto('/');
  await expect(page.locator('#save-status')).toContainText('cannot be saved');
  await page.getByRole('button',{name:'Begin First Night',exact:true}).click();
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[0].en);
});

test('context loss on the map still allows immediate reading',async({page})=>{
  await page.goto('/');
  await expect(page.locator('#map-canvas canvas')).toBeVisible();
  await page.locator('#map-canvas canvas').evaluate(canvas=>canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
  await expect(page.locator('#map-fallback')).toBeVisible();
  await page.getByRole('button',{name:'Begin First Night',exact:true}).click();
  await expect(page.locator('#reader')).toBeVisible();
  await expect(page.locator('#dialogue')).toContainText(chapters[0].lines[0].en);
});

test('chapter travel reaches reading without using skip',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  await page.getByRole('button',{name:'Begin First Night',exact:true}).click();
  await expect(page.locator('#travel-overlay')).toBeVisible();
  await expect(page.locator('#reader')).toBeVisible({timeout:10000});
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[0].en);
});


test('central stage fits the viewport and travel removes competing home text',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  const canvas=await page.locator('#map-canvas').boundingBox();
  expect(Math.abs(canvas.x+canvas.width/2-720)).toBeLessThan(3);
  // Zooming must use the full page, not stop at the former inner map panel.
  expect(canvas.y).toBeLessThanOrEqual(0);
  expect(canvas.y+canvas.height).toBeGreaterThanOrEqual(1000);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2)).toBe(true);
  await page.mouse.move(720,500);
  for(let i=0;i<6;i++)await page.mouse.wheel(0,-200);
  await page.screenshot({path:'test-results/map-zoomed.png'});
  await page.getByRole('button',{name:'Reset map view'}).click();
  await page.getByRole('button',{name:'Begin First Night',exact:true}).click();
  await expect(page.locator('.scene-heading')).toHaveCSS('visibility','hidden');
  await expect(page.locator('.journey-dock')).toHaveCSS('visibility','hidden');
  await page.screenshot({path:'test-results/travel-revised.png'});
  await page.getByRole('button',{name:'Skip transition ↗'}).click();
});

test('text selection does not advance, previous works, and music is controllable inside reading',async({page})=>{
  await page.addInitScript(()=>{
    const connect=AudioNode.prototype.connect;let meter;
    AudioNode.prototype.connect=function(destination,...args){
      if(destination instanceof AudioDestinationNode){
        meter=this.context.createAnalyser();meter.fftSize=256;
        connect.call(this,meter);return connect.call(meter,destination,...args);
      }
      return connect.call(this,destination,...args);
    };
    window.readTestAudioPeak=()=>{if(!meter)return 0;const samples=new Float32Array(meter.fftSize);meter.getFloatTimeDomainData(samples);return Math.max(...samples.map(Math.abs))};
  });
  await page.goto('/');
  await page.getByRole('button',{name:'Begin First Night',exact:true}).click();
  await page.locator('#dialogue-en').dblclick({position:{x:40,y:10}});
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[0].en);
  await page.locator('#dialogue-en').evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);getSelection().removeAllRanges();getSelection().addRange(range)});
  await page.locator('#dialogue').dispatchEvent('click');
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[0].en);
  await advance(page);
  await page.getByRole('button',{name:'Previous paragraph',exact:true}).click();
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[0].en);
  await page.getByRole('button',{name:'Play reading music',exact:true}).click();
  await expect(page.locator('#reader-sound')).toHaveAttribute('aria-pressed','true');
  await expect.poll(()=>page.evaluate(()=>window.readTestAudioPeak())).toBeGreaterThan(.001);
  await page.getByRole('slider',{name:'Music volume'}).fill('70');
  await page.getByRole('button',{name:'Pause reading music',exact:true}).click();
  await expect(page.locator('#reader-sound')).toHaveAttribute('aria-pressed','false');
});

test('music failure gives feedback without claiming playback',async({page})=>{
  await page.addInitScript(()=>{window.AudioContext=class{constructor(){throw new Error('device unavailable')}}});
  await page.goto('/');
  await page.getByRole('button',{name:'Begin First Night',exact:true}).click();
  await page.getByRole('button',{name:'Play reading music',exact:true}).click();
  await expect(page.locator('#toast')).toContainText('Music could not start');
  await expect(page.locator('#reader-sound')).toHaveAttribute('aria-pressed','false');
  await advance(page);
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[1].en);
});

test('short viewport keeps the English text and reading controls accessible',async({page})=>{
  await page.setViewportSize({width:844,height:390});
  await page.goto('/');
  await page.getByRole('button',{name:'Begin First Night',exact:true}).click();
  const box=await page.locator('#next-line').boundingBox();
  expect(box.y+box.height).toBeLessThan(390);
  const textBox=await page.locator('#dialogue').boundingBox();
  expect(textBox.y).toBeGreaterThan(70);
  await page.screenshot({path:'test-results/reading-landscape.png'});
});

test('speaker portraits alternate sides without covering dialogue',async({page})=>{
  await page.goto('/');
  await page.locator('#start-story').click();
  await expect(page.locator('#portrait-left')).toBeHidden();
  await expect(page.locator('#portrait-right')).toBeHidden();
  const firstSpeech=chapters[0].lines.findIndex(line=>line.speakerEn==='The Dreamer');
  for(let i=0;i<firstSpeech;i++)await advance(page);
  await expect(page.locator('#portrait-left')).toBeVisible();
  await expect(page.locator('#portrait-left')).toContainText('The Dreamer');
  await expect(page.locator('#portrait-right')).toBeHidden();
  await expect.poll(()=>page.locator('#portrait-left img').evaluate(img=>img.naturalWidth)).toBeGreaterThan(0);
  const left=await page.locator('#portrait-left').boundingBox(),words=await page.locator('#dialogue').boundingBox();
  expect(left.x+left.width).toBeLessThanOrEqual(words.x);
  await page.screenshot({path:'test-results/dreamer-dialogue.png'});
  const nextSpeech=chapters[0].lines.findIndex((line,i)=>i>firstSpeech&&line.speakerEn==='The young woman');
  for(let i=firstSpeech;i<nextSpeech;i++)await advance(page);
  await expect(page.locator('#portrait-left')).toBeHidden();
  await expect(page.locator('#portrait-right')).toBeVisible();
  await expect(page.locator('#portrait-right')).toContainText('The young woman');
  await expect(page.locator('#portrait-right')).not.toContainText('Nastenka');
  await expect.poll(()=>page.locator('#portrait-right img').evaluate(img=>img.naturalWidth)).toBeGreaterThan(0);
  const right=await page.locator('#portrait-right').boundingBox();
  const rightWords=await page.locator('#dialogue').boundingBox();
  expect(right.x).toBeGreaterThanOrEqual(rightWords.x+rightWords.width);
  await expect(page.locator('#speaker')).toBeVisible();
  await expect(page.locator('#speaker')).toHaveText('The young woman');
  await page.screenshot({path:'test-results/nastenka-dialogue.png'});
  await page.setViewportSize({width:390,height:844});
  const mobilePortrait=await page.locator('#portrait-right').boundingBox(),mobileWords=await page.locator('#dialogue').boundingBox();
  expect(mobilePortrait.y+mobilePortrait.height).toBeLessThan(mobileWords.y);
  const mobileName=await page.locator('#speaker').boundingBox();
  expect(mobilePortrait.y+mobilePortrait.height).toBeLessThan(mobileName.y);
  expect((await page.locator('#next-line').boundingBox()).y).toBeGreaterThan(mobileWords.y+mobileWords.height);
  await page.screenshot({path:'test-results/portrait-mobile.png'});
});

test('small phone landscape preserves a scrollable reading area',async({page})=>{
  await page.setViewportSize({width:568,height:320});
  await page.goto('/');
  await page.locator('#start-story').click();
  const words=await page.locator('#dialogue').boundingBox();
  expect(words.height).toBeGreaterThan(40);
  expect(words.y).toBeGreaterThan(55);
  const next=await page.locator('#next-line').boundingBox();
  expect(next.y+next.height).toBeLessThan(320);
  await page.screenshot({path:'test-results/reading-small-landscape.png'});
});

test('missing character image retains the speaker name and reading controls',async({page})=>{
  await page.route('**/assets/dreamer-portrait*.png',route=>route.abort());
  await page.goto('/');
  await page.locator('#start-story').click();
  const firstSpeech=chapters[0].lines.findIndex(line=>line.speakerEn==='The Dreamer');
  for(let i=0;i<firstSpeech;i++)await advance(page);
  await expect(page.locator('#portrait-left figcaption')).toBeVisible();
  await expect(page.locator('#portrait-left')).toContainText('The Dreamer');
  await expect(page.locator('#portrait-left img')).toBeHidden();
  await advance(page);
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[firstSpeech+1].en);
});

test('immersive map hides place names until focus and supports keyboard exploration',async({page})=>{
  await page.removeLocatorHandler(page.locator('#intro-dialog[open]'));await page.goto('/');await page.locator('#intro-skip').click();
  await expect(page.locator('#map-view')).toHaveClass(/intro-complete/);
  const pin=page.locator('.map-label').filter({hasText:'The embankment'});
  await expect(pin.locator('.pin-name')).toHaveCSS('opacity','0');
  await pin.focus();
  await expect(pin.locator('.pin-name')).toHaveCSS('opacity','1');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog',{name:'Place introduction'})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Begin First Night',exact:true})).toBeEnabled();
});

test('opening title clears the exploration area after the camera introduction',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('white-nights-progress-v1',JSON.stringify({textRevision:2,introSeen:true})));
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  await expect(page.locator('#map-view')).toHaveClass(/scene-entering/);
  await page.screenshot({path:'test-results/immersive-opening.png'});
  await expect(page.locator('#map-view')).toHaveClass(/intro-complete/,{timeout:10000});
  await expect(page.locator('.scene-heading')).toHaveCSS('opacity','0');
  await page.screenshot({path:'test-results/immersive-desktop.png'});
  await page.getByRole('button',{name:'Begin First Night',exact:true}).click();
  await page.getByRole('button',{name:'Skip transition'}).click();
  await expect(page.locator('#reader')).toBeVisible();
});

test('a location transition never interrupts a subsequently opened menu',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  await page.getByRole('button',{name:'Explore places'}).click();
  await page.getByRole('button',{name:'Place: The embankment',exact:true}).click();
  await page.getByRole('button',{name:'About the story ↗'}).click();
  await expect(page.locator('#about-dialog')).toBeVisible();
  // Let the original focus transition finish before checking for a stolen modal.
  await page.waitForTimeout(1300);
  await expect(page.locator('#location-dialog')).toBeHidden();
  await expect(page.locator('dialog[open]')).toHaveCount(1);
});

test('touch reveals a place before opening it and narrow landscape keeps the start usable',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:5173/');await page.locator('#intro-skip').click();
  const pin=page.locator('.map-label').filter({hasText:'The embankment'});
  await pin.tap();
  await expect(pin.locator('.pin-name')).toHaveCSS('opacity','1');
  await page.evaluate(()=>document.activeElement?.blur());
  await expect(pin.locator('.pin-name')).toHaveCSS('opacity','1');
  await expect(page.locator('#location-dialog')).toBeHidden();
  await pin.tap();
  await expect(page.locator('#location-dialog')).toBeVisible();
  await page.getByRole('button',{name:'Close introduction'}).tap();
  await page.setViewportSize({width:568,height:320});
  const start=page.getByRole('button',{name:'Begin First Night',exact:true});
  await expect(start).toBeInViewport();
  await start.tap();
  await expect(page.locator('#reader')).toBeVisible();
  await context.close();
});

test('English narration uses the empty portrait columns and leaves most of the scene exposed',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'About the story ↗'}).click();
  await expect(page.locator('#about-dialog')).not.toContainText(/[\u3400-\u9fff]/);
  await page.keyboard.press('Escape');
  await page.locator('#start-story').click();
  const prose=await page.locator('#dialogue').boundingBox(),deck=await page.locator('#reading-deck').boundingBox();
  expect(prose.width).toBeGreaterThan(800);
  expect(prose.width).toBeLessThan(1100);
  expect(deck.y).toBeGreaterThan(600);
  await expect(page.locator('[lang="zh-CN"]')).toHaveCount(0);
  await expect(page.locator('#reader')).not.toContainText(/[\u3400-\u9fff]/);
  await page.screenshot({path:'test-results/english-narration.png'});
  await page.locator('#history-open').click();
  await expect(page.locator('#history-dialog')).toContainText(chapters[0].lines[0].en);
  await expect(page.locator('#history-dialog')).not.toContainText(/[\u3400-\u9fff]/);
});

test('dialogue frame reserves the complete paragraph while typing',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  await page.locator('#start-story').click();
  await page.getByRole('button',{name:'Skip transition ↗'}).click();
  await expect(page.locator('#speaker')).toHaveText('The Dreamer');
  const bounds=()=>page.evaluate(()=>['.dialogue-wrap','#next-line'].map(selector=>{
    const r=document.querySelector(selector).getBoundingClientRect();
    return [r.x,r.y,r.width,r.height].map(Math.round);
  }));
  const initial=await bounds();
  expect(initial[1][0]).toBeGreaterThan(900);
  await page.waitForTimeout(450);
  expect(await bounds()).toEqual(initial);
  await page.locator('#next-line').dispatchEvent('click');await skipMoment(page);
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[0].en);
  expect(await bounds()).toEqual(initial);
  const spoken=chapters[0].lines.findIndex(line=>line.speakerEn==='The Dreamer');
  for(let i=0;i<spoken;i++){
    await page.locator('#next-line').dispatchEvent('click');await skipMoment(page);
    await page.locator('#next-line').dispatchEvent('click');await skipMoment(page);
  }
  await expect(page.locator('#reading-deck')).toHaveAttribute('data-voice','left');
  const spokenBounds=await bounds();
  await page.waitForTimeout(200);
  expect(await bounds()).toEqual(spokenBounds);
  await page.locator('#history-open').click();
  await expect(page.locator('#history-dialog')).not.toContainText('Inner voice');
});


test('reader title is centered and complete paragraphs choose compact heights',async({page})=>{
  await page.goto('/');
  await page.locator('#start-story').click();
  const title=await page.locator('#reader-chapter').boundingBox();
  expect(Math.abs(title.x+title.width/2-720)).toBeLessThan(2);
  expect((await page.locator('.dialogue-wrap').boundingBox()).height).toBeLessThan(250);
  await page.setViewportSize({width:390,height:844});
  const mobileTitle=await page.locator('#reader-chapter').boundingBox();
  expect(Math.abs(mobileTitle.x+mobileTitle.width/2-195)).toBeLessThan(2);
  const heights=new Set();
  for(let i=0;i<20;i++){
    heights.add(Math.round((await page.locator('.dialogue-wrap').boundingBox()).height));
    if(chapters[0].lines[i].speakerEn==='Narration')await expect(page.locator('#speaker')).toBeHidden();
    if(i<19)await advance(page);
  }
  expect(heights.size).toBeGreaterThan(1);
  await page.locator('#history-open').click();
  expect(await page.locator('#history-content small').allTextContents()).not.toContain('Narration');
});
