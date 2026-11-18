const vm=require('vm'),fs=require('fs'),assert=require('assert/strict');
const { test } = require('node:test');
test('randomized decoration falls settle within the card and follow its floor on resize', () => {
const source=fs.readFileSync('js/app.js','utf8');
const fn=source.slice(source.indexOf('  function dropSquares('),source.indexOf("  document.querySelectorAll('.card-decoration').forEach",source.indexOf('  function dropSquares(')));
for(let seed=1;seed<=30;seed++){
 let randomSeed=seed, frames=[], pieces=[], resizeCallback;
 const card={clientWidth:250,clientHeight:242,appendChild:p=>pieces.push(p)};
 const randomMath=Object.create(Math);randomMath.random=()=>{randomSeed=(randomSeed*1664525+1013904223)>>>0;return randomSeed/4294967296};
 const context={Math:randomMath,motionPreference:{matches:false,addEventListener(){}},document:{createElement:()=>({style:{},setAttribute(){}})},window:{requestAnimationFrame:f=>frames.push(f),cancelAnimationFrame(){}},ResizeObserver:class{constructor(f){resizeCallback=f}observe(){}}};
 vm.runInNewContext(fn+'\ndropSquares(decoration);',{...context,decoration:{offsetLeft:212,offsetTop:13,closest:()=>card}});
 let n=0, previousAngles;
 while(frames.length && n<1800){
  frames.shift()(++n*1000/60);
  const angles=pieces.map(p=>Number(p.style.transform.match(/rotate\(([-\d.e+]+)rad\)/)[1]));
  if(previousAngles)angles.forEach((angle,i)=>{
   const delta=angle-previousAngles[i];
   const visibleTurn=Math.atan2(Math.sin(delta*4),Math.cos(delta*4))/4;
   assert(Math.abs(visibleTurn)*60<12,'rapid spin seed '+seed);
  });
  previousAngles=angles;
 }
 assert(n<1800,'never settles seed '+seed);
 for(const p of pieces){const m=p.style.transform.match(/translate\(([-\d.e+]+)px, ([-\d.e+]+)px\) rotate\(([-\d.e+]+)rad\)/);assert(m);const [x,y,angle]=m.slice(1).map(Number);assert(x>=-.05&&x+25<=250.05);assert(y+25<=242.05);}
 card.clientHeight=180;card.clientWidth=360;resizeCallback();
 for(const p of pieces)assert(p.style.transform.includes(', 155px)'));
 card.clientWidth=75;resizeCallback();
 const landingXs=pieces.map(p=>Number(p.style.transform.match(/translate\(([-\d.e+]+)px/)[1])).sort((a,b)=>a-b);
 assert.deepEqual(landingXs,[0,25,50],'touching squares should have no gap');
}
});
