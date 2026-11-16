const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function element(){return {children:[],dataset:{},hidden:false,value:'Medium',classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},addEventListener(){},append(v){this.children.push(v);},replaceChildren(){this.children=[];},showModal(){this.open=true;},close(){this.open=false;}};}
const storage=new Map();
const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);};
const context=vm.createContext({console,document:{getElementById:get,createElement:element,querySelectorAll:()=>[],querySelector:()=>element(),documentElement:element(),addEventListener(){},activeElement:{tagName:'BODY'}},window:{addEventListener(){}},localStorage:{getItem(k){return storage.get(k)??null;},setItem(k,v){storage.set(k,v);}},matchMedia:()=>({addEventListener(){}}),setInterval(){},setTimeout(){},clearTimeout(){},t:(s,p={})=>s.replace(/\{(\w+)\}/g,(_,k)=>p[k]??'')});
for(const file of ['logic.js','puzzles.js','script.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
assert.equal(get('board').children.length,81);
for(const level of ['Easy','Medium','Hard','Expert']){
 get('difficulty').value=level;
 for(let i=0;i<10;i++){vm.runInContext('newGame()',context);assert.equal(vm.runInContext('SudokuLogic.grade(puzzle).level',context),level);assert.ok(vm.runInContext('puzzle.filter(Boolean).length===SudokuLogic.clueLimits[$(\'difficulty\').value]',context));assert.equal(vm.runInContext('SudokuLogic.matchesLevel($(\'difficulty\').value,SudokuLogic.grade(puzzle))',context),true);if(level==='Expert')assert.equal(vm.runInContext('SudokuLogic.grade(puzzle).rank',context),4);}
}
// Reach an elimination, apply it through the UI, then undo and erase.
vm.runInContext(`{
 const seeds=SudokuPuzzles.Expert;const g=SudokuLogic.grade(seeds[0].split('').map(Number));
 values=seeds[0].split('').map(Number);puzzle=[...values];solution=g.solution;notes=Array.from({length:81},()=>new Set());candidateExclusions=[];
 for(const step of g.steps){if(step.removals)break;values[step.index]=step.number;}
 render();showHint();
}`,context);
assert.equal(vm.runInContext('!!currentHint.removals',context),true);
get('hint-apply').onclick();assert.ok(vm.runInContext('candidateExclusions.length',context)>0);
assert.ok(JSON.parse(storage.get('clear-sudoku')).candidateExclusions.length>0);
get('undo').onclick();assert.equal(vm.runInContext('candidateExclusions.length',context),0);
// Manual pencil removals feed hints, persist, and can be undone or added back.
vm.runInContext(`
 showHint();globalThis.manualRemoval={...currentHint.removals[0]};
 selected=manualRemoval.index;notes[selected].add(manualRemoval.number);noteMode=true;
 enter(manualRemoval.number);
`,context);
assert.equal(vm.runInContext('candidateExclusions.some(r=>r.index===manualRemoval.index&&r.number===manualRemoval.number)',context),true);
assert.ok(JSON.parse(storage.get('clear-sudoku')).candidateExclusions.some(r=>r.index===vm.runInContext('manualRemoval.index',context)&&r.number===vm.runInContext('manualRemoval.number',context)));
assert.equal(vm.runInContext('findHint(values)?.removals?.some(r=>r.index===manualRemoval.index&&r.number===manualRemoval.number)||false',context),false);
get('undo').onclick();
assert.equal(vm.runInContext('notes[manualRemoval.index].has(manualRemoval.number)&&candidateExclusions.length===0',context),true);
vm.runInContext('selected=manualRemoval.index;enter(manualRemoval.number);enter(manualRemoval.number);',context);
assert.equal(vm.runInContext('notes[manualRemoval.index].has(manualRemoval.number)&&candidateExclusions.length===0',context),true);
vm.runInContext('noteMode=false;',context);
// Quick notes fills the board without changing values, mode, or hint eliminations.
vm.runInContext(`
 showHint();candidateExclusions=currentHint.removals.map(r=>({...r}));
 notes=Array.from({length:81},()=>new Set());
`,context);
const beforeQuick=vm.runInContext('JSON.stringify({values,notes:notes.map(s=>[...s]),candidateExclusions,noteMode})',context);
get('quick-notes').onclick();
assert.equal(vm.runInContext(`notes.every((set,i)=>{
 const expected=SudokuLogic.candidates(values)[i];
 for(const r of candidateExclusions)if(r.index===i)expected.delete(r.number);
 return set.size===expected.size&&[...set].every(n=>expected.has(n));
})`,context),true);
assert.equal(vm.runInContext('JSON.stringify(values)',context),JSON.stringify(JSON.parse(beforeQuick).values));
assert.equal(vm.runInContext('noteMode',context),JSON.parse(beforeQuick).noteMode);
assert.ok(JSON.parse(storage.get('clear-sudoku')).notes.some(set=>set.length));
const filled=vm.runInContext('JSON.stringify(notes.map(s=>[...s]))',context);
const historySize=vm.runInContext('history.length',context);
get('quick-notes').onclick();assert.equal(vm.runInContext('history.length',context),historySize,'Repeated fill must not create another undo step');
get('undo').onclick();
assert.equal(vm.runInContext('JSON.stringify({values,notes:notes.map(s=>[...s]),candidateExclusions,noteMode})',context),beforeQuick);
for(const state of ['paused','finished']){
 vm.runInContext(state+'=true',context);get('quick-notes').onclick();
 assert.equal(vm.runInContext('JSON.stringify({values,notes:notes.map(s=>[...s]),candidateExclusions,noteMode})',context),beforeQuick);
 vm.runInContext(state+'=false',context);
}
console.log('Passed initialization, 40 rated new games, candidate hints, Quick notes, persistence, pause/finish guards, and undo.');
