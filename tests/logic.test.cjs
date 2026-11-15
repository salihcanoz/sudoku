const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),logic=require('../logic.js');
const digits=[1,2,3,4,5,6,7,8,9];
function check(kind,edit){const c=Array.from({length:81},()=>new Set(digits));edit(c);const step=logic.next(Array(81).fill(0),c);assert.equal(step.kind,kind);assert.ok(step.removals.length);const before=c.map(s=>new Set(s)),board=Array(81).fill(0);logic.apply(board,c,step);for(const r of step.removals){assert.ok(before[r.index].has(r.number));assert.ok(!c[r.index].has(r.number));}}
check('pointing',c=>{for(const i of [2,9,10,11,18,19,20])c[i].delete(1);});
check('pointing',c=>{for(const i of [9,10,11,18,19,20])c[i].delete(1);});
check('claiming',c=>{for(let i=2;i<9;i++)c[i].delete(1);});
check('claiming',c=>{for(let i=3;i<9;i++)c[i].delete(1);});
check('naked-pair',c=>{c[0]=new Set([1,2]);c[1]=new Set([1,2]);});
check('naked-triple',c=>{c[0]=new Set([1,2]);c[1]=new Set([2,3]);c[2]=new Set([1,3]);});
check('hidden-pair',c=>{for(const i of [1,2,3,5,6,7,8]){c[i].delete(1);c[i].delete(2);}});
check('hidden-triple',c=>{for(const i of [1,2,3,5,6,7])for(const n of [1,2,3])c[i].delete(n);});
const bank=vm.runInNewContext(fs.readFileSync('puzzles.js','utf8')+';SudokuPuzzles');
const {solve}=require('../tools/puzzle-utils.cjs');
let total=0;for(const [level,puzzles] of Object.entries(bank))for(const encoded of puzzles){
 const input=encoded.split('').map(Number),original=[...input],grade=logic.grade(input);
 assert.equal(grade.solved,true);assert.equal(grade.level,level);assert.equal(logic.matchesLevel(level,grade),true);if(level==='Expert')assert.equal(grade.rank,4);assert.deepEqual(input,original);assert.equal(solve(input).count,1);
 const board=[...input],c=logic.candidates(board);
 for(const step of grade.steps){if(step.removals)for(const r of step.removals)assert.notEqual(r.number,grade.solution[r.index],'Elimination must preserve the solution');else assert.equal(step.number,grade.solution[step.index]);logic.apply(board,c,step);}
 for(const unit of logic.units)assert.equal(new Set(unit.cells.map(i=>board[i])).size,9);
 total++;
}
console.log(`Passed all six elimination techniques and ${total} uniquely solvable, correctly graded puzzles.`);
