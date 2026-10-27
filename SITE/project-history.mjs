const clone=value=>JSON.parse(JSON.stringify(value));
// Selection/fault location is navigation. It must not destroy a Redo branch.
const signature=project=>JSON.stringify({...project,selectedBus:null});
export function createProjectHistory({limit=100,maxBytes=32*1024*1024}={}){
 let current=null,past=[],future=[],group=null;
 const frame=(project,selection)=>({project:clone(project),selection,signature:signature(project)});
 function trim(){let bytes=past.reduce((sum,f)=>sum+f.signature.length*2,0);while(past.length>limit||(bytes>maxBytes&&past.length>1))bytes-=past.shift().signature.length*2;}
 return {
  get state(){return {canUndo:past.length>0,canRedo:future.length>0};},
  record(project,selection=null,{group:nextGroup=null}={}){
   const next=frame(project,selection);
   if(!current||current.project.id!==project.id){current=next;past=[];future=[];group=null;return false;}
   if(current.signature===next.signature){current=next;return false;}
   if(!nextGroup||group!==nextGroup)past.push(current);
   current=next;future=[];group=nextGroup;trim();return true;
  },
  boundary(){group=null;},
  undo(){if(!past.length)return null;future.push(current);current=past.pop();group=null;return clone({project:current.project,selection:current.selection});},
  redo(){if(!future.length)return null;past.push(current);current=future.pop();group=null;trim();return clone({project:current.project,selection:current.selection});}
 };
}
