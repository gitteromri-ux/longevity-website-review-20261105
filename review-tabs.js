/* Separate review collections; existing browser keys and v1/v2 backups remain supported. */
const reviewCollections={
 com:{key:'lla-dotcom-fold-review-20261105-v1',file:'folds.json',name:'LongevityLifeAcademy.com',heading:'Choose your final homepage.',data:[],notes:foldNotes},
 master:{key:'lla-masterclass-fold-review-20261105-v1',file:'masterclass.json',name:'Julie Gibson Clark Masterclass',heading:'Choose your final Masterclass page.',data:[],notes:{}}
};
let activeReview='dev';
try{reviewCollections.master.notes=JSON.parse(localStorage.getItem(reviewCollections.master.key)||'{}')||{}}catch(e){}
const originalRenderFolds=renderFolds;
renderFolds=function(){
 originalRenderFolds();
 const c=reviewCollections[activeReview];if(!c)return;
 document.querySelectorAll('[data-fold]').forEach((card,i)=>{
  card.querySelector('.number').textContent=c.name.toUpperCase()+' · SECTION '+(i+1);
  card.querySelector('.caption span').textContent=c.name+' · original section '+(i+1);
 });
};
function changeReviewTab(kind){
 activeReview=kind;
 const isDev=kind==='dev',c=reviewCollections[kind];
 document.querySelector('#cards').hidden=!isDev;
 document.querySelector('#homepage-folds').hidden=isDev;
 document.querySelector('.jump').hidden=!isDev;
 for(const t of ['dev','com','master'])document.querySelector('#tab-'+t).setAttribute('aria-selected',String(t===kind));
 document.querySelector('#progress').hidden=!isDev;
 document.querySelector('h1').textContent=isDev?'Your screenshots. Your exact comments.':c.heading;
 document.querySelector('header>p').textContent=isDev?'11 original Pages.dev screenshots, in upload order. Write the exact change beside each image.':c.name+' only. Select sections, assign positions 1–12 and add your exact comments.';
 if(!isDev){
  FOLDKEY=c.key;foldData=c.data;foldNotes=c.notes;
  document.querySelector('.fold-intro h2').textContent=kind==='master'?'Build your final Masterclass page':'Build your final homepage';
  document.querySelector('.fold-intro>p').textContent='Each card is one complete section of '+c.name+'. Check sections to include, assign unique positions 1–12, and add your exact instructions. Unchecked sections stay out of your final sequence.';
  renderFolds();
 }
}
for(const t of ['com','master'])document.querySelector('#tab-'+t).disabled=true;
Promise.all(Object.entries(reviewCollections).map(async([id,c])=>{
 const response=await fetch(c.file);if(!response.ok)throw Error(c.name);c.data=await response.json();
})).then(()=>{
 for(const t of ['dev','com','master']){const btn=document.querySelector('#tab-'+t);btn.disabled=false;btn.onclick=()=>changeReviewTab(t)}
 changeReviewTab('dev');
}).catch(e=>toast('Could not load all review tabs. Refresh to retry.'));
function collectionMarkdown(c){
 const all=c.data.map(f=>({...f,selected:false,order:'',comment:'',...(c.notes[f.image]||{})}));
 const selected=all.filter(f=>f.selected).sort((a,b)=>(Number(a.order)||99)-(Number(b.order)||99));
 const orders=selected.map(f=>Number(f.order));
 const invalid=selected.length>12||orders.some(n=>!Number.isInteger(n)||n<1||n>12)||new Set(orders).size!==orders.length;
 return '\n# '+c.name+': final version\n\n'+(invalid?'ORDER NEEDS REVIEW: use unique positions 1–12.\n\n':'')+
 (selected.map(f=>`## Position ${f.order}: ${f.title}\nOriginal section ${f.i+1}; image: ${f.image}\n\n${f.comment||'[No comment entered]'}\n`).join('\n')||'[No sections selected]\n')+
 '\n## Excluded sections\n\n'+all.filter(f=>!f.selected).map(f=>`### Original section ${f.i+1}: ${f.title}\n${f.comment||'[No comment entered]'}\n`).join('\n');
}
markdown=()=>screenshotMarkdown()+Object.values(reviewCollections).map(collectionMarkdown).join('\n');
document.querySelector('#backup').onclick=()=>download('Longevity-Website-Review-Backup.json',JSON.stringify({version:3,notes,foldNotes:reviewCollections.com.notes,masterNotes:reviewCollections.master.notes},null,2),'application/json');
document.querySelector('#import').onchange=async e=>{
 try{
  const data=JSON.parse(await e.target.files[0].text());
  if(!data.notes||typeof data.notes!=='object')throw Error();
  for(const f of files)if(typeof data.notes[f]==='string')notes[f]=data.notes[f];
  function normalize(source){
   const out={};if(!source||typeof source!=='object')return out;
   for(const [key,value] of Object.entries(source)){
    if(value&&typeof value==='object')out[key]={selected:value.selected===true,order:String(value.order||''),comment:typeof value.comment==='string'?value.comment:''};
   }return out;
  }
  if(data.foldNotes)reviewCollections.com.notes=normalize(data.foldNotes);
  if(data.masterNotes)reviewCollections.master.notes=normalize(data.masterNotes);
  document.querySelectorAll('#cards textarea').forEach(el=>el.value=notes[el.dataset.file]||'');
  try{localStorage.setItem(KEY,JSON.stringify(notes));for(const c of Object.values(reviewCollections))localStorage.setItem(c.key,JSON.stringify(c.notes))}catch(e){}
  progress();changeReviewTab(activeReview);toast('Review backup restored across all included tabs.');
 }catch(e){toast('Please choose a valid review backup.')}
 e.target.value='';
};
