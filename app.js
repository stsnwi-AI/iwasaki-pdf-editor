class BundledCMapReader {async fetch({name}) {const encoded=window.PDF_CMAPS[name];if(!encoded)throw new Error('CMap unavailable: '+name);return {cMapData:Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)),compressionType:1}}}
const $=id=>document.getElementById(id);pdfjsLib.GlobalWorkerOptions.workerSrc='vendor/pdf.worker.min.js';let doc,bytes,page=1,tool='select',items={},history=[],selected=-1,start,working,imgSource,rendering=false,dirty=false,dragHandle=null;const base=$('base'),canvas=$('overlay'),ctx=canvas.getContext('2d');let sourceName='',scale=1,currentColor="#e59a19";const say=t=>$('status').textContent=t;
function snapshot(){history.push(JSON.stringify(items));if(history.length>60)history.shift();dirty=true}function list(){return items[page]||(items[page]=[])}function setTool(t){if(t!=='select'){selected=-1;$('editor').hidden=true;draw()}tool=t;document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===t));canvas.style.cursor=t==='select'?'default':'crosshair';say(t==='text'?'入力欄に文字を入れて、PDF上の配置場所を押してください。':t==='select'?'書き込みを選択し、角のつまみでサイズ変更。矢印は両端をドラッグできます。':'PDF上でドラッグしてください。')}
const cache=new Map();function imageFor(src){if(!cache.has(src)){let im=new Image();im.onload=draw;im.src=src;cache.set(src,im)}return cache.get(src)}
function paint(c,o){c.save();c.strokeStyle=o.color;c.fillStyle=o.color;c.lineWidth=o.lineWidth||(o.type==='pen'?3:2);c.lineCap='round';const x=o.x,y=o.y,w=o.w||0,h=o.h||0;if(o.type==='text'){c.font=`${o.size}px sans-serif`;c.textBaseline='top';o.text.split('\n').forEach((t,i)=>c.fillText(t,x,y+i*o.size*1.3))}else if(o.type==='image'){let im=imageFor(o.src);if(im.complete)c.drawImage(im,x,y,w,h)}else if(o.type==='highlight'){c.globalAlpha=.3;c.fillRect(x,y,w,h)}else if(o.type==='rect')c.strokeRect(x,y,w,h);else if(o.type==='ellipse'){c.beginPath();c.ellipse(x+w/2,y+h/2,Math.abs(w/2),Math.abs(h/2),0,0,Math.PI*2);c.stroke()}else if(o.type==='pen'){c.beginPath();o.points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke()}else if(o.type==='arrow'){c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y+h);const a=Math.atan2(h,w);c.moveTo(x+w-14*Math.cos(a-.45),y+h-14*Math.sin(a-.45));c.lineTo(x+w,y+h);c.lineTo(x+w-14*Math.cos(a+.45),y+h-14*Math.sin(a+.45));c.stroke()}c.restore()}
function bounds(o){if(o.type==='pen'){const xs=o.points.map(p=>p.x),ys=o.points.map(p=>p.y);return{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)}}if(o.type==='text'){ctx.font=`${o.size}px sans-serif`;return{x:o.x,y:o.y,w:Math.max(...o.text.split('\n').map(t=>ctx.measureText(t).width)),h:o.text.split('\n').length*o.size*1.3}}return{x:Math.min(o.x,o.x+o.w),y:Math.min(o.y,o.y+o.h),w:Math.abs(o.w),h:Math.abs(o.h)}}
function draw(){if(selected<0)$('editor').hidden=true;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.scale(scale,scale);list().forEach((o,i)=>{paint(ctx,o);if(i===selected){const b=bounds(o);ctx.save();ctx.strokeStyle='#24694f';ctx.lineWidth=1;ctx.setLineDash([5,4]);ctx.strokeRect(b.x,b.y,b.w,b.h);ctx.setLineDash([]);for(const h of handles(o)){ctx.fillStyle='white';ctx.strokeStyle='#24694f';const r=5/scale;ctx.fillRect(h.x-r,h.y-r,r*2,r*2);ctx.strokeRect(h.x-r,h.y-r,r*2,r*2)}ctx.restore()}});if(working&&tool!=='select')paint(ctx,working);ctx.restore()}
async function render(){if(!doc||rendering)return;rendering=true;try{const p=await doc.getPage(page);scale=Number($('zoom').value);const v=p.getViewport({scale});base.width=canvas.width=Math.ceil(v.width);base.height=canvas.height=Math.ceil(v.height);await p.render({canvasContext:base.getContext('2d'),viewport:v}).promise;$('paper').style.display='block';$('empty').style.display='none';$('page').textContent=`${page} / ${doc.numPages}`;$('prev').disabled=page===1;$('next').disabled=page===doc.numPages;draw()}catch(e){throw e}finally{rendering=false}}
async function extractEmbeddedProject(pdfBytes){
const pdf=await PDFLib.PDFDocument.load(pdfBytes.slice(),{updateMetadata:false});
// pdf-lib typed lookup throws if a key is absent; ordinary PDFs have no Names dictionary.
const lookupOptional=(dict,key,type)=>{if(!dict||!dict.has(PDFLib.PDFName.of(key)))return undefined;return type?dict.lookup(PDFLib.PDFName.of(key),type):dict.lookup(PDFLib.PDFName.of(key))};
const names=lookupOptional(pdf.catalog,'Names',PDFLib.PDFDict);if(!names)return null;
const tree=lookupOptional(names,'EmbeddedFiles',PDFLib.PDFDict);if(!tree)return null;
const arr=lookupOptional(tree,'Names',PDFLib.PDFArray);if(!arr)return null;
for(let i=0;i+1<arr.size();i+=2){const name=arr.lookup(i);if(!name||name.decodeText?.()!=='kantan-edit-data.json')continue;
const spec=arr.lookup(i+1,PDFLib.PDFDict);const ef=lookupOptional(spec,'EF',PDFLib.PDFDict);const stream=lookupOptional(ef,'F',PDFLib.PDFRawStream);
if(!stream)throw Error('編集情報の添付ファイルがありません');const raw=PDFLib.decodePDFRawStream(stream).decode();if(raw.length>120000000)throw Error('編集情報が大きすぎます');
const project=JSON.parse(new TextDecoder().decode(raw));if(project.format!=='kantan-pdf-project'||project.schemaVersion!==1||!isPdfData(base64ToBytes(project.originalPdfBase64)))throw Error('編集情報の形式が不正です');return project;
}return null;
}
async function load(data,name){say('PDFを読み込んでいます…');try{const original=new Uint8Array(data).slice();const next=await pdfjsLib.getDocument({data:original.slice(),isEvalSupported:false,CMapReaderFactory:BundledCMapReader,cMapPacked:true,standardFontDataUrl:'vendor/standard_fonts/'}).promise;let embedded=null;
try{embedded=await extractEmbeddedProject(original)}catch(e){console.warn('埋め込み編集情報の読込をスキップ:',e);say('編集情報を読み取れなかったため通常のPDFとして開きます。')}
if(embedded){const originalBytes=base64ToBytes(embedded.originalPdfBase64);const source=await pdfjsLib.getDocument({data:originalBytes.slice(),isEvalSupported:false,CMapReaderFactory:BundledCMapReader,cMapPacked:true,standardFontDataUrl:'vendor/standard_fonts/'}).promise;validateAnnotations(embedded.annotationsByPage,source.numPages);await next.destroy();doc=source;bytes=originalBytes;sourceName=embedded.originalPdfName;page=embedded.currentPage;items=embedded.annotationsByPage;history=[];selected=-1;dirty=false;$('zoom').value=String(embedded.zoom);}
else{doc=next;bytes=original;sourceName=name;page=1;items={};history=[];selected=-1;dirty=false;}$('filename').textContent=name;$('save').disabled=false;if($('projectSave'))$('projectSave').disabled=false;await render();say(embedded?'編集情報付きPDFを開きました。追記した内容を再編集できます。':'準備ができました。左のツールを選んで書き込めます。')}catch(e){say('PDFを開けませんでした。暗号化されたPDFや破損ファイルは読み込めない場合があります。 '+e.message)}}
$('file').onchange=async e=>{const f=e.target.files[0];if(f){if(dirty&&!confirm('未保存の書き込みがあります。別のPDFを開きますか？'))return;await load(await f.arrayBuffer(),f.name)}e.target.value=''};
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{if(b.dataset.tool==='image')$('imageFile').click();else setTool(b.dataset.tool)});
$('imageFile').onchange=e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=()=>{imgSource=r.result;const im=imageFor(imgSource);im.onload=()=>{draw();setTool('image');say('PDF上でドラッグして画像の大きさを指定してください。')}};r.readAsDataURL(f)}e.target.value=''};
function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width/scale,y:(e.clientY-r.top)*canvas.height/r.height/scale}}
canvas.onpointerdown=e=>{if(!doc||rendering)return;start=point(e);canvas.setPointerCapture(e.pointerId);if(tool==='select'){dragHandle=selected>=0?hitHandle(list()[selected],start):null;if(dragHandle){snapshot();working=JSON.parse(JSON.stringify(list()[selected]));draw();return}selected=-1;for(let i=list().length-1;i>=0;i--){const b=bounds(list()[i]);if(start.x>=b.x-8&&start.x<=b.x+b.w+8&&start.y>=b.y-8&&start.y<=b.y+b.h+8){selected=i;break}}if(selected>=0){snapshot();working=JSON.parse(JSON.stringify(list()[selected]))}syncEditor();draw();return}if(tool==='text'){const t=$('text').value;if(!t.trim()){say('文字入力欄に、追加する文字を入力してください。');return}snapshot();list().push({type:tool,x:start.x,y:start.y,text:t,size:Number($('size').value),color:currentColor});selected=-1;draw();return}if(tool==='image'&&!imgSource)return;working={type:tool,x:start.x,y:start.y,w:0,h:0,color:currentColor,lineWidth:validWidth($('newLineWidth').value),src:tool==='image'?imgSource:undefined,points:tool==='pen'?[start]:undefined};selected=-1};
canvas.onpointermove=e=>{if(!working||!start){if(tool==='select'&&selected>=0){const h=hitHandle(list()[selected],point(e));canvas.style.cursor=h?(h.key==='nw'||h.key==='se'?'nwse-resize':h.key==='ne'||h.key==='sw'?'nesw-resize':'crosshair'):'move'}return;}const p=point(e),dx=p.x-start.x,dy=p.y-start.y;if(tool==='select'){const o=list()[selected];if(dragHandle){resizeAnnotation(o,working,dragHandle,p);draw();return}o.x=working.x+dx;o.y=working.y+dy;if(o.type==='pen')o.points=working.points.map(v=>({x:v.x+dx,y:v.y+dy}))}else if(tool==='pen')working.points.push(p);else{working.w=dx;working.h=dy}draw()};
function finish(){if(working&&tool!=='select'){if(tool==='pen'||Math.abs(working.w)>3&&Math.abs(working.h)>3||tool==='arrow'&&Math.hypot(working.w,working.h)>3){if(tool==='image'){const b=bounds(working);Object.assign(working,b)}snapshot();list().push(working)}}working=null;start=null;dragHandle=null;if(tool==='select')syncEditor();draw()}canvas.onpointerup=finish;canvas.onpointercancel=finish;
$('undo').onclick=()=>{if(history.length){items=JSON.parse(history.pop());selected=-1;draw()}};$('delete').onclick=()=>{if(selected>=0){snapshot();list().splice(selected,1);selected=-1;draw()}else say('「選択・移動」で書き込みを選んでから削除してください。')};
$('prev').onclick=()=>{if(page>1&&!rendering){page--;selected=-1;render().catch(e=>say('ページの表示に失敗しました：'+e.message))}};$('next').onclick=()=>{if(doc&&page<doc.numPages&&!rendering){page++;selected=-1;render().catch(e=>say('ページの表示に失敗しました：'+e.message))}};$('zoom').onchange=()=>render().catch(e=>say('ページの表示に失敗しました：'+e.message));
function download(data,name){const u=URL.createObjectURL(new Blob([data],{type:'application/pdf'})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),30000)}
$('save').onclick=async()=>{if(!bytes)return;$('save').disabled=true;say('PDFを保存しています…');try{// Rebuild the page tree into a fresh document to avoid invalid source trailer/root references.
const sourcePdf=await PDFLib.PDFDocument.load(bytes.slice(),{updateMetadata:false});
const pdf=await PDFLib.PDFDocument.create();
const copied=await pdf.copyPages(sourcePdf,sourcePdf.getPageIndices());
copied.forEach(p=>pdf.addPage(p));
for(const [n,annotations]of Object.entries(items)){if(!annotations.length)continue;const p=pdf.getPages()[Number(n)-1];const view=(await doc.getPage(Number(n))).getViewport({scale:1});const c=document.createElement('canvas');c.width=Math.ceil(view.width*2);c.height=Math.ceil(view.height*2);const g=c.getContext('2d');g.scale(2,2);for(const o of annotations){if(o.type==='image'){const im=imageFor(o.src);if(!im.complete)await new Promise((r,j)=>{im.onload=r;im.onerror=j})}paint(g,o)}const png=await pdf.embedPng(c.toDataURL('image/png'));const angle=((p.getRotation().angle%360)+360)%360,W=p.getWidth(),H=p.getHeight();const position=angle===90?{x:W,y:0,width:H,height:W}:angle===180?{x:W,y:H,width:W,height:H}:angle===270?{x:0,y:H,width:H,height:W}:{x:0,y:0,width:W,height:H};p.drawImage(png,{...position,rotate:PDFLib.degrees(angle)});}

// Embed the editable source and annotations as a standard PDF attachment.
const embeddedProject={format:'kantan-pdf-project',schemaVersion:1,originalPdfName:sourceName||$('filename').textContent,originalPdfBase64:bytesToBase64(bytes),annotationsByPage:items,currentPage:page,zoom:Number($('zoom').value),savedAt:new Date().toISOString()};
await pdf.attach(new TextEncoder().encode(JSON.stringify(embeddedProject)),'kantan-edit-data.json',{mimeType:'application/json',description:'Editable annotations for Kantan PDF Editor'});
const output=await pdf.save({useObjectStreams:false});
// Validate the serialized file before allowing download.
if(output.length<100||String.fromCharCode(...output.slice(0,5))!=='%PDF-')throw Error('PDFヘッダーが不正です');
const embeddedCheck=await extractEmbeddedProject(output);
if(!embeddedCheck)throw Error('編集情報を保存したPDFから復元できません');
if(JSON.stringify(embeddedCheck.annotationsByPage)!==JSON.stringify(items))throw Error('編集情報の再読込結果が一致しません');
const verified=await PDFLib.PDFDocument.load(output.slice(),{updateMetadata:false});
if(verified.getPageCount()!==sourcePdf.getPageCount())throw Error('保存したPDFのページ数が一致しません');
if(!verified.context.trailerInfo.Root)throw Error('PDFのルートオブジェクトがありません');
const checked=await pdfjsLib.getDocument({data:output.slice(),isEvalSupported:false,CMapReaderFactory:BundledCMapReader,cMapPacked:true,standardFontDataUrl:'vendor/standard_fonts/'}).promise;
try{if(checked.numPages!==sourcePdf.getPageCount())throw Error('PDFの再読込検証に失敗しました');await checked.getPage(1)}finally{await checked.destroy()}
download(output,$('filename').textContent.replace(/\.pdf$/i,'')+'_編集済み.pdf');say('PDF本文と編集情報の再読込を検証して保存しました。')}catch(e){say('保存できませんでした：'+e.message)}finally{$('save').disabled=false}};
$('sample').onclick=async()=>{const p=await PDFLib.PDFDocument.create();for(let i=0;i<2;i++){const s=p.addPage([595,842]);s.drawText('PDF WORKSPACE / SAMPLE '+(i+1),{x:45,y:780,size:20,color:PDFLib.rgb(.15,.4,.3)});s.drawText('Try text, highlight, shapes and images.',{x:45,y:740,size:12});for(let y=660;y>150;y-=65)s.drawRectangle({x:45,y,width:505,height:45,borderColor:PDFLib.rgb(.8,.85,.82),borderWidth:1});s.drawText('Your original PDF stays unchanged.',{x:45,y:80,size:12})}await load(await p.save(),'サンプル.pdf')};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});

function syncEditor(){const o=list()[selected];$('editor').hidden=!o;if(!o)return;$('editTextRow').hidden=o.type!=='text';$('applyEdit').hidden=o.type!=='text';$('editLineRow').hidden=!['pen','rect','ellipse','arrow'].includes(o.type);$('editText').value=o.text||'';if(o.type!=='image'){currentColor=o.color;updatePalette()}$('lineWidth').value=o.lineWidth??(o.type==='pen'?3:2);say('角のつまみでサイズ変更。色はパレットで選ぶとすぐに反映されます。')}
$('applyEdit').onclick=()=>{const o=list()[selected];if(!o||o.type!=='text')return;if(!$('editText').value.trim()){say('文字を入力してください。');return}if(o.text===$('editText').value)return;snapshot();o.text=$('editText').value;draw();say('文字を変更しました。')};
function updatePalette(){document.querySelectorAll('[data-color]').forEach(b=>{const active=b.dataset.color===currentColor;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))})}
function chooseColor(color){const o=tool==='select'?list()[selected]:null;currentColor=color;if(o&&o.type!=='image'&&o.color!==color){snapshot();o.color=color;draw();say('選択した書き込みの色を変更しました。')}else say(o?.type==='image'?'画像の色は変更できません。':'追加する書き込みの色を選びました。');updatePalette()}
document.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>chooseColor(b.dataset.color));
function validWidth(value){const n=Number(value);return Number.isFinite(n)?Math.min(100,Math.max(.1,n)):2}
$('lineWidth').onchange=()=>{const o=list()[selected];if(!o||!['pen','rect','ellipse','arrow'].includes(o.type))return;const n=validWidth($('lineWidth').value);$('lineWidth').value=n;if(o.lineWidth===n)return;snapshot();o.lineWidth=n;draw();say('線の太さを変更しました。')};
$('newLineWidth').onchange=()=>{$('newLineWidth').value=validWidth($('newLineWidth').value)};
updatePalette();

function handles(o){if(o.type==='arrow')return[{key:'start',x:o.x,y:o.y},{key:'end',x:o.x+o.w,y:o.y+o.h}];const b=bounds(o);return[{key:'nw',x:b.x,y:b.y},{key:'ne',x:b.x+b.w,y:b.y},{key:'sw',x:b.x,y:b.y+b.h},{key:'se',x:b.x+b.w,y:b.y+b.h}]}
function hitHandle(o,p){return handles(o).find(h=>Math.hypot(h.x-p.x,h.y-p.y)<=12/scale)}
function resizeAnnotation(o,original,handle,p){if(original.type==='arrow'){if(handle.key==='start'){o.x=p.x;o.y=p.y;o.w=original.x+original.w-p.x;o.h=original.y+original.h-p.y}else{o.w=p.x-original.x;o.h=p.y-original.y}return}const b=bounds(original),left=handle.key.includes('w'),top=handle.key.includes('n'),ax=left?b.x+b.w:b.x,ay=top?b.y+b.h:b.y;let w=Math.max(2,Math.abs(p.x-ax)),h=Math.max(2,Math.abs(p.y-ay));let x=Math.min(p.x,ax),y=Math.min(p.y,ay);if(original.type==='text'){const ratio=Math.max(.1,Math.hypot(w,h)/Math.max(1,Math.hypot(b.w,b.h)));o.size=Math.max(6,Math.min(200,original.size*ratio));const actual=o.size/original.size;o.x=left?ax-b.w*actual:ax;o.y=top?ay-b.h*actual:ay;return}if(original.type==='pen'){o.points=original.points.map(v=>({x:x+(v.x-b.x)*(b.w?w/b.w:1),y:y+(v.y-b.y)*(b.h?h/b.h:1)}));o.x=x;o.y=y;return}o.x=x;o.y=y;o.w=w;o.h=h;}
canvas.ondblclick=e=>{if(tool!=='select'||selected<0)return;const o=list()[selected];if(o.type==='text'){syncEditor();$('editText').focus();$('editText').select();say('文字内容を変更して「変更を反映」を押してください。')}};

// 編集プロジェクトはPDFと書き込みを1ファイルに格納。ネットワーク送信はしません。
function bytesToBase64(arr){let out='';const chunk=32768;for(let i=0;i<arr.length;i+=chunk)out+=String.fromCharCode(...arr.subarray(i,i+chunk));return btoa(out)}
function base64ToBytes(str){if(typeof str!=='string'||!str.length||str.length>150000000)throw Error('PDFデータが大きすぎるか不正です');const binary=atob(str),out=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)out[i]=binary.charCodeAt(i);return out}
function saveProjectFile(data,name){const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}
function isPdfData(data){return data.length>5&&String.fromCharCode(...data.slice(0,5))==='%PDF-'}
function validateAnnotations(all,pages){if(!all||typeof all!=='object'||Array.isArray(all))throw Error('編集データの形式が不正です');for(const [key,annotations] of Object.entries(all)){const n=Number(key);if(!Number.isInteger(n)||n<1||n>pages||!Array.isArray(annotations)||annotations.length>20000)throw Error('ページの編集データが不正です');for(const o of annotations){if(!o||!['text','image','highlight','pen','rect','ellipse','arrow'].includes(o.type)||!Number.isFinite(o.x)||!Number.isFinite(o.y))throw Error('書き込みデータが不正です');if(o.type==='image'&&(!/^data:image\/(png|jpeg);base64,/.test(o.src||'')||o.src.length>30000000))throw Error('画像データが不正です')}}}
$('projectSave').onclick=()=>{if(!bytes||!doc)return;try{const name=$('filename').textContent;const project={format:'kantan-pdf-project',schemaVersion:1,originalPdfName:name,originalPdfBase64:bytesToBase64(bytes),annotationsByPage:items,currentPage:page,zoom:Number($('zoom').value),savedAt:new Date().toISOString()};saveProjectFile(project,name.replace(/\.pdf$/i,'')+'.pdfproj');dirty=false;say('編集プロジェクトをダウンロードしました。作業再開にはこの .pdfproj ファイルを使ってください。')}catch(e){say('作業ファイルを保存できませんでした：'+e.message)}};
$('projectFile').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;if(dirty&&!confirm('未保存の書き込みがあります。別の作業を開きますか？'))return;try{if(file.size>120000000)throw Error('ファイルが大きすぎます');const data=JSON.parse(await file.text());if(data.format!=='kantan-pdf-project'||data.schemaVersion!==1||typeof data.originalPdfName!=='string'||data.originalPdfName.length>255)throw Error('対応していないプロジェクト形式です');const pdf=base64ToBytes(data.originalPdfBase64);if(!isPdfData(pdf))throw Error('PDFデータが不正です');const test=await pdfjsLib.getDocument({data:pdf.slice(),isEvalSupported:false,CMapReaderFactory:BundledCMapReader,cMapPacked:true,standardFontDataUrl:'vendor/standard_fonts/'}).promise;try{validateAnnotations(data.annotationsByPage,test.numPages);if(!Number.isInteger(data.currentPage)||data.currentPage<1||data.currentPage>test.numPages)throw Error('ページ情報が不正です');if(![.7,1,1.4,2].includes(data.zoom))throw Error('表示倍率が不正です')}catch(err){await test.destroy();throw err}const prevDoc=doc;doc=test;bytes=pdf;items=data.annotationsByPage;history=[];selected=-1;page=data.currentPage;$('zoom').value=String(data.zoom);$('filename').textContent=data.originalPdfName;$('save').disabled=false;if($('projectSave'))$('projectSave').disabled=false;dirty=false;await render();if(prevDoc)prevDoc.destroy().catch(()=>{});say('編集プロジェクトを復元しました。書き込みを選択して再編集できます。')}catch(err){say('作業ファイルを開けませんでした：'+err.message)}};

// Ver.3.4: 同じサイトの別ウィンドウ間で書き込みを受け渡す。
// PDF本文は共有せず、コピーしたオブジェクトだけを一時的にメモリで送信する。
let sharedAnnotation=null;
let objectChannel=null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    objectChannel=new BroadcastChannel('kantan-pdf-object-clipboard-v1');
    objectChannel.onmessage=e=>{
      const message=e.data;
      if(!message||message.type!=='annotation-copy'||!message.annotation)return;
      try {
        validateAnnotations({'1':[message.annotation]},1);
        sharedAnnotation=structuredClone(message.annotation);
        say('別ウィンドウから書き込みを受信しました。「貼り付け」で配置できます。');
      }catch(err){console.warn('コピー内容を受け取れません:',err)}
    };
  }
} catch(err) { console.warn('ウィンドウ間コピーを利用できません:',err); }
function copyObject(){
  if(!doc||selected<0||!list()[selected]){say('先に「選択・移動」でコピーする書き込みを選択してください。');return}
  sharedAnnotation=JSON.parse(JSON.stringify(list()[selected]));
  try{objectChannel?.postMessage({type:'annotation-copy',annotation:sharedAnnotation})}catch(err){say('このウィンドウ内ではコピーできますが、別ウィンドウへの転送に失敗しました。');return}
  say('書き込みをコピーしました。別ウィンドウのPDFで「貼り付け」を押してください。');
}
function pasteObject(targetPoint=null){
  if(!doc){say('貼り付け先のPDFを開いてください。');return}
  if(!sharedAnnotation){say('コピーした書き込みがありません。コピー元で「選択をコピー」を押してください。');return}
  try{
    validateAnnotations({'1':[sharedAnnotation]},1);
    const obj=JSON.parse(JSON.stringify(sharedAnnotation));
    const box=bounds(obj),offset=24;
    const dx=(targetPoint?targetPoint.x:offset)-box.x,dy=(targetPoint?targetPoint.y:offset)-box.y;
    if(obj.type==='pen')obj.points=obj.points.map(p=>({x:p.x+dx,y:p.y+dy}));
    obj.x=(obj.x||0)+dx;obj.y=(obj.y||0)+dy;
    snapshot();list().push(obj);setTool('select');selected=list().length-1;syncEditor();draw();
    say('貼り付けました。ドラッグで位置を調整し、PDFを保存してください。');
  }catch(err){say('貼り付けに失敗しました：'+err.message)}
}
$('copyObject').onclick=copyObject;
$('pasteObject').onclick=pasteObject;
$('newWindow').onclick=()=>{
  const child=window.open(window.location.href,'_blank');
  if(!child)say('新しいウィンドウを開けませんでした。ブラウザのポップアップ設定を確認してください。');
  else {try{child.opener=null}catch(e){}say('別ウィンドウを開きました。そこで2つ目のPDFを選んでください。');}
};
window.addEventListener('keydown',e=>{
  if(!(e.ctrlKey||e.metaKey)||e.altKey)return;
  const target=e.target;
  if(target&&(['INPUT','TEXTAREA','SELECT'].includes(target.tagName)||target.isContentEditable))return;
  const key=e.key.toLowerCase();
  if(key==='c'){e.preventDefault();copyObject()}
  else if(key==='v'){e.preventDefault();pasteObject()}
});

// Ver.3.5: Mouse-only object transfer with a context menu.
const menu=document.createElement('div');menu.id='objectContextMenu';menu.setAttribute('role','menu');menu.hidden=true;
menu.innerHTML='<button type="button" id="contextCopy" role="menuitem">⧉ オブジェクトをコピー</button><button type="button" id="contextPaste" role="menuitem">▣ ここに貼り付け</button><button type="button" id="contextDelete" role="menuitem">✕ オブジェクトを削除</button>';
document.body.appendChild(menu);let menuPoint=null;
function hideObjectMenu(){menu.hidden=true}
canvas.addEventListener('contextmenu',e=>{
 if(!doc||rendering)return;e.preventDefault();const p=point(e);menuPoint=p;
 let hit=-1;for(let i=list().length-1;i>=0;i--){const b=bounds(list()[i]);if(p.x>=b.x-8&&p.x<=b.x+b.w+8&&p.y>=b.y-8&&p.y<=b.y+b.h+8){hit=i;break}}
 selected=hit;setTool('select');syncEditor();draw();
 $('contextCopy').disabled=hit<0;$('contextDelete').disabled=hit<0;$('contextPaste').disabled=!sharedAnnotation;
 menu.hidden=false;const w=menu.offsetWidth,h=menu.offsetHeight;
 menu.style.left=Math.max(8,Math.min(e.clientX,window.innerWidth-w-8))+'px';menu.style.top=Math.max(8,Math.min(e.clientY,window.innerHeight-h-8))+'px';
});
$('contextCopy').onclick=()=>{hideObjectMenu();copyObject()};
$('contextPaste').onclick=()=>{const p=menuPoint;hideObjectMenu();pasteObject(p)};
$('contextDelete').onclick=()=>{hideObjectMenu();$('delete').click()};
document.addEventListener('pointerdown',e=>{if(!menu.hidden&&!menu.contains(e.target))hideObjectMenu()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideObjectMenu()});window.addEventListener('blur',hideObjectMenu);
