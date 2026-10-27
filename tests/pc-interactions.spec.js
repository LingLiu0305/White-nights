import {test,expect} from '@playwright/test';
const key='white-nights-progress-v1';
test('new reader enters the world, replays intro, and resets',async({page})=>{
 await page.goto('/');await expect(page.locator('#intro-dialog')).toBeVisible();
 await expect(page.locator('#intro-dialog')).toContainText('Fyodor Dostoevsky');
 await page.screenshot({path:'test-results/pc-intro.png'});
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
