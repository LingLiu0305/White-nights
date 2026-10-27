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
