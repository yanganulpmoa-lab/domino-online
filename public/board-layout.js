// Touching domino rectangles, including side-to-half contacts at each elbow.
function packArm(tiles,width) {
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

// The opening double remains anchored to the center while each arm grows away.
export function layoutBoard(tiles,width,height=300) {
 if(!tiles.length)return {short:26,long:52,width,height,positions:[]};
 let anchor=tiles.findIndex(t=>t[0]===5&&t[1]===5);
 if(anchor<0)anchor=Math.floor(tiles.length/2);
 const armWidth=Math.max(190,width/2),right=packArm(tiles.slice(anchor),armWidth);
 const left=packArm([tiles[anchor],...tiles.slice(0,anchor).reverse()],armWidth);
 const origin=right.positions[0],leftOrigin=left.positions[0],positions=new Array(tiles.length);
 positions[anchor]={...origin,x:0,y:0};
 for(let j=1;j<right.positions.length;j++)positions[anchor+j]={...right.positions[j],x:right.positions[j].x-origin.x,y:right.positions[j].y-origin.y};
 for(let j=1;j<left.positions.length;j++){
  const p=left.positions[j];
  positions[anchor-j]={...p,x:leftOrigin.x-p.x,y:leftOrigin.y-p.y,direction:p.direction==='down'?'up':p.direction==='east'?'west':'east'};
 }
 const extentX=Math.max(...positions.map(p=>Math.abs(p.x)+p.width/2));
 const extentY=Math.max(...positions.map(p=>Math.abs(p.y)+p.height/2));
 const scale=Math.min(1,(width/2-12)/extentX,(height/2-12)/extentY);
 return {short:right.short*scale,long:right.long*scale,width,height,scale,anchor,positions:positions.map(p=>({...p,x:width/2+p.x*scale,y:height/2+p.y*scale,width:p.width*scale,height:p.height*scale}))};
}
