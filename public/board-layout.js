// Geometry is independent of the DOM so resizing and both open ends use the same path.
export function layoutBoard(tiles,width) {
 const short=width<460?26:34,long=short*2,gap=8,padding=12;
 const columns=Math.max(2,Math.floor((width-padding*2)/(long+gap)));
 const cell=long+gap,rowStep=long+18;
 const positions=tiles.map((tile,i)=>{
  const row=Math.floor(i/columns),slot=i%columns,east=row%2===0;
  const column=east?slot:columns-1-slot;
  const corner=slot===columns-1&&i<tiles.length-1;
  const direction=corner?'down':east?'east':'west';
  const double=tile[0]===tile[1];
  const angle=direction==='down'?(double?-90:0):(double?0:east?-90:90);
  const vertical=angle===0;
  return {x:padding+long/2+column*cell,y:padding+long/2+row*rowStep,width:vertical?short:long,height:vertical?long:short,angle,direction,double};
 });
 const rows=Math.ceil(tiles.length/columns);
 return {short,long,columns,width:Math.max(width,padding*2+columns*cell-gap),height:Math.max(150,padding*2+(rows?rows-1:0)*rowStep+long),positions};
}
