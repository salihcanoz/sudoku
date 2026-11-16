'use strict';
const $=id=>document.getElementById(id);
let candidateExclusions=[];
let highlightedNumber=0;
let completing=false,autoCompleteDeclined=false,completionRun=0;
let solution=[],puzzle=[],values=[],notes=[],selected=-1,history=[],mistakes=0,seconds=0,paused=false,finished=false,noteMode=false;
const peers=(a,b)=>Math.floor(a/9)===Math.floor(b/9)||a%9===b%9||(Math.floor(a/27)===Math.floor(b/27)&&Math.floor(a%9/3)===Math.floor(b%9/3));
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function generate(){
 const level=$('difficulty').value,source=SudokuPuzzles[level];
 const seed=source[Math.floor(Math.random()*source.length)].split('').map(Number);
 const rows=shuffle([0,1,2]).flatMap(b=>shuffle([0,1,2]).map(r=>b*3+r));
 const cols=shuffle([0,1,2]).flatMap(b=>shuffle([0,1,2]).map(c=>b*3+c));
 const digits=shuffle([1,2,3,4,5,6,7,8,9]),transpose=Math.random()<.5;
 puzzle=rows.flatMap(r=>cols.map(c=>{const v=seed[transpose?c*9+r:r*9+c];return v?digits[v-1]:0;}));
 let rating=SudokuLogic.grade(puzzle);
 if(!SudokuLogic.matchesLevel(level,rating)){puzzle=[...seed];rating=SudokuLogic.grade(puzzle);}
 if(!SudokuLogic.matchesLevel(level,rating))throw Error('Puzzle does not match its technique rating');
 solution=rating.solution;
}
function save(){try{localStorage.setItem('clear-sudoku',JSON.stringify({solution,puzzle,values,notes:notes.map(n=>[...n]),mistakes,seconds,difficulty:$('difficulty').value,candidateExclusions,autoCompleteDeclined,finished}));}catch{}}
function render(){clearHint();if(selected>=0&&values[selected])highlightedNumber=values[selected];const board=$('board');board.replaceChildren();values.forEach((v,i)=>{const cell=document.createElement('button');cell.className='cell';cell.setAttribute('role','gridcell');cell.setAttribute('aria-label',t('Row {row}, column {column}, {value}{given}',{row:Math.floor(i/9)+1,column:i%9+1,value:v||t('empty'),given:puzzle[i]?t(', given'):''}));cell.tabIndex=i===(selected<0?0:selected)?0:-1;if(puzzle[i])cell.classList.add('fixed');if(selected>=0&&peers(i,selected))cell.classList.add('peer');if(v&&v===highlightedNumber)cell.classList.add('same');if(i===selected)cell.classList.add('selected');if(v&&v!==solution[i])cell.classList.add('error');if(v)cell.textContent=v;else if(notes[i].size){const pencil=document.createElement('span');pencil.className='pencil';for(let n=1;n<=9;n++){const s=document.createElement('span');s.textContent=notes[i].has(n)?n:'';if(notes[i].has(n))s.onclick=e=>{e.stopPropagation();removeCandidate(i,n);};if(notes[i].has(n)&&n===highlightedNumber)s.classList.add('same-note');pencil.append(s);}cell.append(pencil);}cell.onclick=()=>{if(paused||finished||completing)return;selected=i;render();};board.append(cell);});$('mistakes').textContent=mistakes;$('notes').classList.toggle('active',noteMode);$('notes').setAttribute('aria-pressed',noteMode);$('notes-badge').textContent=t(noteMode?'ON':'OFF');for(const btn of $('numpad').children){const n=+btn.dataset.number;btn.classList.toggle('complete',values.filter(v=>v===n).length===9);}save();}
function snapshot(){history.push({candidateExclusions:candidateExclusions.map(r=>({...r})),values:[...values],notes:notes.map(n=>new Set(n))});if(history.length>150)history.shift();}
function removeCandidate(index,number){
 if(paused||finished||completing||puzzle[index]||values[index]||!notes[index].has(number))return;
 snapshot();selected=index;highlightedNumber=number;notes[index].delete(number);
 if(!candidateExclusions.some(r=>r.index===index&&r.number===number))candidateExclusions.push({index,number});
 render();
}
function notify(message){$('toast').dataset.message=message;$('toast').textContent=t(message);$('toast').classList.add('visible');clearTimeout(notify.timeout);notify.timeout=setTimeout(()=>$('toast').classList.remove('visible'),2800);}
function enter(n,hint=false){if(paused||finished||completing)return;if(selected<0){notify('Choose a square first.');return;}if(puzzle[selected]){notify('This number is part of the puzzle.');return;}snapshot();highlightedNumber=n;if(noteMode&&!hint){if(!values[selected]){if(notes[selected].has(n)){notes[selected].delete(n);if(!candidateExclusions.some(r=>r.index===selected&&r.number===n))candidateExclusions.push({index:selected,number:n});}else{notes[selected].add(n);candidateExclusions=candidateExclusions.filter(r=>r.index!==selected||r.number!==n);}}}else{if(values[selected]===n){history.pop();return;}candidateExclusions=[];values[selected]=n;notes[selected].clear();if(n!==solution[selected]){mistakes++;notify('Not quite. Take another look.');}else for(let i=0;i<81;i++)if(peers(i,selected))notes[i].delete(n);}render();if(values.every((v,i)=>v===solution[i])){finished=true;showDialog('A well-earned victory.','You found a place for every number. Take a breath — you did it.');save();}else if(mistakes>=3){finished=true;showDialog('A fresh start awaits.','Three mistakes, plenty learned. Try a new puzzle and find your rhythm again.');save();}else if(!noteMode||hint)offerAutoComplete();}
function showDialog(title,text){$('dialog-title').dataset.message=title;$('dialog-text').dataset.message=text;$('dialog-title').textContent=t(title);$('dialog-text').textContent=t(text);$('dialog-action').dataset.message='Play again';$('dialog-action').textContent=t('Play again');$('dialog').showModal();}
function updateTime(){$('timer').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
function newGame(){completionRun++;completing=false;autoCompleteDeclined=false;$('auto-complete-dialog').close();setCompletionLock(false);generate();highlightedNumber=0;candidateExclusions=[];values=[...puzzle];notes=Array.from({length:81},()=>new Set());selected=-1;history=[];mistakes=0;seconds=0;paused=false;finished=false;noteMode=false;$('resume').hidden=true;$('board').inert=false;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label',t('Pause game'));updateTime();render();}
function pause(){if(finished||completing)return;clearHint();paused=!paused;$('resume').hidden=!paused;$('pause').textContent=paused?'▷':'Ⅱ';$('pause').setAttribute('aria-label',t(paused?'Resume game':'Pause game'));$('board').inert=paused;}
for(let n=1;n<=9;n++){const b=document.createElement('button');b.className='number';b.textContent=n;b.dataset.number=n;b.setAttribute('aria-label',t('Enter {number}',{number:n}));b.onclick=()=>enter(n);$('numpad').append(b);}
$('new-game').onclick=()=>{if(completing)return;if(seconds>0&&!finished){showDialog('Start a fresh puzzle?','Your current progress will be replaced.');$('dialog-action').dataset.message='Start new game';$('dialog-action').textContent=t('Start new game');}else newGame();};$('dialog-action').onclick=()=>{$('dialog').close();$('dialog-action').textContent=t('Play again');newGame();};$('dialog-close').onclick=()=>$('dialog').close();$('difficulty').onchange=newGame;$('pause').onclick=pause;$('resume').onclick=pause;$('notes').onclick=()=>{if(completing)return;noteMode=!noteMode;render();};$('erase').onclick=()=>{if(selected<0||puzzle[selected]||paused||finished||completing)return;snapshot();candidateExclusions=[];values[selected]=0;notes[selected].clear();render();};$('undo').onclick=()=>{if(paused||finished||completing)return;const old=history.pop();if(!old){notify('No moves to undo yet.');return;}values=old.values;notes=old.notes;candidateExclusions=old.candidateExclusions||[];render();};$('hint').onclick=showHint;
$('quick-notes').onclick=()=>{
 if(paused||finished||completing)return;
 const candidates=SudokuLogic.candidates(values);
 for(const r of candidateExclusions)candidates[r.index].delete(r.number);
 const changed=candidates.some((set,i)=>set.size!==notes[i].size||[...set].some(n=>!notes[i].has(n)));
 if(changed){snapshot();notes=candidates;render();}
 notify('All candidates filled.');
};
function syncTheme(){const dark=document.documentElement.classList.contains('dark');$('theme').textContent=dark?'☀':'☾';$('theme').setAttribute('aria-pressed',String(dark));document.querySelector('meta[name="theme-color"]').content=dark?'#111923':'#3478de';}
$('theme').onclick=()=>{document.documentElement.classList.toggle('dark');syncTheme();try{localStorage.setItem('sudoku-dark',document.documentElement.classList.contains('dark'));}catch{}};
const systemTheme=matchMedia('(prefers-color-scheme: dark)');
systemTheme.addEventListener('change',event=>{let preference=null;try{preference=localStorage.getItem('sudoku-dark');}catch{}if(preference===null){document.documentElement.classList.toggle('dark',event.matches);syncTheme();}});
syncTheme();
document.addEventListener('keydown',e=>{if(completing||$('auto-complete-dialog').open||$('dialog').open||['SELECT','INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;if(/^[1-9]$/.test(e.key)){e.preventDefault();enter(+e.key);}else if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();$('erase').click();}else if(e.key.toLowerCase()==='n')$('notes').click();else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();$('undo').click();}else if(e.key.startsWith('Arrow')&&!paused&&!finished&&!completing){e.preventDefault();if(selected<0)selected=0;else{const r=Math.floor(selected/9),c=selected%9;selected=e.key==='ArrowRight'?r*9+(c+1)%9:e.key==='ArrowLeft'?r*9+(c+8)%9:e.key==='ArrowDown'?((r+1)%9)*9+c:((r+8)%9)*9+c;}render();$('board').children[selected].focus();}});
try{const s=JSON.parse(localStorage.getItem('clear-sudoku'));if(!s||s.solution?.length!==81||s.values?.length!==81||s.puzzle?.length!==81||s.notes?.length!==81)throw Error();({solution,puzzle,values,mistakes,seconds,finished}=s);notes=s.notes.map(n=>new Set(n));candidateExclusions=s.candidateExclusions||[];autoCompleteDeclined=!!s.autoCompleteDeclined;$('difficulty').value=s.difficulty;render();updateTime();}catch{newGame();}setInterval(()=>{if(!paused&&!finished&&!completing&&!$('auto-complete-dialog').open&&!document.hidden){seconds++;updateTime();if(seconds%5===0)save();}},1000);window.addEventListener('beforeunload',save);

document.addEventListener('languagechange',()=>{render();$('pause').setAttribute('aria-label',t(paused?'Resume game':'Pause game'));for(const btn of $('numpad').children)btn.setAttribute('aria-label',t('Enter {number}',{number:btn.dataset.number}));for(const id of ['dialog-title','dialog-text','dialog-action']){const node=$(id);if(node.dataset.message)node.textContent=t(node.dataset.message);}$('toast').classList.remove('visible');});


// Hints derive simple deductions from the visible board, not the answer key.
let currentHint=null;
function findHint(board,preferred=-1){
 return SudokuLogic.next(board,hintCandidates(board),preferred);
}
function hintCandidates(board){
 const candidates=SudokuLogic.candidates(board);
 for(const r of candidateExclusions)candidates[r.index].delete(r.number);
 // A square with pencil notes uses those candidates; untouched squares use legal candidates.
 for(let i=0;i<81;i++)if(notes[i]?.size)for(const n of candidates[i])if(!notes[i].has(n))candidates[i].delete(n);
 return candidates;
}
function clearHint(){
 // render() also runs during startup, before hint state is initialized.
 $('hint-panel').hidden=true;
 document.querySelectorAll('.hint-target,.hint-context,.hint-elimination').forEach(cell=>cell.classList.remove('hint-target','hint-context','hint-elimination'));
}
function updateHintText(){
 if(!currentHint||$('hint-panel').hidden)return;
 const h=currentHint;
 if(h.removals){
 const titles={'x-wing':'X-Wing',swordfish:'Swordfish','xy-wing':'XY-Wing','xyz-wing':'XYZ-Wing',aic:'Alternating inference chain','forcing-chain':'Forcing chain',pointing:'Pointing pair / triple',claiming:'Claiming pair / triple','naked-pair':'Naked pair','naked-triple':'Naked triple','hidden-pair':'Hidden pair','hidden-triple':'Hidden triple'};
 const reasons={'x-wing':'Two rows or columns confine this digit to the same two crossing lines. Remove it from the rest of those crossing lines.',swordfish:'Three rows or columns confine this digit to three crossing lines. Remove it from the rest of those crossing lines.','xy-wing':'The two-candidate pivot forces one of its wings to contain the shared digit. Remove that digit from squares that see both wings.','xyz-wing':'Every pivot option forces the shared digit into the pivot or a wing. Remove it only from squares that see all three.',aic:'Assuming this candidate is true leads through alternating strong and weak links to it being false. The candidate can be removed.','forcing-chain':'Both choices in a two-candidate square lead to the same elimination. The candidate can be removed.',pointing:'Within the box, this digit is confined to one row or column. Remove it from that line outside the box.',claiming:'Within the row or column, this digit is confined to one box. Remove it from the other squares in that box.','naked-pair':'Two squares share only two digits. Remove those digits from the other squares in the unit.','naked-triple':'Three squares contain only three digits between them. Remove those digits from the other squares in the unit.','hidden-pair':'Two digits can only go in these two squares. Remove the other candidates from those squares.','hidden-triple':'Three digits can only go in these three squares. Remove the other candidates from those squares.'};
 $('hint-title').textContent=t(titles[h.kind]);
 $('hint-text').textContent=t(reasons[h.kind])+' '+h.removals.map(r=>t('R{row} C{column}: remove {number}',{row:Math.floor(r.index/9)+1,column:r.index%9+1,number:r.number})).join('; ');
 if(h.proof){const proof=document.createElement('span');proof.className='hint-proof';proof.textContent=h.proof.map(chain=>chain.map(v=>'R'+(Math.floor(v.index/9)+1)+' C'+(v.index%9+1)+(v.truth?' = ':' ≠ ')+v.number).join(' → ')).join('\n');$('hint-text').append(proof);}
 $('hint-apply').textContent=t('Update candidates');return;
 }
 const params={row:Math.floor(h.index/9)+1,column:h.index%9+1,number:h.number};
 const messages={
  single:'Row {row}, column {column}: {number} is the only remaining candidate after checking the row, column, box, and earlier deductions.',
  row:'In this row, {number} can only go in column {column}. All other positions have been ruled out by Sudoku constraints and earlier deductions.',
  column:'In this column, {number} can only go in row {row}. All other positions have been ruled out by Sudoku constraints and earlier deductions.',
  box:'In this 3 × 3 box, {number} can only go in row {row}, column {column}. All other positions have been ruled out by Sudoku constraints and earlier deductions.',
  error:'Row {row}, column {column} has an incorrect number. Clear it and reconsider the numbers in its row, column, and box.',
  reveal:'No supported logical step was found. You can keep working or choose to reveal this square.'
 };
 $('hint-title').textContent=t({single:'Only one candidate',row:'Only place in a row',column:'Only place in a column',box:'Only place in a box',error:'Check this square',reveal:'A harder next step'}[h.kind]);
 $('hint-text').textContent=t(messages[h.kind],params);
 $('hint-apply').textContent=t(h.kind==='error'?'Clear this square':h.kind==='reveal'?'Reveal this square':'Place {number}',params);
}
function showHint(){
 if(paused||finished||completing)return;
 const wrong=values.findIndex((v,i)=>v&&v!==solution[i]);
 let hint=wrong>=0?{index:wrong,kind:'error',unit:[]}:findHint(values,selected);
 if(!hint){const index=selected>=0&&!values[selected]?selected:values.findIndex(v=>!v);if(index<0)return;hint={index,number:solution[index],kind:'reveal',unit:[]};}
 if(hint.removals?.length)highlightedNumber=hint.removals[0].number;
 selected=hint.index;render();currentHint=hint;
 const cells=$('board').children;
 hint.unit.forEach(i=>{if(i!==hint.index)cells[i].classList.add('hint-context');});
 cells[hint.index].classList.add('hint-target');
 if(hint.removals){hint.pattern.forEach(i=>cells[i].classList.add('hint-target'));hint.removals.forEach(r=>cells[r.index].classList.add('hint-elimination'));}
 $('hint-panel').hidden=false;updateHintText();
}
$('hint-close').onclick=clearHint;
$('hint-apply').onclick=()=>{
 if(paused||finished||completing||$('hint-panel').hidden||!currentHint)return;
 const hint=currentHint;selected=hint.index;
 if(hint.removals){snapshot();candidateExclusions.push(...hint.removals);notes=hintCandidates(values);render();}
 else if(hint.kind==='error')$('erase').click();else enter(hint.number,true);
};
document.addEventListener('languagechange',updateHintText);


// Unique puzzles have one solution from the start. Offer help only in the final
// nine squares, when each remaining square is already a direct naked single.
function completionPlan(){
 const empty=values.flatMap((v,i)=>v?[]:[i]);
 if(!empty.length||empty.length>9||values.some((v,i)=>v&&v!==solution[i]))return null;
 const candidates=SudokuLogic.candidates(values);
 if(empty.some(i=>candidates[i].size!==1||!candidates[i].has(solution[i])))return null;
 return empty.map(index=>({index,number:[...candidates[index]][0]}));
}
function offerAutoComplete(){
 if(paused||finished||completing||autoCompleteDeclined||$('dialog').open||$('auto-complete-dialog').open)return;
 if(completionPlan())$('auto-complete-dialog').showModal();
}
function declineAutoComplete(){autoCompleteDeclined=true;$('auto-complete-dialog').close();save();}
function setCompletionLock(locked){
 $('board').inert=locked||paused;
 document.querySelector('.controls').inert=locked;
 $('difficulty').disabled=locked;$('pause').disabled=locked;
 $('board').setAttribute('aria-busy',String(locked));
 if(!locked)$('board').classList.remove('completion-glow');
}
async function autoComplete(){
 if(completing||paused||finished)return;
 const plan=completionPlan();if(!plan){$('auto-complete-dialog').close();return;}
 $('auto-complete-dialog').close();
 snapshot();completing=true;const run=++completionRun;clearHint();setCompletionLock(true);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 try{
  for(const {index,number} of plan){
   if(run!==completionRun)return;
   values[index]=number;notes[index].clear();selected=index;
   for(let i=0;i<81;i++)if(peers(i,index))notes[i].delete(number);
   if(values.every((v,i)=>v===solution[i]))finished=true;
   render();$('board').children[index].classList.add('auto-filled');
   await wait(reduced?0:200);
  }
  if(run!==completionRun)return;
  candidateExclusions=[];finished=true;save();
  $('board').classList.add('completion-glow');await wait(reduced?0:500);
  if(run===completionRun)showDialog('A well-earned victory.','You found a place for every number. Take a breath — you did it.');
 }finally{if(run===completionRun){completing=false;setCompletionLock(false);}}
}
$('auto-complete-yes').onclick=autoComplete;
$('auto-complete-no').onclick=declineAutoComplete;
$('auto-complete-dialog').addEventListener('cancel',()=>{autoCompleteDeclined=true;save();});
// Recheck a restored near-finished board after all handlers are initialized.
setTimeout(offerAutoComplete,0);
