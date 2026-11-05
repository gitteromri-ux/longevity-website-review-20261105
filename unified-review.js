/* One mixed final sequence across Pages.dev, dot-com homepage and Masterclass. */
const DEVSELECTKEY='lla-dev-selection-20261105-v1';
let devSelections={};try{devSelections=JSON.parse(localStorage.getItem(DEVSELECTKEY)||'{}')||{}}catch(e){}
function combinedItems(){
 const dev=files.map((f,i)=>({source:'dev',sourceName:'Pages.dev',image:'assets/'+f,key:f,title:'Uploaded screenshot '+(i+1),original:i+1,selected:false,order:'',...(devSelections[f]||{}),comment:notes[f]||''}));
 const other=Object.entries(reviewCollections).flatMap(([source,c])=>c.data.map((f,i)=>({source,sourceName:c.name,key:f.image,...f,original:i+1,selected:false,order:'',comment:'',...(c.notes[f.image]||{})})));
 return [...dev,...other];
}
function combinedSelected(){return combinedItems().filter(f=>f.selected).sort((a,b)=>(Number(a.order)||99)-(Number(b.order)||99))}
function combinedError(){const a=combinedSelected(),n=a.map(f=>Number(f.order));if(a.length>16)return 'Select at most 16 sections in total across all tabs.';if(n.some(x=>!Number.isInteger(x)||x<1||x>16))return 'Every selected section needs a final position from 1–16.';if(new Set(n).size!==n.length)return 'Two sections have the same final position. Positions must be unique across ALL tabs.';return ''}
validateReview=combinedError;
function rememberState(){try{localStorage.setItem(DEVSELECTKEY,JSON.stringify(devSelections));for(const c of Object.values(reviewCollections))localStorage.setItem(c.key,JSON.stringify(c.notes));localStorage.setItem(KEY,JSON.stringify(notes))}catch(e){}}
function stateFor(source,key){const obj=source==='dev'?devSelections:reviewCollections[source].notes;if(!obj[key])obj[key]={selected:false,order:'',comment:''};return obj[key]}
function wireSelection(card,source,key){
 const checkbox=card.querySelector('.include-fold'),order=card.querySelector('.fold-order');
 const s=stateFor(source,key);checkbox.checked=!!s.selected;order.value=s.order||'';
 function update(){const current=stateFor(source,key);current.selected=checkbox.checked;current.order=order.value;card.classList.toggle('selected',current.selected);rememberState();renderSequence()}
 checkbox.onchange=()=>{
  if(checkbox.checked&&!s.selected&&combinedSelected().length>=16){checkbox.checked=false;toast('16 selected already. Uncheck a section before adding another.');return}
  if(checkbox.checked&&!s.selected){const used=new Set(combinedSelected().map(f=>Number(f.order)));if(!order.value||used.has(Number(order.value)))order.value=Array.from({length:16},(_,i)=>i+1).find(x=>!used.has(x))||''}
  update();
 };
 order.oninput=update;
 card.classList.toggle('selected',!!s.selected);
}
function devControls(){
 document.querySelectorAll('#cards .card').forEach((card,i)=>{
  let area=card.querySelector('.dev-select-controls');
  if(!area){area=document.createElement('div');area.className='fold-controls dev-select-controls';area.innerHTML='<label><input type="checkbox" class="include-fold"> Include in final website</label><label>Final position <input class="fold-order" type="number" min="1" max="16" step="1" placeholder="1–16" aria-label="Final position for uploaded screenshot '+(i+1)+'"></label>';card.querySelector('.note h2').after(area)}
  wireSelection(card,'dev',files[i]);
 });
}
const previousFoldRender=renderFolds;
renderFolds=function(){
 previousFoldRender();
 if(activeReview==='dev')return;
 document.querySelectorAll('[data-fold]').forEach((card,i)=>{
  const source=activeReview,key=foldData[i].image;wireSelection(card,source,key);
  const comment=card.querySelector('.fold-comment');comment.oninput=()=>{stateFor(source,key).comment=comment.value;rememberState();renderSequence()};
 });
};
const combinedStatus=document.createElement('p');combinedStatus.id='combined-status';combinedStatus.style.cssText='color:#a9cfff;font-weight:600';document.querySelector('header').append(combinedStatus);
renderSequence=function(){
 const a=combinedSelected(),error=combinedError();
 const wording=error||`${a.length} / 16 selected for ONE final website across all three tabs.`;
 document.querySelector('#combined-status').textContent=wording;
 const s=document.querySelector('#fold-status');s.textContent=wording;s.classList.toggle('invalid',!!error);
 document.querySelector('#sequence').innerHTML=a.map(f=>`<span class="sequence-item">${esc(f.order||'?')}. ${esc(f.sourceName)}: ${esc(f.title)}</span>`).join('');
};
const oldChangeTab=changeReviewTab;
changeReviewTab=function(kind){
 oldChangeTab(kind);
 document.querySelector('#progress').hidden=true;
 document.querySelector('h1').textContent='Build one website from all three.';
 document.querySelector('header>p').textContent='Mix any section from Pages.dev, the dot-com homepage and Masterclass. Select sections, assign one shared order from 1–16, and add your exact comments.';
 if(kind!=='dev'){
  document.querySelector('.fold-intro h2').textContent='Select from '+reviewCollections[kind].name;
  document.querySelector('.fold-intro>p').textContent='Your selections join ONE combined website. Use final positions 1–16 across all three tabs. Nothing is deleted or changed on the live websites.';
 }
 devControls();renderSequence();
};
previewButton.textContent='Build my final website';
sendButton.textContent='Send review';
document.querySelector('.final-head h2').textContent='Your combined website';
document.querySelector('.notice').innerHTML='Check any section in any tab, assign its final position, and write your comment. <b>Build my final website</b> assembles the selected screenshots in one sequence with comments beside them. <b>Send review</b> saves that version here. It does not email anyone or change a live website.';
snapshot=function(){return {version:4,notes:JSON.parse(JSON.stringify(notes)),foldNotes:JSON.parse(JSON.stringify(reviewCollections.com.notes)),masterNotes:JSON.parse(JSON.stringify(reviewCollections.master.notes)),devSelections:JSON.parse(JSON.stringify(devSelections)),markdown:markdown()}};
markdown=function(){
 return '# Combined Longevity website review\n\n'+(combinedError()?'ORDER NEEDS REVIEW: '+combinedError()+'\n\n':'')+
 combinedSelected().map(f=>`## ${f.order}. ${f.title}\nSource: ${f.sourceName}; original section ${f.original}; image: ${f.image}\n\n${f.comment||'[No comment entered]'}\n`).join('\n')+
 '\n# Not selected (retained for reference)\n\n'+combinedItems().filter(f=>!f.selected).map(f=>`## ${f.sourceName}: ${f.title}\n${f.comment||'[No comment entered]'}\n`).join('\n');
};
finalHtml=function(data){
 const all=combinedItems().map(f=>{
  const states=f.source==='dev'?data.devSelections:f.source==='com'?data.foldNotes:data.masterNotes;
  const s=states?.[f.key]||{};
  return {...f,selected:!!s.selected,order:s.order||'',comment:f.source==='dev'?(data.notes[f.key]||''):(s.comment||'')};
 }).filter(f=>f.selected).sort((a,b)=>Number(a.order)-Number(b.order));
 if(!all.length)return '<p>No sections selected yet. Return to any tab and tick the sections you want.</p>';
 return '<nav class="jump" aria-label="Final sequence">'+all.map((f,i)=>`<a href="#final-${i}">${esc(f.order)}. ${esc(f.sourceName)}</a>`).join('')+'</nav>'+
 all.map((f,i)=>`<article class="final-item" id="final-${i}"><div><a href="${f.image}" target="_blank" rel="noopener"><img src="${f.image}" alt="${esc(f.title)}"></a></div><div><div class="number">${esc(f.sourceName)} · Original section ${f.original}</div><h3>${esc(f.order)}. ${esc(f.title)}</h3><label for="final-note-${i}">Your exact comment</label><textarea id="final-note-${i}" class="final-comment" data-source="${f.source}" data-key="${esc(f.key)}">${esc(f.comment)}</textarea><p><button class="edit-source" data-source="${f.source}" data-original="${f.original}">Edit selection / order</button></p></div></article>`).join('');
};
const priorShowFinal=showFinal;
showFinal=function(data,receipt){
 priorShowFinal(data,receipt);
 document.querySelectorAll('.final-comment').forEach(el=>el.oninput=()=>{
  if(el.dataset.source==='dev'){notes[el.dataset.key]=el.value;const idx=files.indexOf(el.dataset.key);document.querySelector('#comment-'+idx).value=el.value}
  else{stateFor(el.dataset.source,el.dataset.key).comment=el.value;if(activeReview===el.dataset.source){const i=reviewCollections[activeReview].data.findIndex(f=>f.image===el.dataset.key);const input=document.querySelector('#fold-comment-'+i);if(input)input.value=el.value}}
  rememberState();document.querySelector('#review-receipt').textContent='Edited after this preview. Click Send review to submit the updated version.';
 });
 document.querySelectorAll('.edit-source').forEach(btn=>btn.onclick=()=>{
  panel.hidden=true;changeReviewTab(btn.dataset.source);
  const cards=btn.dataset.source==='dev'?document.querySelectorAll('#cards .card'):document.querySelectorAll('[data-fold]');
  cards[Number(btn.dataset.original)-1]?.scrollIntoView({behavior:'smooth',block:'start'});
 });
};
document.querySelector('#backup').onclick=()=>download('Longevity-Combined-Website-Backup.json',JSON.stringify(snapshot(),null,2),'application/json');
function applyReviewData(data){
 for(const f of files)if(typeof data.notes?.[f]==='string')notes[f]=data.notes[f];
 if(data.foldNotes&&typeof data.foldNotes==='object')reviewCollections.com.notes=data.foldNotes;
 if(data.masterNotes&&typeof data.masterNotes==='object')reviewCollections.master.notes=data.masterNotes;
 if(data.devSelections&&typeof data.devSelections==='object')devSelections=data.devSelections;
 document.querySelectorAll('#cards textarea').forEach(el=>el.value=notes[el.dataset.file]||'');
 rememberState();changeReviewTab(activeReview);devControls();
}
document.querySelector('#import').onchange=async e=>{
 try{const data=JSON.parse(await e.target.files[0].text());if(!data.notes||typeof data.notes!=='object')throw Error();applyReviewData(data);queueSave();toast('All three tabs and the combined sequence restored.')}catch(e){toast('Choose a valid review backup.')}e.target.value='';
};
loadDraft=async function(){
 try{const r=await api('/draft');if(r.draft&&editCounter===0){applyReviewData(r.draft);status('Saved combined review restored. Use Load Claude\'s selection to see Claude\'s picks.')}else{try{const pr=await fetch('claude-selection.json',{cache:'no-store'});if(pr.ok&&editCounter===0){applyReviewData(await pr.json());status('Claude\'s selection and comments loaded. Edit anything; it saves in this browser.')}}catch(_){}devControls();renderSequence();status('Ready. Comments and selections autosave here.');if(editCounter)queueSave()}}
 catch(e){status('Online saving unavailable. Download a backup before closing. '+e.message,true);try{const pr=await fetch('claude-selection.json',{cache:'no-store'});if(pr.ok&&editCounter===0){applyReviewData(await pr.json());renderSequence()}}catch(_){}}
 finally{sendButton.disabled=false;previewButton.disabled=false}
};
devControls();renderSequence();

/* Load Claude's fold selection and comments (claude-selection.json) on request. */
(function(){
 const bar=document.querySelector('.actions');if(!bar)return;
 const b=document.createElement('button');b.id='load-claude';b.textContent="Load Claude's selection";
 b.onclick=async()=>{
  if(!confirm("Replace the selection and comments in this browser with Claude's selection? Download a backup first if you want to keep yours."))return;
  try{const r=await fetch('claude-selection.json',{cache:'no-store'});applyReviewData(await r.json());if(typeof queueSave==='function')queueSave();toast("Claude's selection loaded.")}catch(e){toast("Could not load Claude's selection.")}
 };
 bar.insertBefore(b,bar.children[1]||null);
})();
