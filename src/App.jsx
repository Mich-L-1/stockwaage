import { useState, useEffect, useCallback, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const DEFAULT_URL="https://script.google.com/macros/s/AKfycbywsE3Hik8hL0Eowxy6TsoDVCH0rq994eE_s9dEcgyILEcFlG-vMy4Y-meoi9wbYrxWuw/exec";
const COLORS=["#BA7517","#378ADD","#E24B4A","#1D9E75","#7C4DBC","#E85A0E","#0891B2","#BE185D"];
const LINE_DASH=[undefined,"8 4","3 3","8 4 2 4","12 3","4 4","8 4 2 4 2 4","16 4"];
const ALARM_META={
  diebstahl:{label:"🚨 Diebstahl",c:"#E24B4A"},schwarm:{label:"🐝 Schwarm",c:"#BA7517"},
  honig:{label:"🍯 Honigeintrag",c:"#639922"},raeuberei:{label:"⚠️ Räuberei",c:"#D97706"},
  gewitter:{label:"⛈ Gewitterwarnung",c:"#5B7FBA"},
  bearbeitung:{label:"✏️ Bearbeitungsm.",c:"#378ADD"},entwickler:{label:"🔧 Entwicklermod.",c:"#7C4DBC"},
  system:{label:"ℹ️ System",c:"#888"},
};
const BUILTIN_Z={
  brut:{h:22,brd:"#185FA5",bg:"rgba(30,100,200,0.10)",tc:"#185FA5",label:"Brutzarge",w:5.0,isBuiltin:true},
  honig:{h:18,brd:"#854F0B",bg:"rgba(180,120,0,0.10)",tc:"#854F0B",label:"Honigraum",w:4.5,isBuiltin:true},
  leer:{h:14,brd:"#777",bg:"transparent",tc:"#777",label:"Leerzarge",w:3.0,isBuiltin:true},
  ableger:{h:22,brd:"#0F6E56",bg:"rgba(15,110,86,0.10)",tc:"#0F6E56",label:"Ableger",w:5.0,isBuiltin:true},
  futteraufsatz:{h:18,brd:"#2E7D32",bg:"rgba(46,125,50,0.10)",tc:"#2E7D32",label:"Futteraufsatz",w:4.0,isBuiltin:true},
  absperrgitter:{h:6,brd:"#222",bg:"#444",tc:"#fff",label:"Absperrgitter",w:0.3,isBuiltin:true},
};
const BEUTEN_DEFAULT={
  zander:{label:"Zander",rahmen:10,zargenGew:5.0,honigProR:2.2,isBuiltin:true},
  dadant:{label:"Dadant",rahmen:12,zargenGew:6.5,honigProR:2.5,isBuiltin:true},
  dnm:{label:"DNM",rahmen:10,zargenGew:4.5,honigProR:2.0,isBuiltin:true},
  segeberger:{label:"Segeberger",rahmen:10,zargenGew:2.5,honigProR:2.0,isBuiltin:true},
  langstroth:{label:"Langstroth",rahmen:10,zargenGew:5.5,honigProR:2.5,isBuiltin:true},
  eigenbau:{label:"Eigenbau",rahmen:10,zargenGew:4.0,honigProR:2.2,isBuiltin:true},
};
const STATUS_OPTS=[
  {v:"normal",l:"✅ Normal",s:"Normal"},{v:"weisellos",l:"⚠️ Weisellos",s:"Weisellos"},
  {v:"zuchtvolk",l:"👑 Zuchtvolk",s:"Zuchtvolk"},{v:"austauschen",l:"🔄 Austauschen",s:"Austauschen"},
  {v:"behandeln",l:"💊 Behandeln",s:"Behandeln"},{v:"beobachten",l:"🔍 Beobachten",s:"Beobachten"},
  {v:"nachzuechten",l:"🐣 Nachzüchten",s:"Nachzüchten"},
];
const STATUS_CLR={normal:"#1D9E75",weisellos:"#E24B4A",zuchtvolk:"#7C4DBC",austauschen:"#D97706",behandeln:"#E85A0E",beobachten:"#378ADD",nachzuechten:"#BA7517"};
const BLK={default:{bg:"rgba(128,128,128,0.05)",brd:"rgba(128,128,128,0.18)"},warm:{bg:"rgba(186,117,23,0.07)",brd:"rgba(186,117,23,0.30)"},cool:{bg:"rgba(55,138,221,0.07)",brd:"rgba(55,138,221,0.28)"},green:{bg:"rgba(29,158,117,0.07)",brd:"rgba(29,158,117,0.28)"}};
const FT_ARTEN=["Zuckerlösung 1:1","Zuckerlösung 2:1","Fondant","Futterkranz","Sirup","Oxalsäure"];
const KRANKHEITEN=["Kalkbrut","Nosema","Sackbrut","Europäische Faulbrut","Amerikanische Faulbrut","DWV (Verkrüppelter Flügel)","CBPV (Chronische Paralyse)"];
const KONIGIN_FARBEN={1:"#f5f5f5",2:"#FFD700",3:"#DC143C",4:"#228B22",5:"#1E90FF",6:"#f5f5f5",7:"#FFD700",8:"#DC143C",9:"#228B22",0:"#1E90FF"};
const KONIGIN_FARB_NAME={1:"Weiß",2:"Gelb",3:"Rot",4:"Grün",5:"Blau",6:"Weiß",7:"Gelb",8:"Rot",9:"Grün",0:"Blau"};
const PRESET_COLORS=["#185FA5","#854F0B","#0F6E56","#7C4DBC","#E85A0E","#0891B2","#BE185D","#555","#BA7517","#1D9E75"];
const MSG_VARS=[
  {v:"{station}",b:"Stationsname"},{v:"{datum}",b:"Datum + Uhrzeit"},{v:"{temp}",b:"Außentemperatur °C"},
  {v:"{hum}",b:"Luftfeuchtigkeit %"},{v:"{pres}",b:"Luftdruck hPa"},{v:"{bat}",b:"Batterie %"},
  {v:"{w0}",b:"Gewicht W0 (kg)"},{v:"{w0_name}",b:"Stockname W0"},{v:"{w0_queen}",b:"Königin W0 (K12 · )"},
  {v:"{w0_brut}",b:"Brutraum W0 °C"},{v:"{w0_bat}",b:"Batterie W0 %"},{v:"{w1} … {w5}",b:"Gewicht W1–5"},
];
const DEFAULT_RULES=[
  {id:"r1",name:"Honigeintrag",typ:"zunahme",schwelle:0.5,zeitraum:3,aktiv:true,emoji:"🍯",waage:"0"},
  {id:"r2",name:"Räuberei",typ:"abnahme",schwelle:0.3,zeitraum:3,aktiv:true,emoji:"⚠️",waage:"0"},
  {id:"r3",name:"Schwarm",typ:"abnahme",schwelle:1.0,zeitraum:1,aktiv:true,emoji:"🐝",waage:"0"},
];
const DEFAULT_MSG_UPDATE=
  "🐝 {station} · {datum}\n\n"+
  "☁️ Außen: {temp}°C · {hum}% · {pres} hPa\n\n"+
  "━━ {w0_queen}{w0_name} · 🔋{w0_bat}% ━━\n"+
  "⚖️ {w0} kg\n"+
  "🌡 Brutraum: {w0_brut}°C";
const WOCHENTAGE=["So","Mo","Di","Mi","Do","Fr","Sa"];

// ── LocalStorage ──────────────────────────────────────────────
const ls={
  get:(k)=>{try{const r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch{return null;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}},
  del:(k)=>{try{localStorage.removeItem(k);}catch{}},
};
const ZARGEN_DEFAULTS=Object.entries(BUILTIN_Z).map(([id,v])=>({id,...v}));
const BEUTEN_DEFAULTS=Object.entries(BEUTEN_DEFAULT).map(([id,v])=>({id,...v}));
function loadZargenAll(){return ls.get("sw_zargen_all")||ZARGEN_DEFAULTS.map(x=>({...x}));}
function saveZargenAll(a){ls.set("sw_zargen_all",a);}
function loadBeutenAll(){return ls.get("sw_beuten_all")||BEUTEN_DEFAULTS.map(x=>({...x}));}
function saveBeutenAll(a){ls.set("sw_beuten_all",a);}
function zTypesMap(arr){const m={};arr.forEach(t=>{m[t.id]=t;});return m;}
function bTypesMap(arr){const m={};arr.forEach(t=>{m[t.id]=t;});return m;}
function loadManualStocks(sid){return ls.get("manual_stocks_"+sid)||[];}
function saveManualStocks(sid,arr){ls.set("manual_stocks_"+sid,arr);}
function loadRules(){return ls.get("sw_notif_rules")||DEFAULT_RULES.map(r=>({...r}));}
function saveRules(r){ls.set("sw_notif_rules",r);}
function loadMsgTemplates(){return ls.get("sw_msg_tpl")||{update:DEFAULT_MSG_UPDATE};}
function saveMsgTemplates(t){ls.set("sw_msg_tpl",t);}
function syncRulesToSheets(apiUrl,rules){if(!apiUrl)return;fetch(apiUrl+"?action=saveConfig&key=notif_rules&value="+encodeURIComponent(JSON.stringify(rules))).catch(function(e){console.warn("Rules sync:",e);});}
function syncMsgToSheets(apiUrl,templates){if(!apiUrl)return;fetch(apiUrl+"?action=saveConfig&key=msg_update&value="+encodeURIComponent(templates.update)).catch(function(e){console.warn("Msg sync:",e);});}
function syncZuchtbuchToSheets(apiUrl,sid,wKey,zb,vd){if(!apiUrl)return;var params=new URLSearchParams({action:"saveVolk",sid:sid,wKey:wKey,zb:JSON.stringify(zb||{}),vdStatus:(vd&&vd.status)||"normal",koniginzeichen:(zb&&zb.koniginzeichen)||"",schluepfjahr:String((zb&&zb.schluepfjahr)||""),zuchtbuchNr:(zb&&zb.zuchtbuchNr)||"",lebensNr:(zb&&zb.lebensNr)||""});fetch(apiUrl+"?"+params.toString()).catch(function(e){console.warn("Sheets sync:",e);});}
function loadVolkData(sid,wk){return ls.get("volk_"+sid+"_"+wk);}
function saveVolkData(sid,wk,vd){ls.set("volk_"+sid+"_"+wk,vd);}
function loadZuchtbuch(sid,wk){return ls.get("zb_"+sid+"_"+wk);}
function saveZuchtbuch(sid,wk,zb){ls.set("zb_"+sid+"_"+wk,zb);}

// ── Helper Functions ──────────────────────────────────────────
function fmt(ts){const d=new Date(ts);return d.getHours()+":"+String(d.getMinutes()).padStart(2,"0");}
function dateFmt(ts){const d=new Date(ts);return String(d.getDate()).padStart(2,"0")+"."+(d.getMonth()+1)+".";}
function ago(ts){const m=Math.round((Date.now()-new Date(ts).getTime())/60000);if(m<60)return "vor "+m+" Min";if(m<1440)return "vor "+Math.round(m/60)+" Std";return "vor "+Math.round(m/1440)+" Tagen";}
function batClr(p){return p>50?"#1D9E75":p>20?"#BA7517":"#E24B4A";}
function dClr(d){if(d>0.5)return{t:"#1D9E75",bg:"rgba(29,158,117,0.1)"};if(d<-0.5)return{t:"#E24B4A",bg:"rgba(226,75,74,0.1)"};return{t:"#888",bg:"rgba(128,128,128,0.08)"};}
function addDays(ds,days){if(!ds)return "";try{const d=new Date(ds);d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);}catch{return "";}}
function daysBetween(a,b){try{return Math.round((new Date(b)-new Date(a))/86400000);}catch{return null;}}
function koniginFarbe(jahr){var d=+String(jahr).slice(-1);return{hex:KONIGIN_FARBEN[d]||"#ccc",name:KONIGIN_FARB_NAME[d]||"—",isWeiss:KONIGIN_FARBEN[d]==="#f5f5f5"};}
function kfTextColor(kf){return "#1a1a1a";}  // always dark - use KfDot for color
function kfBg(kf){return kf.isWeiss?"rgba(0,0,0,0.07)":"transparent";}
function kfBorder(kf){return kf.isWeiss?"2px solid #666":"none";}
function KfDot({kf,size}){
  var s=size||14;
  return(<span style={{
    display:"inline-block",flexShrink:0,
    width:s,height:s,borderRadius:"50%",
    background:kf.hex,
    border:"1.5px solid rgba(0,0,0,0.55)",
    verticalAlign:"middle"
  }}/>);
}
function druckAufMeereshoehe(druckRoh,hoehe){if(!druckRoh||druckRoh<=0)return druckRoh;return druckRoh+((hoehe||0)/8.5);}
function wetterIcon(druckMeer){if(!druckMeer||druckMeer<=0)return{icon:"–",label:"—"};if(druckMeer>1020)return{icon:"☀️",label:"Beständig"};if(druckMeer>=1013)return{icon:"🌤",label:"Wechselhaft"};if(druckMeer>=1005)return{icon:"🌧",label:"Regnerisch"};return{icon:"⛈",label:"Unwetterlage"};}
function gewitterTrend(data,hoeheMeter){if(!data||data.length<6)return null;const recent=data.slice(-6);const korr=recent.map(d=>druckAufMeereshoehe(+d.pres||0,hoeheMeter)).filter(p=>p>0);if(korr.length<2)return null;const diff=korr[korr.length-1]-korr[0];return{diff:+diff.toFixed(1),warning:diff<=-5.0};}
function calcWetterHistory(data,hoehe){const days={};data.forEach(d=>{const dt=new Date(d.ts);const key=dt.toISOString().slice(0,10);if(!days[key])days[key]={temps:[],presses:[],label:dt.getDate()+"."+(dt.getMonth()+1)+".",wt:WOCHENTAGE[dt.getDay()]};const t=+d.temp||0;const p=druckAufMeereshoehe(+d.pres||0,hoehe);if(t>-30&&t<60)days[key].temps.push(t);if(p>900)days[key].presses.push(p);});return Object.values(days).slice(-7).map(({temps,presses,label,wt})=>({label,wt,minT:temps.length?Math.min(...temps).toFixed(0):"—",maxT:temps.length?Math.max(...temps).toFixed(0):"—",icon:presses.length?wetterIcon(Math.min(...presses)).icon:"–"}));}
function fmtX(ts,range){const d=new Date(ts);const mm=String(d.getMinutes()).padStart(2,"0");if(range==="24h")return d.getHours()+":"+mm;if(range==="7d")return WOCHENTAGE[d.getDay()]+" "+d.getDate()+"."+(d.getMonth()+1)+".";return d.getDate()+"."+(d.getMonth()+1)+". "+d.getHours()+":"+mm;}
function calcTagesvergleich(data,stocks){if(data.length<2)return{rows:[],totH:0,totG:0};const today=new Date();today.setHours(0,0,0,0);const rowF=ts=>data.reduce((b,d)=>Math.abs(new Date(d.ts)-ts)<Math.abs(new Date(b.ts)-ts)?d:b,data[0]);const h=rowF(today.getTime()),g=rowF(today.getTime()-86400000);const rows=[0,1,2,3,4,5].map(i=>{const k="w"+i,nm=stocks[String(i)];if(!nm||!h[k]||h[k]<0.5)return null;return{k,nm,h:+h[k]||0,g:+g[k]||0,d:(+h[k]||0)-(+g[k]||0)};}).filter(Boolean);return{rows,totH:rows.reduce((s,r)=>s+r.h,0),totG:rows.reduce((s,r)=>s+r.g,0)};}
function calcTheo(vd,zTypes,beutenTypes){const btMap=typeof beutenTypes==="object"&&!Array.isArray(beutenTypes)?beutenTypes:bTypesMap(beutenTypes||BEUTEN_DEFAULTS);const bt=btMap[vd.beutentyp||"zander"]||BEUTEN_DEFAULTS[0]||{rahmen:10,zargenGew:5.0,honigProR:2.2};const z=vd.zargen||[];const bienenmasse=+(((vd.besWaben||0)*0.25).toFixed(1));const futtervorrat=+(((vd.besHonig||0)*bt.honigProR).toFixed(1));const zargenGew=+z.reduce((s,x)=>{const zt=zTypes[x.t];return s+(zt?zt.w:3.5);},0).toFixed(1);return{bienenmasse,futtervorrat,zargenGew,gesamt:+(bienenmasse+futtervorrat+zargenGew+5).toFixed(1),bt};}
function defaultVolkData(isManual){return{zargen:[{t:"brut"}],beutentyp:"zander",status:"normal",besWaben:8,besHonig:0,notiz:"",fuetterung:[],standNr:isManual?null:0,scaleId:null,konigin:{nr:"",schlupfjahr:new Date().getFullYear(),zuchtbuchNr:"",anpaarung:"",mutterNr:""}};}
function defaultZuchtbuch(){return{schluepfjahr:new Date().getFullYear(),koniginzeichen:"",zuchtbuchNr:"",wabenHerbst:"",wabenAuswinterung:"",wabenMai:"",volksstarke:"",honigraumGabe:"",fruhtracht:"",haupttracht:"",milbeW1:"",milbeW2:"",milbeW3:"",nadeltest:[{datum:"",anstich:"",kontroll:"",ausgeraumt:""},{datum:"",anstich:"",kontroll:"",ausgeraumt:""}],puderzucker:[{datum:"",bienen:"",milben:""},{datum:"",bienen:"",milben:""},{datum:"",bienen:"",milben:""}],sommerbehandlung:"",restentmilbung:"",krankheiten:[],inspektionen:[],smrTag0:"",notiz:""};}

// ── Demo Data ─────────────────────────────────────────────────
function mkDemo(base,seed){const rows=[],now=Date.now();for(let i=119;i>=0;i--){const ts=new Date(now-i*1800000).toISOString(),r=s=>Math.sin(i*0.3+s)*0.4;rows.push({ts,temp:22.5+r(1),hum:64+r(2)*5,pres:1013+r(3)*3,bat:85,w0:+(base+r(4)).toFixed(2),w1:+(base*0.47+r(5)*0.5+seed).toFixed(2),w2:+(base*0.55+r(6)*0.5+seed*0.5).toFixed(2),b0:34.5,b1:33.8,b2:0,bat0:85,bat1:72});}return rows;}
const DEMO_DATA={s1:mkDemo(38.7,0),s2:mkDemo(22.1,2)};
const DEMO_STOCKS={s1:{"0":"Hauptstock","1":"Ableger Süd","2":"Waldstock"},s2:{"0":"Bienenstock B","1":"Junges Volk"}};
const DEMO_ALARME=[
  {ts:new Date(Date.now()-4*3600e3).toISOString(),typ:"honig",waage:"1",wert:19.5,referenz:17.2,beschreibung:"Gewichtsanstieg +2.3 kg"},
  {ts:new Date(Date.now()-18*3600e3).toISOString(),typ:"schwarm",waage:"0",wert:33.1,referenz:36.4,beschreibung:"Gewichtsverlust -3.3 kg"},
  {ts:new Date(Date.now()-26*3600e3).toISOString(),typ:"bearbeitung",waage:"",wert:0,referenz:0,beschreibung:"Bearbeitungsmodus aktiviert"},
];
const DEMO_SCALES=[{id:1,sn:"HW-W0",pos:"HW/W0",name:"Hauptstock"},{id:3,sn:"SAT1-W1",pos:"SAT1/W0",name:"Ableger Süd"}];
const DEMO_DEVICES=[{mac:"D4:E9:F4:77:AC:B4",role:"Hauptwaage"},{mac:"AA:BB:CC:DD:EE:01",role:"Satellit 1"}];

// ── Base UI ───────────────────────────────────────────────────
function SH({icon,children}){return(<div style={{display:"flex",alignItems:"center",gap:6,margin:"0 0 10px"}}><i className={"ti "+icon} style={{fontSize:15,color:"var(--color-text-secondary)"}} aria-hidden="true"/><span style={{fontSize:13,fontWeight:500,color:"var(--color-text-secondary)"}}>{children}</span></div>);}
function Block({children,noPad,color}){const s=BLK[color||"default"]||BLK.default;return(<div style={{background:s.bg,border:"1px solid "+s.brd,borderRadius:"var(--border-radius-lg)",padding:noPad?0:"1rem",marginBottom:"0.75rem"}}>{children}</div>);}
function Modal({children,onClose,width}){return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:99999}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div style={{background:"#ffffff",borderRadius:12,padding:"1.25rem",width:width||"min(420px,95vw)",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 12px 40px rgba(0,0,0,0.25)"}}>{children}</div></div>);}
function ConfirmModal({title,lines,onOk,onCancel}){return(<Modal onClose={onCancel} width="min(320px,95vw)"><p style={{fontWeight:500,margin:"0 0 12px",color:"#1a1a1a"}}>{title}</p>{lines.map((l,i)=><p key={i} style={{margin:"4px 0",fontSize:13,color:"#555"}}>{l}</p>)}<div style={{display:"flex",gap:8,marginTop:16,justifyContent:"flex-end"}}><button onClick={onCancel} style={{padding:"6px 14px",fontSize:13,cursor:"pointer",borderRadius:6}}>Abbrechen</button><button onClick={onOk} style={{padding:"6px 14px",fontSize:13,background:"#BA7517",color:"#fff",border:"none",borderRadius:6,cursor:"pointer"}}>Bestätigen</button></div></Modal>);}

// ── TypeRow (Einstellungen) ───────────────────────────────────
function TypeRow({item,onSave,onDelete,isBeute}){
  const [edit,setEdit]=useState(false);
  const [draft,setDraft]=useState({...item});
  const u=p=>setDraft(d=>({...d,...p}));
  const save=()=>{onSave(draft);setEdit(false);};
  const bg=isBeute?"rgba(186,117,23,0.04)":draft.bg||"transparent";
  const brd=isBeute?"#BA7517":draft.brd||"#999";
  const tc=draft.tc||draft.brd||"#555";
  if(!edit)return(<div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:bg,borderRadius:6,border:"1px solid "+brd+"33"}}>
    {!isBeute&&<div style={{width:12,height:draft.h||18,background:draft.bg,border:"2px solid "+draft.brd,borderRadius:2,flexShrink:0}}/>}
    <span style={{flex:1,fontSize:13,fontWeight:500,color:isBeute?"#BA7517":tc}}>{draft.label||draft.name}</span>
    {!isBeute&&<span style={{fontSize:11,color:"#888"}}>{draft.w} kg · {draft.h}px</span>}
    {isBeute&&<span style={{fontSize:11,color:"#888"}}>{draft.rahmen} Stk · {draft.zargenGew} kg/Z · {draft.honigProR} kg/Rä</span>}
    {item.isBuiltin&&<span style={{fontSize:9,color:"#aaa",border:"0.5px solid #ddd",borderRadius:3,padding:"1px 4px"}}>System</span>}
    <button onClick={()=>setEdit(true)} style={{fontSize:11,padding:"2px 7px",borderRadius:4,cursor:"pointer",background:"transparent",border:"1px solid #ddd"}}>✏</button>
    <button onClick={onDelete} style={{fontSize:12,padding:"2px 6px",color:"#E24B4A",background:"transparent",border:"none",cursor:"pointer"}}>×</button>
  </div>);
  return(<div style={{padding:"10px 12px",background:"rgba(255,255,255,0.8)",borderRadius:8,border:"1px solid "+brd+"55",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
      <label style={{fontSize:11,color:"#888",display:"flex",flexDirection:"column",gap:2,flex:"2 1 120px"}}>Name<input value={draft.label||""} onChange={e=>u({label:e.target.value})} style={{fontSize:13,padding:"3px 7px",borderRadius:5,border:"1px solid #ddd"}}/></label>
      {!isBeute&&<span style={{display:"contents"}}>
        <label style={{fontSize:11,color:"#888",display:"flex",flexDirection:"column",gap:2,flex:"1 1 70px"}}>Gewicht (kg)<input type="number" step="0.1" value={draft.w||""} onChange={e=>u({w:+e.target.value})} style={{fontSize:13,padding:"3px 7px",borderRadius:5,border:"1px solid #ddd"}}/></label>
        <label style={{fontSize:11,color:"#888",display:"flex",flexDirection:"column",gap:2,flex:"1 1 60px"}}>Höhe (px)<input type="number" step="1" min="4" value={draft.h||""} onChange={e=>u({h:+e.target.value})} style={{fontSize:13,padding:"3px 7px",borderRadius:5,border:"1px solid #ddd"}}/></label>
      </span>}
      {isBeute&&<span style={{display:"contents"}}>
        <label style={{fontSize:11,color:"#888",display:"flex",flexDirection:"column",gap:2,flex:"1 1 70px"}}>Rähmchen (Stk)<input type="number" value={draft.rahmen||10} onChange={e=>u({rahmen:+e.target.value})} style={{fontSize:13,padding:"3px 7px",borderRadius:5,border:"1px solid #ddd"}}/></label>
        <label style={{fontSize:11,color:"#888",display:"flex",flexDirection:"column",gap:2,flex:"1 1 80px"}}>Zargengewicht (kg)<input type="number" step="0.1" value={draft.zargenGew||5} onChange={e=>u({zargenGew:+e.target.value})} style={{fontSize:13,padding:"3px 7px",borderRadius:5,border:"1px solid #ddd"}}/></label>
        <label style={{fontSize:11,color:"#888",display:"flex",flexDirection:"column",gap:2,flex:"1 1 100px"}} title="Durchschnittliches Honiggewicht pro vollem Rähmchen">Honig/Rähmchen (kg) ℹ️<input type="number" step="0.1" value={draft.honigProR||2.2} onChange={e=>u({honigProR:+e.target.value})} style={{fontSize:13,padding:"3px 7px",borderRadius:5,border:"1px solid #ddd"}}/><span style={{fontSize:9,color:"#aaa",marginTop:1}}>Ø kg pro vollem Rähmchen</span></label>
      </span>}
    </div>
    {!isBeute&&(<div style={{marginBottom:8}}>
      <p style={{fontSize:11,color:"#888",margin:"0 0 4px"}}>Rahmenfarbe & Hintergrund</p>
      <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center",marginBottom:8}}>
        {PRESET_COLORS.map(c=><div key={c} onClick={()=>u({brd:c,bg:c+"22"})} style={{width:20,height:20,borderRadius:3,background:c,cursor:"pointer",border:"2px solid "+(draft.brd===c?"#333":"transparent")}}/>)}
        <input type="color" value={draft.brd||"#888"} onChange={e=>u({brd:e.target.value,bg:e.target.value+"22"})} style={{width:20,height:20,border:"1px solid #ddd",borderRadius:3,cursor:"pointer",padding:1}}/>
        <div style={{width:12,height:draft.h||18,background:draft.bg,border:"2px solid "+draft.brd,borderRadius:2,marginLeft:4}}/>
      </div>
      <p style={{fontSize:11,color:"#888",margin:"0 0 4px"}}>Schriftfarbe</p>
      <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
        {PRESET_COLORS.map(c=><div key={c} onClick={()=>u({tc:c})} style={{width:20,height:20,borderRadius:3,background:c,cursor:"pointer",border:"2px solid "+(draft.tc===c?"#333":"transparent")}}/>)}
        <input type="color" value={draft.tc||"#555"} onChange={e=>u({tc:e.target.value})} style={{width:20,height:20,border:"1px solid #ddd",borderRadius:3,cursor:"pointer",padding:1}}/>
        <span style={{fontSize:12,color:draft.tc||"#555",background:draft.bg,padding:"1px 8px",borderRadius:4,border:"1.5px solid "+draft.brd,marginLeft:4}}>{draft.label||"Vorschau"}</span>
      </div>
    </div>)}
    <div style={{display:"flex",gap:6}}>
      <button onClick={save} style={{fontSize:12,padding:"4px 12px",background:"#1D9E75",color:"#fff",border:"none",borderRadius:5,cursor:"pointer"}}>✓ Speichern</button>
      <button onClick={()=>{if(JSON.stringify(draft)!==JSON.stringify(item)){if(!window.confirm("Änderungen verwerfen?"))return;}setEdit(false);}} style={{fontSize:12,padding:"4px 10px",borderRadius:5,cursor:"pointer"}}>Abbrechen</button>
    </div>
  </div>);
}

// ── NeuRegelForm ──────────────────────────────────────────────
function NeuRegelForm({onAdd}){
  const [d,setD]=useState({name:"",typ:"zunahme",schwelle:"0.5",zeitraum:"3",waage:"0",emoji:"📊"});
  const upd=p=>setD(x=>({...x,...p}));
  const inp={fontSize:12,padding:"3px 7px",borderRadius:5,border:"1px solid #ddd",boxSizing:"border-box"};
  return(<div style={{background:"rgba(128,128,128,0.03)",border:"1px dashed #ddd",borderRadius:8,padding:"10px 12px"}}>
    <p style={{margin:"0 0 8px",fontSize:12,fontWeight:500,color:"#888"}}>+ Neue Regel</p>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-end"}}>
      <label style={{fontSize:11,color:"#888",display:"flex",flexDirection:"column",gap:2,flex:"2 1 120px"}}>Name<input value={d.name} onChange={e=>upd({name:e.target.value})} placeholder="z.B. Futteraufnahme" style={inp}/></label>
      <label style={{fontSize:11,color:"#888",display:"flex",flexDirection:"column",gap:2,flex:"1 1 90px"}}>Typ<select value={d.typ} onChange={e=>upd({typ:e.target.value})} style={inp}><option value="zunahme">{"📈"} Zunahme</option><option value="abnahme">{"📉"} Abnahme</option></select></label>
      <label style={{fontSize:11,color:"#888",display:"flex",flexDirection:"column",gap:2,flex:"1 1 70px"}}>Schwelle (kg)<input type="number" step="0.1" min="0" value={d.schwelle} onChange={e=>upd({schwelle:e.target.value})} style={inp}/></label>
      <label style={{fontSize:11,color:"#888",display:"flex",flexDirection:"column",gap:2,flex:"1 1 60px"}}>Zeitraum (h)<input type="number" min="1" max="24" value={d.zeitraum} onChange={e=>upd({zeitraum:e.target.value})} style={inp}/></label>
      <label style={{fontSize:11,color:"#888",display:"flex",flexDirection:"column",gap:2,flex:"0 1 60px"}}>Waage (W)<input value={d.waage} onChange={e=>upd({waage:e.target.value})} placeholder="0" style={{...inp,width:50}}/></label>
      <label style={{fontSize:11,color:"#888",display:"flex",flexDirection:"column",gap:2,flex:"0 1 50px"}}>Emoji<input value={d.emoji} onChange={e=>upd({emoji:e.target.value})} style={{...inp,width:44}}/></label>
      <button disabled={!d.name.trim()} onClick={()=>{if(!d.name.trim())return;onAdd({...d,aktiv:true,schwelle:+d.schwelle,zeitraum:+d.zeitraum});setD({name:"",typ:"zunahme",schwelle:"0.5",zeitraum:"3",waage:"0",emoji:"📊"});}}
        style={{fontSize:12,padding:"5px 14px",background:d.name.trim()?"#1D9E75":"#aaa",color:"#fff",border:"none",borderRadius:5,cursor:d.name.trim()?"pointer":"default",flexShrink:0}}>Hinzufügen</button>
    </div>
  </div>);
}

// ── TabEinstellungen ─────────────────────────────────────────
function TabEinstellungen({apiUrl,demo,zargenAll,onZargenAll,beutenAll,onBeutenAll,msgTemplates,onMsgTemplates,notifRules,onNotifRules}){
  const [tab,setTab]=useState("zargen");
  const [syncMsg2,setSyncMsg2]=useState("");
  const [confirmReset,setConfirmReset]=useState(null); // {label,onConfirm}
  const saveMsgAndSync=function(t){onMsgTemplates(t);saveMsgTemplates(t);if(!demo){syncMsgToSheets(apiUrl,t);setSyncMsg2("Gespeichert ✓");setTimeout(function(){setSyncMsg2("");},2500);}};
  const [scales,setScales]=useState([]);const [orig,setOrig]=useState([]);const [devices,setDevices]=useState([]);const [scaleConfirm,setScaleConfirm]=useState(null);
  const loadScales=useCallback(function(){if(demo){setScales(DEMO_SCALES.map(function(x){return Object.assign({},x);}));setOrig(DEMO_SCALES.map(function(x){return Object.assign({},x);}));setDevices(DEMO_DEVICES);return;}fetch(apiUrl+"?action=registry").then(function(r){return r.json();}).then(function(j){if(j.status==="ok"){setScales(j.scales||[]);setOrig((j.scales||[]).map(function(x){return Object.assign({},x);}));setDevices(j.devices||[]);}}).catch(function(){});},[apiUrl,demo]);
  useEffect(()=>{if(tab==="waagen")loadScales();},[tab,loadScales]);
  const saveScale=function(sc){setOrig(function(p){return p.map(function(o){return o.id===sc.id?Object.assign({},sc):o;});});setScaleConfirm(null);if(!demo){fetch(apiUrl+"?action=setscale&id="+sc.id+"&sn="+encodeURIComponent(sc.sn||"")+"&pos="+encodeURIComponent(sc.pos||"")+"&name="+encodeURIComponent(sc.name||"")).catch(function(e){console.warn("Scale save:",e);});}};
  const saveZargen=(idx,ni)=>{const a=[...zargenAll];a[idx]=ni;onZargenAll(a);};
  const delZargen=idx=>{onZargenAll(zargenAll.filter((_,i)=>i!==idx));};
  const addZargen=()=>{onZargenAll([...zargenAll,{id:"z_"+Date.now(),label:"Neue Zarge",h:18,brd:"#888",bg:"rgba(128,128,128,0.1)",tc:"#555",w:4.0,isBuiltin:false}]);};
  const saveBeuten=(idx,ni)=>{const a=[...beutenAll];a[idx]=ni;onBeutenAll(a);};
  const delBeuten=idx=>{onBeutenAll(beutenAll.filter((_,i)=>i!==idx));};
  const addBeuten=()=>{onBeutenAll([...beutenAll,{id:"b_"+Date.now(),label:"Neue Beute",rahmen:10,zargenGew:5.0,honigProR:2.2,isBuiltin:false}]);};
  return(<div style={{padding:"1rem"}}>
    {confirmReset&&<ConfirmModal
      title={"Auf Standard zurücksetzen?"}
      lines={["Alle Änderungen an \""+confirmReset.label+"\" gehen verloren."]}
      onOk={function(){confirmReset.onConfirm();setConfirmReset(null);}}
      onCancel={function(){setConfirmReset(null);}}
    />}
    <Block>
      <div style={{display:"flex",gap:4,marginBottom:12,flexWrap:"wrap"}}>
        {[["zargen","🧱 Zargentypen"],["beuten","🏠 Beutentypen"],["waagen","⚖️ Waagen"],["nachrichten","📨 Nachrichten"],["regeln","🔔 Auswertung"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={{fontSize:12,padding:"5px 14px",borderRadius:6,cursor:"pointer",background:tab===id?"#BA7517":"rgba(128,128,128,0.08)",color:tab===id?"#fff":"inherit",border:"none",fontWeight:tab===id?500:400}}>{lbl}</button>
        ))}
      </div>
      {tab==="zargen"&&(<div style={{display:"flex",flexDirection:"column",gap:6}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <p style={{margin:0,fontSize:12,color:"#666"}}>Alle Zargentypen — bearbeitbar.</p>
          <div style={{display:"flex",gap:5}}><button onClick={function(){setConfirmReset({label:"Zargentypen",onConfirm:function(){onZargenAll(ZARGEN_DEFAULTS.map(function(x){return Object.assign({},x);}));}});}} style={{fontSize:11,padding:"3px 8px",borderRadius:4,cursor:"pointer",color:"#888",background:"transparent",border:"1px solid #ddd"}}>{"↩"} Standard</button><button onClick={addZargen} style={{fontSize:11,padding:"3px 8px",background:"#1D9E75",color:"#fff",border:"none",borderRadius:4,cursor:"pointer"}}>+ Neu</button></div>
        </div>
        {zargenAll.map((item,idx)=><TypeRow key={item.id||idx} item={item} isBeute={false} onSave={ni=>saveZargen(idx,ni)} onDelete={()=>delZargen(idx)}/>)}
      </div>)}
      {tab==="beuten"&&(<div style={{display:"flex",flexDirection:"column",gap:6}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <p style={{margin:0,fontSize:12,color:"#666"}}>Alle Beutentypen — bearbeitbar.</p>
          <div style={{display:"flex",gap:5}}><button onClick={function(){setConfirmReset({label:"Beutentypen",onConfirm:function(){onBeutenAll(BEUTEN_DEFAULTS.map(function(x){return Object.assign({},x);}));}});}} style={{fontSize:11,padding:"3px 8px",borderRadius:4,cursor:"pointer",color:"#888",background:"transparent",border:"1px solid #ddd"}}>{"↩"} Standard</button><button onClick={addBeuten} style={{fontSize:11,padding:"3px 8px",background:"#1D9E75",color:"#fff",border:"none",borderRadius:4,cursor:"pointer"}}>+ Neu</button></div>
        </div>
        {beutenAll.map((item,idx)=><TypeRow key={item.id||idx} item={item} isBeute={true} onSave={ni=>saveBeuten(idx,ni)} onDelete={()=>delBeuten(idx)}/>)}
      </div>)}
      {tab==="waagen"&&(<div>
        <Block><SH icon="ti-device-analytics">Geräteübersicht</SH><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{devices.map((d,i)=><div key={i} style={{padding:"8px 12px",background:"rgba(55,138,221,0.08)",border:"1px solid rgba(55,138,221,0.25)",borderRadius:8,fontSize:12}}><span style={{fontWeight:500}}>{d.role}</span><span style={{color:"var(--color-text-secondary)",fontFamily:"monospace",marginLeft:8,fontSize:11}}>{d.mac}</span></div>)}</div></Block>
        <Block noPad>
          <div style={{padding:"1rem 1rem 0.5rem"}}><SH icon="ti-scale">Waagen-Zuordnung</SH><p style={{margin:"0 0 8px",fontSize:12,color:"#888"}}>Standortbezeichnung und Seriennummer der Waagen-Positionen.</p></div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{borderBottom:"0.5px solid var(--color-border-tertiary)"}}>{["ID","Seriennr.","Position","Standortbezeichnung",""].map(h=><th key={h} style={{padding:"6px 10px",textAlign:"left",fontSize:10,fontWeight:500,color:"var(--color-text-secondary)"}}>{h}</th>)}</tr></thead>
          <tbody>{scales.map(sc=>{const dirty=JSON.stringify(sc)!==JSON.stringify(orig.find(o=>o.id===sc.id));return(<tr key={sc.id} style={{borderBottom:"0.5px solid var(--color-border-tertiary)",background:dirty?"rgba(186,117,23,0.04)":undefined}}><td style={{padding:"7px 10px",fontWeight:500,color:"var(--color-text-secondary)"}}>{sc.id}</td><td style={{padding:"7px 10px",fontFamily:"monospace",fontSize:11}}>{sc.sn||"—"}</td><td style={{padding:"7px 10px"}}><input value={sc.pos||""} onChange={e=>setScales(p=>p.map(s=>s.id===sc.id?{...s,pos:e.target.value}:s))} style={{width:"100%",maxWidth:100,fontSize:12,padding:"2px 6px",borderRadius:4,border:"0.5px solid var(--color-border-secondary)"}}/></td><td style={{padding:"7px 10px"}}><input value={sc.name||""} onChange={e=>setScales(p=>p.map(s=>s.id===sc.id?{...s,name:e.target.value}:s))} style={{width:"100%",maxWidth:120,fontSize:12,padding:"2px 6px",borderRadius:4,border:"0.5px solid var(--color-border-secondary)"}}/></td><td style={{padding:"7px 10px"}}>{dirty&&<button onClick={()=>setScaleConfirm(sc)} style={{fontSize:11,padding:"2px 8px",background:"#BA7517",color:"#fff",border:"none",borderRadius:4,cursor:"pointer"}}>Speichern</button>}</td></tr>);})}</tbody>
          </table>
        </Block>
        {scaleConfirm&&<ConfirmModal title="Zuordnung speichern?" lines={["Scale #"+scaleConfirm.id+": \""+scaleConfirm.name+"\"","Position: "+scaleConfirm.pos]} onOk={()=>saveScale(scaleConfirm)} onCancel={()=>setScaleConfirm(null)}/>}
      </div>)}
      {tab==="nachrichten"&&(<div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
          <p style={{margin:0,fontSize:12,color:"#666"}}>Tages-Update Nachrichtentext gestalten. Platzhalter werden automatisch ersetzt.</p>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>{syncMsg2&&<span style={{fontSize:11,color:"#1D9E75"}}>{syncMsg2}</span>}<button onClick={()=>saveMsgAndSync(msgTemplates)} style={{fontSize:11,padding:"4px 10px",background:"rgba(29,158,117,0.1)",border:"1px solid rgba(29,158,117,0.3)",color:"#1D9E75",borderRadius:5,cursor:"pointer"}}>{"💾"} Speichern{!demo?" & Sync":""}</button><button onClick={function(){setConfirmReset({label:"Nachrichtenvorlage",onConfirm:function(){onMsgTemplates(Object.assign({},msgTemplates,{update:DEFAULT_MSG_UPDATE}));}});}} style={{fontSize:11,padding:"4px 8px",borderRadius:5,cursor:"pointer",color:"#888",background:"transparent",border:"1px solid #ddd"}}>{"↩"} Standard</button></div>
        </div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-start"}}>
          <div style={{flex:"2 1 240px",display:"flex",flexDirection:"column",gap:5}}>
            <label style={{fontSize:11,color:"#888",fontWeight:500}}>Vorlage bearbeiten</label>
            <textarea value={msgTemplates.update||DEFAULT_MSG_UPDATE} onChange={e=>onMsgTemplates({...msgTemplates,update:e.target.value})} rows={10} style={{fontSize:13,padding:"8px 10px",borderRadius:6,border:"1px solid #ddd",background:"#fafafa",resize:"vertical",fontFamily:"monospace",lineHeight:1.6}}/>
          </div>
          <div style={{flex:"1 1 180px"}}>
            <label style={{fontSize:11,color:"#888",fontWeight:500,display:"block",marginBottom:6}}>Platzhalter</label>
            <div style={{display:"flex",flexDirection:"column",gap:3,maxHeight:280,overflowY:"auto"}}>
              {MSG_VARS.map(({v,b})=><div key={v} style={{display:"flex",alignItems:"flex-start",gap:6,padding:"4px 0",borderBottom:"0.5px solid #f0f0f0"}}><code onClick={()=>navigator.clipboard&&navigator.clipboard.writeText(v)} title="Kopieren" style={{fontSize:11,color:"#7C4DBC",background:"#f3f0ff",padding:"1px 5px",borderRadius:3,flexShrink:0,cursor:"pointer",userSelect:"all"}}>{v}</code><span style={{fontSize:10,color:"#888"}}>{b}</span></div>)}
            </div>
          </div>
        </div>
        <div><p style={{fontSize:11,color:"#888",fontWeight:500,margin:"0 0 4px"}}>Vorschau (Demo-Werte)</p><pre style={{fontSize:12,background:"#f8f8f8",border:"1px solid #eee",borderRadius:6,padding:"10px 12px",whiteSpace:"pre-wrap",wordBreak:"break-word",fontFamily:"system-ui",color:"#333",margin:0,lineHeight:1.6}}>{(msgTemplates.update||DEFAULT_MSG_UPDATE).replace(/\{station\}/g,"Bienenstand Wiese").replace(/\{datum\}/g,"06.06. 12:00").replace(/\{temp\}/g,"22.5").replace(/\{hum\}/g,"64").replace(/\{pres\}/g,"1013").replace(/\{w0\}/g,"38.7").replace(/\{w0_name\}/g,"Hauptstock").replace(/\{w0_queen\}/g,"K12 \u00B7 ").replace(/\{w0_brut\}/g,"34.5").replace(/\{w0_bat\}/g,"85").replace(/\{w1\}/g,"18.2").replace(/\{w2\}/g,"21.3")}</pre></div>
      </div>)}
      {tab==="regeln"&&(<div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{background:"rgba(55,138,221,0.05)",border:"1px solid rgba(55,138,221,0.2)",borderRadius:8,padding:"10px 14px"}}>
          <p style={{margin:0,fontSize:12,color:"#378ADD",fontWeight:500}}>ℹ️ Funktionsprinzip</p>
          <p style={{margin:"4px 0 0",fontSize:11,color:"#666"}}>Regeln werden <strong>nur bei den geplanten Updates (7:00 / 12:00 / 17:00 Uhr)</strong> ausgewertet. Hinweis im Update-Text — kein separater Alarm. Diebstahl-Alarm (ESP32, sofort) bleibt unberührt.</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {notifRules.map((rule,i)=><div key={rule.id} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:rule.aktiv?"rgba(255,255,255,0.8)":"rgba(128,128,128,0.04)",borderRadius:8,border:"1px solid "+(rule.aktiv?"rgba(128,128,128,0.2)":"#eee")}}>
            <span style={{fontSize:18,flexShrink:0}}>{rule.emoji}</span>
            <div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}><span style={{fontSize:13,fontWeight:500,color:rule.aktiv?"var(--color-text-primary)":"#aaa"}}>{rule.name}</span><span style={{fontSize:11,color:"#888",background:"rgba(128,128,128,0.08)",padding:"1px 6px",borderRadius:4}}>{rule.typ==="zunahme"?"📈 Zunahme":"📉 Abnahme"} &gt; {rule.schwelle} kg / {rule.zeitraum}h · W{rule.waage}</span></div></div>
            <label style={{display:"flex",alignItems:"center",gap:5,fontSize:12,cursor:"pointer",flexShrink:0}}><input type="checkbox" checked={rule.aktiv} onChange={e=>{const n=[...notifRules];n[i]={...n[i],aktiv:e.target.checked};onNotifRules(n);}}/>Aktiv</label>
            <button onClick={()=>onNotifRules(notifRules.filter((_,x)=>x!==i))} style={{fontSize:12,padding:"2px 7px",color:"#E24B4A",background:"transparent",border:"none",cursor:"pointer",flexShrink:0}}>×</button>
          </div>)}
        </div>
        <NeuRegelForm onAdd={r=>{onNotifRules([...notifRules,{...r,id:"r"+Date.now()}]);}}/>
        <div style={{display:"flex",gap:8,alignItems:"center",marginTop:4}}>
          <button onClick={function(){if(!demo)syncRulesToSheets(apiUrl,notifRules);}} style={{fontSize:11,padding:"5px 12px",background:"rgba(29,158,117,0.1)",border:"1px solid rgba(29,158,117,0.3)",color:"#1D9E75",borderRadius:5,cursor:"pointer"}}>{"💾"} Speichern{!demo?" & Sync":""}</button>
          <button onClick={function(){setConfirmReset({label:"Auswertungsregeln",onConfirm:function(){onNotifRules(DEFAULT_RULES.map(function(r){return Object.assign({},r);}));}});}} style={{fontSize:11,padding:"5px 10px",borderRadius:5,cursor:"pointer",color:"#888",background:"transparent",border:"1px solid #ddd"}}>{"↩"} Standard</button>
        </div>
      </div>)}
    </Block>
  </div>);
}

// WMO Wettercodes → Icon + Beschreibung
const WMO={
  0:{i:"☀️",l:"Klar"},1:{i:"🌤",l:"Meist klar"},2:{i:"🌤",l:"Wechselhaft"},3:{i:"☁️",l:"Bewölkt"},
  45:{i:"🌫",l:"Nebel"},48:{i:"🌫",l:"Raureif"},
  51:{i:"🌦",l:"Leichter Niesel"},53:{i:"🌦",l:"Niesel"},55:{i:"🌧",l:"Starker Niesel"},
  61:{i:"🌧",l:"Leichter Regen"},63:{i:"🌧",l:"Regen"},65:{i:"🌧",l:"Starker Regen"},
  71:{i:"🌨",l:"Leichter Schnee"},73:{i:"🌨",l:"Schnee"},75:{i:"❄️",l:"Starker Schnee"},77:{i:"🌨",l:"Schneekörner"},
  80:{i:"🌦",l:"Schauer"},81:{i:"🌧",l:"Starke Schauer"},82:{i:"🌧",l:"Heftige Schauer"},
  85:{i:"🌨",l:"Schneeschauer"},86:{i:"🌨",l:"Starke Schneeschauer"},
  95:{i:"⛈",l:"Gewitter"},96:{i:"⛈",l:"Gewitter + Hagel"},99:{i:"⛈",l:"Heftiges Gewitter"},
};
function wmoIcon(code){return(WMO[code]||{i:"☁️",l:"—"}).i;}
function wmoLabel(code){return(WMO[code]||{i:"☁️",l:"—"}).l;}

// Demo-Prognose (realistisch Südtirol Sommer)
const DEMO_FORECAST=(()=>{
  const codes=[0,1,2,80,95,3,1];
  const tmx=[27,25,22,18,15,20,26];
  const tmn=[12,11,10,9,8,10,12];
  const rain=[0,0,0.5,4.2,8.1,1.0,0];
  const days=[];
  for(let i=0;i<7;i++){
    const d=new Date();d.setDate(d.getDate()+i);
    days.push({date:d.toISOString().slice(0,10),code:codes[i],tmax:tmx[i],tmin:tmn[i],rain:rain[i],wt:WOCHENTAGE[d.getDay()],isToday:i===0});
  }
  return days;
})();
function WetterWidget({latest,data,hoehe,trend,lat,lon,demo}){
  const effectiveLat=lat||46.77;
  const effectiveLon=lon||11.66;
  const [forecast,setFc]=useState(null);
  const [isLive,setIsLive]=useState(false);
  useEffect(()=>{
    if(demo){setFc(DEMO_FORECAST);setIsLive(false);return;}
    setFc(null);setIsLive(false);
    fetch("https://api.open-meteo.com/v1/forecast?latitude="+effectiveLat+"&longitude="+effectiveLon
      +"&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum"
      +"&timezone=Europe%2FRome&forecast_days=7")
      .then(function(r){return r.json();})
      .then(function(d){
        if(!d.daily)throw new Error("no daily");
        var days=d.daily.time.map(function(dateStr,i){
          var dt=new Date(dateStr);
          return{date:dateStr,code:d.daily.weathercode[i],tmax:Math.round(d.daily.temperature_2m_max[i]),
            tmin:Math.round(d.daily.temperature_2m_min[i]),rain:d.daily.precipitation_sum[i],
            wt:WOCHENTAGE[dt.getDay()],isToday:i===0};
        });
        setFc(days);setIsLive(true);
      })
      .catch(function(){setFc(DEMO_FORECAST);setIsLive(false);});
  },[effectiveLat,effectiveLon,demo]);

  if(!latest&&!forecast)return null;
  const druckMeer=latest?druckAufMeereshoehe(+latest.pres||0,hoehe):0;
  const w=latest?wetterIcon(druckMeer):{icon:"–",label:"—"};
  const history=calcWetterHistory(data||[],hoehe);
  const isWarn=trend&&trend.warning;
  const bergfexUrl="https://www.bergfex.it/suedtirol/wetter/";
  const yrUrl="https://www.yr.no/nb/kart?lat="+effectiveLat+"&lon="+effectiveLon+"&zoom=11";

  return(<div style={{background:"rgba(55,138,221,0.04)",border:"1px solid rgba(55,138,221,0.15)",borderRadius:12,padding:"14px 16px",marginBottom:"0.75rem"}}>
    {isWarn&&<div style={{background:"rgba(91,127,186,0.12)",border:"1px solid rgba(91,127,186,0.35)",borderRadius:7,padding:"7px 12px",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:16}}>{"⛈"}</span>
      <span style={{fontSize:12,fontWeight:500,color:"#5B7FBA"}}>Druckabfall {trend.diff} hPa/3h — mögliches Unwetter!</span>
    </div>}
    {latest&&(<div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <span style={{fontSize:44,lineHeight:1}}>{w.icon}</span>
        <div>
          <p style={{margin:0,fontSize:28,fontWeight:700,color:"var(--color-text-primary)",lineHeight:1}}>{(+latest.temp).toFixed(1)}°C</p>
          <p style={{margin:"2px 0 0",fontSize:12,color:"var(--color-text-secondary)"}}>{w.label} · Sensor</p>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end",fontSize:12,color:"var(--color-text-secondary)"}}>
        <span>{"💧"} {Math.round(+latest.hum)}%</span>
        <span>{"🔵"} {Math.round(druckMeer)} hPa</span>
        <span style={{fontSize:10,color:"#aaa"}}>{ago(latest.ts)}</span>
      </div>
    </div>)}
    <div style={{borderTop:latest?"0.5px solid rgba(55,138,221,0.15)":"none",paddingTop:latest?14:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:6}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <p style={{margin:0,fontSize:10,fontWeight:600,color:"#888",letterSpacing:0.5,textTransform:"uppercase"}}>7-Tage Prognose</p>
          {!isLive&&<span style={{fontSize:9,color:"#BA7517",background:"rgba(186,117,23,0.1)",border:"1px solid rgba(186,117,23,0.3)",padding:"1px 5px",borderRadius:4}}>Demo</span>}
          {isLive&&<span style={{fontSize:9,color:"#1D9E75",background:"rgba(29,158,117,0.1)",border:"1px solid rgba(29,158,117,0.3)",padding:"1px 5px",borderRadius:4}}>Live</span>}
        </div>
        <div style={{display:"flex",gap:5}}>
          <a href={bergfexUrl} target="_blank" rel="noreferrer" style={{fontSize:10,padding:"3px 8px",background:"rgba(55,138,221,0.1)",border:"1px solid rgba(55,138,221,0.3)",borderRadius:4,color:"#378ADD",textDecoration:"none",fontWeight:500}}>Bergfex ↗</a>
          <a href={yrUrl} target="_blank" rel="noreferrer" style={{fontSize:10,padding:"3px 8px",background:"rgba(55,138,221,0.1)",border:"1px solid rgba(55,138,221,0.3)",borderRadius:4,color:"#378ADD",textDecoration:"none",fontWeight:500}}>Yr.no ↗</a>
        </div>
      </div>
      {!forecast&&<p style={{fontSize:11,color:"#aaa",margin:0}}>{"…"}</p>}
      {forecast&&(<div style={{display:"flex",gap:3,justifyContent:"space-between"}}>
        {forecast.map(function(d){return(
          <div key={d.date} style={{flex:"1 0 40px",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"7px 3px",borderRadius:8,background:d.isToday?"rgba(55,138,221,0.12)":"transparent",border:d.isToday?"1px solid rgba(55,138,221,0.25)":"1px solid transparent"}}>
            <span style={{fontSize:9,fontWeight:d.isToday?700:400,color:d.isToday?"#378ADD":"#888"}}>{d.isToday?"Heute":d.wt}</span>
            <span style={{fontSize:9,color:"#bbb"}}>{d.date.slice(5).replace("-",".")}</span>
            <span style={{fontSize:21,lineHeight:1.3}}>{wmoIcon(d.code)}</span>
            <span style={{fontSize:12,fontWeight:700,color:"#E24B4A"}}>{d.tmax}°</span>
            <span style={{fontSize:10,color:"#888"}}>{d.tmin}°</span>
            {d.rain>0
              ?<span style={{fontSize:9,color:"#378ADD",fontWeight:500}}>{d.rain<1?d.rain.toFixed(1):Math.round(d.rain)}mm</span>
              :<span style={{fontSize:9,color:"#e0e0e0"}}>{"—"}</span>}
          </div>
        );})}
      </div>)}
      <p style={{margin:"8px 0 0",fontSize:9,color:"#ccc",textAlign:"right"}}>Open-Meteo · ECMWF · {effectiveLat.toFixed(2)}N {effectiveLon.toFixed(2)}E</p>
    </div>
    {history.length>0&&(<div style={{marginTop:14,paddingTop:12,borderTop:"0.5px solid rgba(55,138,221,0.15)"}}>
      <p style={{margin:"0 0 8px",fontSize:10,fontWeight:500,color:"#aaa",letterSpacing:0.5,textTransform:"uppercase"}}>Sensor-Verlauf</p>
      <div style={{display:"flex",gap:4,justifyContent:"space-between"}}>
        {history.map(function(d,i){return(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"6px 4px",borderRadius:7,background:i===history.length-1?"rgba(55,138,221,0.08)":"transparent"}}>
            <span style={{fontSize:9,color:i===history.length-1?"#378ADD":"#aaa",fontWeight:i===history.length-1?500:400}}>{i===history.length-1?"Heute":d.wt}</span>
            <span style={{fontSize:18,lineHeight:1}}>{d.icon}</span>
            <span style={{fontSize:10,fontWeight:500,color:"var(--color-text-primary)"}}>{d.maxT}°</span>
            <span style={{fontSize:9,color:"#aaa"}}>{d.minT}°</span>
          </div>
        );})}
      </div>
    </div>)}
  </div>);
}

// ── UnterbauStreifen ──────────────────────────────────────────
function UnterbauStreifen({isFirst,isLast,active}){
  if(!active)return <div style={{height:22}}/>;
  return(<div style={{position:"relative",height:22,width:"100%"}}>
    <div style={{position:"absolute",left:isFirst?2:-5,right:isLast?2:-5,top:0,height:6,background:"#8B6914",borderRadius:(isFirst?"3":"0")+"px "+(isLast?"3":"0")+"px "+(isLast?"3":"0")+"px "+(isFirst?"3":"0")+"px"}}/>
    {isFirst&&<div style={{position:"absolute",left:5,top:5,width:5,height:16,background:"#8B6914",borderRadius:"0 0 2px 2px"}}/>}
    {isLast&&<div style={{position:"absolute",right:5,top:5,width:5,height:16,background:"#8B6914",borderRadius:"0 0 2px 2px"}}/>}
  </div>);
}

// ── MiniHive ──────────────────────────────────────────────────
function MiniHive({zargen,zTypes,small,hasWaage}){
  const w=small?36:44;
  return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
    <div style={{width:w+10,height:6,border:"2px solid #C0392B",borderRadius:"2px 2px 0 0",background:"transparent"}}/>
    {zargen.map((z,i)=>{const s=zTypes[z.t]||BUILTIN_Z.leer;if(z.t==="absperrgitter")return <div key={i} style={{width:w,height:s.h,background:s.bg,borderRadius:1,border:"1.5px solid "+s.brd}}/>;return(<div key={i} style={{position:"relative",width:w,height:s.h,border:"2px solid "+s.brd,borderRadius:1,background:s.bg}}>{z.zuchtlatte&&<div style={{position:"absolute",top:2,bottom:2,right:4,width:2,background:s.brd,borderRadius:1}}/>}</div>);})}
    <div style={{position:"relative",width:w+14,height:14,border:"2px solid #C0392B",borderRadius:"0 0 2px 2px",background:"transparent"}}>
      <div style={{position:"absolute",left:8,right:8,top:"50%",height:2,background:"rgba(0,0,0,0.35)",borderRadius:1}}/>
    </div>
    {hasWaage!==false&&<div style={{width:w+20,height:5,background:"#F59E0B",borderRadius:2,marginTop:0}}/>}
  </div>);
}

// ── VolkEditPanel ─────────────────────────────────────────────
function VolkEditPanel({stockKey,stockName,standortId,vd,savedVd,onVdChange,onSave,onDiscard,onClose,actualWeight,actualBrut,zTypes,beutenTypes,standsConfig,onAddStand,onDeleteStand,onOpenZuchtbuch}){
  const [tab,setTab]=useState("zargen");
  const [closeCfm,setCfm]=useState(false);
  const [newFt,setNewFt]=useState({datum:new Date().toISOString().slice(0,10),menge:"",art:FT_ARTEN[0]});
  const zargen=vd.zargen||[];const beutentyp=vd.beutentyp||"zander";const status=vd.status||"normal";
  const fuetterung=vd.fuetterung||[];const konigin=vd.konigin||{nr:"",schlupfjahr:new Date().getFullYear(),zuchtbuchNr:"",anpaarung:"",mutterNr:""};
  const isDirty=JSON.stringify(vd)!==JSON.stringify(savedVd);
  const upd=p=>onVdChange(Object.assign({},vd,p));
  const addZ=t=>upd({zargen:[{t},...zargen]});
  const removeZ=i=>upd({zargen:zargen.filter((_,x)=>x!==i)});
  const cycleZ=i=>{const types=Object.keys(zTypes);const nz=[...zargen];nz[i]={...nz[i],t:types[(types.indexOf(nz[i].t)+1)%types.length]};upd({zargen:nz});};
  const toggleZL=i=>{const nz=[...zargen];nz[i]={...nz[i],zuchtlatte:!nz[i].zuchtlatte};upd({zargen:nz});};
  const updKonigin=p=>upd({konigin:{...konigin,...p}});
  const theo=calcTheo(vd,zTypes,beutenTypes);
  const staClr=STATUS_CLR[status]||"#888";
  const kf=koniginFarbe(konigin.schlupfjahr);
  const isKoniginWeiss=kf.hex==="#f5f5f5";
  return(<div style={{background:"#fafafa",border:"1px solid #ddd",borderRadius:10,padding:"12px 14px",marginTop:8}}>
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
      <select value={status} onChange={e=>upd({status:e.target.value})} style={{fontSize:12,padding:"3px 8px",borderRadius:6,background:staClr+"18",border:"1.5px solid "+staClr,color:staClr,fontWeight:500,cursor:"pointer"}}>{STATUS_OPTS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>
      <span style={{flex:1,fontSize:13,fontWeight:500,color:"#1a1a1a"}}>{stockName}</span>
      <button onClick={()=>onOpenZuchtbuch&&onOpenZuchtbuch(stockKey,stockName)} style={{fontSize:11,padding:"3px 8px",background:"rgba(186,117,23,0.1)",border:"1px solid rgba(186,117,23,0.3)",color:"#BA7517",borderRadius:4,cursor:"pointer"}}>{"📋"} Stockkarte</button>
      {isDirty&&<button onClick={onSave} style={{fontSize:12,padding:"3px 10px",background:"#1D9E75",color:"#fff",border:"none",borderRadius:4,cursor:"pointer",fontWeight:500}}>{"💾"}</button>}
      {isDirty&&<button onClick={()=>setCfm(true)} style={{fontSize:12,padding:"3px 8px",borderRadius:4,cursor:"pointer",color:"#888"}}>↩</button>}
      <button onClick={()=>isDirty?setCfm(true):onClose()} style={{fontSize:13,padding:"2px 8px",borderRadius:4,cursor:"pointer"}}>✕</button>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:10,padding:"5px 8px",background:"rgba(128,128,128,0.05)",borderRadius:6,flexWrap:"wrap"}}>
      <span style={{fontSize:11,color:"#888",fontWeight:500,flexShrink:0}}>Beute:</span>
      {Object.entries(bTypesMap(beutenTypes)).map(([k,b])=><button key={k} onClick={()=>upd({beutentyp:k})} style={{fontSize:11,padding:"2px 8px",borderRadius:10,cursor:"pointer",background:beutentyp===k?"#BA7517":"transparent",color:beutentyp===k?"#fff":"#888",border:"1px solid "+(beutentyp===k?"#BA7517":"transparent"),fontWeight:beutentyp===k?500:400}}>{b.label}</button>)}
    </div>
    <div style={{display:"flex",gap:2,marginBottom:10,borderBottom:"0.5px solid #e0e0e0",paddingBottom:5}}>
      {[["zargen","🏗"],["waben","📐"],["konigin","👑"],["fuetterung","🍯"],["notiz","📝"]].map(([id,em])=><button key={id} onClick={()=>setTab(id)} title={id} style={{fontSize:14,padding:"3px 9px",borderRadius:4,cursor:"pointer",background:tab===id?"#f5f5f5":"transparent",border:tab===id?"0.5px solid #ddd":"none"}}>{em}</button>)}
    </div>
    {tab==="zargen"&&(<div style={{display:"flex",gap:14,flexWrap:"wrap",alignItems:"flex-start"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        <span style={{fontSize:10,color:"#888"}}>Vorschau</span>
        <MiniHive zargen={zargen} zTypes={zTypes}/>
        {actualWeight>0&&<span style={{fontSize:11,fontWeight:500,marginTop:4}}>{actualWeight.toFixed(2)} kg</span>}
        {actualBrut>0&&<span style={{fontSize:10,color:"#E24B4A"}}>{"🌡"} {actualBrut.toFixed(1)}°C</span>}
        <span style={{fontSize:10,color:"#888"}}>Theo: {theo.gesamt} kg</span>
      </div>
      <div style={{flex:1,minWidth:200}}>
        <p style={{fontSize:11,color:"#888",margin:"0 0 6px",fontWeight:500}}>Zargen (oben → unten)</p>
        <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:8}}>
          {zargen.map((z,i)=>{const s=zTypes[z.t]||BUILTIN_Z.leer;return(<div key={i} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:18,height:14,border:"2px solid "+s.brd,background:s.bg,borderRadius:2,flexShrink:0}}/><button onClick={()=>cycleZ(i)} style={{fontSize:11,padding:"2px 7px",flex:1,textAlign:"left",background:"#f5f5f5",borderRadius:4,cursor:"pointer"}}>{s.label}</button>{z.t!=="absperrgitter"&&<button onClick={()=>toggleZL(i)} style={{fontSize:10,padding:"1px 5px",background:z.zuchtlatte?"#7C4DBC22":"#f5f5f5",color:z.zuchtlatte?"#7C4DBC":"#aaa",border:z.zuchtlatte?"1px solid #7C4DBC":"1px solid #eee",borderRadius:4,cursor:"pointer"}}>ZL</button>}<button onClick={()=>removeZ(i)} style={{fontSize:13,padding:"0 5px",color:"#aaa",background:"transparent",border:"none",cursor:"pointer"}}>×</button></div>);})}
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{Object.entries(zTypes).map(([t,s])=><button key={t} onClick={()=>addZ(t)} style={{fontSize:11,padding:"3px 7px",border:"1.5px solid "+s.brd,background:s.bg,color:s.tc,borderRadius:4,cursor:"pointer"}}>+ {s.label}</button>)}</div>
        <div style={{marginTop:10,borderTop:"1px solid #eee",paddingTop:8}}>
          <p style={{fontSize:11,fontWeight:500,color:"#8B6914",margin:"0 0 6px"}}>Unterbau / Stand</p>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
            <button onClick={()=>upd({standNr:null})} style={{fontSize:11,padding:"3px 9px",borderRadius:10,cursor:"pointer",background:vd.standNr==null?"#555":"transparent",color:vd.standNr==null?"#fff":"#888",border:"1.5px solid #888"}}>Kein Stand</button>
            {(standsConfig||[]).map(st=><div key={st.id} style={{display:"flex",alignItems:"center",gap:1}}><button onClick={()=>upd({standNr:st.id})} style={{fontSize:11,padding:"3px 9px",borderRadius:"10px 0 0 10px",cursor:"pointer",background:vd.standNr===st.id?"#8B6914":"transparent",color:vd.standNr===st.id?"#fff":"#8B6914",border:"1.5px solid #8B6914",borderRight:"none"}}>{st.label}</button><button onClick={()=>onDeleteStand&&onDeleteStand(st.id)} title="Stand löschen" style={{fontSize:11,padding:"3px 5px",borderRadius:"0 10px 10px 0",cursor:"pointer",background:vd.standNr===st.id?"#6B4A0A":"rgba(139,105,20,0.1)",color:vd.standNr===st.id?"#fff":"#8B6914",border:"1.5px solid #8B6914",borderLeft:"none"}}>×</button></div>)}
            <button onClick={()=>onAddStand&&onAddStand()} style={{fontSize:11,padding:"3px 9px",borderRadius:10,cursor:"pointer",background:"rgba(29,158,117,0.1)",color:"#1D9E75",border:"1.5px solid #1D9E75"}}>+ Stand</button>
          </div>
          {vd.standNr!=null&&standsConfig&&<p style={{fontSize:10,color:"#aaa",margin:"4px 0 0"}}>Teilt Unterbau auf „{((standsConfig||[]).find(s=>s.id===vd.standNr)||{}).label||"Stand"}"</p>}
        </div>
        <div style={{marginTop:8}}>
          <p style={{fontSize:11,fontWeight:500,color:"#888",margin:"0 0 6px"}}>Waage / Sensor</p>
          <label style={{fontSize:12,display:"flex",alignItems:"center",gap:4,cursor:"pointer"}}>
            <input type="checkbox" checked={vd.scaleId!=null||!stockKey.startsWith("m")} onChange={e=>upd({scaleId:e.target.checked?"manual":null})} disabled={!stockKey.startsWith("m")}/>Waage vorhanden
            {!stockKey.startsWith("m")&&<span style={{fontSize:10,color:"#aaa",marginLeft:4}}>Automatisch via ESP-NOW</span>}
          </label>
        </div>
      </div>
    </div>)}
    {tab==="waben"&&(<div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        {[["Besetzte Waben gesamt","besWaben"],["davon Honigwaben","besHonig"]].map(([lbl,k])=><label key={k} style={{display:"flex",flexDirection:"column",gap:4,fontSize:12,color:"#888"}}>{lbl}<input type="number" min="0" max={theo.bt.rahmen*4} value={vd[k]||0} onChange={e=>upd({[k]:+e.target.value})} style={{width:80,fontSize:14,padding:"4px 8px",borderRadius:6,border:"1px solid #ddd"}}/></label>)}
      </div>
      <div style={{background:"rgba(186,117,23,0.06)",border:"1px solid rgba(186,117,23,0.25)",borderRadius:8,padding:"10px 12px"}}>
        <p style={{margin:"0 0 8px",fontSize:12,fontWeight:500,color:"#888"}}>Theoretisches Gewicht ({theo.bt.label})</p>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          {[["Futtervorrat","#BA7517",theo.futtervorrat+" kg"],["Bienenmasse","#378ADD",theo.bienenmasse+" kg"],["Gesamt theo.","#333",theo.gesamt+" kg"],actualWeight>0?["Gemessen","#1D9E75",actualWeight.toFixed(1)+" kg"]:null].filter(Boolean).map(([lbl,clr,val])=><div key={lbl}><p style={{margin:0,fontSize:10,color:"#888"}}>{lbl}</p><p style={{margin:0,fontSize:16,fontWeight:600,color:clr}}>{val}</p></div>)}
        </div>
      </div>
    </div>)}
    {tab==="konigin"&&(<div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"rgba(186,117,23,0.05)",border:"1px solid rgba(186,117,23,0.2)",borderRadius:8}}>
        <div style={{width:28,height:28,borderRadius:"50%",background:kf.hex,border:isKoniginWeiss?"2px solid rgba(0,0,0,0.6)":"2px solid rgba(0,0,0,0.2)",flexShrink:0}}/>        <div><p style={{margin:0,fontSize:12,fontWeight:500,color:"#1a1a1a"}}>{kf.name} — Jahrgang {konigin.schlupfjahr}</p><p style={{margin:0,fontSize:10,color:"#888"}}>Imker-Markierungsfarbe nach Jahrgang</p></div>
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {[["Schlupfjahr","schlupfjahr","number"],["Königin-Nr.","nr","text"],["Zuchtbuch-Nr.","zuchtbuchNr","text"],["Anpaarung","anpaarung","text"],["Mutter-Nr.","mutterNr","text"]].map(([lbl,k,type])=><label key={k} style={{display:"flex",flexDirection:"column",gap:3,fontSize:12,color:"#888",flex:"1 1 100px",minWidth:100}}>{lbl}<input type={type} value={konigin[k]||""} onChange={e=>updKonigin({[k]:e.target.value})} style={{fontSize:13,padding:"4px 8px",borderRadius:5,border:"1px solid #ddd"}}/></label>)}
      </div>
    </div>)}
    {tab==="fuetterung"&&(<div style={{display:"flex",flexDirection:"column",gap:8}}>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"flex-end",background:"rgba(128,128,128,0.04)",borderRadius:6,padding:"8px 10px"}}>
        <label style={{fontSize:11,color:"#888",display:"flex",flexDirection:"column",gap:3}}>Datum<input type="date" value={newFt.datum} onChange={e=>setNewFt(p=>({...p,datum:e.target.value}))} style={{fontSize:12,padding:"3px 6px",borderRadius:4,border:"1px solid #ddd"}}/></label>
        <label style={{fontSize:11,color:"#888",display:"flex",flexDirection:"column",gap:3}}>Menge kg<input type="number" min="0" step="0.1" value={newFt.menge} onChange={e=>setNewFt(p=>({...p,menge:e.target.value}))} style={{width:70,fontSize:12,padding:"3px 6px",borderRadius:4,border:"1px solid #ddd"}}/></label>
        <label style={{fontSize:11,color:"#888",display:"flex",flexDirection:"column",gap:3}}>Art<select value={newFt.art} onChange={e=>setNewFt(p=>({...p,art:e.target.value}))} style={{fontSize:12,padding:"3px 6px",borderRadius:4,border:"1px solid #ddd"}}>{FT_ARTEN.map(a=><option key={a}>{a}</option>)}</select></label>
        <button onClick={()=>{if(!newFt.menge)return;upd({fuetterung:[{...newFt},...fuetterung]});setNewFt(p=>({...p,menge:""}));}} style={{fontSize:12,padding:"5px 12px",background:"#1D9E75",color:"#fff",border:"none",borderRadius:4,cursor:"pointer",marginBottom:1}}>+</button>
      </div>
      {fuetterung.length===0?<p style={{fontSize:12,color:"#888",margin:0}}>Keine Einträge.</p>:<div style={{display:"flex",flexDirection:"column",gap:3}}>{fuetterung.map((ft,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,padding:"5px 8px",background:"#f9f9f9",borderRadius:5}}><span style={{color:"#888"}}>{ft.datum}</span><span style={{fontWeight:500,color:"#BA7517"}}>{ft.menge} kg</span><span style={{flex:1,color:"#888"}}>{ft.art}</span><button onClick={()=>upd({fuetterung:fuetterung.filter((_,x)=>x!==i)})} style={{fontSize:12,padding:"0 5px",color:"#aaa",background:"transparent",border:"none",cursor:"pointer"}}>×</button></div>)}</div>}
    </div>)}
    {tab==="notiz"&&<textarea value={vd.notiz||""} onChange={e=>upd({notiz:e.target.value})} placeholder="Notizen..." style={{width:"100%",minHeight:100,fontSize:13,padding:"8px 10px",borderRadius:6,border:"1px solid #ddd",background:"#f9f9f9",resize:"vertical",boxSizing:"border-box"}}/>}
    {closeCfm&&<ConfirmModal title="Ohne Speichern schließen?" lines={["Eingetragene Daten in der Völkerübersicht gehen verloren."]} onOk={()=>{setCfm(false);onDiscard();onClose();}} onCancel={()=>setCfm(false)}/>}
  </div>);
}

// ── StockkartePaneel ─────────────────────────────────────────
function StockkartePaneel({sid,wKey,stockName,onClose,apiUrl,demo}){
  return(<Modal onClose={onClose} width="min(600px,98vw)">
    <div style={{display:"flex",justifyContent:"space-between",padding:"0 0 10px"}}>
      <strong>{stockName}</strong>
      <button onClick={onClose}>X</button>
    </div>
    <p style={{color:"#888",fontSize:12}}>Stockkarte-Editor (vereinfacht)</p>
  </Modal>);
}

// ── StockDropdown ─────────────────────────────────────────────
function StockDropdown({allStocks,selected,onChange}){
  const [open,setOpen]=useState(false);const [pos,setPos]=useState({top:0,left:0});
  const btnRef=useRef(null);const panelRef=useRef(null);
  const toggle=()=>{if(!open&&btnRef.current){const r=btnRef.current.getBoundingClientRect();setPos({top:r.bottom+4,left:r.left});}setOpen(o=>!o);};
  useEffect(()=>{if(!open)return;const h=e=>{if(panelRef.current&&!panelRef.current.contains(e.target)&&btnRef.current&&!btnRef.current.contains(e.target))setOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[open]);
  const allOn=selected.length===allStocks.length;
  return(<div style={{display:"inline-block"}}>
    <button ref={btnRef} onClick={toggle} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,padding:"4px 10px",background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:"var(--border-radius-md)",cursor:"pointer"}}>
      <i className="ti ti-filter" style={{fontSize:13}} aria-hidden="true"/>{allOn?"Alle Völker":(selected.length+" / "+allStocks.length)}<i className={"ti ti-chevron-"+(open?"up":"down")} style={{fontSize:11}} aria-hidden="true"/>
    </button>
    {open&&(<div ref={panelRef} style={{position:"fixed",top:pos.top,left:pos.left,zIndex:99999,background:"#fff",border:"1px solid #ccc",borderRadius:8,boxShadow:"0 8px 28px rgba(0,0,0,.22)",minWidth:230,overflow:"hidden"}}>
      <div onClick={()=>onChange(allOn?[]:allStocks.map(s=>s.k))} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",cursor:"pointer",borderBottom:"1px solid #eee",fontSize:12,color:"#555",userSelect:"none"}}><div style={{width:14,height:14,border:"1.5px solid #999",borderRadius:3,background:allOn?"#BA7517":"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{allOn&&<span style={{color:"#fff",fontSize:10,lineHeight:1}}>✓</span>}</div><em>Alle / Keine</em></div>
      {allStocks.map((s,i)=>{const on=selected.includes(s.k);return(<div key={s.k} onClick={()=>onChange(on?selected.filter(x=>x!==s.k):[...selected,s.k])} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",cursor:"pointer",borderBottom:"1px solid #eee",fontSize:12,color:"#333",userSelect:"none"}}><div style={{width:14,height:14,border:"1.5px solid "+COLORS[i%COLORS.length],borderRadius:3,background:on?COLORS[i%COLORS.length]:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{on&&<span style={{color:"#fff",fontSize:10,lineHeight:1}}>✓</span>}</div><svg width="28" height="10" style={{flexShrink:0}}><line x1="2" y1="5" x2="26" y2="5" stroke={COLORS[i%COLORS.length]} strokeWidth="2.5" strokeDasharray={LINE_DASH[i%LINE_DASH.length]||""}/></svg><span style={{flex:1}}>{s.nm}</span></div>);})}
    </div>)}
  </div>);
}
function GesamtRow({totH,totG}){const d=totH-totG,c=dClr(d);return(<tr style={{background:"rgba(128,128,128,0.06)"}}><td style={{padding:"7px 12px",fontSize:11,fontWeight:500,color:"var(--color-text-secondary)"}}>Gesamt</td><td style={{padding:"7px 12px",textAlign:"right",fontSize:11,color:"var(--color-text-secondary)"}}>{totG.toFixed(2)} kg</td><td style={{padding:"7px 12px",textAlign:"right",fontSize:11,fontWeight:500}}>{totH.toFixed(2)} kg</td><td style={{padding:"7px 12px",textAlign:"right"}}><span style={{fontSize:12,fontWeight:500,color:c.t,background:c.bg,padding:"2px 8px",borderRadius:10}}>{d>0?"+":""}{d.toFixed(2)} kg</span></td></tr>);}
function SatGroups({satStocks,latest,satBat}){
  const groups=[];const s1=satStocks.filter(s=>s.i>=1&&s.i<=5);if(s1.length>0)groups.push({name:"Satellit 1",bat:(latest&&latest.bat1)||satBat,stocks:s1,ci:1});const s2=satStocks.filter(s=>s.i>=6&&s.i<=10);if(s2.length>0)groups.push({name:"Satellit 2",bat:(latest&&latest.bat6)||0,stocks:s2,ci:6});
  return(<div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{groups.map(grp=><div key={grp.name} style={{flex:"1 1 180px",minWidth:180,background:"rgba(255,255,255,0.5)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",overflow:"hidden"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",borderBottom:"0.5px solid var(--color-border-tertiary)"}}><div style={{display:"flex",alignItems:"center",gap:6}}><i className="ti ti-satellite" style={{fontSize:13,color:"var(--color-text-secondary)"}} aria-hidden="true"/><span style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>{grp.name}</span></div><span style={{fontSize:12,fontWeight:500,color:batClr(grp.bat)}}>{grp.bat>0?grp.bat+"%":"—"}</span></div><div style={{padding:"6px 0"}}>{grp.stocks.map((s,i)=>{const w=latest&&latest[s.k],b=latest&&latest["b"+s.i];return(<div key={s.k} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 14px",borderBottom:i<grp.stocks.length-1?"0.5px solid var(--color-border-tertiary)":undefined}}><span style={{width:8,height:8,borderRadius:"50%",background:COLORS[(grp.ci+i)%COLORS.length],flexShrink:0,display:"inline-block"}}/><span style={{flex:1,fontSize:12,fontWeight:500,color:"var(--color-text-primary)"}}>{s.nm}</span><div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:500}}>{w>0?w.toFixed(2)+" kg":"—"}</div>{b>0&&<div style={{fontSize:10,color:"#E24B4A"}}>{b.toFixed(1)}°C</div>}</div></div>);})}</div></div>)}</div>);
}

// ── Karten-Picker: Leaflet + OSM (Europa) + Auto-Höhe ─────────
// Im deployten Browser: echte OSM-Karte, ganz Europa, zoombar.
// Im Claude-Artifact: externe Server geblockt → manueller Fallback.
function MapPicker({lat,lon,onSelect,onClose}){
  var initLat=lat||46.77; var initLon=lon||11.66;

  var mapDivRef=useRef(null);
  var leafletMapRef=useRef(null);
  var markerRef=useRef(null);
  var [picked,setPicked]=useState({lat:initLat,lon:initLon});
  var [hoehe,setHoehe]=useState(null);
  var [hoeheLoad,setHoeheLoad]=useState(false);
  var [mHoehe,setMHoehe]=useState("");
  var [mapReady,setMapReady]=useState(false);
  var [mapFail,setMapFail]=useState(false);
  var [mLat,setMLat]=useState(String(initLat));
  var [mLon,setMLon]=useState(String(initLon));
  var [searchQ,setSearchQ]=useState("");
  var [searchResults,setSearchResults]=useState([]);
  var [searchBusy,setSearchBusy]=useState(false);
  var elevTimer=useRef(null);
  var searchTimer=useRef(null);

  // ── Höhe automatisch via Open-Meteo Elevation API ──
  function fetchElev(la,lo){
    setHoeheLoad(true); clearTimeout(elevTimer.current);
    elevTimer.current=setTimeout(function(){
      fetch("https://api.open-meteo.com/v1/elevation?latitude="+la+"&longitude="+lo)
        .then(function(r){return r.json();})
        .then(function(d){
          if(d.elevation&&d.elevation[0]!=null)setHoehe(Math.round(d.elevation[0]));
          setHoeheLoad(false);
        })
        .catch(function(){setHoeheLoad(false);});
    },500);
  }

  // ── Nominatim Ortssuche (funktioniert nur deployed) ──
  function doSearch(val){
    setSearchQ(val); clearTimeout(searchTimer.current);
    if(val.length<2){setSearchResults([]);return;}
    setSearchBusy(true);
    searchTimer.current=setTimeout(function(){
      fetch("https://nominatim.openstreetmap.org/search?q="+encodeURIComponent(val)+"&format=json&limit=5&accept-language=de")
        .then(function(r){return r.json();})
        .then(function(d){setSearchResults(d||[]);setSearchBusy(false);})
        .catch(function(){setSearchBusy(false);});
    },500);
  }

  function goTo(la,lo){
    setPicked({lat:la,lon:lo});
    setMLat(la.toFixed(5)); setMLon(lo.toFixed(5));
    if(markerRef.current)markerRef.current.setLatLng([la,lo]);
    if(leafletMapRef.current)leafletMapRef.current.setView([la,lo],Math.max(leafletMapRef.current.getZoom(),12));
    fetchElev(la,lo);
  }

  // ── Leaflet dynamisch laden + Karte initialisieren ──
  useEffect(function(){
    fetchElev(initLat,initLon);
    var cancelled=false;

    function initMap(){
      if(cancelled||!mapDivRef.current||leafletMapRef.current)return;
      var L=window.L;
      if(!L){setMapFail(true);return;}
      try{
        var map=L.map(mapDivRef.current,{zoomControl:true}).setView([initLat,initLon],11);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
          attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom:19
        }).addTo(map);
        var icon=L.divIcon({
          html:'<div style="width:20px;height:20px;background:#378ADD;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
          className:"",iconAnchor:[10,10]
        });
        var mk=L.marker([initLat,initLon],{icon:icon,draggable:true}).addTo(map);
        function onMove(pos){
          var la=+pos.lat.toFixed(5); var lo=+pos.lng.toFixed(5);
          setPicked({lat:la,lon:lo});
          setMLat(la.toFixed(5)); setMLon(lo.toFixed(5));
          fetchElev(la,lo);
        }
        map.on("click",function(e){mk.setLatLng(e.latlng);onMove(e.latlng);});
        mk.on("dragend",function(){onMove(mk.getLatLng());});
        leafletMapRef.current=map;
        markerRef.current=mk;
        setMapReady(true);
        // Leaflet braucht resize-Trigger im Modal
        setTimeout(function(){map.invalidateSize();},150);
      }catch(e){setMapFail(true);}
    }

    if(window.L){initMap();}
    else{
      // CSS
      if(!document.getElementById("leaflet-css")){
        var lnk=document.createElement("link");
        lnk.id="leaflet-css"; lnk.rel="stylesheet";
        lnk.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
        document.head.appendChild(lnk);
      }
      // JS
      var s=document.createElement("script");
      s.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      s.onload=function(){setTimeout(initMap,100);};
      s.onerror=function(){if(!cancelled)setMapFail(true);};
      document.head.appendChild(s);
      // Timeout-Fallback: nach 5s aufgeben
      setTimeout(function(){if(!cancelled&&!leafletMapRef.current)setMapFail(true);},5000);
    }

    return function(){
      cancelled=true;
      clearTimeout(elevTimer.current); clearTimeout(searchTimer.current);
      if(leafletMapRef.current){leafletMapRef.current.remove();leafletMapRef.current=null;}
    };
  },[]);

  function applyManual(){
    var la=parseFloat(mLat); var lo=parseFloat(mLon);
    if(isNaN(la)||isNaN(lo))return;
    goTo(+la.toFixed(5),+lo.toFixed(5));
  }

  var effHoehe=hoehe!=null?hoehe:(mHoehe?+mHoehe:null);

  return(<Modal onClose={onClose} width="min(640px,98vw)">
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
      <p style={{margin:0,fontWeight:600,fontSize:14}}>Standort auf Karte wählen</p>
      <button onClick={onClose} style={{background:"transparent",border:"none",fontSize:20,cursor:"pointer",color:"#aaa",lineHeight:1}}>{"×"}</button>
    </div>

    {/* Ortssuche */}
    <div style={{position:"relative",marginBottom:8}}>
      <input value={searchQ} onChange={function(e){doSearch(e.target.value);}}
        placeholder="Ort suchen — ganz Europa (z.B. Brixen, Wien, Gardasee…)"
        style={{width:"100%",fontSize:13,padding:"7px 10px",borderRadius:6,border:"1px solid #ddd",boxSizing:"border-box"}}/>
      {searchBusy&&<span style={{position:"absolute",right:10,top:8,fontSize:11,color:"#aaa"}}>{"…"}</span>}
      {searchResults.length>0&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #ddd",borderRadius:6,boxShadow:"0 4px 16px rgba(0,0,0,0.15)",zIndex:99999,maxHeight:180,overflowY:"auto"}}>
        {searchResults.map(function(r,i){
          var short=r.display_name.split(",").slice(0,3).join(", ");
          return(<div key={i}
            onClick={function(){goTo(+parseFloat(r.lat).toFixed(5),+parseFloat(r.lon).toFixed(5));setSearchResults([]);setSearchQ("");}}
            style={{padding:"7px 12px",cursor:"pointer",borderBottom:"0.5px solid #f0f0f0",fontSize:12}}>{short}</div>);
        })}
      </div>}
    </div>

    {/* Karte */}
    <div style={{position:"relative",marginBottom:8}}>
      <div ref={mapDivRef} style={{height:340,borderRadius:8,border:"1px solid #ddd",background:"#e8e4dc",zIndex:1}}/>
      {!mapReady&&!mapFail&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
        <span style={{background:"rgba(255,255,255,0.9)",padding:"8px 16px",borderRadius:8,fontSize:12,color:"#888"}}>Karte wird geladen…</span>
      </div>}
      {mapFail&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:6,background:"rgba(240,240,238,0.95)",borderRadius:8}}>
        <p style={{margin:0,fontSize:13,color:"#888",fontWeight:500}}>Karte hier nicht verfügbar (Vorschau-Umgebung)</p>
        <p style={{margin:0,fontSize:11,color:"#aaa",textAlign:"center",padding:"0 20px"}}>
          In der installierten App funktioniert die Karte vollständig.<br/>
          Koordinaten unten manuell eingeben — Höhe wird trotzdem automatisch ermittelt (falls Netz verfügbar).
        </p>
        <a href={"https://www.google.com/maps?q="+picked.lat+","+picked.lon} target="_blank" rel="noreferrer"
          style={{fontSize:12,padding:"5px 12px",background:"#4285F4",color:"#fff",borderRadius:5,textDecoration:"none",marginTop:4}}>
          Google Maps öffnen {"↗"}
        </a>
      </div>}
    </div>

    {/* Manuelle Eingabe + Ergebnis */}
    <div style={{display:"flex",gap:8,alignItems:"flex-end",flexWrap:"wrap",marginBottom:10}}>
      <label style={{fontSize:10,color:"#888",display:"flex",flexDirection:"column",gap:2}}>
        Breitengrad
        <input type="number" step="0.0001" value={mLat} onChange={function(e){setMLat(e.target.value);}}
          onKeyDown={function(e){if(e.key==="Enter")applyManual();}}
          style={{fontSize:12,padding:"4px 7px",borderRadius:4,border:"1px solid #ddd",width:100}}/>
      </label>
      <label style={{fontSize:10,color:"#888",display:"flex",flexDirection:"column",gap:2}}>
        Längengrad
        <input type="number" step="0.0001" value={mLon} onChange={function(e){setMLon(e.target.value);}}
          onKeyDown={function(e){if(e.key==="Enter")applyManual();}}
          style={{fontSize:12,padding:"4px 7px",borderRadius:4,border:"1px solid #ddd",width:100}}/>
      </label>
      <button onClick={applyManual}
        style={{fontSize:11,padding:"5px 10px",background:"rgba(55,138,221,0.1)",border:"1px solid rgba(55,138,221,0.3)",borderRadius:5,color:"#378ADD",cursor:"pointer"}}>
        Setzen
      </button>
      <div style={{flex:1}}/>
      <div style={{textAlign:"right"}}>
        <p style={{margin:"0 0 1px",fontSize:11,color:"#555",fontFamily:"monospace"}}>{"📍"} {picked.lat.toFixed(5)}, {picked.lon.toFixed(5)}</p>
        <div style={{display:"flex",alignItems:"center",gap:5,justifyContent:"flex-end"}}>
          <span style={{fontSize:11,color:"#555"}}>{"⛰"}</span>
          {hoeheLoad
            ?<span style={{fontSize:11,color:"#aaa"}}>ermittle…</span>
            :hoehe!=null
              ?<span style={{fontSize:12,fontWeight:600,color:"#1D9E75"}}>{hoehe} m ü.M. {"✓"}</span>
              :<input type="number" value={mHoehe} onChange={function(e){setMHoehe(e.target.value);}}
                placeholder="Höhe m" style={{fontSize:11,padding:"2px 6px",borderRadius:4,border:"1px solid #ddd",width:75}}/>
          }
        </div>
      </div>
    </div>

    <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
      <button onClick={onClose} style={{padding:"7px 16px",fontSize:13,cursor:"pointer",borderRadius:6,border:"1px solid #ddd"}}>Abbrechen</button>
      <button onClick={function(){onSelect(picked.lat,picked.lon,effHoehe);onClose();}}
        style={{padding:"7px 18px",fontSize:13,background:"#378ADD",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontWeight:500}}>
        {"✓"} Übernehmen
      </button>
    </div>
  </Modal>);
}

function OrtSuche(){return null;}

// ── Koordinaten-Editor ────────────────────────────────────────
function CoordEdit({standort,onSave}){
  var [mode,setMode]=useState(""); // "" | "map" | "manual"
  var [lat,setLat]=useState(standort.lat||46.77);
  var [lon,setLon]=useState(standort.lon||11.66);

  if(mode==="map")return(
    <MapPicker
      lat={standort.lat||46.77}
      lon={standort.lon||11.66}
      onSelect={function(la,lo,ho){onSave(la,lo,ho);setMode("");}}
      onClose={function(){setMode("");}}
    />
  );

  if(mode==="manual")return(
    <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap",marginTop:2}}>
      <span style={{fontSize:11,color:"#888"}}>Lat:</span>
      <input type="number" step="0.0001" value={lat}
        onChange={function(e){setLat(+e.target.value);}}
        style={{fontSize:11,padding:"2px 5px",borderRadius:4,border:"1px solid #ddd",width:85}}/>
      <span style={{fontSize:11,color:"#888"}}>Lon:</span>
      <input type="number" step="0.0001" value={lon}
        onChange={function(e){setLon(+e.target.value);}}
        style={{fontSize:11,padding:"2px 5px",borderRadius:4,border:"1px solid #ddd",width:85}}/>
      <button onClick={function(){onSave(lat,lon,null);setMode("");}}
        style={{fontSize:11,padding:"2px 8px",cursor:"pointer",background:"#378ADD",color:"#fff",border:"none",borderRadius:4}}>{"✓"}</button>
      <button onClick={function(){setMode("");}}
        style={{fontSize:11,padding:"2px 6px",cursor:"pointer",borderRadius:4,border:"1px solid #ddd"}}>{"✕"}</button>
    </div>
  );

  return(
    <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3,flexWrap:"wrap"}}>
      <span style={{fontSize:11,color:"#aaa"}}>
        {"📍"} {standort.lat?(standort.lat.toFixed(4)+"° N, "+standort.lon.toFixed(4)+"° E"):"Koordinaten setzen"}
      </span>
      <button onClick={function(){setLat(standort.lat||46.77);setLon(standort.lon||11.66);setMode("map");}}
        style={{fontSize:10,padding:"2px 8px",background:"rgba(55,138,221,0.1)",border:"1px solid rgba(55,138,221,0.3)",borderRadius:4,color:"#378ADD",cursor:"pointer",fontWeight:500}}>
        {"🗺"} Karte
      </button>
      <button onClick={function(){setLat(standort.lat||46.77);setLon(standort.lon||11.66);setMode("manual");}}
        style={{fontSize:10,padding:"2px 7px",background:"rgba(128,128,128,0.06)",border:"1px solid #ddd",borderRadius:4,color:"#888",cursor:"pointer"}}>
        manuell
      </button>
    </div>
  );
}

// ── TabStandort
function TabStandort({apiUrl,demo,standort,onNameChange,onHoeheChange,onCoordChange,onDelete,zTypes,beutenTypes,registerDirty}){
  const [data,setData]=useState([]);const [stocks,setStocks]=useState({});const [alarme,setAlarme]=useState([]);
  const [loading,setLoading]=useState(false);const [latest,setLatest]=useState(null);
  const [range,setRange]=useState("24h");const [chartMode,setChartMode]=useState("total");
  const [selStocks,setSel]=useState(null);const [editName,setEditName]=useState(false);
  const [nameVal,setNameVal]=useState(standort.name);const [nameCfm,setNameCfm]=useState(false);
  const [delCfm,setDelCfm]=useState(false);const [selVolk,setSelVolk]=useState(null);
  const [selVd,setSelVd]=useState(null);const [selVdSaved,setSelVdSaved]=useState(null);const [openZB,setOpenZB]=useState(null);
  const [manualStocks,setManualStocks]=useState(()=>loadManualStocks(standort.id));
  const [standsConfig,setStandsConfig]=useState(()=>ls.get("stands_"+standort.id)||[]);
  const [editHoehe,setEditHoehe]=useState(false);const [hoeheVal,setHoeheVal]=useState(standort.hoehe||0);
  const [dragIdx,setDragIdx]=useState(null);const [dragOverIdx,setDragOverIdx]=useState(null);
  const [stockOrder,setStockOrder]=useState(()=>ls.get("stockorder_"+standort.id)||null);
  const zTypesMap=zTypes;
  const msMap={"24h":86400e3,"48h":172800e3,"7d":604800e3};
  const load=useCallback(function(){
    setLoading(true);
    if(demo){
      var d=DEMO_DATA[standort.id]||DEMO_DATA.s1;
      setData(d);setLatest(d[d.length-1]);
      var demoStocks=DEMO_STOCKS[standort.id]||DEMO_STOCKS.s1;setStocks(demoStocks);ls.set("stocks_"+standort.id,demoStocks);
      setAlarme(DEMO_ALARME);
      setLoading(false);
    }else{
      Promise.all([
        fetch(apiUrl+"?action=read&rows=300&station="+standort.apiStation),
        fetch(apiUrl+"?action=alarme&rows=30&station="+standort.apiStation)
      ]).then(function(rs){return Promise.all([rs[0].json(),rs[1].json()]);})
        .then(function(js){
          var j1=js[0],j2=js[1];
          if(j1.rows&&j1.rows.length>0){setData(j1.rows);setLatest(j1.rows[j1.rows.length-1]);}if(j1.stocks){ls.set("stocks_"+standort.id,j1.stocks);}
          if(j1.stocks)setStocks(j1.stocks);
          if(j2.rows)setAlarme(j2.rows);
          setLoading(false);
        }).catch(function(e){console.warn("load:",e);setLoading(false);});
    }
  },[apiUrl,demo,standort.id,standort.apiStation]);
  useEffect(()=>{load();},[load]);

  // sensorStocks: no destructuring/shorthand to avoid parser issues
  var sensorStocks=Object.keys(stocks).map(function(i){return{k:"w"+i,nm:stocks[i],i:+i};});
  var manualMapped=manualStocks.map(function(m,mi){return{k:"m"+mi,nm:m.name,i:null,isManual:true};});
  var allStocks=sensorStocks.concat(manualMapped);
  if(stockOrder){
    var _om={};
    allStocks.forEach(function(s){_om[s.k]=s;});
    allStocks=stockOrder.map(function(k){return _om[k];}).filter(Boolean).concat(allStocks.filter(function(s){return stockOrder.indexOf(s.k)<0;}));
  }
  var satStocks=sensorStocks.filter(function(s){return s.i>0;});
  var _cutoff=Date.now()-(msMap[range]||172800e3);
  var filtered=data.filter(function(d){return new Date(d.ts).getTime()>=_cutoff;});
  var step=Math.max(1,Math.floor(filtered.length/80));
  var sel=selStocks||allStocks.map(function(s){return s.k;});
  var chartData=filtered.filter(function(_,i){return i%step===0;}).map(function(d){
    var total=sensorStocks.filter(function(s){return sel.indexOf(s.k)>=0;}).reduce(function(sum,st){return sum+(+d[st.k]||0);},0);
    return Object.assign({},d,{time:fmtX(d.ts,range),_total:+total.toFixed(2)});
  });
  var chartStocks=chartMode==="select"?sensorStocks.filter(function(s){return sel.indexOf(s.k)>=0;}):sensorStocks;
  var _tCalc=calcTagesvergleich(data,stocks);
  var tRows=_tCalc.rows; var totH=_tCalc.totH; var totG=_tCalc.totG;
  var druckMeer=latest?druckAufMeereshoehe(+latest.pres||0,standort.hoehe||0):0;
  var trend=gewitterTrend(data,standort.hoehe||0);

  const persistStands=cfg=>{ls.set("stands_"+standort.id,cfg);setStandsConfig(cfg);};
  const addStand=()=>persistStands([...standsConfig,{id:"st"+Date.now(),label:"Stand "+(standsConfig.length+1)}]);
  const deleteStand=id=>persistStands(standsConfig.filter(s=>s.id!==id));
  const saveStockOrder=order=>{ls.set("stockorder_"+standort.id,order);setStockOrder(order);};
  const addManual=()=>{const n=[...manualStocks,{name:"Manueller Stock "+(manualStocks.length+1)}];setManualStocks(n);saveManualStocks(standort.id,n);};
  const delManual=mi=>{const n=manualStocks.filter((_,i)=>i!==mi);setManualStocks(n);saveManualStocks(standort.id,n);};
  const getVD=k=>{const saved=loadVolkData(standort.id,k);return saved||defaultVolkData(k.startsWith("m"));};
  const setVD=(k,vd)=>{saveVolkData(standort.id,k,vd);};

  return(<div style={{padding:"1rem"}}>

    {/* ── Header ── */}
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:"0.75rem",flexWrap:"wrap"}}>
      <div>
        {editName
          ?<div style={{display:"flex",gap:6,alignItems:"center"}}>
            <input value={nameVal} onChange={function(e){setNameVal(e.target.value);}} style={{fontSize:16,fontWeight:600,padding:"3px 8px",borderRadius:6,border:"1px solid var(--color-border-secondary)"}}/>
            <button onClick={function(){if(nameVal!==standort.name)setNameCfm(true);else setEditName(false);}} style={{fontSize:12,padding:"3px 8px",cursor:"pointer"}}>{"✓"}</button>
            <button onClick={function(){setNameVal(standort.name);setEditName(false);}} style={{fontSize:12,padding:"3px 8px",cursor:"pointer"}}>{"✕"}</button>
          </div>
          :<div style={{display:"flex",alignItems:"center",gap:6}}>
            <h2 style={{margin:0,fontSize:16,fontWeight:600}}>{standort.name}</h2>
            <button onClick={function(){setEditName(true);}} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:12,color:"#aaa"}}>{"✏"}</button>
          </div>
        }
        {latest&&<p style={{margin:"2px 0 0",fontSize:12,color:"var(--color-text-secondary)"}}>{"🔋"} {(latest.bat0||latest.bat||"—")}% · {ago(latest.ts)}</p>}
        {editHoehe
          ?<div style={{display:"flex",gap:5,alignItems:"center",marginTop:3}}>
            <span style={{fontSize:11,color:"#888"}}>{"⛰"} m:</span>
            <input type="number" value={hoeheVal} onChange={function(e){setHoeheVal(+e.target.value);}} autoFocus
              onKeyDown={function(e){if(e.key==="Enter"){onHoeheChange(standort.id,hoeheVal);setEditHoehe(false);}if(e.key==="Escape")setEditHoehe(false);}}
              style={{fontSize:11,padding:"2px 6px",borderRadius:4,border:"1px solid #ddd",width:70}}/>
            <button onClick={function(){onHoeheChange(standort.id,hoeheVal);setEditHoehe(false);}} style={{fontSize:11,padding:"1px 6px",cursor:"pointer"}}>{"✓"}</button>
            <button onClick={function(){setHoeheVal(standort.hoehe||0);setEditHoehe(false);}} style={{fontSize:11,padding:"1px 6px",cursor:"pointer"}}>{"✕"}</button>
          </div>
          :<div style={{display:"flex",alignItems:"center",gap:10,marginTop:3,flexWrap:"wrap"}}>
            <div onClick={function(){setEditHoehe(true);}} style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer"}}>
              <span style={{fontSize:11,color:"#aaa"}}>{"⛰"} {standort.hoehe||0} m</span>
              <span style={{fontSize:10,color:"#ccc"}}>{"✏"}</span>
            </div>
            <CoordEdit standort={standort} onSave={function(la,lo,ho){onCoordChange&&onCoordChange(standort.id,la,lo,ho);if(ho!=null&&onHoeheChange)onHoeheChange(standort.id,ho);}}/>
          </div>
        }
        {trend&&trend.warning&&<p style={{margin:"3px 0 0",fontSize:11,color:"#5B7FBA",fontWeight:500}}>{"⛈"} Druckabfall {trend.diff} hPa/3h</p>}
      </div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={load} disabled={loading} style={{fontSize:12,padding:"4px 10px",background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-md)",cursor:"pointer"}}>{loading?"…":"↻"}</button>
        <button onClick={function(){setDelCfm(true);}} style={{fontSize:12,padding:"4px 8px",background:"rgba(226,75,74,0.1)",border:"1px solid rgba(226,75,74,0.3)",borderRadius:"var(--border-radius-md)",cursor:"pointer",color:"#E24B4A"}}>{"🗑"}</button>
      </div>
    </div>

    {/* ── Völkerübersicht ── */}
    {allStocks.length>0&&<Block>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end",paddingBottom:8}}>
        {allStocks.map(function(s,idx){
          var vd=getVD(s.k);var zb=loadZuchtbuch(standort.id,s.k)||{};
          var kf=koniginFarbe(zb.schluepfjahr||new Date().getFullYear());
          var w=s.i!=null?(+(latest&&latest[s.k])||0):0;
          var b=s.i!=null?(+(latest&&latest["b"+s.i])||0):0;
          var nameParts=[zb.koniginzeichen?"K"+zb.koniginzeichen:null,zb.schluepfjahr?String(zb.schluepfjahr):null,zb.zuchtbuchNr?String(zb.zuchtbuchNr):null].filter(Boolean);
          var compName=nameParts.length>0?nameParts.join(" · "):s.nm;
          var isSel=selVolk===s.k;
          return(<div key={s.k}
            draggable={true}
            onDragStart={function(){setDragIdx(idx);}}
            onDragOver={function(e){e.preventDefault();setDragOverIdx(idx);}}
            onDrop={function(){
              if(dragIdx!==null&&dragIdx!==idx){
                var o=allStocks.map(function(st){return st.k;});
                var mv=o.splice(dragIdx,1)[0];
                o.splice(idx,0,mv);
                saveStockOrder(o);
              }
              setDragIdx(null);setDragOverIdx(null);
            }}
            onDragEnd={function(){setDragIdx(null);setDragOverIdx(null);}}
            onClick={function(){setSelVolk(isSel?null:s.k);if(!isSel)setSelVd(null);}}
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,opacity:dragIdx===idx?0.4:1,outline:dragOverIdx===idx?"2px solid #378ADD":"none",cursor:"pointer",minWidth:60}}>
            <div style={{textAlign:"center",marginBottom:2}}>
              <div style={{display:"flex",alignItems:"center",gap:4}}><KfDot kf={kf} size={10}/><p style={{margin:0,fontSize:11,fontWeight:500,color:"#1a1a1a"}}>{compName}</p></div>
              {w>0&&<p style={{margin:0,fontSize:12,fontWeight:600}}>{w.toFixed(1)} kg</p>}
              {b>0&&<p style={{margin:0,fontSize:10,color:"#E24B4A"}}>{b.toFixed(1)}{"°C"}</p>}
              {s.isManual&&<span style={{fontSize:9,color:"#aaa",border:"0.5px solid #ddd",borderRadius:3,padding:"1px 3px"}}>kein Sensor</span>}
            </div>
            <MiniHive zargen={vd.zargen||[{t:"brut"}]} zTypes={zTypesMap} hasWaage={!s.isManual}/>
            <span style={{fontSize:9,color:"#999",cursor:"grab"}}>{"⠿"}</span>
          </div>);
        })}
        <button onClick={addManual} style={{fontSize:11,padding:"6px 10px",borderRadius:6,cursor:"pointer",alignSelf:"center",background:"rgba(128,128,128,0.07)",border:"1px dashed #ccc",color:"#888"}}>+ Manuell</button>
      </div>
      {selVolk&&<VolkEditPanel
        key={selVolk} stockKey={selVolk}
        stockName={(allStocks.filter(function(s){return s.k===selVolk;})[0]||{}).nm||selVolk}
        standortId={standort.id}
        vd={selVd||getVD(selVolk)}
        savedVd={selVdSaved||getVD(selVolk)}
        onVdChange={function(vd){setVD(selVolk,vd);setSelVd(vd);}}
        onSave={function(){var vd=getVD(selVolk);setSelVdSaved(Object.assign({},vd));syncZuchtbuchToSheets(apiUrl||"",standort.id,selVolk,loadZuchtbuch(standort.id,selVolk),vd);}}
        onDiscard={function(){}}
        onClose={function(){setSelVolk(null);}}
        actualWeight={sensorStocks.filter(function(s){return s.k===selVolk;})[0]&&latest?(+(latest[selVolk])||0):0}
        actualBrut={0}
        zTypes={zTypesMap}
        beutenTypes={beutenTypes}
        standsConfig={standsConfig}
        onAddStand={addStand}
        onDeleteStand={deleteStand}
        onOpenZuchtbuch={function(k,nm){setOpenZB({k:k,nm:nm});}}
      />}
    </Block>}

    {/* ── Wetter ── */}
    {latest&&<WetterWidget latest={latest} data={data} hoehe={standort.hoehe||0} trend={trend} lat={standort.lat} lon={standort.lon} demo={demo}/>}

    {/* ── Satelliten ── */}
    {satStocks.filter(function(s){return s.i>0;}).length>0&&<Block><SatGroups satStocks={satStocks} latest={latest} satBat={+(latest&&latest.bat1)||0}/></Block>}

    {/* ── Gewichtsverlauf ── */}
    {chartData.length>0&&<Block>
      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
        {["24h","48h","7d"].map(function(r){return(
          <button key={r} onClick={function(){setRange(r);}} style={{fontSize:13,padding:"6px 16px",background:range===r?"#378ADD":"rgba(128,128,128,0.07)",color:range===r?"#fff":"var(--color-text-secondary)",borderRadius:7,fontWeight:range===r?600:400,border:range===r?"none":"0.5px solid var(--color-border-tertiary)",cursor:"pointer"}}>{r}</button>
        );})}
        <div style={{width:"0.5px",height:20,background:"var(--color-border-tertiary)",margin:"0 2px"}}/>
        {[["total","Gesamt"],["select","Einzeln"]].map(function(pair){var m=pair[0];var lbl=pair[1];return(
          <button key={m} onClick={function(){setChartMode(m);}} style={{fontSize:12,padding:"5px 12px",background:chartMode===m?"var(--color-background-secondary)":"transparent",color:chartMode===m?"var(--color-text-primary)":"var(--color-text-secondary)",borderRadius:7,fontWeight:chartMode===m?500:400,border:chartMode===m?"0.5px solid var(--color-border-secondary)":"none",cursor:"pointer"}}>{lbl}</button>
        );})}
        {chartMode==="select"&&<StockDropdown allStocks={sensorStocks} selected={selStocks||sensorStocks.map(function(s){return s.k;})} onChange={function(next){setSel(next.length===sensorStocks.length?null:next.length>0?next:null);}}/>}
      </div>
      <div style={{height:300}}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{top:8,right:46,left:-14,bottom:0}}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(128,128,128,0.09)"/>
            <XAxis dataKey="time" tick={{fontSize:10,fill:"#999"}} interval="preserveStartEnd" stroke="transparent" tickLine={false}/>
            <YAxis yAxisId="left" tick={{fontSize:10,fill:"#999"}} domain={["auto","auto"]} stroke="transparent" tickLine={false} width={42} tickFormatter={function(v){return v+" kg";}}/>
            <YAxis yAxisId="temp" orientation="right" tick={{fontSize:10,fill:"#E24B4A"}} domain={["auto","auto"]} stroke="transparent" tickLine={false} width={32} tickFormatter={function(v){return v+"°";}}/>
            <Tooltip contentStyle={{fontSize:12,background:"rgba(255,255,255,0.97)",border:"0.5px solid #e0e0e0",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",padding:"8px 12px"}} formatter={function(val,name){return[typeof val==="number"?val.toFixed(2):val,name];}} labelStyle={{fontWeight:500,marginBottom:4}}/>
            {chartMode==="total"
              ?<Line yAxisId="left" type="monotone" dataKey="_total" name="Gesamt (kg)" stroke="#BA7517" strokeWidth={2.5} dot={false} activeDot={{r:5,stroke:"#BA7517",strokeWidth:2,fill:"#fff"}}/>
              :chartStocks.map(function(s,i){return(<Line key={s.k} yAxisId="left" type="monotone" dataKey={s.k} name={s.nm+" (kg)"} stroke={COLORS[i%COLORS.length]} strokeWidth={2.5} strokeDasharray={LINE_DASH[i%LINE_DASH.length]} dot={false} activeDot={{r:5,stroke:COLORS[i%COLORS.length],strokeWidth:2,fill:"#fff"}}/>);})}
            {latest&&latest.temp&&<Line yAxisId="temp" type="monotone" dataKey="temp" name={"Temp. (°C)"} stroke="#E24B4A" strokeWidth={1.5} strokeDasharray="5 3" dot={false} activeDot={{r:3}}/>}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Block>}

    {/* ── Tagesvergleich ── */}
    {tRows&&tRows.length>0&&<Block noPad>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr style={{borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
          {["Stock","Gestern","Heute","Diff"].map(function(h){return(<th key={h} style={{padding:"7px 12px",textAlign:h==="Stock"?"left":"right",fontSize:10,fontWeight:500,color:"var(--color-text-secondary)"}}>{h}</th>);})}
        </tr></thead>
        <tbody>
          {tRows.map(function(r){var c=dClr(r.d);return(
            <tr key={r.k} style={{borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
              <td style={{padding:"7px 12px",fontWeight:500}}>{r.nm}</td>
              <td style={{padding:"7px 12px",textAlign:"right",color:"var(--color-text-secondary)"}}>{r.g.toFixed(2)} kg</td>
              <td style={{padding:"7px 12px",textAlign:"right",fontWeight:500}}>{r.h.toFixed(2)} kg</td>
              <td style={{padding:"7px 12px",textAlign:"right"}}><span style={{fontSize:11,fontWeight:500,color:c.t,background:c.bg,padding:"2px 8px",borderRadius:10}}>{r.d>0?"+":""}{r.d.toFixed(2)} kg</span></td>
            </tr>
          );})}
          <GesamtRow totH={totH} totG={totG}/>
        </tbody>
      </table>
    </Block>}

    {/* ── Ereignisse ── */}
    {alarme.length>0&&<Block>
      <SH icon="ti-bell">Ereignisse</SH>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        {alarme.map(function(a,i){
          var m=ALARM_META[a.typ]||{label:a.typ,c:"#888"};
          var stockEntry=a.waage!=null&&a.waage!==""
            ?allStocks.filter(function(s){return s.k==="w"+a.waage||s.i===+a.waage;})[0]:null;
          var stockLabel=stockEntry?stockEntry.nm:(a.waage!=null&&a.waage!==""?"Waage W"+a.waage:null);
          return(
          <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 10px",background:m.c+"12",border:"1px solid "+m.c+"33",borderRadius:7}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:m.c,flexShrink:0,marginTop:4,display:"inline-block"}}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <span style={{fontSize:12,fontWeight:600,color:m.c}}>{m.label}</span>
                {stockLabel&&<span style={{fontSize:11,fontWeight:500,background:m.c+"22",color:m.c,padding:"1px 7px",borderRadius:8}}>{"🐝"} {stockLabel}</span>}
              </div>
              {a.beschreibung&&<p style={{margin:"2px 0 0",fontSize:11,color:"var(--color-text-secondary)"}}>{a.beschreibung}</p>}
              {(a.wert||a.referenz)&&<p style={{margin:"1px 0 0",fontSize:10,color:"#aaa"}}>{a.referenz?a.referenz.toFixed(1)+" kg → ":""}{a.wert?a.wert.toFixed(1)+" kg":""}</p>}
            </div>
            <span style={{fontSize:10,color:"#aaa",flexShrink:0}}>{a.ts?ago(a.ts):""}</span>
          </div>
        );})}
      </div>
    </Block>}

    {openZB&&<StockkartePaneel sid={standort.id} wKey={openZB.k} stockName={openZB.nm} onClose={function(){setOpenZB(null);}} apiUrl={apiUrl} demo={demo}/>}
    {nameCfm&&<ConfirmModal title="Name ändern?" lines={[standort.name+" → "+nameVal]} onOk={function(){onNameChange(standort.id,nameVal);setEditName(false);setNameCfm(false);}} onCancel={function(){setNameCfm(false);}}/>}
    {delCfm&&<ConfirmModal title={"Löschen?"} lines={["Alle lokalen Völkerdaten werden entfernt."]} onOk={function(){onDelete(standort.id);setDelCfm(false);}} onCancel={function(){setDelCfm(false);}}/>}
  </div>);
}


// ── TabZuchtbuch ──────────────────────────────────────────────
function TabZuchtbuch({standorte,apiUrl,demo}){
  var [openZB,setOpenZB]=useState(null);
  var [filter,setFilter]=useState("alle"); // "alle"|"mit_koenigin"|"ohne_waage"
  var [search,setSearch]=useState("");

  // Alle Völker aller Standorte zusammenführen (Sensor + Manuell)
  var alleVoelker=standorte.flatMap(function(st){
    var sensorStocks=ls.get("stocks_"+st.id)||{};
    var manuals=loadManualStocks(st.id);
    var list=[];
    // Sensor-Völker (mit Waage)
    Object.keys(sensorStocks).forEach(function(i){
      list.push({sid:st.id,sName:st.name,k:"w"+i,nm:sensorStocks[i],isManual:false,waageIdx:+i});
    });
    // Manuelle Völker (ohne Waage)
    manuals.forEach(function(m,mi){
      list.push({sid:st.id,sName:st.name,k:"m"+mi,nm:m.name,isManual:true,waageIdx:null});
    });
    return list;
  });

  // Filter + Suche
  var visible=alleVoelker.filter(function(v){
    var zb=loadZuchtbuch(v.sid,v.k)||{};
    var vd=loadVolkData(v.sid,v.k)||{};
    if(filter==="mit_koenigin"&&!zb.koniginzeichen)return false;
    if(filter==="ohne_waage"&&!v.isManual)return false;
    if(search){
      var q=search.toLowerCase();
      var nm=(v.nm||"").toLowerCase();
      var zbNr=(zb.zuchtbuchNr||"").toLowerCase();
      var kz=(zb.koniginzeichen||"").toLowerCase();
      if(!nm.includes(q)&&!zbNr.includes(q)&&!kz.includes(q)&&!v.sName.toLowerCase().includes(q))return false;
    }
    return true;
  });

  // Gruppieren nach Standort
  var byStandort={};
  visible.forEach(function(v){
    if(!byStandort[v.sid])byStandort[v.sid]={name:v.sName,voelker:[]};
    byStandort[v.sid].voelker.push(v);
  });

  return(<div style={{padding:"1rem"}}>
    {/* Header */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.75rem",flexWrap:"wrap",gap:8}}>
      <div>
        <h2 style={{margin:0,fontSize:16,fontWeight:600}}>Digitales Zuchtbuch</h2>
        <p style={{margin:"2px 0 0",fontSize:12,color:"#888"}}>{alleVoelker.length} Völker · {visible.length} angezeigt</p>
      </div>
    </div>

    {/* Filter + Suche */}
    <Block>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <input value={search} onChange={function(e){setSearch(e.target.value);}}
          placeholder="Suche (Name, Zuchtbuch-Nr., Königin…)"
          style={{flex:1,minWidth:160,fontSize:13,padding:"6px 10px",borderRadius:6,border:"1px solid #ddd",boxSizing:"border-box"}}/>
        {[["alle","Alle"],["mit_koenigin","Königin erfasst"],["ohne_waage","Ohne Waage"]].map(function(pair){
          var f=pair[0]; var lbl=pair[1];
          return(<button key={f} onClick={function(){setFilter(f);}}
            style={{fontSize:11,padding:"4px 10px",borderRadius:10,cursor:"pointer",
              background:filter===f?"#378ADD":"rgba(128,128,128,0.07)",
              color:filter===f?"#fff":"#888",border:"none",fontWeight:filter===f?500:400}}>
            {lbl}
          </button>);
        })}
      </div>
    </Block>

    {alleVoelker.length===0&&<Block>
      <p style={{margin:0,fontSize:13,color:"#aaa",textAlign:"center",padding:"1rem 0"}}>
        Noch keine Völker angelegt — bitte zuerst Völker in der Standort-Ansicht erstellen.
      </p>
    </Block>}

    {/* Gruppen nach Standort */}
    {Object.keys(byStandort).map(function(sid){
      var grp=byStandort[sid];
      return(<div key={sid} style={{marginBottom:"1rem"}}>
        <p style={{margin:"0 0 6px",fontSize:11,fontWeight:600,color:"#aaa",textTransform:"uppercase",letterSpacing:0.5}}>
          {"📍"} {grp.name}
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {grp.voelker.map(function(v){
            var zb=loadZuchtbuch(v.sid,v.k)||{};
            var vd=loadVolkData(v.sid,v.k)||{};
            var kf=koniginFarbe(zb.schluepfjahr||new Date().getFullYear());
            var nameParts=[
              zb.koniginzeichen?"K"+zb.koniginzeichen:null,
              zb.schluepfjahr?String(zb.schluepfjahr):null,
              zb.zuchtbuchNr?"#"+zb.zuchtbuchNr:null
            ].filter(Boolean);
            var compName=nameParts.length>0?nameParts.join(" · "):v.nm;
            var zargen=vd.zargen||[{t:"brut"}];
            var lastInsp=zb.inspektionen&&zb.inspektionen.filter(function(x){return x.datum;}).pop();
            var statusColor={normal:"#1D9E75",schwach:"#E24B4A",verloren:"#888",abwesend:"#aaa"};
            var status=vd.status||"normal";
            return(<div key={v.k}
              onClick={function(){setOpenZB({sid:v.sid,k:v.k,nm:v.nm});}}
              style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",
                background:"var(--color-background-primary)",
                border:"1px solid var(--color-border-secondary)",
                borderLeft:"4px solid "+(kf.isWeiss?"#888":kf.hex),outline:kf.isWeiss?"1px solid #ccc":"none",
                borderRadius:8,cursor:"pointer",transition:"box-shadow .15s"}}
              onMouseEnter={function(e){e.currentTarget.style.boxShadow="0 2px 10px rgba(0,0,0,0.08)";}}
              onMouseLeave={function(e){e.currentTarget.style.boxShadow="none";}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                  <span style={{display:"inline-flex",alignItems:"center",gap:5}}><KfDot kf={kf} size={12}/><span style={{fontSize:13,fontWeight:600,color:"#1a1a1a"}}>{compName}</span></span>
                  <span style={{fontSize:10,padding:"1px 6px",borderRadius:8,background:statusColor[status]+"20",color:statusColor[status],fontWeight:500}}>{status}</span>
                  {v.isManual&&<span style={{fontSize:9,color:"#bbb",border:"0.5px solid #ddd",borderRadius:4,padding:"0 4px"}}>kein Sensor</span>}
                </div>
                <p style={{margin:"2px 0 0",fontSize:11,color:"#888"}}>{v.nm}{v.nm!==compName?" · ":""}{zargen.length} Zargen · {lastInsp?"Kontrolle "+lastInsp.datum:"keine Kontrolle"}</p>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <p style={{margin:0,fontSize:12,fontWeight:600}}>{zargen.length} Z</p>
                {zb.zuchtbuchNr&&<p style={{margin:0,fontSize:10,color:"#aaa"}}>{"#"}{zb.zuchtbuchNr}</p>}
              </div>
              <span style={{fontSize:16,color:"#ddd"}}>{"›"}</span>
            </div>);
          })}
        </div>
      </div>);
    })}

    {visible.length===0&&alleVoelker.length>0&&<Block>
      <p style={{margin:0,fontSize:12,color:"#aaa",textAlign:"center",padding:"0.5rem 0"}}>Keine Einträge für diesen Filter.</p>
    </Block>}

    {openZB&&<StockkartePaneel sid={openZB.sid} wKey={openZB.k} stockName={openZB.nm}
      onClose={function(){setOpenZB(null);}} apiUrl={apiUrl} demo={demo}/>}
  </div>);
}

// ── App Root ──────────────────────────────────────────────────
// ── PIN-Login (Zugangsschutz) ─────────────────────────────────
// PIN hier ändern:
var APP_PIN="imker2026";

function LoginGate({children}){
  var [ok,setOk]=useState(function(){try{return localStorage.getItem("sw_auth")==="ja";}catch(e){return false;}});
  var [pin,setPin]=useState("");
  var [fehler,setFehler]=useState(false);

  function pruefe(){
    if(pin===APP_PIN){
      try{localStorage.setItem("sw_auth","ja");}catch(e){}
      setOk(true); setFehler(false);
    }else{
      setFehler(true); setPin("");
    }
  }

  if(ok)return children;

  return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#f5efe0,#e8f0e4)",fontFamily:"system-ui,-apple-system,sans-serif"}}>
    <div style={{background:"#fff",padding:"2rem 2.5rem",borderRadius:16,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",width:"min(340px,90vw)",textAlign:"center"}}>
      <div style={{fontSize:40,marginBottom:8}}>{"🐝"}</div>
      <h1 style={{margin:"0 0 4px",fontSize:20,fontWeight:700,color:"#1a1a1a"}}>Stockwaage</h1>
      <p style={{margin:"0 0 20px",fontSize:13,color:"#888"}}>Bitte Zugangs-PIN eingeben</p>
      <input type="password" value={pin} autoFocus
        onChange={function(e){setPin(e.target.value);setFehler(false);}}
        onKeyDown={function(e){if(e.key==="Enter")pruefe();}}
        placeholder="PIN"
        style={{width:"100%",fontSize:16,padding:"10px 14px",borderRadius:8,border:"1px solid "+(fehler?"#E24B4A":"#ddd"),boxSizing:"border-box",textAlign:"center",marginBottom:12}}/>
      {fehler&&<p style={{margin:"0 0 12px",fontSize:12,color:"#E24B4A"}}>Falscher PIN</p>}
      <button onClick={pruefe}
        style={{width:"100%",padding:"10px",fontSize:15,background:"#BA7517",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600}}>
        Anmelden
      </button>
    </div>
  </div>);
}

export default function App(){
  return(<LoginGate><Dashboard/></LoginGate>);
}

function Dashboard(){
  const [apiUrl,setApiUrl]=useState(DEFAULT_URL);
  const [demo,setDemo]=useState(true);
  const [standorte,setSt]=useState(()=>ls.get("sw_standorte")||[{id:"s1",name:"Bienenstand Wiese",apiStation:"1",hoehe:280,lat:46.77,lon:11.66},{id:"s2",name:"Bienenstand Wald",apiStation:"2",hoehe:280,lat:46.77,lon:11.66}]);
  const [activeTab,setActiveTab]=useState("s1");
  const [addStandortName,setAddStandortName]=useState(null);
  const [zargenAll,setZargenAll]=useState(loadZargenAll);
  const [beutenAll,setBeutenAll]=useState(loadBeutenAll);
  const [msgTemplates,setMsgTemplates]=useState(loadMsgTemplates);
  const [notifRules,setNotifRules]=useState(loadRules);
  const dirtyForms=useRef(new Set());
  const registerDirty=(key,isDirty)=>{if(isDirty)dirtyForms.current.add(key);else dirtyForms.current.delete(key);};

  useEffect(()=>{ls.set("sw_standorte",standorte);},[standorte]);
  useEffect(()=>{saveZargenAll(zargenAll);},[zargenAll]);
  useEffect(()=>{saveBeutenAll(beutenAll);},[beutenAll]);

  const renameS=(id,name)=>setSt(p=>p.map(s=>s.id===id?Object.assign({},s,{name}):s));
  const hoeheS=function(id,hoehe){setSt(function(p){return p.map(function(s){return s.id===id?Object.assign({},s,{hoehe:hoehe}):s;});});if(!demo){var st=standorte.find(function(s){return s.id===id;});fetch(apiUrl+"?action=saveStation&apiStation="+(st&&st.apiStation||"")+"&hoehe="+hoehe).catch(function(e){console.warn("Höhe:",e);});}};
  const coordS=(id,lat,lon,hoehe)=>setSt(function(p){return p.map(function(s){if(s.id!==id)return s;var upd=Object.assign({},s,{lat:lat,lon:lon});if(hoehe!=null)upd.hoehe=hoehe;return upd;});});
  const deleteS=id=>{if(dirtyForms.current.size>0&&!window.confirm("Ungespeicherte Änderungen – trotzdem löschen?"))return;setSt(p=>p.filter(s=>s.id!==id));if(activeTab===id)setActiveTab(standorte.find(s=>s.id!==id)&&standorte.find(s=>s.id!==id).id||"s1");};
  const addS=name=>{const id="s"+(Date.now());const apiStation=String(standorte.length+1);setSt(p=>[...p,{id,name,apiStation,hoehe:280}]);setActiveTab(id);setAddStandortName(null);};
  const handleSetActive=id=>{if(dirtyForms.current.size>0&&!window.confirm("Ungespeicherte Änderungen – Tab wechseln?"))return;setActiveTab(id);};

  const zTypes=Object.fromEntries(zargenAll.map(z=>[z.id,z]));
  const beutenTypes=Object.fromEntries(beutenAll.map(b=>[b.id,b]));

  const leftTabs=standorte.map(s=>({id:s.id,label:s.name}));
  const rightTabs=[{id:"zuchtbuch",label:"📋 Zuchtbuch"},{id:"einstellungen",label:"⚙️ Einstellungen"}];

  return(<div style={{minHeight:"100vh",background:"var(--color-background-secondary)",fontFamily:"var(--font-family-sans)"}}>
    {/* Header */}
    <div style={{background:"var(--color-background-primary)",borderBottom:"1px solid var(--color-border-tertiary)",padding:"10px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
      <span style={{fontSize:16,fontWeight:700,color:"var(--color-text-primary)"}}>{"🐝"} Stockwaage</span>
      <div style={{flex:1,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <input value={apiUrl} onChange={e=>setApiUrl(e.target.value)} style={{fontSize:11,padding:"3px 8px",borderRadius:5,border:"1px solid #ddd",width:320,fontFamily:"monospace"}} placeholder="Apps Script URL"/>
        <label style={{display:"flex",alignItems:"center",gap:5,fontSize:12,cursor:"pointer"}}>
          <input type="checkbox" checked={demo} onChange={e=>setDemo(e.target.checked)}/>
          <span style={{color:demo?"#BA7517":"#1D9E75",fontWeight:500}}>{demo?"Demo":"Live"}</span>
        </label>
      </div>
    </div>

    {/* Navigation */}
    <div style={{display:"flex",alignItems:"stretch",borderBottom:"1px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",overflowX:"auto"}}>
      <div style={{display:"flex",gap:1,padding:"0 8px",flex:1,alignItems:"center",minHeight:42}}>
        {leftTabs.map(t=><div key={t.id} style={{position:"relative",display:"inline-flex",alignItems:"center"}}>
          <button onClick={()=>handleSetActive(t.id)} style={{fontSize:13,padding:"10px 16px",whiteSpace:"nowrap",cursor:"pointer",borderRadius:0,background:"transparent",fontWeight:activeTab===t.id?600:400,color:activeTab===t.id?"#378ADD":"var(--color-text-secondary)",border:"none",borderBottom:activeTab===t.id?"2.5px solid #378ADD":"2.5px solid transparent",paddingRight:activeTab===t.id?"28px":undefined,transition:"color .15s,border-color .15s"}}>{t.label}</button>
          {activeTab===t.id&&<button onClick={()=>{if(window.confirm("\""+t.label+"\" löschen?"))deleteS(t.id);}} style={{position:"absolute",right:6,fontSize:11,color:"#ccc",background:"transparent",border:"none",cursor:"pointer",padding:0,lineHeight:1}}>×</button>}
        </div>)}
        <button onClick={()=>setAddStandortName("")} style={{fontSize:12,padding:"8px 10px",cursor:"pointer",borderRadius:5,background:"transparent",border:"none",color:"#aaa",marginLeft:2}}>+ Standort</button>
      </div>
      <div style={{width:1,background:"var(--color-border-tertiary)",margin:"8px 0"}}/>
      <div style={{display:"flex",gap:1,padding:"0 6px",alignItems:"center",background:"rgba(128,128,128,0.02)"}}>
        {rightTabs.map(t=><button key={t.id} onClick={()=>handleSetActive(t.id)} style={{fontSize:11,padding:"7px 12px",whiteSpace:"nowrap",cursor:"pointer",borderRadius:5,background:activeTab===t.id?"rgba(128,128,128,0.1)":"transparent",fontWeight:activeTab===t.id?500:400,color:activeTab===t.id?"var(--color-text-primary)":"#999",border:"none"}}>{t.label}</button>)}
      </div>
    </div>

    {/* Content */}
    <div style={{maxWidth:900,margin:"0 auto"}}>
      {standorte.map(st=>activeTab===st.id&&(<TabStandort key={st.id} apiUrl={apiUrl} demo={demo} standort={st} onNameChange={renameS} onHoeheChange={hoeheS} onCoordChange={coordS} onDelete={deleteS} zTypes={zTypes} beutenTypes={beutenAll} registerDirty={registerDirty}/>))}
      {activeTab==="zuchtbuch"&&<TabZuchtbuch standorte={standorte} apiUrl={apiUrl} demo={demo}/>}
      {activeTab==="einstellungen"&&<TabEinstellungen apiUrl={apiUrl} demo={demo} zargenAll={zargenAll} onZargenAll={setZargenAll} beutenAll={beutenAll} onBeutenAll={setBeutenAll} msgTemplates={msgTemplates} onMsgTemplates={t=>{setMsgTemplates(t);saveMsgTemplates(t);}} notifRules={notifRules} onNotifRules={r=>{setNotifRules(r);saveRules(r);}}/>}
    </div>

    {addStandortName!==null&&<Modal onClose={()=>setAddStandortName(null)} width="min(320px,95vw)">
      <p style={{fontWeight:500,margin:"0 0 10px"}}>Neuer Standort</p>
      <input autoFocus value={addStandortName} onChange={e=>setAddStandortName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addStandortName.trim()&&addS(addStandortName.trim())} placeholder="Name des Standorts" style={{width:"100%",fontSize:14,padding:"6px 10px",borderRadius:6,border:"1px solid #ddd",boxSizing:"border-box",marginBottom:10}}/>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={()=>setAddStandortName(null)} style={{padding:"5px 14px",cursor:"pointer",borderRadius:6}}>Abbrechen</button>
        <button onClick={()=>addStandortName.trim()&&addS(addStandortName.trim())} disabled={!addStandortName.trim()} style={{padding:"5px 14px",background:"#378ADD",color:"#fff",border:"none",borderRadius:6,cursor:"pointer"}}>Hinzufügen</button>
      </div>
    </Modal>}
  </div>);
}