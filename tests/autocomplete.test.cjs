const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function harness(reduced=false,saved=null){
 const timers=[],nodes=new Map(),storage=new Map(saved?[['clear-sudoku',saved]]:[]);
 function element(){const classes=new Set(),listeners={};return {children:[],dataset:{},open:false,classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),toggle(){},contains:c=>classes.has(c)},setAttribute(k,v){this[k]=v;},addEventListener(k,f){listeners[k]=f;},fire(k){listeners[k]?.();},append(v){this.children.push(v);},replaceChildren(){this.children=[];},showModal(){this.open=true;},close(){this.open=false;},value:'Medium'};}
 const get=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);};
 const ctx=vm.createContext({console,document:{getElementById:get,createElement:element,querySelectorAll:()=>[],querySelector:s=>get(s),documentElement:element(),addEventListener(){},activeElement:{tagName:'BODY'}},window:{addEventListener(){}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},matchMedia:q=>({matches:q.includes('reduced-motion')&&reduced,addEventListener(){}}),setInterval(){},setTimeout(f,ms){timers.push({f,ms});return timers.length;},clearTimeout(){},t:s=>s});
 for(const file of ['logic.js','puzzles.js','script.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 const run=s=>vm.runInContext(s,ctx);
 function fixture(indices=Array.from({length:9},(_,i)=>i)){
  run(`solution=Array.from({length:81},(_,i)=>(Math.floor(i/9)*3+Math.floor(i/27)+i%9)%9+1);values=[...solution];puzzle=Array(81).fill(0);for(const i of ${JSON.stringify(indices)})values[i]=0;notes=Array.from({length:81},()=>new Set());candidateExclusions=[];paused=false;finished=false;completing=false;autoCompleteDeclined=false;mistakes=0;selected=9;render();`);
  get('dialog').close();get('auto-complete-dialog').close();
 }
 return {timers,get,run,fixture,storage};
}
(async()=>{
 const h=harness();h.timers.shift().f();h.fixture();
 assert.equal(h.run('completionPlan().length'),9);
 h.run('offerAutoComplete()');assert.ok(h.get('auto-complete-dialog').open);
 h.get('auto-complete-no').onclick();assert.ok(!h.get('auto-complete-dialog').open);
 h.run('offerAutoComplete()');assert.ok(!h.get('auto-complete-dialog').open);
 assert.equal(JSON.parse(h.storage.get('clear-sudoku')).autoCompleteDeclined,true);
 const restored=harness(false,h.storage.get('clear-sudoku'));restored.timers.shift().f();assert.ok(!restored.get('auto-complete-dialog').open);
 h.fixture(Array.from({length:10},(_,i)=>i));assert.equal(h.run('completionPlan()'),null);
 h.fixture([0,3,6,9,12,15,18,21,24]);assert.equal(h.run('completionPlan()'),null,'Ambiguous candidates must not prompt');
 h.fixture();h.run('values[20]=solution[20]%9+1');assert.equal(h.run('completionPlan()'),null);
 for(const state of ['paused','finished']){h.fixture();h.run(state+'=true;offerAutoComplete()');assert.ok(!h.get('auto-complete-dialog').open);}
 h.fixture();h.run('offerAutoComplete()');h.get('auto-complete-dialog').fire('cancel');assert.equal(h.run('autoCompleteDeclined'),true);
 // A correct move triggers the offer, without relying on manual candidate notes.
 h.fixture(Array.from({length:10},(_,i)=>i));h.run('selected=9;enter(solution[9])');assert.ok(h.get('auto-complete-dialog').open);
 const animation=h.get('auto-complete-yes').onclick();
 assert.equal(h.run('completing'),true);assert.equal(h.get('board').inert,true);assert.equal(h.get('difficulty').disabled,true);
 assert.equal(h.run('values.filter(v=>!v).length'),8,'Animation fills one cell at a time');
 const during=h.run('JSON.stringify(values)');h.get('erase').onclick();h.get('undo').onclick();h.run('enter(9)');assert.equal(h.run('JSON.stringify(values)'),during);
 let ticks=0;while(h.timers.length){h.timers.shift().f();await Promise.resolve();await Promise.resolve();if(++ticks>30)throw Error('Animation did not terminate');}
 await animation;
 assert.equal(h.run('values.every((v,i)=>v===solution[i])'),true);assert.equal(h.run('finished'),true);assert.equal(h.run('completing'),false);
 assert.ok(h.get('dialog').open);assert.equal(h.get('difficulty').disabled,false);assert.equal(JSON.parse(h.storage.get('clear-sudoku')).finished,true);
 // Reduced motion retains completion while skipping the animation delays.
 const r=harness(true);r.timers.shift().f();r.fixture([0,1]);const reduced=r.get('auto-complete-yes').onclick();
 while(r.timers.length){const timer=r.timers.shift();assert.equal(timer.ms,0);timer.f();await Promise.resolve();await Promise.resolve();}await reduced;assert.equal(r.run('finished'),true);
 // A new game invalidates pending animation work.
 const c=harness();c.timers.shift().f();c.fixture();const cancelled=c.get('auto-complete-yes').onclick();c.run('newGame()');const fresh=c.run('JSON.stringify(values)');
 while(c.timers.length){c.timers.shift().f();await Promise.resolve();await Promise.resolve();}await cancelled;assert.equal(c.run('JSON.stringify(values)'),fresh);assert.equal(c.run('finished'),false);
 console.log('Passed completion eligibility, Yes/No/Escape, persistence, sequential animation, input locks, reduced motion, and cancellation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
