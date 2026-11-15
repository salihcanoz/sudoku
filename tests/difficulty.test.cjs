const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),logic=require('../logic.js');
// Formerly accepted boards with only one bottleneck must fail the new policy.
for(const encoded of ['090080063100306000002070000000700630006294010000003002620007000000530400500042000','004500000000001060172009000300020041728000000001903000000090280080714506590000017']){
 const rating=logic.grade(encoded.split('').map(Number));assert.ok(rating.solved);assert.equal(logic.matchesLevel('Hard',rating),false);assert.equal(logic.matchesLevel('Expert',rating),false);
}
const crowded=logic.grade('007630021650012049021400030069000210000520000208706350036175492100240000002963185'.split('').map(Number));
assert.equal(crowded.solved,true);assert.equal(crowded.level,'Easy');assert.ok(crowded.clues>logic.clueLimits.Easy);assert.equal(logic.matchesLevel('Easy',crowded),false);
const bank=vm.runInNewContext(fs.readFileSync('puzzles.js','utf8')+';SudokuPuzzles');
for(const [level,seeds] of Object.entries(bank))for(const seed of seeds){const clues=seed.split('').filter(n=>n!=='0').length;assert.equal(clues,logic.clueLimits[level],level+' must use its exact starting clue count');}
for(const level of ['Hard','Expert'])for(const seed of bank[level]){
 const rating=logic.grade(seed.split('').map(Number));assert.equal(logic.matchesLevel(level,rating),true);
 const {effort:e}=rating;assert.ok(e.eliminationSteps>=5);assert.ok(e.eliminationPhases>=2);assert.ok(e.firstElimination<=12);
 if(level==='Expert'){assert.ok(e.eliminationSteps>=10);assert.ok(e.advancedSteps>=6);assert.ok(e.advancedPhases>=3);assert.ok(e.firstElimination<=8);assert.ok(e.initialSingles<=2);}
}
// Eligibility must reject unsolved boards and levels requiring less/more effort.
assert.equal(logic.matchesLevel('Expert',{solved:false}),false);
assert.equal(logic.matchesLevel('Hard',logic.grade(bank.Easy[0].split('').map(Number))),false);
console.log('Passed sustained-difficulty thresholds for all Hard/Expert seeds and rejection of former one-bottleneck puzzles.');
