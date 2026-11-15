const assert=require('node:assert/strict'),logic=require('../logic.js');
const digits=[1,2,3,4,5,6,7,8,9],blank=()=>Array.from({length:81},()=>new Set(digits)),board=Array(81).fill(0);
function check(kind,edit){const c=blank();edit(c);const before=c.map(s=>[...s]);const step=logic.next(board,c);assert.equal(step.kind,kind);assert.ok(step.removals.length);assert.deepEqual(c.map(s=>[...s]),before);return {c,step};}
for(const transpose of [false,true]){
 const index=(r,c)=>transpose?c*9+r:r*9+c;
 check('x-wing',c=>{for(const r of [0,3])for(let k=0;k<9;k++)if(![1,5].includes(k))c[index(r,k)].delete(1);});
 check('swordfish',c=>{for(const [r,cols] of [[0,[1,4]],[3,[4,7]],[6,[1,7]]])for(let k=0;k<9;k++)if(!cols.includes(k))c[index(r,k)].delete(1);});
}
const xy=check('xy-wing',c=>{c[0]=new Set([1,2]);c[4]=new Set([1,3]);c[36]=new Set([2,3]);});
assert.ok(xy.step.removals.some(r=>r.index===40&&r.number===3));
const xyz=check('xyz-wing',c=>{c[0]=new Set([1,2,3]);c[4]=new Set([1,3]);c[9]=new Set([2,3]);});
assert.ok(xyz.step.removals.some(r=>r.index===1&&r.number===3));
assert.ok(!xyz.step.removals.some(r=>r.index===13),'XYZ target must also see pivot');
// A bivalue pivot yields the same elimination via each assumed candidate.
const forcing=logic.forcingStep(board,xy.c);assert.equal(forcing.kind,'forcing-chain');assert.equal(forcing.proof.length,2);
function validateProof(c,step){
 for(const chain of step.proof){for(let k=1;k<chain.length;k++){
  const a=chain[k-1],b=chain[k];assert.notEqual(a.truth,b.truth);
  if(a.truth){assert.ok(a.index===b.index&&a.number!==b.number||a.number===b.number&&logic.peers(a.index,b.index));}
  else if(a.index===b.index){assert.equal(c[a.index].size,2);assert.notEqual(a.number,b.number);}
  else{assert.equal(a.number,b.number);assert.ok(logic.units.some(u=>u.cells.includes(a.index)&&u.cells.includes(b.index)&&u.cells.filter(i=>c[i].has(a.number)).length===2));}
 }
 const end=chain.at(-1);assert.equal(end.truth,false);assert.deepEqual({index:end.index,number:end.number},step.removals[0]);
 }
 if(step.kind==='aic'){assert.equal(step.proof[0][0].truth,true);assert.equal(step.proof[0][0].index,step.removals[0].index);assert.equal(step.proof[0][0].number,step.removals[0].number);}
 else{assert.equal(step.proof[0][0].index,step.proof[1][0].index);assert.notEqual(step.proof[0][0].number,step.proof[1][0].number);assert.equal(c[step.proof[0][0].index].size,2);}
}
validateProof(xy.c,forcing);
// Restrict candidates without excluding a known solution, then check every chain link.
const solved=Array.from({length:81},(_,i)=>(Math.floor(i/9)*3+Math.floor(i/27)+i%9)%9+1);
let seed=25,found=false;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/2**32;}
for(let attempt=0;attempt<100&&!found;attempt++){
 const c=blank().map((set,i)=>new Set([...set].filter(n=>n===solved[i]||random()<.3)));
 for(const set of c)while(set.size<3)set.add(1+Math.floor(random()*9));
 const step=logic.forcingStep(board,c);if(!step||step.kind!=='aic')continue;
 validateProof(c,step);for(const r of step.removals)assert.notEqual(r.number,solved[r.index]);found=true;
}
assert.ok(found,'Exercise an actual AIC contradiction');
// Every advanced chain used to grade the actual starting bank has a valid proof.
const fs=require('node:fs'),vm=require('node:vm');
const bank=vm.runInNewContext(fs.readFileSync('puzzles.js','utf8')+';SudokuPuzzles');
for(const encoded of bank.Expert){const input=encoded.split('').map(Number),grade=logic.grade(input),c=logic.candidates(input);assert.equal(grade.rank,4);for(const step of grade.steps){if(step.proof)validateProof(c,step);logic.apply(input,c,step);}}
// Random candidate states preserve a known complete grid; no deduction may remove it.
for(let attempt=0;attempt<200;attempt++){
 const c=blank().map((set,i)=>new Set([...set].filter(n=>n===solved[i]||random()<.35)));
 const step=logic.next(board,c);if(!step)continue;
 if(step.removals)for(const r of step.removals)assert.notEqual(r.number,solved[r.index]);else assert.equal(step.number,solved[step.index]);
 if(step.proof)validateProof(c,step);
}
assert.equal(logic.next(board,blank()),null);
console.log('Passed X-Wing/Swordfish in both orientations, XY/XYZ-Wing, dual forcing chains, and validated AIC proofs.');
module.exports={validateProof};
