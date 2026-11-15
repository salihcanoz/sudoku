// Count solutions with row/column/box masks; stop at two to verify uniqueness.
function solve(input,limit=2){
 const board=[...input],rows=Array(9).fill(0),cols=Array(9).fill(0),boxes=Array(9).fill(0);let count=0,solution;
 const box=i=>Math.floor(i/27)*3+Math.floor(i%9/3);
 for(let i=0;i<81;i++)if(board[i]){const bit=1<<(board[i]-1),r=Math.floor(i/9),c=i%9,b=box(i);if((rows[r]|cols[c]|boxes[b])&bit)return {count:0};rows[r]|=bit;cols[c]|=bit;boxes[b]|=bit;}
 function visit(){let index=-1,options=0,best=10;for(let i=0;i<81;i++)if(!board[i]){const mask=511&~(rows[Math.floor(i/9)]|cols[i%9]|boxes[box(i)]);if(!mask)return;let bits=mask,size=0;while(bits){bits&=bits-1;size++;}if(size<best){best=size;index=i;options=mask;if(size===1)break;}}
  if(index<0){count++;solution||=board.slice();return;}
  const r=Math.floor(index/9),c=index%9,b=box(index);
  while(options&&count<limit){const bit=options&-options;options^=bit;board[index]=Math.log2(bit)+1;rows[r]|=bit;cols[c]|=bit;boxes[b]|=bit;visit();rows[r]^=bit;cols[c]^=bit;boxes[b]^=bit;board[index]=0;}
 }
 visit();return {count,solution};
}
module.exports={solve};
