import {test,expect} from '@playwright/test';
import {chapters} from '../src/content.js';

test('map to first night, history, reload and completion',async({page})=>{
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('#map-fallback')).toBeHidden();
  await page.screenshot({path:'test-results/map-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'地点：河岸的栏杆',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'地点介绍'})).toBeVisible();
  await expect(page.locator('#place-description-en')).toContainText('Water passes');
  await page.getByRole('button',{name:'关闭介绍'}).click();
  await page.getByRole('button',{name:'开始第一夜',exact:true}).click();
  await expect(page.locator('#reader')).toBeVisible();
  await expect(page.locator('#dialogue')).toContainText('明亮');
  await page.getByRole('button',{name:'继续阅读',exact:true}).click();
  await expect(page.locator('#dialogue')).toContainText('街角');
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[1].en);
  await expect(page.locator('#scene-backdrop')).not.toHaveCSS('background-image','none');
  await page.screenshot({path:'test-results/reading-desktop.png'});
  await page.getByRole('button',{name:'对话记录'}).click();
  await expect(page.getByRole('dialog',{name:'对话记录'})).toContainText('明亮');
  await expect(page.getByRole('dialog',{name:'对话记录'})).toContainText(chapters[0].lines[0].en);
  await page.keyboard.press('Escape');
  await page.reload();
  await page.getByRole('button',{name:'继续第一夜',exact:true}).click();
  await expect(page.locator('#dialogue')).toContainText('街角');
  for(let i=0;i<11;i++) await page.getByRole('button',{name:'继续阅读',exact:true}).click();
  await expect(page.locator('#chapter-end')).toBeVisible();
  await page.getByRole('button',{name:'返回地图，继续故事'}).click();
  await expect(page.getByRole('button',{name:'开始第二夜',exact:true})).toBeEnabled();
  expect(errors).toEqual([]);
});

test('fallback map works without WebGL and failed background still shows text',async({page})=>{
  await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes('webgl')?null:original.call(this,type,...args)}});
  await page.route('**/assets/canal-night.png',r=>r.abort());
  await page.goto('/');
  await expect(page.locator('#map-fallback')).toBeVisible();
  await page.getByRole('button',{name:'开始第一夜',exact:true}).click();
  await expect(page.locator('#dialogue')).toContainText('明亮');
});

test('mobile layout, keyboard reading and reset',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/map-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'开始第一夜',exact:true}).click();
  await page.locator('#reader').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#dialogue')).toContainText('街角');
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[1].en);
  await expect(page.locator('#scene-backdrop')).not.toHaveCSS('background-image','none');
  await page.screenshot({path:'test-results/reading-mobile.png'});
  await page.getByRole('button',{name:'返回地图',exact:true}).click();
  await page.getByRole('button',{name:'关于白夜'}).click();
  await page.getByRole('button',{name:'重新开始'}).click();
  await page.getByRole('button',{name:'确认重新开始'}).click();
  await expect(page.getByRole('button',{name:'开始第一夜',exact:true})).toBeVisible();
});

test('all five chapters reach the fixed ending with paired languages',async({page})=>{
  await page.goto('/');
  for(const chapter of chapters){
    await page.getByRole('button',{name:`开始${chapter.label}`,exact:true}).click();
    for(let index=0;index<chapter.lines.length;index++){
      await expect(page.locator('#dialogue-zh')).toHaveText(chapter.lines[index].text);
      await expect(page.locator('#dialogue-en')).toHaveText(chapter.lines[index].en);
      if(chapter.id==='night-4'&&index===12)await page.screenshot({path:'test-results/fourth-night.png'});
      await page.getByRole('button',{name:'继续阅读',exact:true}).click();
    }
    await expect(page.locator('#end-title-en')).toHaveText(chapter.endingEn);
    await page.getByRole('button',{name:'返回地图，继续故事'}).click();
  }
  await expect(page.locator('.chapter-tab:disabled')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'重读清晨',exact:true})).toBeEnabled();
});

test('ordinary motion, duplicate start, skip and reveal text before advancing',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  await page.locator('#start-story').evaluate(button=>{button.click();button.click()});
  await expect(page.locator('#travel-overlay')).toBeVisible();
  await page.getByRole('button',{name:'跳过过场 →'}).click();
  await page.locator('#next-line').dispatchEvent('click');
  await expect(page.locator('#line-count')).toHaveText('01 / 12');
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[0].en);
  await page.getByRole('button',{name:'继续阅读',exact:true}).click();
  await expect(page.locator('#line-count')).toHaveText('02 / 12');
});

test('storage denied shows feedback and keeps reading available',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('storage denied')}}));
  await page.goto('/');
  await expect(page.locator('#save-status')).toContainText('无法保存');
  await page.getByRole('button',{name:'开始第一夜',exact:true}).click();
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[0].en);
});

test('context loss on the map still allows immediate reading',async({page})=>{
  await page.goto('/');
  await expect(page.locator('#map-canvas canvas')).toBeVisible();
  await page.locator('#map-canvas canvas').evaluate(canvas=>canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
  await expect(page.locator('#map-fallback')).toBeVisible();
  await page.getByRole('button',{name:'开始第一夜',exact:true}).click();
  await expect(page.locator('#reader')).toBeVisible();
  await expect(page.locator('#dialogue')).toContainText('明亮');
});

test('chapter travel reaches reading without using skip',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  await page.getByRole('button',{name:'开始第一夜',exact:true}).click();
  await expect(page.locator('#travel-overlay')).toBeVisible();
  await expect(page.locator('#reader')).toBeVisible({timeout:10000});
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[0].en);
});
