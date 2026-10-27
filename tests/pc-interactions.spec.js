import {test,expect} from '@playwright/test';
const key='white-nights-progress-v1';
test('new reader enters the world, replays intro, and resets',async({page})=>{
 await page.goto('/');await expect(page.locator('#intro-dialog')).toBeVisible();
 await expect(page.locator('#intro-dialog')).toContainText('Fyodor Dostoevsky');
 await page.screenshot({path:'docs/screenshots/pc-intro.png'});
 await page.getByRole('button',{name:'Enter the story'}).click();
 await expect(page.locator('#intro-dialog')).toBeHidden();
 await page.keyboard.press('Enter');await expect(page.locator('#location-dialog')).toBeVisible();
 await page.keyboard.press('Escape');
 await page.locator('#about-open').click();await page.locator('#intro-replay').click();
 await page.locator('#intro-skip').click();await page.reload();await expect(page.locator('#intro-dialog')).toBeHidden();
 await page.locator('#restart-story-home').click();await page.locator('#confirm-reset').click();
 await expect(page.locator('#intro-dialog')).toBeVisible();
});
test('old save keeps the paragraph and bypasses intro; walking position persists',async({page})=>{
 await page.addInitScript(({key})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({textRevision:2,completed:0,chapter:1,cursors:[0,12,0,0,0]}))},{key});
 await page.goto('/');await expect(page.locator('#intro-dialog')).toBeHidden();
 await page.locator('#map-canvas canvas').focus();await page.keyboard.down('ArrowUp');await page.waitForTimeout(900);await page.keyboard.up('ArrowUp');
 const moved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).mapPlayer,key);expect(moved.z).toBeLessThan(4.4);
 await page.reload();const restored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).mapPlayer,key);expect(restored.z).toBeCloseTo(moved.z,2);
 await page.locator('#start-story').click();await expect(page.locator('#line-count')).toHaveText('13 / 41');
});
async function seed(page,chapter,line){
 await page.addInitScript(({key,chapter,line})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({textRevision:2,interactionSchemaVersion:1,introSeen:true,completed:chapter-1,chapter,cursors:[0,0,0,0,0].map((n,i)=>i===chapter?line:0)}))},{key,chapter,line});
 await page.goto('/');await page.locator('#start-story').click();
}
test('city observations survive pause, map and reload; replay does not advance',async({page})=>{
 await seed(page,0,0);await page.locator('#next-line').click();
 await expect(page.locator('#interaction-dialog')).toBeVisible();
 await page.locator('.event-object-list button').first().click();
 await expect(page.locator('#event-object-name')).toHaveText('The open window');
 await page.locator('#event-pause').click();await expect(page.locator('#line-count')).toHaveText('01 / 37');
 await page.locator('#replay-interaction').click();await page.locator('#event-map').click();
 await page.reload();await page.locator('#start-story').click();
 await expect(page.locator('.event-object-list button').first()).toContainText('Look again');
 await page.screenshot({path:'docs/screenshots/pc-observation.png'});
 await page.locator('#event-continue').click();await expect(page.locator('#line-count')).toHaveText('02 / 37');
 await page.locator('#previous-line').click();await page.locator('#replay-interaction').click();
 await page.locator('#event-continue').click();await expect(page.locator('#line-count')).toHaveText('01 / 37');
 await page.locator('#next-line').click();await expect(page.locator('#line-count')).toHaveText('02 / 37');
});
test('morning letter resumes open and preserves the reaction between passages',async({page})=>{
 await seed(page,4,1);await page.locator('#next-line').click();
 await expect(page.locator('#open-letter')).toBeVisible();await page.locator('#open-letter').click();
 await page.screenshot({path:'docs/screenshots/pc-letter.png'});
 await page.reload();await page.locator('#start-story').click();await expect(page.locator('#letter-paper')).toBeVisible();
 await page.locator('#event-continue').click();await expect(page.locator('#line-count')).toHaveText('05 / 15');
 await page.locator('#next-line').click();await expect(page.locator('#letter-paper')).toBeVisible();
 await page.locator('#event-continue').click();await expect(page.locator('#line-count')).toHaveText('07 / 15');
});
test('waiting is optional and does not reorder the next story beat',async({page})=>{
 await seed(page,2,8);await page.locator('#next-line').click();
 await expect(page.locator('#event-title')).toHaveText('Before the appointed hour');
 await page.locator('.event-object-list button').nth(1).click();
 await page.screenshot({path:'docs/screenshots/pc-waiting.png'});
 await page.locator('#event-skip').click();await expect(page.locator('#line-count')).toHaveText('10 / 23');
});
test('take the letter once, then keep and replace a sentence',async({page})=>{
 await seed(page,1,38);await page.locator('#next-line').click();
 await expect(page.locator('#event-action')).toHaveText('Take the letter');
 await page.locator('#event-action').evaluate(b=>{b.click();b.click()});
 await expect(page.locator('#line-count')).toHaveText('40 / 41');
 await page.locator('#next-line').click();await page.locator('#next-line').click();
 await page.locator('#keepsake-choices button').first().click();
 await expect(page.locator('#keepsake-choices button').first()).toHaveAttribute('aria-pressed','true');
 await page.locator('#keepsake-choices button').last().click();
 const chosen=await page.locator('#keepsake-choices button').last().textContent();
 await page.screenshot({path:'docs/screenshots/pc-keepsake.png'});
 await page.locator('#end-map').click();await page.reload();await page.locator('#memories-open').click();
 await expect(page.locator('#memories-content blockquote')).toHaveText(chosen);
 await page.keyboard.press('Escape');await page.locator('#restart-story-home').click();await page.locator('#confirm-reset').click();
 await expect(page.locator('#intro-dialog')).toBeVisible();
 expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).keptLines,key)).toEqual({});
});
test('turning attention survives reload without advancing or changing the ending',async({page})=>{
 await seed(page,3,28);await page.locator('#next-line').click();await expect(page.locator('#event-figure svg')).toBeVisible();await page.screenshot({path:'docs/screenshots/pc-footsteps.png'});await page.locator('#event-figure').click();
 await expect(page.locator('#interaction-dialog')).toHaveClass(/attention-shift/);
 await page.reload();await page.locator('#start-story').click();
 await expect(page.locator('#interaction-dialog')).toHaveClass(/attention-shift/);
 await page.locator('#event-continue').click();await expect(page.locator('#line-count')).toHaveText('30 / 36');
});
test('place memories unlock once and retain earlier descriptions',async({page})=>{
 await seed(page,1,0);await page.locator('#back-map').click();await page.locator('#places-open').click();
 await expect(page.locator('[data-place="home"] .new-memory')).toBeVisible();await page.locator('[data-place="home"]').click();
 await expect(page.locator('#place-description-en')).toContainText('tomorrow');
 await page.locator('#earlier-memories summary').click();await expect(page.locator('#place-memory-history p')).toHaveCount(1);
 await page.locator('#location-dialog .close-dialog').click();await page.locator('#places-open').click();
 await expect(page.locator('[data-place="home"] .new-memory')).toHaveCount(0);
});
test('PC observation and letter controls fit supported viewports and 200% layout zoom',async({page})=>{
 test.setTimeout(60000);await seed(page,0,0);await page.locator('#next-line').click();
 for(const [width,height] of [[1280,720],[1440,900],[1920,1080],[1024,768],[640,360]]){
  await page.setViewportSize({width,height});
  await page.locator('.event-object-list button').last().click();
  const response=page.locator('.event-response');await expect(response).toBeVisible();
  await page.locator('#event-continue').scrollIntoViewIfNeeded();
  const r=await page.locator('#event-continue').boundingBox();expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(width);expect(r.y+r.height).toBeLessThanOrEqual(height+1);
  await page.screenshot({path:`docs/screenshots/pc-observe-${width}.png`});
 }
});
test('complete interactive route preserves all five endings and keepsakes',async({page})=>{
 test.setTimeout(120000);await page.goto('/');await page.locator('#intro-enter').click();
 for(let chapter=0;chapter<5;chapter++){
  await page.locator('#start-story').click();
  for(let count=0;count<65;count++){
   if(await page.locator('#chapter-end').isVisible())break;
   if(await page.locator('#interaction-dialog').isVisible()){
    if(await page.locator('#open-letter').isVisible())await page.locator('#open-letter').click();
    else if(await page.locator('#event-action').isVisible())await page.locator('#event-action').click();
    else await page.locator('#event-continue').click();
   }else await page.locator('#next-line').click();
  }
  await expect(page.locator('#chapter-end')).toBeVisible();
  await page.locator('#keepsake-choices button').first().click();await page.locator('#end-map').click();
 }
 await page.locator('#memories-open').click();await expect(page.locator('#memories-content blockquote')).toHaveCount(5);
 await page.screenshot({path:'docs/screenshots/pc-memories.png'});
 await page.reload();await page.locator('#memories-open').click();await expect(page.locator('#memories-content blockquote')).toHaveCount(5);
});
test('failed observation image and keyboard controls do not block reading',async({page})=>{
 await page.route('**/assets/summer-street.png',r=>r.abort());
 await seed(page,0,0);await page.locator('#music-volume').focus();await page.keyboard.press('ArrowRight');
 await expect(page.locator('#line-count')).toHaveText('01 / 37');
 await page.locator('#next-line').click();await expect(page.locator('.event-image-status')).toBeVisible();
 await page.locator('.event-object-list button').first().focus();await page.keyboard.press('Enter');await expect(page.locator('#event-object-name')).toHaveText('The open window');
 await page.keyboard.press('ArrowRight');await expect(page.locator('#interaction-dialog')).toBeVisible();
 await page.locator('#event-skip').click();await expect(page.locator('#line-count')).toHaveText('02 / 37');
});
test('ordinary-motion replay restores after refresh without blanking the reader',async({page})=>{
 await seed(page,0,0);await page.locator('#next-line').click();await page.locator('#event-skip').click();
 await page.locator('#previous-line').click();await page.locator('#replay-interaction').click();
 await page.emulateMedia({reducedMotion:'no-preference'});await page.reload();await page.locator('#start-story').click();
 await expect(page.locator('#interaction-dialog')).toBeVisible();await page.locator('#event-continue').click();
 await page.locator('#next-line').dispatchEvent('click');await expect(page.locator('#dialogue-en')).not.toBeEmpty();
 await expect(page.locator('#line-count')).toHaveText('01 / 37');
});
test('PC letter remains scrollable with accessible controls at all desktop sizes',async({page})=>{
 await seed(page,4,1);await page.locator('#next-line').click();await page.locator('#open-letter').click();
 for(const [width,height] of [[1280,720],[1440,900],[1920,1080],[1024,768],[640,360]]){
  await page.setViewportSize({width,height});await page.locator('#letter-paper').focus();await page.keyboard.press('PageDown');
  await page.locator('#event-continue').scrollIntoViewIfNeeded();
  const r=await page.locator('#event-continue').boundingBox();expect(r.x+r.width).toBeLessThanOrEqual(width);expect(r.y+r.height).toBeLessThanOrEqual(height+1);
  await page.screenshot({path:`docs/screenshots/pc-letter-${width}.png`});
 }
 await page.locator('#event-continue').click();await expect(page.locator('#line-count')).toHaveText('05 / 15');
});
test('speaker portraits stay above reading controls',async({page})=>{
 await seed(page,0,29);
 for(const portrait of ['#portrait-left','#portrait-right']){
  await expect(page.locator(portrait)).toBeVisible();
  const p=await page.locator(portrait).boundingBox(),control=await page.locator(portrait.includes('left')?'#previous-line':'#next-line').boundingBox();
  expect(p.y+p.height).toBeLessThanOrEqual(control.y+1);
  await page.screenshot({path:`docs/screenshots/portrait-safe-${portrait.includes('left')?'dreamer':'nastenka'}.png`});
  if(portrait.includes('left'))await page.locator('#next-line').click();
 }
});
test('rainy room, period letter and split passage remain readable',async({page})=>{
 await seed(page,4,1);await expect(page.locator('#scene-backdrop')).toHaveCSS('background-image',/rainy-room-window/);
 await page.locator('#next-line').click();await expect(page.locator('#open-letter .wax-seal')).toBeVisible();
 await page.screenshot({path:'docs/screenshots/period-envelope.png'});
 await page.locator('#open-letter').click();await expect(page.locator('#letter-paper')).toBeVisible();
 await expect(page.locator('#letter-paper')).toHaveCSS('overflow-y','auto');
 await expect(page.locator('#letter-body p')).toHaveCount(2);await expect(page.locator('.letter-heading')).toBeVisible();
 await expect(page.locator('#letter-body p').first()).toHaveCSS('font-family',/Caveat/);
 await page.screenshot({path:'docs/screenshots/period-letter.png'});
 await page.locator('#event-continue').click();await expect(page.locator('#line-count')).toHaveText('05 / 15');
 await page.locator('#next-line').click();await expect(page.locator('.letter-heading')).toBeHidden();await expect(page.locator('.letter-signature')).toBeVisible();
 await expect(page.locator('.letter-page')).toHaveText('Part 2 of 2');await page.locator('#event-continue').click();await expect(page.locator('#line-count')).toHaveText('07 / 15');
});
test('footsteps offer an immediate alternative and keep the figure when looking',async({page})=>{
 await seed(page,3,28);await page.locator('#next-line').click();await expect(page.locator('#event-hint')).toHaveText('Someone is approaching.');
 await expect(page.locator('#event-continue')).toBeVisible();await page.locator('#event-action').click();
 await expect(page.locator('#event-figure')).toBeVisible();await expect(page.locator('#event-figure')).toBeDisabled();
 await page.screenshot({path:'docs/screenshots/footsteps-looked.png'});
 await page.locator('#event-continue').click();await expect(page.locator('#line-count')).toHaveText('30 / 36');
});
test('chapter selection applies an individual map tint',async({page})=>{
 await seed(page,4,0);await page.locator('#back-map').click();
 for(const [i,tint] of ['first','second','third','fourth','morning'].entries()){
  await page.locator('.chapter-tab').nth(i).click();await expect(page.locator('#map-view')).toHaveAttribute('data-chapter-tint',tint);
  await page.screenshot({path:`docs/screenshots/map-tint-${tint}.png`});
 }
});
test('letter opening animation can be interrupted and long text can scroll',async({page})=>{
 await seed(page,4,1);await page.locator('#next-line').click();await page.emulateMedia({reducedMotion:'no-preference'});
 await page.locator('#open-letter').click();await expect(page.locator('#open-letter')).toHaveClass(/is-opening/);
 await page.locator('#event-dialogue').click();await expect(page.locator('#line-count')).toHaveText('03 / 15');
 await page.waitForTimeout(800);await expect(page.locator('#line-count')).toHaveText('03 / 15');
 await page.locator('#previous-line').click();await page.locator('#replay-interaction').click();await page.locator('#open-letter').click();
 await expect(page.locator('#letter-paper')).toBeVisible();
 await page.locator('#letter-body').evaluate(el=>{el.firstElementChild.textContent=el.firstElementChild.textContent.repeat(20)});
 const scroll=await page.locator('#letter-paper').evaluate(el=>{el.scrollTop=el.scrollHeight;return {top:el.scrollTop,height:el.scrollHeight,client:el.clientHeight}});
 expect(scroll.height).toBeGreaterThan(scroll.client);expect(scroll.top).toBeGreaterThan(0);
 await page.locator('#event-continue').click();await expect(page.locator('#line-count')).toHaveText('02 / 15');
});
