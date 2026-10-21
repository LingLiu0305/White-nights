import {test,expect} from '@playwright/test';
import {chapters} from '../src/content.js';

// Optional web fonts must not make interaction checks depend on a third-party network.
// Exercise the supported system-serif fallback in every browser test.
test.beforeEach(async({page})=>{
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//,route=>route.abort());
});

test('map to first night, history, reload and completion',async({page})=>{
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('#map-fallback')).toBeHidden();
  await page.screenshot({path:'test-results/map-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'地点目录 / Places ↗'}).click();
  await page.getByRole('button',{name:'地点：河岸的栏杆',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'地点介绍'})).toBeVisible();
  await expect(page.locator('#place-description-en')).toContainText('Water passes');
  await page.getByRole('button',{name:'关闭介绍'}).click();
  await page.getByRole('button',{name:'开始第一夜',exact:true}).click();
  await expect(page.locator('#reader')).toBeVisible();
  await expect(page.locator('#dialogue')).toContainText(chapters[0].lines[0].text);
  await page.getByRole('button',{name:'继续阅读',exact:true}).click();
  await expect(page.locator('#dialogue')).toContainText('街角');
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[1].en);
  await expect(page.locator('#scene-backdrop')).not.toHaveCSS('background-image','none');
  await page.screenshot({path:'test-results/reading-desktop.png'});
  await page.getByRole('button',{name:'对话记录'}).click();
  await expect(page.getByRole('dialog',{name:'对话记录'})).toContainText(chapters[0].lines[0].text);
  await expect(page.getByRole('dialog',{name:'对话记录'})).toContainText(chapters[0].lines[0].en);
  await page.keyboard.press('Escape');
  await page.reload();
  await page.getByRole('button',{name:'继续第一夜',exact:true}).click();
  await expect(page.locator('#dialogue')).toContainText('街角');
  for(let i=1;i<chapters[0].lines.length;i++) await page.getByRole('button',{name:'继续阅读',exact:true}).click();
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
  await expect(page.locator('#dialogue')).toContainText(chapters[0].lines[0].text);
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
  test.setTimeout(120000);
  await page.goto('/');
  for(const chapter of chapters){
    await page.getByRole('button',{name:`开始${chapter.label}`,exact:true}).click();
    for(let index=0;index<chapter.lines.length;index++){
      await expect(page.locator('#dialogue-zh')).toHaveText(chapter.lines[index].text);
      await expect(page.locator('#dialogue-en')).toHaveText(chapter.lines[index].en);
      if(chapter.id==='night-4'&&chapter.lines[index].visual==='leaving'&&chapter.lines[index-1]?.visual!=='leaving')await page.screenshot({path:'test-results/fourth-night.png'});
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
  await expect(page.locator('#line-count')).toHaveText(`01 / ${chapters[0].lines.length}`);
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[0].en);
  await page.getByRole('button',{name:'继续阅读',exact:true}).click();
  await expect(page.locator('#line-count')).toHaveText(`02 / ${chapters[0].lines.length}`);
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
  await expect(page.locator('#dialogue')).toContainText(chapters[0].lines[0].text);
});

test('chapter travel reaches reading without using skip',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  await page.getByRole('button',{name:'开始第一夜',exact:true}).click();
  await expect(page.locator('#travel-overlay')).toBeVisible();
  await expect(page.locator('#reader')).toBeVisible({timeout:10000});
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[0].en);
});


test('central stage fits the viewport and travel removes competing home text',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  const canvas=await page.locator('#map-canvas').boundingBox();
  expect(Math.abs(canvas.x+canvas.width/2-720)).toBeLessThan(3);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+2)).toBe(true);
  await page.getByRole('button',{name:'开始第一夜',exact:true}).click();
  await expect(page.locator('.scene-heading')).toHaveCSS('visibility','hidden');
  await expect(page.locator('.journey-dock')).toHaveCSS('visibility','hidden');
  await page.screenshot({path:'test-results/travel-revised.png'});
  await page.getByRole('button',{name:'跳过过场 →'}).click();
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
  await page.getByRole('button',{name:'开始第一夜',exact:true}).click();
  await page.locator('#dialogue-en').dblclick({position:{x:40,y:10}});
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[0].en);
  await page.locator('#dialogue-en').evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);getSelection().removeAllRanges();getSelection().addRange(range)});
  await page.locator('#dialogue').dispatchEvent('click');
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[0].en);
  await page.getByRole('button',{name:'继续阅读',exact:true}).click();
  await page.getByRole('button',{name:'上一段',exact:true}).click();
  await expect(page.locator('#dialogue-en')).toHaveText(chapters[0].lines[0].en);
  await page.getByRole('button',{name:'开启阅读音乐',exact:true}).click();
  await expect(page.locator('#reader-sound')).toHaveAttribute('aria-pressed','true');
  await expect.poll(()=>page.evaluate(()=>window.readTestAudioPeak())).toBeGreaterThan(.001);
  await page.getByRole('slider',{name:'音乐音量'}).fill('70');
  await page.getByRole('button',{name:'关闭阅读音乐',exact:true}).click();
  await expect(page.locator('#reader-sound')).toHaveAttribute('aria-pressed','false');
});

test('music failure gives feedback without claiming playback',async({page})=>{
  await page.addInitScript(()=>{window.AudioContext=class{constructor(){throw new Error('device unavailable')}}});
  await page.goto('/');
  await page.getByRole('button',{name:'开始第一夜',exact:true}).click();
  await page.getByRole('button',{name:'开启阅读音乐',exact:true}).click();
  await expect(page.locator('#toast')).toContainText('音乐未能启动');
  await expect(page.locator('#reader-sound')).toHaveAttribute('aria-pressed','false');
  await page.getByRole('button',{name:'继续阅读',exact:true}).click();
  await expect(page.locator('#dialogue-zh')).toHaveText(chapters[0].lines[1].text);
});

test('short viewport keeps the paired text and reading controls accessible',async({page})=>{
  await page.setViewportSize({width:844,height:390});
  await page.goto('/');
  await page.getByRole('button',{name:'开始第一夜',exact:true}).click();
  const box=await page.locator('#next-line').boundingBox();
  expect(box.y+box.height).toBeLessThan(390);
  const textBox=await page.locator('#dialogue').boundingBox();
  expect(textBox.y).toBeGreaterThan(70);
  await page.screenshot({path:'test-results/reading-landscape.png'});
});
