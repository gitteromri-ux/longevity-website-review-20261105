const apiBase=window.REVIEW_API.includes('__PORT_')?'http://127.0.0.1:8874':window.REVIEW_API;
let localBrowserId='';try{localBrowserId=localStorage.getItem('review-local-browser-id')||crypto.randomUUID();localStorage.setItem('review-local-browser-id',localBrowserId)}catch(e){}
const apiHeaders=()=>({'Content-Type':'application/json',...(location.hostname==='127.0.0.1'?{'X-Local-Review-Browser':localBrowserId}:{})});
const actionBar=document.querySelector('.actions');
const sendButton=document.createElement('button');sendButton.id='send-review';sendButton.className='primary';sendButton.textContent='Send review';actionBar.prepend(sendButton);
const previewButton=document.createElement('button');previewButton.id='preview-final';previewButton.textContent='Preview final order';actionBar.insertBefore(previewButton,sendButton.nextSibling);
const stateLine=document.createElement('p');stateLine.id='server-save-state';stateLine.setAttribute('aria-live','polite');stateLine.style.fontSize='14px';document.querySelector('header').append(stateLine);
document.querySelector('.notice').innerHTML='Your comments and choices autosave to this review workspace. <b>Send review</b> saves a submitted version and shows your selected folds in order. It does not email anyone. Keep a downloadable backup for your own records.';
const panel=document.createElement('section');panel.id='final-review';panel.hidden=true;panel.innerHTML='<div class="final-head"><h2>Your final review</h2><button id="back-editing">Back to editing</button></div><p id="review-receipt" role="status"></p><div id="final-content"></div>';document.body.append(panel);
const style=document.createElement('style');style.textContent='#final-review{max-width:1400px;margin:24px auto;padding:24px}.final-head{display:flex;justify-content:space-between;gap:20px;align-items:center}.final-item{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(250px,1fr);gap:24px;padding:22px;border:1px solid #425776;border-radius:10px;margin:18px 0;background:#172133}.final-item img{width:100%;height:auto}.final-item p{white-space:pre-wrap;overflow-wrap:anywhere}.final-item h3{font-size:21px}.save-error{color:#ffb7a8!important}@media(max-width:780px){.final-item{grid-template-columns:1fr}#final-review{padding:16px}.final-head{align-items:flex-start}}';document.head.append(style);
let pendingSave,editCounter=0,saveChain=Promise.resolve(),requestId=null,sending=false,lastSnapshot=null;
function snapshot(){return {version:3,notes:JSON.parse(JSON.stringify(notes)),foldNotes:JSON.parse(JSON.stringify(reviewCollections.com.notes)),masterNotes:JSON.parse(JSON.stringify(reviewCollections.master.notes)),markdown:markdown()}}
async function api(path,method='GET',payload){const r=await fetch(apiBase+path,{method,headers:apiHeaders(),...(payload?{body:JSON.stringify(payload)}:{})});const data=await r.json();if(!r.ok)throw Error(data.detail||'Could not save. Your comments are still on this page.');return data}
function status(message,error=false){stateLine.textContent=message;stateLine.classList.toggle('save-error',error)}
function saveNow(){
 clearTimeout(pendingSave);const payload=snapshot();
 saveChain=saveChain.catch(()=>{}).then(()=>api('/draft','PUT',payload)).then(()=>{status('All changes saved to this review workspace.');document.querySelectorAll('.save').forEach(e=>e.textContent='Saved to this review workspace.')}).catch(e=>{status('Save failed. Keep this tab open or download a backup. '+e.message,true)});
 return saveChain;
}
function queueSave(){editCounter++;requestId=null;status('Saving changes…');clearTimeout(pendingSave);pendingSave=setTimeout(saveNow,450)}
document.addEventListener('input',e=>{if(e.target.matches('textarea,.fold-order'))queueSave()});
document.addEventListener('change',e=>{if(e.target.matches('.include-fold'))queueSave()});
persistFolds=function(){try{localStorage.setItem(FOLDKEY,JSON.stringify(foldNotes))}catch(e){}renderSequence()};
function errorsFor(c){const rows=Object.values(c.notes).filter(x=>x&&x.selected);const orders=rows.map(x=>Number(x.order));if(rows.length>12)return c.name+': select no more than 12 folds.';if(orders.some(n=>!Number.isInteger(n)||n<1||n>12))return c.name+': give every selected fold a position from 1–12.';if(new Set(orders).size!==orders.length)return c.name+': two selected folds have the same position. Assign different numbers.';return ''}
function validateReview(){return Object.values(reviewCollections).map(errorsFor).filter(Boolean).join(' ')}
function finalHtml(data){
 let html='<h2>Pages.dev screenshot comments</h2>';
 const annotated=files.filter(f=>(data.notes[f]||'').trim());
 html+=annotated.length?annotated.map(f=>`<article class="final-item"><img src="assets/${f}" alt="${esc(f)}"><div><h3>Screenshot ${files.indexOf(f)+1}</h3><p>${esc(data.notes[f])}</p></div></article>`).join(''):'<p>No screenshot comments entered.</p>';
 for(const [key,c] of Object.entries(reviewCollections)){
  const n=data[key==='com'?'foldNotes':'masterNotes']||{};
  const selected=c.data.filter(f=>n[f.image]?.selected).map(f=>({...f,...n[f.image]})).sort((a,b)=>Number(a.order)-Number(b.order));
  html+=`<h2>${esc(c.name)}: selected final order</h2>`;
  html+=selected.length?selected.map(f=>`<article class="final-item"><img src="${f.image}" alt="${esc(f.title)}"><div><h3>${esc(f.order)}. ${esc(f.title)}</h3><p>${esc(f.comment||'No additional instructions.')}</p></div></article>`).join(''):'<p>No folds selected.</p>';
 }
 return html;
}
function showFinal(data,receipt){lastSnapshot=data;document.querySelector('#final-content').innerHTML=finalHtml(data);document.querySelector('#review-receipt').textContent=receipt;panel.hidden=false;document.querySelector('#cards').hidden=true;document.querySelector('#homepage-folds').hidden=true;panel.scrollIntoView({behavior:'smooth',block:'start'})}
document.querySelector('#back-editing').onclick=()=>{panel.hidden=true;changeReviewTab(activeReview);document.querySelector('.tabs').scrollIntoView({behavior:'smooth'})};
document.querySelector('.tabs').addEventListener('click',()=>panel.hidden=true);
previewButton.onclick=()=>{const err=validateReview();if(err){status(err,true);toast(err);return}showFinal(snapshot(),'Preview only. Click Send review to submit this version.')};
sendButton.onclick=async()=>{
 if(sending)return;const err=validateReview();if(err){status(err,true);toast(err);return}
 if(!files.some(f=>(notes[f]||'').trim())&&!Object.values(reviewCollections).some(c=>Object.values(c.notes).some(n=>n?.selected||(n?.comment||'').trim()))&&!(typeof devSelections!=='undefined'&&Object.values(devSelections).some(n=>n?.selected))){status('Add a comment or select at least one fold before sending.',true);return}
 sending=true;sendButton.disabled=true;sendButton.textContent='Sending…';
 try{
  await saveNow();const data=snapshot();requestId=requestId||crypto.randomUUID();data.requestId=requestId;
  const saved=await api('/reviews','POST',data);const confirmed=await api('/reviews/'+saved.id);
  if(confirmed.id!==saved.id)throw Error('Submission could not be confirmed.');
  showFinal(confirmed.review,'Submitted and saved. Receipt: '+saved.id+' · '+new Date(saved.created).toLocaleString()+'. Saved to this review workspace; no email was sent.');
  status('Review submitted successfully. You can return to editing and send an updated version.');toast('Review submitted and confirmed.');
 }catch(e){status('Not sent. '+e.message+' Download a backup to keep your work.',true)}
 finally{sending=false;sendButton.disabled=false;sendButton.textContent='Send review'}
};
const originalImport=document.querySelector('#import').onchange;
document.querySelector('#import').onchange=async e=>{await originalImport(e);queueSave()};
sendButton.disabled=true;previewButton.disabled=true;
async function loadDraft(){
 try{
  const r=await api('/draft');
  if(r.draft&&editCounter===0){
   const d=r.draft;
   for(const f of files)if(typeof d.notes?.[f]==='string')notes[f]=d.notes[f];
   if(d.foldNotes)reviewCollections.com.notes=d.foldNotes;if(d.masterNotes)reviewCollections.master.notes=d.masterNotes;
   document.querySelectorAll('#cards textarea').forEach(el=>el.value=notes[el.dataset.file]||'');
   progress();changeReviewTab(activeReview);status('Saved review restored. Continue editing.');
  }else{status('Ready. Your changes will autosave to this review workspace.');if(editCounter)queueSave()}
 }catch(e){status('Online saving unavailable. You can still edit and download a backup. '+e.message,true)}
 finally{sendButton.disabled=false;previewButton.disabled=false}
}
const waitCollections=setInterval(()=>{if(reviewCollections.com.data.length&&reviewCollections.master.data.length){clearInterval(waitCollections);loadDraft()}},80);
