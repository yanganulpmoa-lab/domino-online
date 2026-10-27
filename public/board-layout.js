// Touching domino rectangles, including side-to-half contacts at each elbow.
export function layoutBoard(tiles,width) {
 const short=width<460?26:34,long=short*2,padding=12;
 const left=padding+short/2,right=width-padding-short/2;
 const positions=[];let direction='east',nextDirection='west',rowBottom=0;
 function shape(tile,dir){
  const double=tile[0]===tile[1],vertical=dir==='down'?!double:double;
  return {width:vertical?short:long,height:vertical?long:short,angle:dir==='down'?(double?-90:0):(double?0:dir==='east'?-90:90),direction:dir,double};
 }
 for(const tile of tiles){
  let p=shape(tile,direction);const prev=positions.at(-1);
  if(!prev){p.x=left+p.width/2;p.y=padding+short;}
  else if(direction==='down'){
   const baseline=prev.y+prev.height/2-short/2;
   if(baseline>=rowBottom+short){
    direction=nextDirection;p=shape(tile,direction);const sign=direction==='east'?1:-1;
    p.x=prev.x+sign*(prev.width+p.width)/2;p.y=baseline;rowBottom=p.y+p.height/2;
   }else {p.x=prev.x;p.y=prev.y+(prev.height+p.height)/2;}
  }else {
   const sign=direction==='east'?1:-1;
   const x=prev.x+sign*(prev.width+p.width)/2;
   if(x-p.width/2>=left&&x+p.width/2<=right){p.x=x;p.y=prev.y;}
   else {
    nextDirection=direction==='east'?'west':'east';direction='down';p=shape(tile,direction);
    p.x=prev.x+sign*(prev.width/2-short/2);p.y=prev.y+(prev.height+p.height)/2;
   }
  }
  positions.push(p);
  if(direction!=='down')rowBottom=Math.max(rowBottom,p.y+p.height/2);
 }
 return {short,long,width,columns:Math.max(2,Math.floor((right-left)/long)),height:Math.max(150,...positions.map(p=>p.y+p.height/2+padding)),positions};
}
