const fs=require('node:fs'),logic=require('../logic.js'),{solve}=require('./puzzle-utils.cjs');
const bank={Easy:[],Medium:[],Hard:[],Expert:require('./expert-seeds.json').map(entry=>entry.puzzle)};
for(const encoded of bank.Expert){const board=encoded.split('').map(Number);if(solve(board).count!==1||!logic.matchesLevel('Expert',logic.grade(board)))throw Error('Invalid Expert seed');}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function complete(board){let best=-1,opts;for(let i=0;i<81;i++)if(!board[i]){const p=[1,2,3,4,5,6,7,8,9].filter(n=>!board.some((v,j)=>v===n&&logic.peers(i,j)));if(!p.length)return false;if(!opts||p.length<opts.length){best=i;opts=p;}}if(best<0)return true;for(const n of shuffle(opts)){board[best]=n;if(complete(board))return true;}board[best]=0;return false;}
for(let attempt=0;Object.values(bank).some(v=>v.length<8);attempt++){
 const collected=new Set(),b=Array(81).fill(0);complete(b);
 for(const i of shuffle(Array.from({length:81},(_,i)=>i))){const old=b[i];b[i]=0;if(solve(b).count!==1){b[i]=old;continue;}
 const clues=b.filter(Boolean).length;
 if(!Object.keys(bank).some(level=>bank[level].length<8&&!collected.has(level)&&clues===logic.clueLimits[level]))continue;
 const g=logic.grade(b);if(logic.matchesLevel(g.level,g)&&!collected.has(g.level)&&bank[g.level].length<8&&!bank[g.level].some(p=>p===b.join(''))){collected.add(g.level);bank[g.level].push(b.join(''));console.log(attempt,g.level,bank[g.level].length,g.clues+' clues',JSON.stringify(g.effort));}
 }
}
fs.writeFileSync('puzzles.js',"'use strict';\nconst SudokuPuzzles="+JSON.stringify(bank,null,2)+';\n');
