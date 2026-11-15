const assert=require('node:assert/strict'),{solve}=require('../tools/puzzle-utils.cjs');
const source='000000010400000000020000000000050407008000300001090000300400200050100000000806000'.split('').map(Number),before=[...source];
const result=solve(source);assert.equal(result.count,1);assert.deepEqual(source,before);assert.ok(result.solution.every(n=>n>=1&&n<=9));
assert.equal(solve(Array(81).fill(0)).count,2,'Stop after detecting non-unique boards');
const conflict=Array(81).fill(0);conflict[0]=conflict[1]=1;assert.equal(solve(conflict).count,0);
assert.equal(solve(result.solution).count,1);
for(const entry of require('../tools/expert-seeds.json')){
 const source=entry.source.split('').map(Number),derived=entry.puzzle.split('').map(Number),initial=solve(source),added=derived.filter((v,i)=>!source[i]&&v).length;
 assert.equal(initial.count,1);assert.equal(source.filter(Boolean).length,17);assert.equal(derived.filter(Boolean).length,20);assert.equal(added,3);
 assert.ok(source.every((v,i)=>!v||derived[i]===v));assert.ok(derived.every((v,i)=>!v||initial.solution[i]===v));assert.equal(solve(derived).count,1);
}
console.log('Passed masked uniqueness solver: unique, multiple, conflicting, and complete boards; input preserved.');
