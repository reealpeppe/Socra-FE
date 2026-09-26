"use strict";

const $ = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const num = value => value == null ? "N/D" : new Intl.NumberFormat("it-IT", {maximumFractionDigits:1}).format(value);
const pct = value => value == null ? "N/D" : `${num(value)}%`;
const shortDate = value => new Intl.DateTimeFormat("it-IT", {day:"2-digit",month:"short",timeZone:"UTC"}).format(new Date(`${value}T12:00:00Z`));
const longDate = value => new Intl.DateTimeFormat("it-IT", {day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${value}T12:00:00Z`));
const iconPaths = {
  overview:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  activation:'<path d="M4 4h16l-6 8v6l-4 2v-8z"/>',
  matching:'<path d="M3 7h14l-3-3m3 3-3 3M21 17H7l3-3m-3 3 3 3"/>',
  quality:'<path d="m12 3 3 6 6 1-4.5 4.5 1 6.5-5.5-3-5.5 3 1-6.5L3 10l6-1z"/>',
  retention:'<path d="M3 12a9 9 0 1 1 3 7M3 4v8h8M12 7v5l3 2"/>',
  operations:'<path d="M10 3h4l1 3 3 1 3 3-1 4-3 1-1 3-4 3-4-1-1-3-3-1-1-4 1-4 3-1z"/><circle cx="12" cy="12" r="3"/>',
  data:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
  alert:'<path d="m12 3 10 18H2zM12 9v4M12 17h.01"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
};
const icon = key => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[key] || iconPaths.overview}</svg>`;
const views = {
  overview:{name:"Panoramica",title:"Il polso della community.",description:"Dalle prime iscrizioni ai confronti che fanno crescere."},
  activation:{name:"Attivazione",title:"Dal primo passo al confronto.",description:"Dove le persone proseguono, dove si fermano, quanto aspettano."},
  matching:{name:"Matching",title:"Le persone giuste si incontrano?",description:"Domanda, disponibilità e tempi di risposta, strumento per strumento."},
  quality:{name:"Percorsi e qualità",title:"Il confronto lascia qualcosa.",description:"Completamenti, miglioramento dichiarato e autonomia."},
  retention:{name:"Ritorno",title:"Una community a cui tornare.",description:"Le coorti nel tempo, con la stessa opportunità di essere osservate."},
  operations:{name:"Operatività",title:"Le cose da seguire oggi.",description:"Code, percorsi aperti e crediti: segnali operativi, senza sanzioni automatiche."},
  data:{name:"Dati e definizioni",title:"Ogni numero, una definizione.",description:"Fonti, limiti e formule per leggere i dati con criterio."},
};
const definitions = [
  ["Percorsi utili", "Percorsi completati nel periodo con feedback apprendista “obiettivo raggiunto” o “forte miglioramento”. Un esito di apprendimento autodichiarato, non una misura di rendimento finanziario. Il conteggio include tutti i percorsi; il tasso di qualità deduplica le coppie."],
  ["Attivazione entro 14 giorni", "Primo percorso avviato come apprendista entro 14 giorni dall’iscrizione. Il denominatore contiene soltanto iscritti che hanno avuto 14 giorni interi di osservazione. Le persone ancora in osservazione sono mostrate separatamente."],
  ["Funnel della stessa coorte", "Una sola coorte di nuovi iscritti maturi, stesso ordine temporale e stessa catena obiettivo → richiesta/proposta → percorso, entro 14 giorni. Le proposte ricevute contano. Strumento e direzione non filtrano questo funnel globale."],
  ["Attività osservata", "Persona con nuova sessione oppure survey, ultima bozza aggiornata, obiettivo, richiesta, risposta tracciata, chiusura o feedback. Solo l’autore dell’azione; un percorso ricevuto non rende automaticamente attive entrambe le persone. Le visite senza evento non sono rilevate."],
  ["Ritorno W1–W4", "W1 osserva i giorni dal 7° al 14° dall’iscrizione; W2 dal 14° al 21°, e così via, con estremi semiaperti. Una persona entra nel denominatore solo dopo la fine dell’intero intervallo. Le celle mostrano ritornati / osservabili; una cella immatura non vale zero."],
  ["Qualità per coppia", "Ultimo feedback apprendista per coppia mentor/apprendista, tra i percorsi completati nel periodo. Le ripetizioni della stessa coppia non aumentano il peso del tasso. I grafici descrivono il campione amministrativo, non ricalcolano ranking o reputazione pubblica."],
  ["Tasso di accettazione", "Richieste accettate / richieste create nel periodo, incluse le pendenti nel denominatore. Non è un tasso tra sole richieste risolte. Direzione e strumento si applicano. Stati storici senza evidenza temporale sono indicati come non ricostruibili."],
  ["Tempi di risposta", "Da creazione della richiesta a prima risposta tracciata nella history oppure avvio del percorso accettato. Mediana e P90 sul campione ricostruibile. updated_at non viene usato come timestamp della risposta. Le richieste irrisolte non diventano tempi di risposta."],
  ["Disponibilità dichiarata oggi", "Mentor attivi, disponibilità abilitata sullo snapshot corrente e meno di tre percorsi non completati. È una disponibilità per strumento, non una garanzia di idoneità per uno specifico obiettivo o di presenza online. Non si ricostruisce una disponibilità storica dallo stato corrente."],
  ["Domanda aperta oggi", "Ultimo obiettivo attivo per persona senza percorso aperto da apprendista. Una persona può avere domanda e offrire aiuto allo stesso tempo: i ruoli non sono categorie permanenti di utenti."],
  ["Crediti interni", "Saldo corrente e movimenti nel periodo. Crediti non acquistabili né convertibili in denaro. Non rappresentano ricavi, euro o patrimonio. Le emissioni positive possono comprendere saldo iniziale e aggiustamenti, oltre ai reward."],
  ["Periodi e piccoli campioni", "Date UTC con estremi inclusi nella selezione. Gli eventi futuri rispetto alla fine osservata sono esclusi. Con meno di cinque osservazioni si indica campione ridotto, senza target o verdetti. N/D significa assenza di base dati o denominatore; 0 significa conteggio osservato nullo."],
];
let metadata, dashboard, controller, renderedQuery, requestId=0;
let view = new URLSearchParams(location.search).get("view") || "overview";
if (!views[view]) view="overview";
const chartSelected = {started:true,completed:true,useful:true,registered:false,active:false};
const seriesLabels = {registered:"Nuovi iscritti",active:"Attività osservata",started:"Percorsi avviati",completed:"Completati",useful:"Utili"};
const colors = {registered:"#678ead",active:"#a3b9a4",started:"#90b09c",completed:"#2b725a",useful:"#d5ad4c"};

function query() {
  const params=new URLSearchParams();
  for (const key of ["source","topic","direction","grain"]) params.set(key,$(key).value);
  const range=$("range").value;
  if (range==="all") params.set("start","all");
  else if(range==="custom") {params.set("start",$("start").value);params.set("end",$("end").value);}
  else {const day=new Date(`${metadata.today}T12:00:00Z`);day.setUTCDate(day.getUTCDate()-Number(range)+1);params.set("start",day.toISOString().slice(0,10));params.set("end",metadata.today);}
  params.set("compare",$("compare").checked?"1":"0");
  return params;
}

function updateURL() {
  const params=query();params.set("view",view);params.set("range",$("range").value);
  history.replaceState(null,"",`${location.pathname}?${params}`);
}

function navigation() {
  $("navigation").innerHTML=Object.entries(views).map(([key,value],index)=>`${index===6?'<div class="nav-separator"></div>':''}<button type="button" class="nav-item" data-view="${key}" ${key===view?'aria-current="page"':''}>${icon(key)}<span>${value.name}</span></button>`).join("");
  $("page-title").textContent=views[view].title;$("page-description").textContent=views[view].description;
  document.title=`Socra · ${views[view].name}`;
}

function panel(title,description,body,{tag,link,full=false,note}={}) {
  return `<article class="panel ${full?'full':''}"><header class="panel-header"><div><h2>${esc(title)}</h2><p>${description}</p></div>${link?`<button class="panel-link" data-view="${link}">Approfondisci ↗</button>`:tag?`<span class="panel-kicker">${esc(tag)}</span>`:''}</header>${body}${note?`<div class="panel-note">${note}</div>`:''}</article>`;
}

const sumAvailable = rows => rows.some(r=>r.count==null)?null:rows.reduce((sum,r)=>sum+r.count,0);
const sampleNote = count => count==null?'Fonte non disponibile':count<5?'<span class="small-sample">Campione ridotto · nessuna conclusione statistica</span>':`${num(count)} osservazioni nel campione`;
const empty = (message="Nessun evento nel periodo",detail="Prova un intervallo più ampio o ripristina i filtri.") => `<div class="empty-chart"><span class="empty-symbol">↗</span><span>${esc(message)}</span><small>${esc(detail)}</small></div>`;
const detailsTable = (headers,rows,summary="Vedi i dati del grafico")=>`<details class="details-table"><summary>${summary}</summary><div class="table-wrap"><table class="data-table"><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></details>`;

function kpis() {
  return `<div class="section-label">INDICATORI ESSENZIALI <span>Nessun target automatico</span></div><div class="kpi-grid">${dashboard.kpis.map((k,index)=>{
    let detail;
    if (k.unit==="percent") detail=k.denominator?`${num(k.numerator)} / ${num(k.denominator)} ${k.denominator<5?'· campione ridotto':''}`:"Nessuna base di confronto";
    else if (k.previous!==undefined) detail=k.change==null?`Periodo precedente: ${num(k.previous)}`:`<span class="${k.change>=0?'change-up':'change-down'}">${k.change>=0?'↗ +':'↘ '}${num(k.change)}%</span> <span>vs periodo precedente</span>`;
    else detail=index===0?`${num(k.people)} apprendisti distinti`:"Conteggio nel periodo";
    return `<article class="kpi ${index===0?'featured':''}"><div class="kpi-head"><span>${esc(k.label)}</span><button class="info-button" type="button" data-info="${esc(k.key)}" aria-label="Definizione: ${esc(k.label)}">i</button></div><div class="kpi-value">${num(k.value)}${k.unit==='percent'&&k.value!=null?'<small>%</small>':''}</div><div class="kpi-change ${k.denominator<5?'small-sample':''}">${detail}</div><div class="kpi-scope">${esc(k.scope)}</div></article>`;
  }).join("")}</div>`;
}

function lineChart(keys) {
  const rows=dashboard.series;
  const used=keys.filter(key=>chartSelected[key]&&rows.some(r=>r[key]!=null));
  const max=Math.max(0,...rows.flatMap(row=>used.map(k=>row[k])));
  const legend=`<div class="chart-legend">${keys.map(key=>`<button class="legend-toggle" data-series="${key}" aria-pressed="${chartSelected[key]}"><span class="dot" style="background:${colors[key]}"></span>${seriesLabels[key]}</button>`).join("")}</div>`;
  if (!max) return legend+empty(used.length?"Nessun evento per le serie selezionate":keys.some(k=>chartSelected[k])?"Fonti delle serie non disponibili":"Scegli una serie nella legenda");
  const width=650,height=230,left=28,right=11,top=12,bottom=32;
  const plotWidth=width-left-right,plotHeight=height-top-bottom;
  const limit=Math.max(4,Math.ceil(max/4)*4);
  const x=index=>rows.length===1?left+plotWidth/2:left+index/(rows.length-1)*plotWidth;
  const y=value=>height-bottom-value/limit*plotHeight;
  const grid=Array.from({length:5},(_,i)=>`<line class="gridline" x1="${left}" x2="${width-right}" y1="${y(i*limit/4)}" y2="${y(i*limit/4)}"/><text class="axis" x="${left-8}" y="${y(i*limit/4)+3}" text-anchor="end">${num(i*limit/4)}</text>`).join("");
  const paths=used.map(key=>{
    const points=rows.map((r,i)=>`${x(i)},${y(r[key])}`).join(" ");
    return `${key==='useful'?`<polygon points="${x(0)},${height-bottom} ${points} ${x(rows.length-1)},${height-bottom}" fill="${colors[key]}" opacity=".09"/>`:''}<polyline class="line" points="${points}" stroke="${colors[key]}"/>${rows.length===1?`<circle cx="${x(0)}" cy="${y(rows[0][key])}" r="3" fill="${colors[key]}"/>`:''}`;
  }).join("");
  const indexes=[...new Set([0,Math.round((rows.length-1)/4),Math.round((rows.length-1)/2),Math.round((rows.length-1)*3/4),rows.length-1])];
  const labels=indexes.map(i=>`<text class="axis" x="${x(i)}" y="${height-9}" text-anchor="${i===0?'start':i===rows.length-1?'end':'middle'}">${shortDate(rows[i].date)}</text>`).join("");
  const points=rows.map((r,i)=>`<rect class="chart-point" data-point="${i}" x="${x(i)-Math.max(3,plotWidth/Math.max(1,rows.length-1)/2)}" y="${top}" width="${Math.max(6,plotWidth/Math.max(1,rows.length-1))}" height="${plotHeight}" opacity=".07"><title>${shortDate(r.date)}: ${used.map(k=>`${seriesLabels[k]} ${r[k]}`).join(', ')}</title></rect>`).join("");
  return `${legend}<svg class="chart" role="img" aria-label="Andamento ${dashboard.meta.grain==='week'?'settimanale':'giornaliero'}: ${used.map(k=>seriesLabels[k]).join(', ')}" viewBox="0 0 ${width} ${height}">${grid}${paths}${labels}${points}</svg>${detailsTable(['Data UTC',...keys.map(k=>seriesLabels[k])],rows.map(r=>[r.date,...keys.map(k=>r[k])]))}`;
}

function signupsChart() {
  const rows=dashboard.registrations_daily;
  const table=detailsTable(['Data UTC','Nuovi iscritti'],rows.map(r=>[r.date,r.registered]),'Vedi gli iscritti per giorno');
  const maximum=Math.max(0,...rows.map(r=>r.registered));
  if(!maximum) return empty('Nessun nuovo iscritto nel periodo','I giorni senza iscrizioni valgono zero.')+table;
  const width=850,height=230,left=30,right=12,top=12,bottom=32;
  const plotWidth=width-left-right,plotHeight=height-top-bottom;
  const limit=Math.max(4,Math.ceil(maximum/4)*4),step=plotWidth/rows.length;
  const x=i=>left+(i+.5)*step,y=value=>height-bottom-value/limit*plotHeight;
  const grid=Array.from({length:5},(_,i)=>`<line class="gridline" x1="${left}" x2="${width-right}" y1="${y(i*limit/4)}" y2="${y(i*limit/4)}"/><text class="axis" x="${left-8}" y="${y(i*limit/4)+3}" text-anchor="end">${num(i*limit/4)}</text>`).join('');
  const bars=rows.map((r,i)=>`<rect class="signup-bar" data-daily-point="${i}" x="${left+i*step+step*.16}" y="${y(r.registered)}" width="${step*.68}" height="${height-bottom-y(r.registered)}" rx="${Math.min(2,step*.1)}" fill="${colors.registered}"/><rect data-daily-point="${i}" x="${left+i*step}" y="${top}" width="${step}" height="${plotHeight}" fill="transparent"><title>${longDate(r.date)}: ${r.registered} nuovi iscritti</title></rect>`).join('');
  const indexes=[...new Set([0,Math.round((rows.length-1)/4),Math.round((rows.length-1)/2),Math.round((rows.length-1)*3/4),rows.length-1])];
  const labels=indexes.map(i=>`<text class="axis" x="${x(i)}" y="${height-9}" text-anchor="${i===0?'start':i===rows.length-1?'end':'middle'}">${shortDate(rows[i].date)}</text>`).join('');
  return `<svg class="chart signup-chart" role="img" aria-label="Distribuzione dei nuovi iscritti per giorno" viewBox="0 0 ${width} ${height}">${grid}${bars}${labels}</svg>${table}`;
}

function funnelPanel(link) {
  const {mature,pending}=dashboard.cohort;
  const body=mature?dashboard.funnel.map(step=>`<div class="funnel-row"><span>${esc(step.label)}</span><div class="funnel-track"><div class="funnel-fill" style="width:${step.value||0}%"></div></div><span class="funnel-count">${num(step.count)}</span><span class="funnel-percent">${pct(step.value)}</span></div>`).join(""):empty(pending?"Coorte ancora in osservazione":"Nessun nuovo iscritto nel periodo",pending?"Il funnel richiede 14 giorni interi dall’iscrizione.":"Prova un intervallo più ampio.");
  const largest=dashboard.funnel.slice(1).map((step,index)=>({label:step.label,count:step.count!=null&&dashboard.funnel[index].count!=null?dashboard.funnel[index].count-step.count:0})).sort((a,b)=>b.count-a.count)[0];
  const note=mature&&largest.count?`<div class="callout">${icon('activation')}<span>Il passaggio con più persone ferme è <b>${esc(largest.label.toLowerCase())}</b>: ${num(largest.count)} persone non lo hanno raggiunto nella finestra.</span></div>`:'';
  return panel("Dall’iscrizione al percorso",`${num(mature)} iscritti osservabili · finestra di 14 giorni`,body+note,{link,tag:"COORTE GLOBALE",note:`<strong>${num(pending)} persone ancora in osservazione</strong> · ${sampleNote(mature)}. Include richieste inviate e proposte ricevute. Filtri strumento/direzione esclusi.`});
}

function topicsPanel(full=false) {
  const rows=dashboard.topics;
  const any=rows.some(t=>t.demand||t.mentors||t.started||t.demand==null||t.mentors==null);
  const maximum=Math.max(1,...rows.map(t=>Math.max(t.demand,t.mentors||0)));
  const body=any?`<div class="chart-legend"><span><span class="dot" style="background:#527f6a"></span> Domanda aperta</span><span><span class="dot" style="background:var(--gold)"></span> Disponibilità dichiarata</span></div><div class="table-wrap"><table class="topics-table"><thead><tr><th scope="col">Strumento</th><th scope="col">Domanda</th><th scope="col">Mentor</th>${full?'<th scope="col">Avviati</th><th scope="col">Completati</th><th scope="col">Utili</th>':''}</tr></thead><tbody>${rows.filter(t=>t.demand||t.mentors||t.started||t.demand==null||t.mentors==null||full).slice(0,full?30:6).map(t=>`<tr><td class="topic-label"><span class="topic-dot"></span>${esc(t.label)}</td><td>${num(t.demand)}</td><td>${num(t.mentors)}<div class="balance-chart" aria-hidden="true"><i style="width:${t.demand/maximum*50}px"></i><i style="width:${(t.mentors||0)/maximum*50}px"></i></div></td>${full?`<td>${num(t.started)}</td><td>${num(t.completed)}</td><td>${num(t.useful)}</td>`:''}</tr>`).join("")}</tbody></table></div>`:empty("Nessuna domanda o disponibilità osservata","Le copie storiche possono non avere le fonti V3.");
  return panel("Domanda e disponibilità",full?"Domanda / mentor: fotografia attuale. Percorsi: periodo selezionato.":"Fotografia di oggi · disponibilità dichiarata per strumento",body,{full,link:full?null:'matching',tag:full?'OGGI + PERIODO':null,note:"I mentor indicati hanno disponibilità abilitata e capacità residua. <strong>Non è una misura di idoneità per ogni obiettivo.</strong> La direzione filtra i percorsi, non le disponibilità."});
}

function distribution(rows, color='var(--green)') {
  if(rows.some(r=>r.count==null)) return empty('Fonte non disponibile','Questa copia non contiene tutti i dati necessari per l’indicatore.');
  const total=rows.reduce((sum,r)=>sum+r.count,0);
  return total?rows.map((r,i)=>`<div class="distribution-row"><span class="distribution-key">${esc(r.label)}</span><div class="distribution-track"><div class="distribution-fill" style="width:${r.count/total*100}%;background:${Array.isArray(color)?color[i%color.length]:color}"></div></div><span class="distribution-number" title="${r.count} / ${total}">${num(r.count)}</span></div>`).join(""):empty("Nessuna risposta osservabile","I dati mancanti non vengono sostituiti con una risposta neutra.");
}

function qualityPanel(link) {
  const q=dashboard.quality,value=q.positive.value;
  const ring=value!=null?`<svg class="ring" viewBox="0 0 160 160" role="img" aria-label="${pct(value)} esiti positivi su ${q.pairs} coppie"><circle cx="80" cy="80" r="59" fill="none" stroke="#edf1e9" stroke-width="12"/><circle cx="80" cy="80" r="59" fill="none" stroke="#537e62" stroke-width="12" pathLength="100" stroke-dasharray="${value} 100" transform="rotate(-90 80 80)" stroke-linecap="round"/><text x="80" y="81" text-anchor="middle" font-size="28">${pct(value)}</text><text class="ring-label" x="80" y="100" text-anchor="middle">ESITI POSITIVI</text></svg>`:empty("Esito non ancora misurabile","Servono percorsi completati con feedback.");
  return panel("Il valore del confronto",`${num(q.pairs)} coppie · ultimo feedback per coppia nel campione`,`<div class="quality-hero">${ring}<div>${distribution(q.outcomes,['#47775f','#93b5a0','#d4bd7d','#c0c8bd','#bd7f63'])}</div></div>`,{link,tag:"ESITO DICHIARATO",note:`${num(q.positive.numerator)} / ${num(q.positive.denominator)} esiti positivi · ${num(q.people)} apprendisti distinti. ${sampleNote(q.pairs)}.`});
}

function queuePanel(link) {
  const o=dashboard.operations;
  const items=[['matching','Richieste in attesa',o.pending_requests,'Non scadute · in attesa di risposta'],['retention','Percorsi aperti da 14+ giorni',o.aged_paths,'Da approfondire, senza presumere un problema'],['quality','Feedback da completare',o.feedback_pending,'Percorsi nello stato feedback_pending'],['alert','Review aperte',o.reviews_open,'Segnalazioni e verifiche manuali']];
  return panel("Da seguire", "Situazione attuale · il periodo non ricostruisce la coda",items.map(([key,label,count,detail])=>`<div class="queue-row"><div><span class="queue-icon">${icon(key)}</span><span>${label}<small>${detail}</small></span></div><strong>${num(count)}</strong></div>`).join(""),{link,tag:"OGGI"});
}

function retentionPanel() {
  const rows=dashboard.retention;
  const body=rows.length?`<div class="table-wrap"><table class="heatmap"><thead><tr><th scope="col">Coorte di iscrizione</th>${[1,2,3,4].map(w=>`<th scope="col">W${w}</th>`).join("")}</tr></thead><tbody>${rows.map(row=>`<tr><td>${shortDate(row.week)}<small>${num(row.size)} iscritti</small></td>${row.cells.map(c=>`<td><div class="heat-cell ${c.value==null?'waiting':''}" ${c.value!=null?`style="background:rgba(52,113,78,${.07+c.value/100*.65});color:${c.value>60?'#fff':'#274c39'}"`:''} title="${c.available===false?'Fonte attività non disponibile':`${num(c.numerator)} ritornati / ${num(c.denominator)} osservabili; ${num(c.pending)} ancora in osservazione`}"><b>${c.value==null?'—':pct(c.value)}</b><small>${c.value==null?(c.available===false?'Fonte assente':'In osservazione'):`${c.numerator} / ${c.denominator}${c.pending?` · +${c.pending} attesa`:''}`}</small></div></td>`).join("")}</tr>`).join("")}</tbody></table></div><div class="heat-legend"><span>Minore ritorno</span>${[.1,.25,.45,.65,.8].map(alpha=>`<i style="background:rgba(52,113,78,${alpha})"></i>`).join("")}<span>Maggiore</span></div>`:empty("Nessun iscritto nella coorte selezionata");
  return panel("Le persone tornano?", "Coorti settimanali · ritorno su login o azioni osservate",body,{full:true,tag:"COMMUNITY GLOBALE",note:"W1 = giorni 7–14 dalla registrazione, W2 = 14–21, fino a W4. Ogni cella include soltanto persone con l’intero intervallo osservabile. Le celle tratteggiate sono immature. <strong>Il ritorno non misura tutte le visite.</strong> Strumento e direzione non si applicano."});
}

function renderView() {
  if (!dashboard) return;
  navigation();
  let body="";
  const totalCompleted=dashboard.quality.completed_paths;
  if(view==='overview') body=kpis()+`<div class="grid">${panel('Nuovi iscritti per giorno','Distribuzione giornaliera delle registrazioni nel periodo selezionato',signupsChart(),{full:true,tag:'GIORNO · GLOBALE',note:'Una barra per giorno, inclusi i giorni a zero. Amministratori e account di monitoraggio esclusi; filtri strumento/direzione esclusi. Sempre giornaliero, anche con gli altri grafici per settimana. Date UTC; il giorno corrente è parziale.'})}</div><div class="grid">${panel('I percorsi nel tempo','Avvii, completamenti ed esiti utili nel periodo',lineChart(['started','completed','useful']),{tag:dashboard.meta.grain==='week'?'SETTIMANA':'GIORNO',note:'Ogni punto conta eventi del periodo. Avvii e completamenti possono appartenere a coorti diverse.'})}${funnelPanel('activation')}</div><div class="grid equal">${topicsPanel()}${qualityPanel('quality')}</div><div class="grid equal">${queuePanel('operations')}${panel('Leggere i dati prima di decidere','La qualità di una misura conta quanto il suo valore',`<div class="callout">${icon('check')}<span><b>Prima esperienza → valore → ritorno.</b><br>Usa il funnel per trovare gli ostacoli, il feedback per capire l’esito e le coorti per seguire il ritorno.</span></div><div class="definition-card"><h3>Percentuali con una base visibile</h3><p>Ogni tasso mostra numeratore e denominatore. Una coorte immatura non diventa un insuccesso.</p></div><div class="definition-card"><h3>Disponibile non significa misurato</h3><p>Visite, device, ricerche senza risultati e tempi API richiedono raccolta specifica. Qui sono indicati come mancanti.</p></div>`,{link:'data',note:'Aggregati del database applicativo. Campioni ridotti richiedono cautela.'})}</div>`;
  if(view==='activation') body=`<p class="view-note">Il funnel segue la stessa coorte e una finestra di 14 giorni. Il numero di persone in ciascun passaggio non è il conteggio di tutti gli eventi avvenuti nel periodo.</p><div class="grid equal">${funnelPanel()}${panel('La base di osservazione','Nuovi iscritti nel periodo, esclusi gli amministratori',`<div class="big-stat"><strong>${num(dashboard.cohort.mature)}</strong><span>persone con 14 giorni<br>interi di osservazione</span></div><div class="stats-strip"><div><b>${num(dashboard.cohort.pending)}</b><small>Ancora in osservazione</small></div><div><b>${pct(dashboard.kpis.find(k=>k.key==='activation').value)}</b><small>Primo percorso entro 14 giorni</small></div></div><div class="callout warn">${icon('alert')}<span>Un nuovo iscritto non ha ancora avuto il tempo di convertirsi. Non viene conteggiato come abbandono.</span></div>`,{tag:'GLOBALE',note:sampleNote(dashboard.cohort.mature)})}</div><div class="grid">${panel('Iscrizioni e attività osservata','Persone uniche per giorno o settimana',lineChart(['registered','active']),{full:true,note:'Le attività osservate includono nuove sessioni e azioni tracciate. Le visite senza eventi non sono disponibili.'})}</div>`;
  if(view==='matching') {
    const m=dashboard.matching;
    const names={accepted:'Accettate',pending:'In attesa',rejected:'Rifiutate',expired:'Scadute',cancelled:'Annullate',withdrawn:'Ritirate',unknown:'Stato non ricostruibile'};
    const distributions=Object.entries(names).map(([key,label])=>({key,label,count:m.available?(m.statuses[key]||0):null}));
    body=`<div class="grid equal">${panel('Dalle richieste ai percorsi',`${num(m.total)} richieste e proposte create nel periodo`,distribution(distributions,['#527c62','#e2ba5d','#acbcb1','#c17d5b','#8d9fa3']),{tag:'COORTE RICHIESTE',note:`Accettazione: <strong>${pct(m.acceptance.value)}</strong> · ${num(m.acceptance.numerator)} / ${num(m.acceptance.denominator)}. Include le pendenti nel denominatore.`})}${panel('Quanto si aspetta una risposta?','Solo risposte con timestamp ricostruibile',`<div class="big-stat"><strong>${m.response.median_hours==null?'N/D':num(m.response.median_hours)+' h'}</strong><span>tempo mediano<br>di risposta</span></div><div class="stats-strip"><div><b>${m.response.p90_hours==null?'N/D':num(m.response.p90_hours)+' h'}</b><small>90° percentile</small></div><div><b>${num(m.response.sample)} / ${num(m.total)}</b><small>Tempi ricostruibili</small></div></div><div class="callout">${icon('matching')}<span>${num(m.available?(m.directions.mentee||0):null)} richieste dagli apprendisti · ${num(m.available?(m.directions.mentor||0):null)} proposte dai mentor.</span></div>`,{tag:'PERIODO',note:'Il tempo è misurato su history o avvio del percorso. Le richieste irrisolte e updated_at non diventano risposte.'})}</div><div class="grid">${topicsPanel(true)}</div>`;
  }
  if(view==='quality') body=`<div class="grid equal">${qualityPanel()}${panel('Completamenti e copertura','Percorsi formalmente completati nel periodo',`<div class="big-stat"><strong>${num(totalCompleted)}</strong><span>percorsi<br>completati</span></div><div class="stats-strip"><div><b>${num(dashboard.quality.feedback_paths)}</b><small>Con feedback apprendista valido</small></div><div><b>${pct(dashboard.quality.coverage.value)}</b><small>Copertura del feedback</small></div></div><div class="callout">${icon('check')}<span><b>${num(dashboard.kpis[0].value)} percorsi utili</b>, per ${num(dashboard.kpis[0].people)} apprendisti distinti. Il tasso di qualità usa una sola osservazione per coppia.</span></div>`,{note:'Un completamento richiede il processo bilaterale del backend. La dashboard osserva lo stato e non completa percorsi.'})}</div><div class="grid equal">${panel('Più autonomia?','Ultimo feedback per coppia nel campione',distribution(dashboard.quality.autonomy),{note:sampleNote(sumAvailable(dashboard.quality.autonomy))})}${panel('Lo rifarebbero?','Volontà dichiarata dall’apprendista',distribution(dashboard.quality.repeat,'#9c8653'),{note:sampleNote(sumAvailable(dashboard.quality.repeat))})}</div><div class="grid equal">${panel('La profondità era adeguata?','Risposte V3 presenti, senza imputare i dati legacy',distribution(dashboard.quality.depth,['#527c62','#aebcad','#c3a665']),{note:`${num(sumAvailable(dashboard.quality.depth))} risposte osservabili`})}${panel('Completamenti nel tempo','Eventi del periodo selezionato',lineChart(['completed','useful']),{note:'Conta tutti i percorsi completati. Una coppia ripetuta può completare più percorsi; il tasso qualità rimane deduplicato.'})}</div>`;
  if(view==='retention') body=`<div class="notice-box">La frequenza di un percorso di apprendimento può essere diversa dall’uso quotidiano di un’app. Leggi il ritorno insieme agli esiti e alla durata dei percorsi, senza fissare un obiettivo arbitrario di accessi.</div><div class="grid">${retentionPanel()}</div><div class="grid equal">${panel('Un’altra esperienza di apprendimento','Conteggio descrittivo fino alla fine osservata',`<div class="big-stat"><strong>${num(dashboard.repeat_learners)}</strong><span>apprendisti con almeno<br>due percorsi avviati</span></div>`,{tag:'GLOBALE',note:'Persone distinte, senza filtro di strumento/direzione. Non è una previsione di ritorno futuro.'})}${panel('Attività nel periodo','Nuove sessioni e azioni osservate',lineChart(['active']),{note:'Una nuova sessione registra login o registrazione. La navigazione durante una sessione già aperta può non comparire.'})}</div>`;
  if(view==='operations') {
    const o=dashboard.operations;
    const severityNames={critical:'Critica',high:'Alta',medium:'Media',low:'Bassa',unknown:'Non classificata'};
    body=`<p class="view-note">Le code e i saldi descrivono <b>oggi</b>, anche quando scegli un periodo storico. I movimenti di credito si riferiscono invece al periodo selezionato. Le review sono globali: non hanno un filtro affidabile per strumento.</p><div class="grid equal">${queuePanel()}${panel('Segnalazioni da valutare','Review aperte per gravità · nessuna sanzione automatica',distribution(Object.entries(severityNames).map(([key,label])=>({key,label,count:o.reviews_open==null?null:(o.reviews_severity[key]||0)})),['#a96249','#c7a05a','#9aaf9f','#c7d0c4']),{tag:'OGGI · GLOBALE',note:o.reviews_open==null?'Fonte review non disponibile in questa copia.':'Una review è un caso da verificare; non dimostra da sola una violazione.'})}</div><div class="grid equal">${panel('Crediti in circolazione','Saldo attuale, esclusi gli amministratori',`<div class="big-stat"><strong>${num(o.wallet_balance)}</strong><span>crediti interni<br>nel saldo corrente</span></div><div class="stats-strip"><div><b>${num(o.wallet_empty)}</b><small>Account senza saldo positivo o con debito</small></div><div><b>${num(o.credits_spent)}</b><small>Addebiti nel periodo</small></div><div><b>${num(o.credits_issued)}</b><small>Accrediti nel periodo</small></div></div>`,{tag:'OGGI + PERIODO',note:'I crediti non sono monetizzabili. Gli accrediti includono anche eventuali saldi iniziali e aggiustamenti, non solo reward.'})}${panel('Stati da riconciliare','Osservazione in sola lettura',`<div class="queue-row"><div><span>Richieste scadute ancora pending<small>expires_at trascorso · nessuna scrittura di stato</small></span></div><strong>${num(o.expired_pending)}</strong></div><div class="queue-row"><div><span>Percorsi non completati<small>Filtri strumento e direzione applicati</small></span></div><strong>${num(o.open_paths)}</strong></div><div class="callout warn">${icon('alert')}<span>I percorsi aperti da 14 giorni sono una coda di attenzione, non una violazione o un abbandono accertato.</span></div>`,{tag:'OGGI'})}</div>`;
  }
  if(view==='data') body=`<div class="notice-box"><b>${'Dati correnti Socra'}</b> · ${esc(dashboard.meta.name)}. ${'Snapshot del database applicativo in sola lettura.'} Amministratori e account di monitoraggio sono esclusi dalle metriche. Nessun identificativo, email, nota privata o risposta finanziaria viene restituito alla dashboard.</div><div class="grid equal">${panel('Fonti lette','Disponibilità nella sorgente selezionata',`<div class="table-wrap"><table class="data-table"><thead><tr><th>Fonte</th><th>Righe</th><th>Disponibilità</th></tr></thead><tbody>${Object.entries(dashboard.meta.counts).map(([key,count])=>`<tr><td>${esc(sourceNames[key]||key)}</td><td>${num(count)}</td><td><span class="badge ${dashboard.meta.available.includes(key)?'good':'unavailable'}">${dashboard.meta.available.includes(key)?'Presente':'Assente'}</span></td></tr>`).join("")}</tbody></table></div>`,{tag:'SORGENTE'})}${panel('Da raccogliere','Indicatori che non hanno ancora una fonte completa',`<div class="definition-card"><h3>Acquisizione e navigazione</h3><p>Visitatori, canale/UTM, device, visite alle pagine e abbandoni per schermata della survey.</p></div><div class="definition-card"><h3>Matching senza opportunità</h3><p>Ricerche con zero risultati e disponibilità hard-valid per obiettivo. Gli opt-in non bastano.</p></div><div class="definition-card"><h3>Salute tecnica del servizio</h3><p>Uptime, tasso errori API, latenza P95/P99, errori email e disponibilità del provider Meet.</p></div><div class="callout">${icon('data')}<span>Le impressioni V3 hanno retention di 30 giorni. Non sono una misura completa dello storico visite.</span></div>`,{tag:'NON MISURATO',note:'Gli indicatori senza fonte restano N/D. Nessun tracking esterno è stato aggiunto.'})}</div><div class="grid">${panel('Dizionario delle metriche','Definizioni del monitoraggio · non modifica le regole di prodotto',`<div class="definitions-grid">${definitions.map(([title,text])=>`<div class="definition-card"><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`).join("")}</div>`,{full:true})}</div>${dashboard.meta.warnings.length?panel('Limiti della sorgente','Informazioni da conservare quando interpreti i grafici',dashboard.meta.warnings.map(w=>`<p class="micro-note">${esc(w)}</p>`).join("")):''}`;
  $("content").innerHTML=body;
  $("content").setAttribute("aria-busy","false");
}

const sourceNames={users:'Account',surveys:'Survey completate',drafts:'Ultime bozze',goals:'Obiettivi',requests:'Richieste e proposte',paths:'Percorsi',feedback:'Feedback',sessions:'Nuove sessioni',request_history:'Storico risposte',closures:'Chiusure',wallets:'Wallet',transactions:'Movimenti crediti',reviews:'Review amministrative',optins:'Disponibilità per strumento',instrument_surveys:'Snapshot survey V3'};

async function load() {
  updateURL();
  controller?.abort();controller=new AbortController();const activeController=controller;const id=++requestId;const requestedQuery=query().toString();
  $("status").textContent="";$("content").setAttribute("aria-busy","true");$("export").disabled=true;$("refresh").disabled=true;
  if(!dashboard) $("content").innerHTML='<div class="loading" aria-label="Caricamento degli indicatori"></div>';
  const timer=setTimeout(()=>activeController.abort(),15000);
  try {
    const response=await authenticatedFetch(`/api/monitoring/dashboard?${requestedQuery}`,{signal:activeController.signal,cache:'no-store'});
    const result=await response.json();
    if(!response.ok) throw new Error(result.detail||result.error||"Dati non disponibili.");
    if(id!==requestId) return;
    dashboard=result;renderedQuery=requestedQuery;
    $("source-tag").textContent='SOCRA · DATI CORRENTI';
    $("source-tag").classList.toggle('local',true);
    $("period-label").textContent=`${longDate(result.meta.start)} — ${longDate(result.meta.end)} · date UTC`;
    $("source-notice").textContent="Database applicativo · aggregati in sola lettura. Date UTC; il giorno corrente è parziale.";
    $("last-updated").textContent=`Ultima lettura ${new Date(result.meta.generated_at).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})} · nessuna scrittura`;
    $("export").disabled=false;
    renderView();
  } catch(error) {
    if(id!==requestId) return;
    dashboard=null;$("content").innerHTML="";$("content").setAttribute("aria-busy","false");
    $("source-tag").textContent="SOCRA · ERRORE";
    $("source-notice").textContent="Nessun dato mostrato: la sorgente selezionata non è stata sostituita.";
    $("status").textContent=error.name==='AbortError'?"La lettura sta impiegando troppo tempo. Riprova con Aggiorna.":error.message;
    $("last-updated").textContent="Lettura non completata";
  } finally {clearTimeout(timer);if(id===requestId) $("refresh").disabled=false;}
}

function info(key) {
  const k=dashboard.kpis.find(k=>k.key===key);
  const dialog=document.createElement('dialog');
  dialog.innerHTML=`<h2>${esc(k.label)}</h2><p>${esc(k.help)}</p><p><b>Ambito:</b> ${esc(k.scope)}${k.denominator!==undefined?`<br><b>Campione:</b> ${num(k.numerator)} / ${num(k.denominator)}`:''}</p><button class="button primary">Ho capito</button>`;
  document.body.append(dialog);dialog.querySelector('button').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
}

const tooltip=document.createElement('div');tooltip.className='chart-tooltip';tooltip.hidden=true;document.body.append(tooltip);
document.addEventListener('pointermove',event=>{
  const point=event.target.closest('[data-point], [data-daily-point]');
  if(!point||!dashboard) {tooltip.hidden=true;return;}
  const daily=point.dataset.dailyPoint!==undefined;
  const row=daily?dashboard.registrations_daily[Number(point.dataset.dailyPoint)]:dashboard.series[Number(point.dataset.point)];
  tooltip.innerHTML=`<b>${shortDate(row.date)}</b>${(daily?['registered']:Object.keys(seriesLabels).filter(k=>chartSelected[k])).map(k=>`${seriesLabels[k]}: ${num(row[k])}`).join('<br>')}`;
  tooltip.hidden=false;tooltip.style.left=`${Math.max(8,Math.min(event.clientX+12,innerWidth-210))}px`;tooltip.style.top=`${Math.max(8,Math.min(event.clientY+12,innerHeight-tooltip.offsetHeight-8))}px`;
});
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button) return;
  if(button.dataset.view) {
    view=button.dataset.view;
    if(view==='activation') {chartSelected.registered=true;chartSelected.active=true;}
    if(view==='retention') chartSelected.active=true;
    renderView();if(metadata) updateURL();
  }
  if(button.dataset.info&&dashboard) info(button.dataset.info);
  if(button.dataset.series) {const key=button.dataset.series;chartSelected[key]=!chartSelected[key];renderView();document.querySelector(`[data-series="${key}"]`)?.focus();}
});

function toggleDates() {$("custom-dates").hidden=$("range").value!=='custom';}
function reset() {
  $("source").value='live';$("range").value='30';$("topic").value='all';$("direction").value='all';$("grain").value='day';$("compare").checked=true;
  $("start").value=metadata.default_start;$("end").value=metadata.today;toggleDates();load();
}
$("reset").addEventListener('click',reset);
$("refresh").addEventListener('click',load);
$("export").addEventListener('click',async()=>{
  if(!dashboard||!renderedQuery)return;
  try {
    const response=await authenticatedFetch('/api/monitoring/export.csv?'+renderedQuery,{cache:'no-store'});
    if(!response.ok)throw new Error('Esportazione non disponibile.');
    const url=URL.createObjectURL(await response.blob());const link=document.createElement('a');link.href=url;link.download='socra-monitoraggio.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(error){$("status").textContent=error.message;}
});
$("apply-dates").addEventListener('click',()=>{if(!$("start").reportValidity()||!$("end").reportValidity())return;load();});
for(const key of ['source','topic','direction','grain','compare']) $(key).addEventListener('change',load);
$("range").addEventListener('change',()=>{toggleDates();if($("range").value!=='custom')load();});
navigation();

async function init() {
  try {
    const response=await authenticatedFetch('/api/monitoring/meta',{cache:'no-store'});
    if(!response.ok)throw new Error('Informazioni della sorgente non disponibili.');
    metadata=await response.json();
    for(const [key,label] of Object.entries(metadata.topics)) {const option=document.createElement('option');option.value=key;option.textContent=label;$("topic").append(option);}
    setTimeout(expireAccess, Math.max(0, Date.parse(metadata.grant_expires_at)-Date.now()));
    $("start").value=metadata.default_start;$("end").value=metadata.today;
    $("start").max=metadata.today;$("end").max=metadata.today;
    const params=new URLSearchParams(location.search);
    for(const key of ['source','topic','direction','grain','range']) {
      const value=params.get(key);if(value&&[...$(key).options].some(o=>o.value===value)) $(key).value=value;
    }
    if(!params.has('range')&&params.has('start')) $("range").value=params.get('start')==='all'?'all':'custom';
    if(params.get('start')&&params.get('start')!=='all') $("start").value=params.get('start');
    if(params.get('end')) $("end").value=params.get('end');
    $("compare").checked=params.get('compare')!=='0';
    if(view==='activation') {chartSelected.registered=true;chartSelected.active=true;}
    if(view==='retention') chartSelected.active=true;
    toggleDates();await load();
  } catch(error) {$("status").textContent=`${error.message} Ricarica la pagina per riprovare.`;$("content").setAttribute('aria-busy','false');}
}
init();

function expireAccess() {
  controller?.abort();dashboard=null;renderedQuery=null;$("content").replaceChildren();$("export").disabled=true;
  document.querySelectorAll('dialog').forEach(node=>node.remove());tooltip.hidden=true;
  location.replace('/admin/monitoraggio/verifica');
}
async function authenticatedFetch(url,options) {
  const response=await fetch(url,options);
  if(response.status===401||response.status===403){expireAccess();throw new Error('Accesso da verificare.');}
  return response;
}
$("lock").addEventListener('click',async()=>{
  try {const response=await authenticatedFetch('/api/monitoring/lock',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(!response.ok)throw new Error('Blocco non riuscito. Riprova.');expireAccess();}
  catch(error){$("status").textContent=error.message;}
});
addEventListener('storage',event=>{if(event.key==='socra-session-change')expireAccess();});
addEventListener('pageshow',event=>{if(event.persisted)expireAccess();});
