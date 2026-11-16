const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('script.js', 'utf8');
const context = vm.createContext({});
const logic=require('../logic.js');
context.SudokuLogic=logic;context.candidateExclusions=[];context.notes=[];
vm.runInContext(source.slice(source.indexOf('function findHint('), source.indexOf('function clearHint(')), context);
context.peers=logic.peers;
const hint = (board, preferred = -1) => context.findHint(board, preferred);
const solved = Array.from({length:81}, (_, i) => (Math.floor(i/9)*3+Math.floor(i/27)+i%9)%9+1);
const single = [...solved]; single[40] = 0;
assert.equal(hint(single).kind, 'single');
assert.equal(hint(single).index, 40);
assert.equal(hint(single).number, solved[40]);
assert.equal(hint(Array(81).fill(0)), null);
assert.equal(hint(solved), null);
// A partial grid with no naked singles, but a hidden single.
const board = '000050780000000103009123000004507001000091004000004000045000000070000000000000008'.split('').map(Number);
const before = JSON.stringify(board);
const result = hint(board);
assert.ok(result && result.kind !== 'single');
assert.equal(JSON.stringify(board), before, 'Finding a hint must not change the board');
assert.equal(board[result.index], 0);
assert.ok(!board.some((v,i) => v === result.number && context.peers(i,result.index)));
const candidates = i => [1,2,3,4,5,6,7,8,9].filter(n => !board.some((v,j) => v===n && context.peers(i,j)));
assert.deepEqual(Array.from(result.unit).filter(i => !board[i] && candidates(i).includes(result.number)), [result.index]);
console.log('Passed: single candidates, hidden singles, complete/empty boards, and non-mutating hints.');

// Existing pencil notes constrain hints even when exclusion history is unavailable.
context.notes=Array.from({length:81},()=>new Set());
context.notes[0]=new Set([2,3]);
const noted=context.hintCandidates(Array(81).fill(0));
assert.deepEqual([...noted[0]],[2,3]);
assert.equal(noted[1].size,9,'Untouched cells retain legal candidates');
context.notes[0].delete(3);
assert.equal(hint(Array(81).fill(0)).number,2);
