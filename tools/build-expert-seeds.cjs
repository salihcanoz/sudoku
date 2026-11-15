// Usage: node tools/build-expert-seeds.cjs /path/to/sudoku17.49151.txt
// Source catalogue attribution and license: see PUZZLE_SOURCES.md.
const fs=require('node:fs'),logic=require('../logic.js'),{solve}=require('./puzzle-utils.cjs');
const file=process.argv[2];if(!file)throw Error('Pass the downloaded Royle 17-clue catalogue path');
let seed=20261115;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/2**32;}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const sources=shuffle(fs.readFileSync(file,'utf8').replace(/\./g,'0').split(/\s+/).filter(s=>/^[0-9]{81}$/.test(s))),accepted=[];
for(let attempt=0;attempt<sources.length&&accepted.length<8;attempt++){
 const source=sources[attempt],base=source.split('').map(Number),result=solve(base);
 if(result.count!==1)continue;
 const initial=logic.grade(base);
 const early=initial.steps.filter(step=>!step.removals).slice(0,3).map(step=>step.index);
 const board=[...base],empty=shuffle(board.flatMap((v,i)=>v?[]:[i]));
 const additions=early.length===3?early:empty.slice(0,3);
 for(const i of additions)board[i]=result.solution[i];
 const rating=logic.grade(board);if(!logic.matchesLevel('Expert',rating))continue;
 accepted.push({source,puzzle:board.join('')});console.log(attempt,accepted.length,rating.clues,JSON.stringify(rating.effort));
}
if(accepted.length!==8)throw Error('Not enough qualifying 20-clue Expert seeds');
fs.writeFileSync(process.argv[3]||'tools/expert-seeds.json',JSON.stringify(accepted,null,2)+'\n');
