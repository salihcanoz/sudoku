'use strict';
const SudokuLogic=(()=>{
 const clueLimits={Easy:35,Medium:30,Hard:25,Expert:20};
 const digits=[1,2,3,4,5,6,7,8,9],cells=Array.from({length:81},(_,i)=>i);
 const row=i=>Math.floor(i/9),col=i=>i%9,box=i=>Math.floor(i/27)*3+Math.floor(i%9/3);
 const units=['row','column','box'].flatMap((kind,k)=>digits.map((_,n)=>({kind,cells:cells.filter(i=>[row,col,box][k](i)===n)})));
 const peers=(a,b)=>a!==b&&(row(a)===row(b)||col(a)===col(b)||box(a)===box(b));
 function candidates(board){return board.map((v,i)=>new Set(v?[]:digits.filter(n=>!board.some((v,j)=>v===n&&peers(i,j)))));}
 function combinations(items,size){if(!size)return [[]];return items.flatMap((v,i)=>combinations(items.slice(i+1),size-1).map(rest=>[v,...rest]));}
 function next(board,c=candidates(board),preferred=-1){
  const order=[...cells].sort((a,b)=>(a===preferred?-1:b===preferred?1:0));
  for(const i of order)if(!board[i]&&c[i].size===1)return {kind:'single',rank:0,index:i,number:[...c[i]][0],unit:cells.filter(j=>peers(i,j))};
  for(const u of units)for(const n of digits){const places=u.cells.filter(i=>c[i].has(n));if(places.length===1)return {kind:u.kind,rank:1,index:places[0],number:n,unit:u.cells};}
  function elimination(kind,rank,pattern,targets,nums,unit){const removals=targets.flatMap(i=>nums.filter(n=>c[i].has(n)).map(number=>({index:i,number})));return removals.length?{kind,rank,index:pattern[0],unit,pattern,removals}:null;}
  for(const u of units)for(const n of digits){
   const places=u.cells.filter(i=>c[i].has(n));if(places.length<2||places.length>3)continue;
   const destinations=u.kind==='box'?units.filter(v=>v.kind!=='box'):units.filter(v=>v.kind==='box');
   for(const v of destinations)if(places.every(i=>v.cells.includes(i))){const step=elimination(u.kind==='box'?'pointing':'claiming',2,places,v.cells.filter(i=>!u.cells.includes(i)),[n],[...new Set([...u.cells,...v.cells])]);if(step)return step;}
  }
  for(const size of [2,3])for(const u of units){
   const empty=u.cells.filter(i=>!board[i]);
   for(const group of combinations(empty.filter(i=>c[i].size>=2&&c[i].size<=size),size)){
    const nums=[...new Set(group.flatMap(i=>[...c[i]]))];if(nums.length!==size)continue;
    const step=elimination(size===2?'naked-pair':'naked-triple',size===2?2:3,group,empty.filter(i=>!group.includes(i)),nums,u.cells);if(step)return step;
   }
   for(const nums of combinations(digits.filter(n=>empty.some(i=>c[i].has(n))),size)){
    const group=empty.filter(i=>nums.some(n=>c[i].has(n)));if(group.length!==size)continue;
    const step=elimination(size===2?'hidden-pair':'hidden-triple',3,group,group,digits.filter(n=>!nums.includes(n)),u.cells);if(step)return step;
   }
  }
  // Fish: N base lines confine a digit to exactly N cover lines.
  for(const size of [2,3])for(const axis of [row,col])for(const n of digits){
   const other=axis===row?col:row;
   const lines=digits.map((_,v)=>cells.filter(i=>axis(i)===v&&c[i].has(n))).filter(group=>group.length>=2&&group.length<=size);
   for(const groups of combinations(lines,size)){
    const pattern=groups.flat(),covers=[...new Set(pattern.map(other))];if(covers.length!==size)continue;
    const base=groups.map(g=>axis(g[0]));
    const step=elimination(size===2?'x-wing':'swordfish',4,pattern,cells.filter(i=>!base.includes(axis(i))&&covers.includes(other(i))),[n],cells.filter(i=>base.includes(axis(i))||covers.includes(other(i))));if(step)return step;
   }
  }
  // Wings: both possible pivot outcomes force z into one of the wings.
  for(const pivot of cells.filter(i=>c[i].size===2||c[i].size===3)){
   const wings=cells.filter(i=>peers(i,pivot)&&c[i].size===2);
   for(const [a,b] of combinations(wings,2)){
    const common=[...c[a]].filter(n=>c[b].has(n));if(common.length!==1)continue;
    const z=common[0],x=[...c[a]].find(n=>n!==z),y=[...c[b]].find(n=>n!==z);
    if(x===y||!c[pivot].has(x)||!c[pivot].has(y))continue;
    const xyz=c[pivot].size===3;if(xyz&&!c[pivot].has(z)||!xyz&&c[pivot].has(z))continue;
    const pattern=[pivot,a,b];
    const step=elimination(xyz?'xyz-wing':'xy-wing',4,pattern,cells.filter(i=>!pattern.includes(i)&&peers(i,a)&&peers(i,b)&&(!xyz||peers(i,pivot))),[z],[...new Set(pattern.concat(cells.filter(i=>peers(i,pivot))))]);if(step)return step;
   }
  }
  return forcingStep(board,c);
 }
 // Implication graph: weak links map true -> false; strong links map false -> true.
 // Bounded traversal keeps hints responsive. It never branches by guessing a solution.
 function forcingStep(board,c){
  const graph=new Map(),literal=(i,n,truth)=>(i*9+n-1)*2+(truth?1:0);
  const add=(a,b)=>{if(!graph.has(a))graph.set(a,[]);graph.get(a).push(b);};
  const weak=(a,b)=>{add(a|1,b&~1);add(b|1,a&~1);};
  const strong=(a,b)=>{add(a&~1,b|1);add(b&~1,a|1);};
  for(const i of cells){const ns=[...c[i]];for(const [a,b] of combinations(ns,2))weak(literal(i,a,true),literal(i,b,true));if(ns.length===2)strong(literal(i,ns[0],true),literal(i,ns[1],true));}
  for(const unit of units)for(const n of digits){const places=unit.cells.filter(i=>c[i].has(n));for(const [a,b] of combinations(places,2))weak(literal(a,n,true),literal(b,n,true));if(places.length===2)strong(literal(places[0],n,true),literal(places[1],n,true));}
  const decode=id=>({index:Math.floor(id/18),number:Math.floor(id/2)%9+1,truth:!!(id%2)});
  function trace(start){const parents=new Map([[start,null]]),queue=[[start,0]];for(let k=0;k<queue.length;k++){const [id,depth]=queue[k];if(depth===12)continue;for(const dest of graph.get(id)||[])if(!parents.has(dest)){parents.set(dest,id);queue.push([dest,depth+1]);}}return parents;}
  function path(parents,end){const out=[];for(let id=end;id!==null;id=parents.get(id))out.push(decode(id));return out.reverse();}
  function step(kind,removal,proof){const pattern=[...new Set(proof.flat().map(v=>v.index))];return {kind,rank:4,index:pattern[0],unit:pattern,pattern,removals:[removal],proof};}
  // A bivalue cell must take one of its two candidates. Keep a shared consequence.
  for(const i of cells.filter(i=>c[i].size===2)){
   const [a,b]=[...c[i]],left=trace(literal(i,a,true)),right=trace(literal(i,b,true));
   for(const id of left.keys())if(!(id%2)&&right.has(id)){const target=decode(id);if(target.index!==i)return step('forcing-chain',{index:target.index,number:target.number},[path(left,id),path(right,id)]);}
  }
  // A contradiction after assuming a candidate true proves it can be removed.
  for(const i of cells)for(const n of c[i]){const start=literal(i,n,true),p=trace(start);if(p.has(start^1))return step('aic',{index:i,number:n},[path(p,start^1)]);}
  return null;
 }

 function apply(board,c,step){if(step.removals){for(const r of step.removals)c[r.index].delete(r.number);}else{board[step.index]=step.number;c[step.index].clear();for(const i of cells)if(peers(i,step.index))c[i].delete(step.number);}}
 function grade(input){const board=[...input],c=candidates(board),steps=[];let rank=0;while(board.includes(0)){
  if(c.some((s,i)=>!board[i]&&!s.size))return {solved:false,steps};
  const step=next(board,c);if(!step)return {solved:false,steps};apply(board,c,step);steps.push(step);rank=Math.max(rank,step.rank);
  }
 const eliminationSteps=steps.filter(s=>s.rank>=2).length,advancedSteps=steps.filter(s=>s.rank>=4).length;
 function phases(minRank){let count=0,inPhase=false;for(const step of steps){if(!step.removals){inPhase=false;}else if(step.rank>=minRank&&!inPhase){count++;inPhase=true;}}return count;}
 return {solved:true,clues:input.filter(Boolean).length,rank,level:['Easy','Medium','Hard','Hard','Expert'][rank],steps,solution:board,
  effort:{eliminationSteps,advancedSteps,eliminationPhases:phases(2),advancedPhases:phases(4),firstElimination:steps.findIndex(s=>s.rank>=2),initialSingles:candidates(input).filter(s=>s.size===1).length}};
 }
 // A single difficult deduction is not enough to qualify a sustained challenge.
 function matchesLevel(level,rating){
  if(!rating.solved||rating.level!==level||rating.clues!==clueLimits[level])return false;
  const e=rating.effort;
  if(level==='Hard')return e.eliminationSteps>=5&&e.eliminationPhases>=2&&e.firstElimination<=12;
  if(level==='Expert')return e.eliminationSteps>=10&&e.advancedSteps>=6&&e.advancedPhases>=3&&e.firstElimination<=8&&e.initialSingles<=2;
  return true;
 }
 return {candidates,next,apply,grade,matchesLevel,clueLimits,units,peers,forcingStep};
})();
if(typeof module!=='undefined')module.exports=SudokuLogic;
