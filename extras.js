const SETTINGS_KEY='ciel.display.v1';
let displaySettings={light:false,large:false};
try{const raw=localStorage.getItem(SETTINGS_KEY);if(raw){const p=JSON.parse(raw);displaySettings={light:p.light===true,large:p.large===true};}}catch{}
function applyDisplay(){document.documentElement.classList.toggle('light',displaySettings.light);document.documentElement.classList.toggle('large',displaySettings.large);}
function setDisplay(key,value){const next={...displaySettings,[key]:value};try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(next));displaySettings=next;applyDisplay();}catch{$('#status').textContent='Anzeige-Einstellung konnte nicht gespeichert werden.';}}
applyDisplay();
const euro=value=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(value);
const dateLabel=value=>value?new Date(value+'T12:00:00').toLocaleDateString('de-DE'):'Kein Datum';
function localDay(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function subscriptionTotal(items){return items.filter(x=>x.active).reduce((sum,x)=>sum+x.amount/(x.cycle==='year'?12:1),0);}
function renderExtras(){
if(tab==='abos'){
 const total=subscriptionTotal(data.subscriptions);
 $('#view').innerHTML=`<h2>Abos im Blick.</h2><p>Was läuft, was kostet es und bis wann kannst du kündigen?</p><div class="card"><h3>Aktive Abos · Monatsdurchschnitt</h3><div class="big-number">${euro(total)}</div><p>${euro(total*12)} pro Jahr, rechnerisch. Jahreszahlungen werden auf zwölf Monate verteilt.</p></div><form id="subscription"><label>Name<input name="name" required maxlength="200" placeholder="Zum Beispiel Streamingdienst"></label><div class="split"><label>Betrag in Euro<input name="amount" inputmode="decimal" required placeholder="9,99"></label><label>Zahlungsrhythmus<select name="cycle"><option value="month">Monatlich</option><option value="year">Jährlich</option></select></label></div><label>Kündigen bis (optional)<input name="deadline" type="date"></label><label>Notiz (optional)<input name="note" maxlength="1000" placeholder="Vertragsnummer oder Kündigungsweg"></label><button class="primary">Abo speichern</button></form><div class="card"><h3>Deine Abos</h3>${data.subscriptions.length?data.subscriptions.map(x=>`<div class="record"><div class="row"><div class="grow"><strong>${escape(x.name)}</strong><div class="muted">${euro(x.amount)} / ${x.cycle==='year'?'Jahr':'Monat'} · ${x.active?'aktiv':'beendet'}</div></div><button class="delete" data-delete="subscriptions" data-id="${escape(x.id)}">Löschen</button></div>${x.deadline?`<p class="${x.active&&x.deadline<localDay()?'warning':''}">Kündigen bis: ${dateLabel(x.deadline)}${x.active&&x.deadline<localDay()?' · Datum vergangen':''}</p>`:''}${x.note?`<p>${escape(x.note)}</p>`:''}<button data-sub-active="${escape(x.id)}">${x.active?'Als beendet markieren':'Wieder aktivieren'}</button></div>`).join(''):'<p>Noch keine Abos gespeichert.</p>'}</div><p>Ciel kündigt keine Verträge und verschickt keine automatischen Frist-Mitteilungen. Die Übersicht hilft dir beim Planen.</p>`;
}else if(tab==='verliehen'){
 const open=data.loans.filter(x=>!x.returned);
 $('#view').innerHTML=`<h2>Wo ist eigentlich …?</h2><p>Bücher, Werkzeug und Kleidung: festhalten, wer was ausgeliehen hat.</p><div class="card"><h3>Aktuell verliehen</h3><div class="big-number">${open.length} ${open.length===1?'Gegenstand':'Gegenstände'}</div></div><form id="loan"><label>Was hast du verliehen?<input name="item" required maxlength="250" placeholder="Zum Beispiel Bohrmaschine"></label><label>An wen?<input name="person" required maxlength="150" placeholder="Name"></label><div class="split"><label>Verliehen am<input name="lent" type="date" required value="${localDay()}"></label><label>Rückgabe bis (optional)<input name="due" type="date"></label></div><label>Notiz (optional)<input name="note" maxlength="1000" placeholder="Zum Beispiel inklusive Ladegerät"></label><button class="primary">Verliehenes speichern</button></form><div class="card"><h3>Deine Liste</h3>${data.loans.length?[...data.loans].sort((a,b)=>Number(a.returned)-Number(b.returned)).map(x=>`<div class="record"><div class="row"><div class="grow ${x.returned?'done':''}"><strong>${escape(x.item)}</strong><div class="muted">An ${escape(x.person)} · seit ${dateLabel(x.lent)}</div></div><button class="delete" data-delete="loans" data-id="${escape(x.id)}">Löschen</button></div>${x.due?`<p class="${!x.returned&&x.due<localDay()?'warning':''}">Rückgabe bis ${dateLabel(x.due)}${!x.returned&&x.due<localDay()?' · überfällig':''}</p>`:''}${x.note?`<p>${escape(x.note)}</p>`:''}<button data-returned="${escape(x.id)}">${x.returned?'Wieder als verliehen markieren':'Zurückbekommen ✓'}</button></div>`).join(''):'<p>Noch nichts eingetragen.</p>'}</div>`;
}else if(tab==='hilfe'){
 $('#view').insertAdjacentHTML('afterbegin',`<div class="card"><h3>So liest es sich leichter</h3><label class="setting"><span>Heller Modus</span><input id="light-mode" type="checkbox" ${displaySettings.light?'checked':''}></label><label class="setting"><span>Größere Schrift</span><input id="large-font" type="checkbox" ${displaySettings.large?'checked':''}></label><p>Die Einstellungen werden auf diesem Gerät gemerkt.</p></div>`);
}
}
document.addEventListener('submit',e=>{
 if(!['subscription','loan'].includes(e.target.id))return;
 e.preventDefault();e.stopImmediatePropagation();const form=e.target,f=new FormData(form),id=crypto.randomUUID();let next;
 if(form.id==='subscription'){
 const raw=String(f.get('amount')).trim().replace(',','.');const amount=Number(raw);
 if(!/^\d+(?:\.\d{1,2})?$/.test(raw)||!Number.isFinite(amount)||amount<0||amount>1000000){$('#status').textContent='Bitte einen gültigen Betrag eingeben, zum Beispiel 9,99.';return;}
 const name=f.get('name').trim();if(!name)return;next={...data,subscriptions:[...data.subscriptions,{id,name,amount,cycle:f.get('cycle'),deadline:f.get('deadline'),note:f.get('note').trim(),active:true}]};
 }else{
 const item=f.get('item').trim(),person=f.get('person').trim(),lent=f.get('lent'),due=f.get('due');if(!item||!person||!lent)return;
 if(due&&due<lent){$('#status').textContent='Das Rückgabedatum darf nicht vor dem Verleihdatum liegen.';return;}
 next={...data,loans:[...data.loans,{id,item,person,lent,due,note:f.get('note').trim(),returned:false}]};
 }
 if(save(next)){$('#status').textContent='Gespeichert.';render();}
},true);
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;for(const [attr,key,field]of [['subActive','subscriptions','active'],['returned','loans','returned']]){if(b.dataset[attr]){const next={...data,[key]:data[key].map(x=>x.id===b.dataset[attr]?{...x,[field]:!x[field]}:x)};if(save(next))render();}}});
document.addEventListener('change',e=>{if(e.target.id==='light-mode')setDisplay('light',e.target.checked);if(e.target.id==='large-font')setDisplay('large',e.target.checked);});
