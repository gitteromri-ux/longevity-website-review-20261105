/* GitHub Pages is static. Do not claim that it saves into the private API. */
if(location.hostname.endsWith('github.io')){
 const GH_DRAFT='lla-combined-github-review-v4';
 const GH_ISSUES='https://github.com/gitteromri-ux/longevity-website-review-20261105/issues/new';
 document.querySelector('.notice').innerHTML='This review tool is hosted on GitHub Pages. Comments save in this browser. <b>Build my final website</b> shows your selected sections in order. <b>Send review to GitHub</b> opens a prepared GitHub issue: click Submit new issue there to create a permanent public link for Claude. Download a backup before closing.';
 sendButton.textContent='Send review to GitHub';
 status=function(message,error=false){stateLine.textContent=error?message:message.replace(/to this review workspace|to the review workspace|here/g,'in this browser');stateLine.classList.toggle('save-error',error)};
 api=async function(path,method='GET',payload){
  if(path==='/draft'&&method==='GET'){let draft=null;try{draft=JSON.parse(localStorage.getItem(GH_DRAFT)||'null')}catch(e){}return {draft}}
  if(path==='/draft'&&method==='PUT'){try{localStorage.setItem(GH_DRAFT,JSON.stringify(payload));return {saved:true}}catch(e){throw Error('Browser storage unavailable. Download your backup.');}}
  throw Error('Use Send review to GitHub to publish a review.');
 };
 saveNow=function(){
  clearTimeout(pendingSave);
  try{localStorage.setItem(GH_DRAFT,JSON.stringify(snapshot()));status('Saved in this browser. Use Send review to GitHub to share it.');document.querySelectorAll('.save').forEach(el=>el.textContent='Saved in this browser.');return Promise.resolve()}
  catch(e){status('Browser storage unavailable. Download a backup before closing.',true);return Promise.resolve()}
 };
 function issueText(){
  const selected=combinedSelected();
  return '# Final website selection\n\n'+
   'Review tool: '+location.origin+location.pathname+'\n\n'+
   selected.map(f=>`## ${f.order}. ${f.title}\n**Source:** ${f.sourceName}, original section ${f.original}\n\n![${f.title}](${new URL(f.image,location.href).href})\n\n### Exact instructions\n${f.comment||'No additional instructions.'}\n`).join('\n')+
   '\n## Other comments (sections not selected)\n\n'+
   combinedItems().filter(f=>!f.selected&&(f.comment||'').trim()).map(f=>`### ${f.sourceName}: ${f.title}\n${f.comment}\n`).join('\n');
 }
 sendButton.onclick=function(){
  const err=validateReview();if(err){status(err,true);toast(err);return}
  if(!combinedSelected().length&&!combinedItems().some(f=>(f.comment||'').trim())){status('Select a section or add a comment before sending.',true);return}
  saveNow();
  const body=issueText(),title='Website review: '+new Date().toISOString().slice(0,10);
  showFinal(snapshot(),'Ready to share. The GitHub issue is not submitted until you click Submit new issue on GitHub.');
  const url=GH_ISSUES+'?title='+encodeURIComponent(title)+'&body='+encodeURIComponent(body);
  if(url.length<=7500){
   const opened=window.open(url,'_blank','noopener');
   const receipt=document.querySelector('#review-receipt');receipt.innerHTML='Your review is ready. <a class="open" target="_blank" rel="noopener" href="'+esc(url)+'">Open prepared GitHub review</a> Then click Submit new issue. That creates the public link to send Claude.';
  }else{
   download('Final-Website-Review-for-GitHub.md',body,'text/markdown;charset=utf-8');
   navigator.clipboard?.writeText(body).catch(()=>{});
   const url=GH_ISSUES+'?title='+encodeURIComponent(title);
   window.open(url,'_blank','noopener');
   document.querySelector('#review-receipt').innerHTML='Your review is too long for a prefilled URL. It was downloaded as Markdown. <a class="open" target="_blank" rel="noopener" href="'+esc(url)+'">Open GitHub review</a> Paste the review text into the issue and submit. No comments were discarded.';
  }
 };
}
