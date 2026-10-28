/* Vector seals: frame and label are one editable annotation. */
const stampBox=document.createElement('section');stampBox.id='stampBox';
stampBox.innerHTML='<h2>指示スタンプ</h2><div class="stamp-buttons"></div><label>番号 <select id="stampNumber" aria-label="番号付き丸印"></select></label><button id="placeNumber">丸番号を配置</button>';
document.querySelector('aside').append(stampBox);
function prepareStamp(text,number=false){if(pageBusy||rendering)return;if(mobileMedia.matches)setTouchMode('edit',false);stampPreset={text,shape:number?'circle':'rect',w:number?54:140,h:number?54:50};setTool('stamp');draw()}
toolLabels.stamp='スタンプを配置';
for(const text of ['要修正','位置確認','施工済','写真撮影']){const b=document.createElement('button');b.textContent=text;b.className='seal-preview';b.onclick=()=>prepareStamp(text);stampBox.querySelector('.stamp-buttons').append(b)}
for(let n=1;n<=20;n++){const o=document.createElement('option');o.value=String.fromCharCode(0x2460+n-1);o.textContent=o.value;$('stampNumber').append(o)}
$('placeNumber').onclick=()=>prepareStamp(String($('stampNumber').selectedIndex+1),true);
const lineDialog=document.createElement('dialog');lineDialog.id='lineStyleDialog';
lineDialog.innerHTML='<h2>線・先端を編集</h2><p>選択した線・図形にまとめて反映します。</p><label>線種<select id="lineStyleChoice"><option value="">変更しない／混在</option><option value="solid">実線 ─</option><option value="dashed">破線 ┄</option><option value="dotted">点線 ⋯</option></select></label><div id="capChoices"><label>始点<select id="startCapChoice"></select></label><label>終点<select id="endCapChoice"></select></label></div><p id="capHint">先端の変更は矢印オブジェクトに適用します。「なし」で通常の直線になります。</p><div class="line-dialog-actions"><button id="cancelLineStyle">キャンセル</button><button id="applyLineStyle">反映</button></div>';
document.body.append(lineDialog);
for(const id of ['startCapChoice','endCapChoice'])for(const [value,label] of [['','変更しない／混在'],['none','なし'],['arrow','矢印 →'],['circle','丸 ●']]){const o=document.createElement('option');o.value=value;o.textContent=label;$(id).append(o)}
const lineTypes=['pen','rect','ellipse','arrow'];let lineTargets=null,linePage=null;
function openLineStyle(){
 if(pageBusy||rendering||start||working)return;
 lineTargets=selectedObjects().filter(o=>lineTypes.includes(o.type));if(!lineTargets.length)return;
 linePage=pageEntries[page-1].id;
 const common=(objects,key,fallback)=>{const values=objects.map(o=>o[key]||fallback);return values.every(v=>v===values[0])?values[0]:''};
 $('lineStyleChoice').value=common(lineTargets,'lineStyle','solid');const arrows=lineTargets.filter(o=>o.type==='arrow');
 $('capChoices').hidden=!arrows.length;$('capHint').hidden=!arrows.length;
 $('startCapChoice').value=common(arrows,'startCap','none');$('endCapChoice').value=common(arrows,'endCap','arrow');
 hideObjectMenu();lineDialog.showModal();
}
const lineMenuButton=document.createElement('button');lineMenuButton.textContent='線種・先端を編集';lineMenuButton.setAttribute('role','menuitem');lineMenuButton.onclick=openLineStyle;$('objectMenu').append(lineMenuButton);
const lineTouchButton=document.createElement('button');lineTouchButton.textContent='線種・先端';lineTouchButton.onclick=openLineStyle;$('touchObjectActions').append(lineTouchButton);
const oldShowMenu=showObjectMenu;showObjectMenu=function(...args){lineMenuButton.hidden=!selectedObjects().some(o=>lineTypes.includes(o.type));oldShowMenu(...args)};
const oldSelectionUpdate=window.updateTouchSelection;window.updateTouchSelection=function(...args){oldSelectionUpdate?.(...args);lineTouchButton.hidden=!selectedObjects().some(o=>lineTypes.includes(o.type))};
$('cancelLineStyle').onclick=()=>{lineDialog.close();lineTargets=null};lineDialog.addEventListener('cancel',()=>{lineTargets=null});
$('applyLineStyle').onclick=()=>{
 if(pageBusy||rendering||!lineTargets||pageEntries[page-1]?.id!==linePage||lineTargets.some(o=>!list().includes(o)))return;
 const style=$('lineStyleChoice').value,first=$('startCapChoice').value,last=$('endCapChoice').value;
 const changes=lineTargets.filter(o=>style&&style!==(o.lineStyle||'solid')||o.type==='arrow'&&(first&&first!==(o.startCap||'none')||last&&last!==(o.endCap||'arrow')));
 if(changes.length){snapshot();for(const o of changes){if(style)o.lineStyle=style;if(o.type==='arrow'){if(first)o.startCap=first;if(last)o.endCap=last}}}
 lineDialog.close();lineTargets=null;draw();
};
