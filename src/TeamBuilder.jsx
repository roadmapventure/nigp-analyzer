import { useState, useRef, useCallback, useEffect } from "react";
import PersonnelScreen from "./PersonnelScreen";

// ── Treasury Design Tokens ─────────────────────────────────────────────────────
const T = {
  paper:"#ebe5d5",paperDeep:"#ddd5be",card:"#f8f2e2",cardAlt:"#f2ead4",
  navy:"#12243c",navyDeep:"#0b1929",navyMid:"#1a2e4a",
  ink:"#28221a",muted:"#786d52",mutedDeep:"#58503a",
  line:"#c8bb9a",lineSoft:"#d8cbac",
  brass:"#b6873a",brassDeep:"#886224",brassLight:"#e4c786",
  moss:"#5a7538",mossLight:"#a6bc82",flag:"#a83319",
};
const display = '"Fraunces", Georgia, serif';
const body    = '"Inter", -apple-system, system-ui, sans-serif';
const mono    = '"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace';

// ── Agent definitions ──────────────────────────────────────────────────────────
const AGENTS = [
  { id:"chloe",   name:"Chloe Okafor",       role:"Junior Procurement Analyst",     code:"JR-01", hiredOn:"Feb 2025",
    trainer:"RMV",  arch:"LLM Prompt",         specialty:"Quick Analysis · Anything Obvious",
    salary:60000,   value:60000,  hourly:31, reportHrs:2, reportCost:63,
    docs:0, classes:0, chunks:0, skill:18, situational:10,
    trainable:false, trainableBy:"RMV", revenueModel:"Freemium · Included",
    quip:'"I spot the obvious stuff fast."', color:T.brass,
  },
  { id:"mike",    name:"Mike Alvarez",         role:"Senior Procurement Analyst",     code:"SR-02", hiredOn:"Jun 2023",
    trainer:"RMV",  arch:"LLM Deep Prompt",    specialty:"Industry Best-Practice Analysis",
    salary:90000,   value:90000,  hourly:47, reportHrs:3, reportCost:141,
    docs:0, classes:0, chunks:0, skill:42, situational:25,
    trainable:false, trainableBy:"RMV", revenueModel:"Teaser · 10% NIGP split",
    quip:'"Industry patterns are where I shine."', color:T.brass,
  },
  { id:"bob",     name:"Bob Whitfield",        role:"Professional Procurement Analyst", code:"PR-04", hiredOn:"May 2021",
    trainer:"Gov't", arch:"RAG",               specialty:"Legal & Internal Audits",
    salary:120000,  value:130000, hourly:68, reportHrs:5, reportCost:339,
    docs:50, classes:10, chunks:842, skill:71, situational:25,
    trainable:true,  trainableBy:"Gov't", revenueModel:"Offer · 20% consultant split",
    quip:'"Legally, where are we?"', color:T.moss,
  },
  { id:"christy", name:"Christy Park",         role:"Marketing Designer",             code:"MK-05", hiredOn:"Aug 2023",
    trainer:"RMV",  arch:"LLM Format",         specialty:"Formatting · Executive Presentation",
    salary:90000,   value:90000,  hourly:47, reportHrs:3, reportCost:141,
    docs:0, classes:0, chunks:0, skill:36, situational:5,
    trainable:false, trainableBy:"RMV", revenueModel:"Split · 50% RMV",
    quip:'"Make it look like a cover story."', color:T.brass,
  },
  { id:"robyn",   name:"Robyn Castellanos",    role:"NIGP Consultant",               code:"CN-03", hiredOn:"Jan 2016",
    trainer:"NIGP", arch:"RAG + Deep Prompt",  specialty:"NIGP Best-Practice · Strategy",
    salary:175000,  value:200000, hourly:104, reportHrs:5, reportCost:521,
    docs:100, classes:25, chunks:1685, skill:88, situational:35,
    trainable:true,  trainableBy:"NIGP", revenueModel:"Split · 50% NIGP · $260/rpt",
    quip:'"Next year\'s strategy, not last year\'s report."', color:T.brass,
  },
];

const AGENT_PRONOUNS = {
  chloe:   { subject:"she", object:"her", possessive:"her" },
  mike:    { subject:"he",  object:"him", possessive:"his" },
  bob:     { subject:"he",  object:"him", possessive:"his" },
  christy: { subject:"she", object:"her", possessive:"her" },
  robyn:   { subject:"she", object:"her", possessive:"her" },
};

const CATEGORIES    = ["Compliance","Jurisdiction","Best Practice","Internal","Standards","Methodology","Playbook","Template","Statute"];
const JURISDICTIONS = ["All","Federal","Texas","California","Florida","New York","Illinois"];
const FLAG_TRIGGERS = [
  { id:"maverick",      label:"Maverick Spend"   },
  { id:"po-split",      label:"PO Splitting"     },
  { id:"spike",         label:"Spend Spike"      },
  { id:"single-source", label:"Single Source"    },
  { id:"vendor-hhi",    label:"Vendor HHI"       },
  { id:"long-tail",     label:"Long-Tail"        },
];

const BEE_SCENARIOS = [
  { id:"maverick",      flag:"🔴", flagLabel:"Maverick Spend",
    title:"High Uncontracted IT Purchases",
    meta:"$2.1M outside master agreements · 847 txns · 23 vendors",
    amount:"$2,142,880 at risk",
    queryText:"High uncontracted technology spend $2.1M across 847 transactions with 23 vendors, no master agreements, maverick spend",
    jurisdiction:"Texas" },
  { id:"posplit",       flag:"🟠", flagLabel:"PO Splitting",
    title:"Suspicious Sub-Threshold Orders",
    meta:"14 POs same vendor · 30 days · Under $49,500",
    amount:"$674,200 structured",
    queryText:"14 purchase orders to same vendor in 30 days all under $49500 threshold, suspected bid splitting, Public Works",
    jurisdiction:"Texas" },
  { id:"concentration", flag:"🔴", flagLabel:"Vendor Concentration",
    title:"Single Vendor: 34% of Facilities",
    meta:"HHI: 3,240 · $18.7M of $55M budget",
    amount:"$18,720,000 single source",
    queryText:"Single vendor controls 34% of facilities spend HHI 3240 highly concentrated single source risk $18.7M",
    jurisdiction:"Texas" },
  { id:"spike",         flag:"🟡", flagLabel:"Spend Spike",
    title:"December Surge — Year End",
    meta:"340% above avg · $4.2M in final 3 weeks · 12 depts",
    amount:"$4,200,000 spike",
    queryText:"December spending surge 340% above monthly average $4.2M in final 3 weeks year-end spending rush 12 departments",
    jurisdiction:"Texas" },
  { id:"full",          flag:"🔵", flagLabel:"Combined Risk",
    title:"Full Austin 2025 Portfolio",
    meta:"$372M total · All 6 flags · 264 NIGP classes · 2,847 vendors",
    amount:"$372,988,798 total",
    queryText:"Full procurement portfolio $372M total spend 2847 vendors 264 NIGP classes all risk flags maverick PO splitting vendor concentration",
    jurisdiction:"Texas" },
];

const BASE_SYSTEM = "You are an AI procurement analyst. Analyze the spend data provided and generate an executive briefing identifying risks, compliance concerns, and recommended actions. Be specific and practical.";

// ── Helpers ────────────────────────────────────────────────────────────────────
function skillLabel(s){ return s<30?"Trainee":s<55?"Developing":s<75?"Proficient":s<90?"Expert":"Principal"; }
function fmt$  (n){ return "$"+Math.round(n).toLocaleString(); }
function priorityInfo(v){ if(v>=80) return{label:"Critical",color:T.flag}; if(v>=65) return{label:"High",color:T.brass}; if(v>=40) return{label:"Medium",color:T.navy}; return{label:"Low",color:T.muted}; }

function analyzeText(text){
  if(!text) return{words:0,statutes:0,dollarThresholds:0,orgRefs:0,actionCount:0};
  const words=(text.split(/\s+/).filter(Boolean)).length;
  const statutes=(text.match(/§\s*\d+|CFR\s+\d+|\bLGC\b|\bU\.S\.C\b/gi)||[]).length;
  const dollarThresholds=(text.match(/\$[\d,]+(?:\.\d+)?/gi)||[]).length;
  const orgRefs=(text.match(/\b(?:NIGP|NASPO|GAO|OMB|CFR|CPPO|FAR)\b/g)||[]).length;
  const actionCount=(text.match(/^\s*\d+\.|(?:Immediate|First|Second|Third|Action|Step|Recommend)/gmi)||[]).length;
  return{words,statutes,dollarThresholds,orgRefs,actionCount};
}
function computeDelta(beforeText,afterText){
  const b=analyzeText(beforeText); const a=analyzeText(afterText);
  return{wordDiff:a.words-b.words,statutesBefore:b.statutes,statutesAfter:a.statutes,dollarsBefore:b.dollarThresholds,dollarsAfter:a.dollarThresholds,orgsBefore:b.orgRefs,orgsAfter:a.orgRefs,actionsBefore:b.actionCount,actionsAfter:a.actionCount,beforeWords:b.words,afterWords:a.words};
}

// ── Prompt layer diff analysis ───────────────────────────────────────────────────
function computePromptDiff(r1, r2, agent1Name, agent2Name) {
  if (!r1 || !r2) return null;
  const p1 = r1.promptText || "";
  const p2 = r2.promptText || "";
  const d1 = r1.debugInfo || {};
  const d2 = r2.debugInfo || {};

  // Extract sections by header marker
  const getSection = (text, header) => {
    const marker = `=== ${header} ===`;
    const start = text.indexOf(marker);
    if (start === -1) return "";
    const end = text.indexOf("\n\n---\n\n", start);
    return (end === -1 ? text.slice(start) : text.slice(start, end)).replace(marker, "").trim();
  };

  const role1    = getSection(p1, "ROLE & IDENTITY");
  const role2    = getSection(p2, "ROLE & IDENTITY");
  const rag1     = getSection(p1, "BACKGROUND KNOWLEDGE");
  const rag2     = getSection(p2, "BACKGROUND KNOWLEDGE");
  const format1  = getSection(p1, "OUTPUT FORMAT");
  const format2  = getSection(p2, "OUTPUT FORMAT");
  const guard1   = getSection(p1, "CONSTRAINTS & GUARDRAILS");
  const guard2   = getSection(p2, "CONSTRAINTS & GUARDRAILS");

  const tokEst = (s) => Math.round(s.length / 4);
  const wordCount = (s) => s.split(/\s+/).filter(Boolean).length;
  const overlap = (a, b) => {
    if (!a || !b) return 0;
    const wa = new Set(a.toLowerCase().split(/\W+/).filter(w => w.length > 4));
    const wb = new Set(b.toLowerCase().split(/\W+/).filter(w => w.length > 4));
    const inter = [...wa].filter(w => wb.has(w)).length;
    const union = new Set([...wa, ...wb]).size;
    return union === 0 ? 100 : Math.round((inter / union) * 100);
  };

  return {
    agent1: agent1Name, agent2: agent2Name,
    total: { t1: tokEst(p1), t2: tokEst(p2) },
    layers: [
      {
        label: "01 · Role & Behavior",
        name1: d1.role_name || "—", name2: d2.role_name || "—",
        text1: role1, text2: role2,
        tok1: tokEst(role1), tok2: tokEst(role2),
        words1: wordCount(role1), words2: wordCount(role2),
        overlap: overlap(role1, role2),
        same: role1 === role2,
        key: "role",
      },
      {
        label: "02 · Background (RAG)",
        name1: d1.rag_retrieved ? "Retrieved" : "None", name2: d2.rag_retrieved ? "Retrieved" : "None",
        text1: rag1, text2: rag2,
        tok1: tokEst(rag1), tok2: tokEst(rag2),
        words1: wordCount(rag1), words2: wordCount(rag2),
        overlap: overlap(rag1, rag2),
        same: rag1 === rag2,
        key: "rag",
      },
      {
        label: "03 · Analysis Payload",
        name1: "Same data payload", name2: "Same data payload",
        text1: "", text2: "",
        tok1: 0, tok2: 0,
        words1: 0, words2: 0,
        overlap: 100,
        same: true,
        key: "payload",
      },
      {
        label: "04 · Output Format",
        name1: d1.format_name || "—", name2: d2.format_name || "—",
        text1: format1, text2: format2,
        tok1: tokEst(format1), tok2: tokEst(format2),
        words1: wordCount(format1), words2: wordCount(format2),
        overlap: overlap(format1, format2),
        same: format1 === format2,
        key: "format",
      },
      {
        label: "05 · Guardrails",
        name1: d1.guardrail_name || "—", name2: d2.guardrail_name || "—",
        text1: guard1, text2: guard2,
        tok1: tokEst(guard1), tok2: tokEst(guard2),
        words1: wordCount(guard1), words2: wordCount(guard2),
        overlap: overlap(guard1, guard2),
        same: guard1 === guard2,
        key: "guardrail",
      },
    ],
  };
}

// ── PDF/DOCX extraction via api/extract ────────────────────────────────────────
async function extractTextFromFile(file){
  return new Promise((resolve)=>{
    const reader=new FileReader();
    reader.onload=async(e)=>{
      try{
        const bytes=new Uint8Array(e.target.result);
        let binary="";
        for(let i=0;i<bytes.length;i++) binary+=String.fromCharCode(bytes[i]);
        const base64=btoa(binary);
        const res=await fetch("/api/extract",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fileData:base64,fileType:file.type,fileName:file.name})});
        const data=await res.json();
        if(!res.ok){resolve({text:"",wordCount:0,error:data.error||"Extraction failed"});return;}
        resolve({text:data.text,wordCount:data.wordCount,preview:data.preview});
      }catch(err){resolve({text:"",wordCount:0,error:err.message});}
    };
    reader.onerror=()=>resolve({text:"",wordCount:0,error:"File read failed"});
    reader.readAsArrayBuffer(file);
  });
}

// ── AI metadata generation via api/brief ──────────────────────────────────────
async function generateMetadata(filename,extractedText){
  const snippet=extractedText.slice(0,3000);
  try{
    const res=await fetch("/api/brief",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      system:"You are a procurement document classifier. Return ONLY valid JSON — no markdown fences, no explanation, no preamble.",
      messages:[{role:"user",content:`Analyze this government procurement document and return ONLY a JSON object:\n{"title":"Clean readable title","category":"one of: Compliance, Jurisdiction, Best Practice, Internal, Standards, Methodology, Playbook, Template, Statute","jurisdiction":"one of: All, Federal, Texas, California, Florida, New York, Illinois","priority":<0-100>,"triggers":<array from: ["maverick","po-split","spike","single-source","vendor-hhi","long-tail"] or ["all"]>}\n\nFilename: ${filename}\n\nText:\n${snippet}`}]
    })});
    if(!res.ok) return null;
    const data=await res.json();
    const raw=data.content?.[0]?.text||"";
    const clean=raw.replace(/^```json\s*/i,"").replace(/```\s*$/,"").trim();
    const parsed=JSON.parse(clean);
    if(parsed.triggers&&!Array.isArray(parsed.triggers)) parsed.triggers=[];
    return parsed;
  }catch{return null;}
}

// ── Shared UI components ───────────────────────────────────────────────────────
function Corners(){
  return(<>
    <svg width="10" height="10" style={{position:"absolute",top:4,left:4,color:T.brass}} viewBox="0 0 10 10" fill="currentColor"><path d="M0 0h4v1H1v3H0V0z"/></svg>
    <svg width="10" height="10" style={{position:"absolute",top:4,right:4,color:T.brass}} viewBox="0 0 10 10" fill="currentColor"><path d="M10 0H6v1h3v3h1V0z"/></svg>
    <svg width="10" height="10" style={{position:"absolute",bottom:4,left:4,color:T.brass}} viewBox="0 0 10 10" fill="currentColor"><path d="M0 10h4v-1H1V6H0v4z"/></svg>
    <svg width="10" height="10" style={{position:"absolute",bottom:4,right:4,color:T.brass}} viewBox="0 0 10 10" fill="currentColor"><path d="M10 10H6v-1h3V6h1v4z"/></svg>
  </>);
}

function AgentAvatar({who,size=68,ring=true}){
  const cfg={
    chloe: {skin:"#e8c9a8",hair:"#6b3a1e",collar:"#f0e6d2",extra:"freckles",border:T.brass},
    mike:  {skin:"#d4a378",hair:"#3a3a3a",collar:"#24364f",extra:"glasses",border:T.brass},
    bob:   {skin:"#e5c19a",hair:"#5a4a3a",collar:"#2a3a52",extra:"tie",    border:T.moss},
    christy:{skin:"#dba77d",hair:"#2a1a1a",collar:T.brass,  extra:"bob",   border:T.brass},
    robyn: {skin:"#c48b62",hair:"#8a3418",collar:"#5a2f3d",extra:"bun",    border:T.brass},
  };
  const c=cfg[who]||cfg.chloe;
  const uid=`av-${who}-${Math.random().toString(36).slice(2,7)}`;
  return(
    <svg width={size} height={size} viewBox="0 0 72 72" style={{display:"block",flexShrink:0}}>
      <defs><clipPath id={`clip-${uid}`}><circle cx="36" cy="36" r="34"/></clipPath></defs>
      <circle cx="36" cy="36" r="35" fill={T.card} stroke={ring?c.border:"none"} strokeWidth={ring?1.5:0}/>
      <g clipPath={`url(#clip-${uid})`}>
        <rect x="0" y="0" width="72" height="72" fill="#ede6d5"/>
        <rect x="0" y="40" width="72" height="32" fill={T.card}/>
        <path d="M 6 72 Q 12 54 36 54 Q 60 54 66 72 Z" fill={c.collar}/>
        <rect x="31" y="48" width="10" height="8" rx="2" fill={c.skin}/>
        {c.extra==="bun"&&<circle cx="48" cy="22" r="6" fill={c.hair}/>}
        <path d="M 16 34 Q 14 18 36 15 Q 58 18 56 34 Q 56 22 36 22 Q 16 22 16 34 Z" fill={c.hair}/>
        <ellipse cx="36" cy="36" rx="14" ry="16" fill={c.skin}/>
        {c.extra==="bob"&&<path d="M 20 30 Q 20 18 36 16 Q 54 18 52 34 L 52 28 Q 46 22 36 22 Q 26 22 22 30 Z" fill={c.hair}/>}
        {c.extra==="freckles"&&<path d="M 22 26 Q 24 18 36 16 Q 48 18 50 30 Q 44 22 36 22 Q 28 22 22 28 Z" fill={c.hair}/>}
        {c.extra==="tie"&&<path d="M 22 30 Q 22 20 36 18 Q 48 20 50 28 Q 44 22 36 22 Q 28 22 24 28 Q 22 29 22 30 Z" fill={c.hair}/>}
        {c.extra==="glasses"&&<path d="M 22 30 Q 24 20 36 18 Q 50 20 50 30 Q 44 24 36 24 Q 28 24 22 30 Z" fill={c.hair}/>}
        <circle cx="30" cy="35" r="1.2" fill={T.navy}/>
        <circle cx="42" cy="35" r="1.2" fill={T.navy}/>
        {c.extra==="glasses"&&<g fill="none" stroke={T.navy} strokeWidth="1.2"><circle cx="30" cy="35" r="4"/><circle cx="42" cy="35" r="4"/><line x1="34" y1="35" x2="38" y2="35"/></g>}
        {c.extra==="freckles"&&<g fill={c.hair} opacity="0.45"><circle cx="28" cy="38" r="0.5"/><circle cx="31" cy="39" r="0.5"/><circle cx="41" cy="39" r="0.5"/><circle cx="44" cy="38" r="0.5"/></g>}
        <ellipse cx="28" cy="40" rx="2" ry="1" fill="#c47a5a" opacity="0.22"/>
        <ellipse cx="44" cy="40" rx="2" ry="1" fill="#c47a5a" opacity="0.22"/>
        <path d="M 32 43 Q 36 46 40 43" fill="none" stroke={T.navy} strokeWidth="1.1" strokeLinecap="round"/>
        {c.extra==="tie"&&<><path d="M 34 54 L 38 54 L 40 72 L 32 72 Z" fill={T.brass}/><path d="M 34 54 L 36 58 L 38 54 Z" fill={T.navy}/></>}
        {(c.extra==="bob"||c.extra==="bun"||c.extra==="glasses")&&<path d="M 26 58 L 36 64 L 46 58" fill="none" stroke={c.border} strokeWidth="1.5" opacity="0.7"/>}
      </g>
      {ring&&<circle cx="36" cy="36" r="34.5" fill="none" stroke={c.border} strokeWidth="0.5" strokeDasharray="0.5 2" opacity="0.5"/>}
    </svg>
  );
}

function SkillBar({skill,color=T.brass,size=6}){
  return(
    <div>
      <div style={{height:size,background:T.paperDeep,border:`1px solid ${T.lineSoft}`,position:"relative"}}>
        <div style={{position:"absolute",inset:0,right:`${100-skill}%`,background:`linear-gradient(90deg,${color},${color==="moss"?T.moss:T.brassDeep})`}}/>
        {[30,55,75,90].map(t=><div key={t} style={{position:"absolute",top:-2,bottom:-2,left:`${t}%`,width:1,background:T.line}}/>)}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontFamily:mono,fontSize:8,color:T.muted,marginTop:3}}>
        <span>Trainee</span><span>Developing</span><span>Proficient</span><span>Expert</span><span>Principal</span>
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function Toast({toast}){
  if(!toast) return null;
  return(
    <div style={{position:"fixed",bottom:22,right:22,background:T.navy,border:`1px solid ${T.brass}`,padding:"10px 16px",fontSize:12,color:T.card,fontFamily:mono,boxShadow:"0 8px 28px rgba(0,0,0,0.3)",zIndex:9999,display:"flex",alignItems:"center",gap:8,animation:"slideUp 0.2s ease"}}>
      <span>{toast.icon}</span><span>{toast.msg}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 1: ROSTER
// ══════════════════════════════════════════════════════════════════════════════
function RosterScreen({onViewFile,onAddTraining,onTestTeam,showToast}){
  const [openCards,setOpenCards]=useState({});
  const toggle=id=>setOpenCards(s=>({...s,[id]:!s[id]}));

  return(
    <div style={{flex:1,overflowY:"auto",padding:"24px 28px 48px",background:T.paperDeep}}>

      {/* Masthead */}
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",paddingBottom:14}}>
        <div>
          <div style={{fontFamily:display,fontSize:30,fontWeight:500,color:T.navy,letterSpacing:"-.5px",lineHeight:1,marginBottom:6}}>Build your analyst team.</div>
          <div style={{fontFamily:body,fontStyle:"italic",fontSize:13,color:T.mutedDeep,maxWidth:580,lineHeight:1.5}}>Each analyst is a trainable AI agent with their own specialty, knowledge base, and price per report. The more you feed them, the sharper they get.</div>
        </div>
        <button onClick={onTestTeam} style={{background:T.navyMid,border:`1px solid ${T.brass}`,color:T.brassLight,padding:"10px 20px",fontFamily:body,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8,flexShrink:0,whiteSpace:"nowrap"}}>
          <span style={{fontSize:14}}>🐝</span> Test My Team
        </button>
      </div>
      <div style={{height:2,background:T.brass,marginBottom:20}}/>

      {/* Bench stats */}
      <div style={{background:T.navy,padding:"10px 20px",marginBottom:20,display:"flex",alignItems:"center",gap:28,borderBottom:`3px solid ${T.brass}`}}>
        {[["Bench Size","5",T.card],["Annual Salary","$535k",T.brassLight],["Annual Value","$570k",T.mossLight],["Reports / Mo","54",T.card],["Trainable Agents","2",T.brassLight]].map(([k,v,c])=>(
          <div key={k}>
            <div style={{fontFamily:mono,fontSize:8,color:"#8fa3bf",textTransform:"uppercase",letterSpacing:1.3,marginBottom:2}}>{k}</div>
            <div style={{fontFamily:display,fontSize:18,fontWeight:600,color:c,fontVariantNumeric:"tabular-nums"}}>{v}</div>
          </div>
        ))}
        <div style={{flex:1}}/>
        <div style={{fontFamily:body,fontSize:11,color:"#8fa3bf",fontStyle:"italic"}}>Gov't Admin · Austin TX</div>
      </div>

      {/* Agent grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
        {AGENTS.map(a=>{
          const isOpen=!!openCards[a.id];
          const borderColor=a.trainable?(a.color===T.moss?T.moss:T.brass):T.line;
          const boxShadow=a.trainable?`0 0 0 2.5px ${borderColor}`:"none";
          return(
            <div key={a.id} style={{background:T.card,border:`1px solid ${T.line}`,position:"relative",display:"flex",flexDirection:"column",boxShadow,cursor:"pointer"}} onClick={()=>onViewFile(a)}>
              <Corners/>
              {/* Badge header */}
              <div style={{padding:"15px 16px 12px",display:"flex",gap:12,alignItems:"flex-start",borderBottom:`1px dashed ${T.line}`}}>
                <AgentAvatar who={a.id} size={68} ring={true}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,letterSpacing:1.2,fontWeight:600,marginBottom:2}}>{a.code} · EST. {a.hiredOn.toUpperCase()}</div>
                  <div style={{fontFamily:display,fontSize:18,fontWeight:600,color:T.navy,letterSpacing:"-.2px",lineHeight:1.1,marginBottom:3}}>{a.name}</div>
                  <div style={{fontFamily:body,fontSize:11,color:T.mutedDeep,fontStyle:"italic",marginBottom:7}}>{a.role}</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    <span style={{fontFamily:mono,fontSize:9,padding:"1px 7px",background:a.trainable?`${borderColor}18`:`${T.muted}12`,color:a.trainable?borderColor:T.mutedDeep,border:`1px solid ${a.trainable?borderColor:T.line}`,letterSpacing:.4}}>
                      {a.trainable?`● YOUR TRAINEE`:`◐ ${a.trainableBy.toUpperCase()} MANAGED`}
                    </span>
                    <span style={{fontFamily:mono,fontSize:9,padding:"1px 7px",background:`${T.brass}10`,color:T.brassDeep,border:`1px solid ${T.brass}35`,letterSpacing:.4}}>{a.arch}</span>
                  </div>
                </div>
              </div>
              {/* Specialty */}
              <div style={{padding:"10px 16px 11px",borderBottom:`1px solid ${T.lineSoft}`}}>
                <div style={{fontFamily:body,fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:1.4,fontWeight:600,marginBottom:2}}>Specialty</div>
                <div style={{fontFamily:body,fontSize:12,color:T.ink,marginBottom:4}}>{a.specialty}</div>
                <div style={{fontFamily:display,fontStyle:"italic",fontSize:12,color:T.mutedDeep}}>{a.quip}</div>
              </div>
              {/* Skill bar */}
              <div style={{padding:"11px 16px",borderBottom:`1px solid ${T.lineSoft}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
                  <div style={{fontFamily:body,fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:1.4,fontWeight:600}}>Skill Level</div>
                  <div style={{fontFamily:mono,fontSize:10,color:a.color===T.moss?T.moss:T.brassDeep,fontWeight:600}}>{skillLabel(a.skill)} · {a.skill}/100</div>
                </div>
                <SkillBar skill={a.skill} color={a.color===T.moss?T.moss:T.brass}/>
              </div>
              {/* Awareness */}
              <div style={{padding:"10px 16px",borderBottom:`1px solid ${T.lineSoft}`,background:T.cardAlt}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
                  <div style={{fontFamily:body,fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:1.4,fontWeight:600}}>Situational Awareness</div>
                  <div style={{fontFamily:mono,fontSize:11,fontWeight:700,color:a.situational>=30?T.brass:T.muted}}>{a.situational}%</div>
                </div>
                <div style={{height:7,background:T.paperDeep,border:`1px solid ${T.lineSoft}`,position:"relative",borderRadius:1}}>
                  <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${a.situational}%`,background:a.situational>=30?T.brass:T.muted,borderRadius:1}}/>
                </div>
              </div>
              {/* Drawer toggle */}
              <button onClick={e=>{e.stopPropagation();toggle(a.id);}} style={{width:"100%",padding:"8px 16px",background:T.cardAlt,border:"none",borderBottom:`1px solid ${T.lineSoft}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",fontFamily:body,fontSize:10.5,color:T.brassDeep,letterSpacing:1.2,textTransform:"uppercase",fontWeight:700}}>
                <span>{isOpen?"Hide Details":"Show Details"}</span>
                <span style={{width:22,height:22,borderRadius:"50%",border:`1.5px solid ${T.brass}`,background:T.card,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:T.brassDeep,transition:"transform .2s",transform:isOpen?"rotate(180deg)":"none"}}>▾</span>
              </button>
              {/* Drawer content */}
              {isOpen&&<>
                {/* Cost */}
                <div style={{padding:"10px 16px",borderBottom:`1px solid ${T.lineSoft}`}} onClick={e=>e.stopPropagation()}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontFamily:body,fontSize:9.5,color:T.muted}}>Cost per AI Strategy Report</span>
                    <span style={{fontFamily:mono,fontSize:12,color:a.reportCost===63?T.moss:T.brassDeep,fontWeight:700}}>{a.reportCost===63?"Free":fmt$(a.reportCost)}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontFamily:body,fontSize:9.5,color:T.muted}}>Revenue model</span>
                    <span style={{fontFamily:body,fontSize:10.5,color:T.mutedDeep}}>{a.revenueModel}</span>
                  </div>
                </div>
                {/* Stats */}
                <div style={{padding:"10px 16px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,borderBottom:`1px solid ${T.lineSoft}`}} onClick={e=>e.stopPropagation()}>
                  {[["Documents",a.docs],["Class Hrs",a.classes],["Chunks",a.chunks]].map(([k,v])=>(
                    <div key={k}>
                      <div style={{fontFamily:body,fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:1.2,fontWeight:600}}>{k}</div>
                      <div style={{fontFamily:display,fontSize:17,fontWeight:600,color:v===0?T.muted:T.navy,fontVariantNumeric:"tabular-nums",marginTop:1}}>{v===0?"—":v.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
                {/* P&L */}
                <div style={{padding:"10px 16px 12px",background:`linear-gradient(180deg,${T.navy},${T.navyDeep})`,color:T.card}} onClick={e=>e.stopPropagation()}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                    <div><div style={{fontFamily:body,fontSize:8.5,color:T.brassLight,textTransform:"uppercase",letterSpacing:1.3,fontWeight:600}}>Salary Equiv.</div><div style={{fontFamily:display,fontSize:17,fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{fmt$(a.salary)}</div></div>
                    <div style={{textAlign:"right"}}><div style={{fontFamily:body,fontSize:8.5,color:T.brassLight,textTransform:"uppercase",letterSpacing:1.3,fontWeight:600}}>Yearly Value</div><div style={{fontFamily:display,fontSize:17,fontWeight:600,color:T.mossLight,fontVariantNumeric:"tabular-nums"}}>{fmt$(a.value)}</div></div>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:6,paddingTop:6,borderTop:`1px solid ${T.card}20`,fontFamily:mono,fontSize:9.5,color:"#b8c5d8"}}>
                    <span>${a.hourly}/hr</span><span>{a.reportHrs}h / report</span><span>{fmt$(a.reportCost)} per report</span>
                  </div>
                </div>
              </>}
              {/* Action row */}
              <div style={{display:"flex",borderTop:`1px solid ${T.line}`}} onClick={e=>e.stopPropagation()}>
                <button onClick={()=>onViewFile(a)} style={{flex:1,padding:10,fontFamily:body,fontSize:11.5,fontWeight:500,background:"transparent",border:"none",borderRight:`1px solid ${T.line}`,color:T.mutedDeep,cursor:"pointer"}}>View File →</button>
                {a.trainable
                  ?<button onClick={()=>onAddTraining(a)} style={{flex:1,padding:10,fontFamily:body,fontSize:11.5,fontWeight:700,background:a.color===T.moss?T.moss:T.brass,color:a.color===T.moss?"#fff":T.navy,border:"none",cursor:"pointer"}}>+ Add Training</button>
                  :<button style={{flex:1,padding:10,fontFamily:body,fontSize:11.5,background:"transparent",border:"none",color:T.muted,cursor:"not-allowed"}}>🔒 {a.trainableBy} Only</button>
                }
              </div>
            </div>
          );
        })}

        {/* Vacancy */}
        <div style={{background:`repeating-linear-gradient(45deg,${T.paperDeep},${T.paperDeep} 6px,${T.paper} 6px,${T.paper} 12px)`,border:`1.5px dashed ${T.muted}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:30,minHeight:460}}>
          <div style={{width:64,height:64,borderRadius:"50%",background:T.paper,border:`1.5px dashed ${T.muted}`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>
            <span style={{fontFamily:display,fontSize:26,color:T.muted}}>+</span>
          </div>
          <div style={{fontFamily:mono,fontSize:10,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.3,fontWeight:600,marginBottom:6}}>Vacancy · Position 06</div>
          <div style={{fontFamily:display,fontSize:17,fontWeight:600,color:T.navy,textAlign:"center",marginBottom:5}}>Forecast Analyst</div>
          <div style={{fontFamily:body,fontSize:11.5,color:T.mutedDeep,textAlign:"center",fontStyle:"italic",lineHeight:1.5,maxWidth:200,marginBottom:14}}>Predictive spend modeling. Coming Q3 with agent workflows.</div>
          <div style={{padding:"3px 10px",background:`${T.brass}20`,border:`1px solid ${T.brass}60`,fontFamily:mono,fontSize:9.5,color:T.brassDeep,letterSpacing:1.2,textTransform:"uppercase",fontWeight:700}}>On Roadmap</div>
        </div>
      </div>

      {/* Workflows strip */}
      <div style={{marginTop:20,padding:"13px 20px",background:T.card,border:`1px solid ${T.line}`,display:"flex",alignItems:"center",gap:22}}>
        <div>
          <div style={{fontFamily:mono,fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:1.3,fontWeight:600,marginBottom:2}}>Coming Q3 2026</div>
          <div style={{fontFamily:display,fontSize:14,fontWeight:600,color:T.navy}}>Agent Workflows</div>
        </div>
        <div style={{fontFamily:body,fontSize:12,color:T.mutedDeep,lineHeight:1.5,fontStyle:"italic",flex:1}}>In Q3, each analyst will take on multi-step autonomous tasks. Chloe screens raw data. Mike benchmarks against peers. Robyn drafts strategy. Bob runs legal checks. Christy binds it into a deliverable.</div>
        <div style={{display:"flex",gap:6}}>
          {["Retrieve","Analyze","Draft","Review","Format"].map(w=>(
            <span key={w} style={{fontFamily:mono,fontSize:9.5,padding:"3px 10px",background:T.paperDeep,color:T.muted,border:`1px dashed ${T.line}`,letterSpacing:.5,textTransform:"uppercase"}}>{w}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 2: PERSONNEL FILE
// PersonnelScreen is now imported from ./PersonnelScreen.jsx
// See src/PersonnelScreen.jsx for the full tabbed implementation.
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 3: TEACH AGENT
// ══════════════════════════════════════════════════════════════════════════════
function TeachScreen({agent,existingEntry,onBack,onSaved,showToast}){
  const isEditing=!!existingEntry;
  const [uploadState,setUploadState]=useState(isEditing?"ready":"idle");
  const [uploadProgress,setUploadProgress]=useState(isEditing?100:0);
  const [uploadedFile,setUploadedFile]=useState(null);
  const [extractedText,setExtractedText]=useState(existingEntry?.content||"");
  const [wordCount,setWordCount]=useState(existingEntry?.content?existingEntry.content.split(/\s+/).length:0);
  const [extractedOpen,setExtractedOpen]=useState(false);
  const [isSaving,setIsSaving]=useState(false);
  const [form,setForm]=useState(existingEntry?{
    id:existingEntry.id,title:existingEntry.title||"",category:existingEntry.category||"Standards",
    jurisdiction:existingEntry.jurisdiction||"All",priority:existingEntry.priority??50,
    triggers:existingEntry.triggers||[],status:existingEntry.status||"active",
    teaching_note:existingEntry.teaching_note||"",
  }:{title:"",category:"Standards",jurisdiction:"All",priority:50,triggers:[],status:"active",teaching_note:""});
  const fileRef=useRef(null);
  const pInfo=priorityInfo(form.priority);
  const locked=uploadState!=="ready";

  const handleFile=async(file)=>{
    if(!file) return;
    setUploadState("uploading");setUploadProgress(0);setUploadedFile(file);
    let prog=0;
    const ticker=setInterval(()=>{prog+=Math.random()*18+8;if(prog>=90){clearInterval(ticker);prog=90;}setUploadProgress(Math.min(90,prog));},180);
    const result=await extractTextFromFile(file);
    clearInterval(ticker);setUploadProgress(100);
    if(result.error||!result.text){setUploadState("idle");showToast(result.error||"Could not extract text","⚠");return;}
    setExtractedText(result.text);setWordCount(result.wordCount);
    await new Promise(r=>setTimeout(r,400));
    setUploadState("ready");
    showToast("✨ Claude is analyzing your document…","✨");
    const meta=await generateMetadata(file.name,result.text);
    if(meta){
      setForm(f=>({...f,title:meta.title||f.title,category:meta.category||f.category,jurisdiction:meta.jurisdiction||f.jurisdiction,priority:meta.priority??f.priority,triggers:Array.isArray(meta.triggers)?meta.triggers:f.triggers}));
      showToast("Metadata generated — review before saving");
    }else{showToast("Could not auto-generate metadata — fill in manually","⚠");}
  };

  const toggleTrigger=(id)=>{
    if(id==="all"){setForm(f=>({...f,triggers:f.triggers.includes("all")?[]:["all"]}));return;}
    setForm(f=>{const base=f.triggers.filter(t=>t!=="all");return{...f,triggers:base.includes(id)?base.filter(t=>t!==id):[...base,id]};});
  };

  const handleSave=async()=>{
    if(!form.title||!extractedText){showToast("Title and document text are required","⚠");return;}
    setIsSaving(true);
    try{
      const res=await fetch("/api/ingest",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,content:extractedText,tenant_id:"global",agent_id:agent.id,teaching_note:form.teaching_note||null})});
      const data=await res.json();
      if(!res.ok){showToast(data.error||"Save failed","⚠");setIsSaving(false);return;}
      showToast(isEditing?"Entry updated ✦":"Document indexed ✦");
      onSaved({...form,id:data.entry?.id||form.id||`e-${Date.now()}`,source:`Added ${new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})}`,content:extractedText,agent_id:agent.id});
    }catch(err){showToast("Network error: "+err.message,"⚠");}
    setIsSaving(false);
  };

  return(
    <div style={{flex:1,overflowY:"auto",padding:"24px 28px 60px",background:T.paperDeep}}>
      {/* Title */}
      <div style={{fontFamily:mono,fontSize:9.5,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.8,fontWeight:600,marginBottom:4}}>Training Session · {isEditing?"Edit Document":"Add Training"}</div>
      <div style={{fontFamily:display,fontSize:28,fontWeight:500,color:T.navy,letterSpacing:"-.5px",marginBottom:5}}>You're teaching {agent.name.split(" ")[0]}.</div>
      <div style={{fontFamily:body,fontStyle:"italic",fontSize:13,color:T.mutedDeep,marginBottom:16}}>Upload a document, tell {(AGENT_PRONOUNS[agent.id]||{object:"them"}).object} how to weight it, and mark which flags it helps trigger.</div>
      <div style={{display:"flex",justifyContent:"flex-start",marginBottom:14}}>
        <button onClick={onBack} style={{background:"transparent",border:`1px solid ${T.line}`,color:T.mutedDeep,padding:"7px 18px",fontFamily:body,fontSize:13,cursor:"pointer"}}>← Cancel</button>
      </div>
      <div style={{height:2,background:T.brass,marginBottom:20}}/>

      {/* Agent identity strip */}
      <div style={{background:`linear-gradient(135deg,${T.navy},${T.navyMid})`,padding:"14px 20px",marginBottom:20,display:"flex",alignItems:"center",gap:18,borderBottom:`2px solid ${T.brass}`}}>
        <AgentAvatar who={agent.id} size={52} ring={true}/>
        <div style={{marginRight:24}}>
          <div style={{fontFamily:mono,fontSize:9,color:"#8fa3bf",letterSpacing:1.2,marginBottom:2}}>{agent.code} · {agent.role.toUpperCase()}</div>
          <div style={{fontFamily:display,fontSize:17,fontWeight:600,color:T.card,lineHeight:1.1}}>{agent.name}</div>
          <div style={{fontFamily:mono,fontSize:10.5,color:"#b8c5d8",marginTop:3}}>Currently <span style={{color:T.brassLight,fontWeight:600}}>{skillLabel(agent.skill)} · {agent.skill}/100</span></div>
        </div>
        <div style={{display:"flex",gap:0}}>
          {[["Documents",agent.docs],["Class Hours",agent.classes],["Chunks",agent.chunks.toLocaleString()],["Tokens",agent.chunks>0?`${(agent.chunks*0.74).toFixed(1)}k`:"0"],["Skill",`${agent.skill}/100`]].map(([k,v],i)=>(
            <div key={k} style={{padding:"0 16px",borderRight:i<4?`1px solid rgba(255,255,255,.12)`:"none"}}>
              <div style={{fontFamily:mono,fontSize:8,color:"#8fa3bf",textTransform:"uppercase",letterSpacing:1.3,marginBottom:2}}>{k}</div>
              <div style={{fontFamily:display,fontSize:k==="Skill"?20:18,fontWeight:600,color:k==="Skill"?T.brassLight:T.card,fontVariantNumeric:"tabular-nums"}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:20,alignItems:"start"}}>
        {/* LEFT: Form */}
        <div>
          {/* Exhibit A: File upload */}
          <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"16px 20px",marginBottom:14,position:"relative"}}>
            <Corners/>
            <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.8,fontWeight:600,marginBottom:12}}>Exhibit A · Course Material</div>
            {uploadState==="idle"&&!isEditing&&(
              <div onClick={()=>fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}}
                style={{border:`2px dashed ${T.brass}55`,padding:"32px",textAlign:"center",cursor:"pointer",background:T.cardAlt,transition:"all .2s"}}
                onMouseEnter={e=>e.currentTarget.style.background=`rgba(182,135,58,0.08)`}
                onMouseLeave={e=>e.currentTarget.style.background=T.cardAlt}>
                <div style={{fontSize:28,marginBottom:8}}>📄</div>
                <div style={{fontFamily:display,fontSize:15,fontWeight:600,color:T.navy,marginBottom:4}}>Drop a document here</div>
                <div style={{fontFamily:body,fontSize:12,color:T.muted,marginBottom:14}}>PDF, DOCX, TXT · Max 20MB</div>
                <div style={{display:"inline-block",background:T.brass,color:T.navy,padding:"8px 20px",fontFamily:body,fontSize:12,fontWeight:700,cursor:"pointer"}}>↑ Browse File</div>
                <input ref={fileRef} type="file" accept=".pdf,.txt,.docx" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
              </div>
            )}
            {uploadState==="uploading"&&(
              <div style={{border:`1px solid ${T.brass}40`,padding:"24px",textAlign:"center",background:T.cardAlt}}>
                <div style={{fontFamily:display,fontSize:15,fontWeight:600,color:T.navy,marginBottom:12}}>Extracting document text…</div>
                <div style={{fontFamily:mono,fontSize:11,color:T.muted,marginBottom:10}}>{uploadedFile?.name}</div>
                <div style={{background:T.paperDeep,height:4,width:"100%",maxWidth:320,margin:"0 auto 8px",overflow:"hidden"}}>
                  <div style={{height:"100%",background:T.brass,width:`${uploadProgress}%`,transition:"width .2s"}}/>
                </div>
                <div style={{fontFamily:mono,fontSize:11,color:T.brassDeep}}>{Math.round(uploadProgress)}% complete</div>
              </div>
            )}
            {uploadState==="ready"&&(
              <div style={{border:`1px solid ${T.moss}50`,padding:"12px 14px",background:`${T.moss}05`,display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:44,height:52,background:T.flag,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <div style={{fontFamily:mono,fontSize:9,color:T.card,fontWeight:700}}>PDF</div>
                  <div style={{fontFamily:mono,fontSize:8,color:`${T.card}80`,marginTop:2}}>{uploadedFile?`${(uploadedFile.size/1e6).toFixed(1)}MB`:isEditing?"saved":""}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:display,fontSize:14,fontWeight:600,color:T.navy}}>{isEditing?existingEntry.title:uploadedFile?.name}</div>
                  <div style={{fontFamily:body,fontSize:11.5,color:T.moss,marginTop:2}}>{isEditing?`✎ Editing · ${wordCount.toLocaleString()} words`:`✓ ${wordCount.toLocaleString()} words extracted`}</div>
                </div>
                {!isEditing&&<button onClick={()=>{setUploadState("idle");setUploadedFile(null);setExtractedText("");}} style={{fontFamily:body,fontSize:11.5,color:T.brassDeep,background:"transparent",border:`1px solid ${T.line}`,padding:"5px 12px",cursor:"pointer"}}>✎ Replace</button>}
              </div>
            )}
          </div>

          {/* Exhibit B: Weighting form */}
          <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"16px 20px",position:"relative",opacity:locked?.38:1,pointerEvents:locked?"none":"auto",transition:"opacity .3s"}}>
            <Corners/>
            <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.8,fontWeight:600,marginBottom:16}}>Exhibit B · How {agent.name.split(" ")[0]} Should Weight This</div>

            {/* Title */}
            <div style={{marginBottom:14}}>
              <label style={{fontFamily:body,fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:1.3,fontWeight:600,marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
                Document Title
                {!locked&&!isEditing&&<span style={{fontFamily:mono,fontSize:8,background:`rgba(155,110,243,0.12)`,border:`1px solid rgba(155,110,243,0.3)`,padding:"1px 5px",color:"#9b6ef3"}}>AI SUGGESTED</span>}
              </label>
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Document title…" style={{width:"100%",padding:"9px 12px",fontFamily:body,fontSize:13,color:T.ink,background:T.cardAlt,border:`1px solid ${form.title?T.brass:T.line}`,outline:"none"}}/>
            </div>

            {/* Category + Jurisdiction */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              {[{key:"category",label:"Category",options:CATEGORIES},{key:"jurisdiction",label:"Jurisdiction",options:JURISDICTIONS}].map(({key,label,options})=>(
                <div key={key}>
                  <label style={{fontFamily:body,fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:1.3,fontWeight:600,marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
                    {label}
                    {!locked&&!isEditing&&<span style={{fontFamily:mono,fontSize:8,background:`rgba(155,110,243,0.12)`,border:`1px solid rgba(155,110,243,0.3)`,padding:"1px 5px",color:"#9b6ef3"}}>AI</span>}
                  </label>
                  <select value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={{width:"100%",padding:"9px 12px",fontFamily:body,fontSize:13,color:T.ink,background:T.cardAlt,border:`1px solid ${T.line}`,outline:"none",cursor:"pointer",appearance:"none"}}>
                    {options.map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {/* Priority */}
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
                <label style={{fontFamily:body,fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:1.3,fontWeight:600}}>Priority Weight</label>
                <span style={{fontFamily:mono,fontSize:12,color:pInfo.color,fontWeight:700}}>{pInfo.label} · {form.priority}/100</span>
              </div>
              <input type="range" min={0} max={100} value={form.priority} onChange={e=>setForm(f=>({...f,priority:+e.target.value}))} style={{width:"100%",accentColor:T.brass,marginBottom:4}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontFamily:mono,fontSize:9,color:T.muted}}>
                <span>Low</span><span>Medium</span><span>High</span><span>Critical</span>
              </div>
            </div>

            {/* Flag triggers */}
            <div style={{marginBottom:16}}>
              <label style={{fontFamily:body,fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:1.3,fontWeight:600,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                Flag Triggers
                {!locked&&!isEditing&&<span style={{fontFamily:mono,fontSize:8,background:`rgba(155,110,243,0.12)`,border:`1px solid rgba(155,110,243,0.3)`,padding:"1px 5px",color:"#9b6ef3"}}>AI</span>}
              </label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:6}}>
                {FLAG_TRIGGERS.map(f=>{
                  const on=form.triggers.includes("all")||form.triggers.includes(f.id);
                  return(
                    <button key={f.id} onClick={()=>toggleTrigger(f.id)} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 10px",background:on?`${T.flag}10`:"transparent",border:`1px solid ${on?T.flag:T.line}`,cursor:"pointer",fontFamily:mono,fontSize:10.5,color:on?T.flag:T.muted,textAlign:"left",transition:"all .15s"}}>
                      <span style={{width:12,height:12,border:`1.5px solid ${on?T.flag:T.line}`,background:on?T.flag:"transparent",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:8,color:T.card,flexShrink:0}}>{on?"✓":""}</span>
                      ⚑ {f.label}
                    </button>
                  );
                })}
              </div>
              <button onClick={()=>toggleTrigger("all")} style={{width:"100%",display:"flex",alignItems:"center",gap:7,padding:"7px 10px",background:form.triggers.includes("all")?`${T.flag}08`:"transparent",border:`1px dashed ${form.triggers.includes("all")?T.flag:T.line}`,cursor:"pointer",fontFamily:mono,fontSize:10.5,color:form.triggers.includes("all")?T.flag:T.muted,transition:"all .15s"}}>
                <span style={{width:12,height:12,border:`1.5px solid ${form.triggers.includes("all")?T.flag:T.line}`,background:form.triggers.includes("all")?T.flag:"transparent",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:8,color:T.card,flexShrink:0}}>{form.triggers.includes("all")?"✓":""}</span>
                ⚑ All Flags — always retrieve for every briefing
              </button>
            </div>

            {/* Teaching Note */}
            <div style={{marginBottom:14}}>
              <label style={{fontFamily:body,fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:1.3,fontWeight:600,marginBottom:6,display:"block"}}>Teaching Note for {agent.name.split(" ")[0]}</label>
              <textarea value={form.teaching_note} onChange={e=>setForm(f=>({...f,teaching_note:e.target.value}))} placeholder="Optional. Shapes how this agent phrases findings that cite this document…" style={{width:"100%",padding:"9px 12px",fontFamily:body,fontSize:12.5,color:T.ink,background:T.cardAlt,border:`1px solid ${T.line}`,outline:"none",resize:"vertical",minHeight:80,lineHeight:1.5,fontStyle:"italic"}}/>
              <div style={{fontFamily:body,fontSize:11,color:T.muted,fontStyle:"italic",marginTop:4}}>Optional. Shapes how {agent.name.split(" ")[0]} phrases findings that cite this doc.</div>
            </div>

            {/* Extracted text preview */}
            {uploadState==="ready"&&(
              <div style={{marginBottom:14}}>
                <button onClick={()=>setExtractedOpen(o=>!o)} style={{width:"100%",padding:"9px 12px",background:T.cardAlt,border:`1px solid ${T.line}`,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",fontFamily:mono,fontSize:10,color:T.muted,letterSpacing:.5}}>
                  <span>▾ View extracted document text</span>
                  <span style={{fontFamily:mono,fontSize:9,color:T.flag}}>READ ONLY · {wordCount.toLocaleString()} words</span>
                </button>
                {extractedOpen&&(
                  <div style={{background:T.navyDeep,border:`1px solid rgba(255,255,255,.1)`,borderTop:"none",padding:"12px 14px",fontFamily:mono,fontSize:11,color:"#8fa3bf",lineHeight:1.7,maxHeight:180,overflowY:"auto",whiteSpace:"pre-wrap",userSelect:"none"}}>
                    {extractedText.split(/\s+/).slice(0,300).join(" ")}{"\n\n[Read-only · Stored in Supabase]"}
                  </div>
                )}
              </div>
            )}

            {/* Action strip */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:16,paddingTop:16,borderTop:`1px solid ${T.lineSoft}`}}>
              <button onClick={onBack} style={{background:"transparent",border:`1px solid ${T.line}`,color:T.mutedDeep,padding:"9px 20px",fontFamily:body,fontSize:13,cursor:"pointer"}}>Cancel</button>
              <button onClick={handleSave} disabled={!form.title||isSaving||locked} style={{background:!form.title||locked?T.line:`linear-gradient(135deg,${T.brass},${T.brassDeep})`,border:"none",color:!form.title||locked?T.muted:T.navy,padding:"10px 24px",fontFamily:display,fontSize:14,fontWeight:700,cursor:!form.title||locked?"not-allowed":"pointer",opacity:isSaving?.7:1}}>
                {isSaving?"⏳ Saving…":`▸ Teach ${agent.name.split(" ")[0]} this document`}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Projected impact */}
        <div>
          <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"16px 18px",marginBottom:14,position:"relative"}}>
            <Corners/>
            <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.8,fontWeight:600,marginBottom:14}}>Projected Impact</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-around",marginBottom:14}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontFamily:mono,fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Before</div>
                <div style={{fontFamily:display,fontSize:40,fontWeight:700,color:T.mutedDeep,lineHeight:1}}>{agent.skill}</div>
                <div style={{fontFamily:mono,fontSize:10,color:T.muted}}>{skillLabel(agent.skill)}</div>
              </div>
              <div style={{fontFamily:display,fontSize:22,color:T.brassDeep}}>→</div>
              <div style={{textAlign:"center"}}>
                <div style={{fontFamily:mono,fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>After</div>
                <div style={{fontFamily:display,fontSize:40,fontWeight:700,color:T.moss,lineHeight:1}}>{Math.min(100,agent.skill+3)}</div>
                <div style={{fontFamily:mono,fontSize:10,color:T.moss,fontWeight:600}}>▸ {skillLabel(Math.min(100,agent.skill+3))}</div>
              </div>
            </div>
            <div style={{fontFamily:body,fontSize:12,color:T.mutedDeep,lineHeight:1.5,fontStyle:"italic",padding:"8px 10px",background:`${T.moss}08`,border:`1px solid ${T.moss}30`}}>Mock projected impact. Live skill computation in v5.</div>
          </div>

          {/* What changes — live fields */}
          <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"14px 16px",marginBottom:14}}>
            <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.8,fontWeight:600,marginBottom:10}}>What Changes</div>
            {[["Documents",agent.docs,agent.docs+1,true],["Class hours",agent.classes,agent.classes+1,false],["Chunks in RAG",agent.chunks,agent.chunks+"+ new",true],["Tokens indexed","—","+ new chunks",true],["Flag coverage","—","—",false],["Training invested",`$${agent.classes*1000}`,`$${(agent.classes+1)*1000}`,false]].map(([k,before,after,live])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.lineSoft}`,fontSize:12,alignItems:"baseline"}}>
                <span style={{color:T.mutedDeep,display:"flex",alignItems:"center",gap:5}}>
                  {k}
                  {live&&<span style={{fontFamily:mono,fontSize:8,color:T.moss,border:`1px solid ${T.moss}40`,padding:"0 4px",letterSpacing:.5}}>LIVE</span>}
                </span>
                <div style={{fontFamily:mono,fontSize:11,display:"flex",alignItems:"baseline",gap:6}}>
                  <span style={{color:T.muted}}>{before} →</span>
                  <span style={{color:T.navy,fontWeight:700}}>{after}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Onboarding checklist — live fields */}
          <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"14px 16px",marginBottom:14}}>
            <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.8,fontWeight:600,marginBottom:10}}>Onboarding Checklist</div>
            {[
              ["File uploaded & extracted",    uploadState==="ready",     "just now"],
              ["Priority & flags assigned",     !locked&&form.title!=="", "just now"],
              ["Chunked into passages",          false,                    "starting…"],
              ["Indexed into RAG",               false,                    "queued"],
              ["Quality check",                  false,                    "scheduled"],
              ["Available in next briefing",     false,                    "after index"],
            ].map(([label,done,status])=>(
              <div key={label} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:`1px solid ${T.lineSoft}`}}>
                <div style={{width:14,height:14,border:`1.5px solid ${done?T.moss:T.line}`,background:done?T.moss:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {done&&<span style={{color:T.card,fontSize:9,fontWeight:700}}>✓</span>}
                </div>
                <span style={{flex:1,fontFamily:body,fontSize:12,color:done?T.ink:T.muted}}>{label}</span>
                <span style={{fontFamily:mono,fontSize:10,color:T.muted}}>{status}</span>
              </div>
            ))}
          </div>

          {agent.trainer==="NIGP"&&(
            <div style={{padding:"10px 14px",background:`${T.moss}08`,border:`1px solid ${T.moss}30`,fontFamily:body,fontSize:11.5,color:T.mutedDeep,lineHeight:1.5}}>
              <strong style={{color:T.moss}}>NIGP-funded training.</strong> This class hour is charged against NIGP's subscription. No impact to your jurisdiction's usage.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROMPT COMPARISON PANEL
// ══════════════════════════════════════════════════════════════════════════════
function PromptComparisonPanel({ pd }) {
  const [layerOpen, setLayerOpen] = useState({});
  const toggle = (k) => setLayerOpen(m => ({ ...m, [k]: !m[k] }));
  const overlapColor = (pct) => pct >= 90 ? T.moss : pct >= 60 ? T.brass : T.flag;
  const layerColors = ["#9b6ef3", T.moss, T.brassDeep, T.brass, T.flag];

  return (
    <div style={{background:T.card,border:`1px solid ${T.line}`,marginBottom:16,position:"relative"}}>
      <Corners color={T.navy}/>
      {/* Header */}
      <div style={{background:T.navyMid,padding:"12px 18px",display:"flex",alignItems:"baseline",justifyContent:"space-between"}}>
        <div>
          <div style={{fontFamily:mono,fontSize:9,color:T.brassLight,textTransform:"uppercase",letterSpacing:1.8,fontWeight:600,marginBottom:3}}>Prompt Intelligence</div>
          <div style={{fontFamily:display,fontSize:14,fontWeight:600,color:T.card}}>System Prompt Comparison — Why they think differently</div>
        </div>
        <div style={{display:"flex",gap:20}}>
          {[{name:pd.agent1,tok:pd.total.t1},{name:pd.agent2,tok:pd.total.t2}].map(({name,tok})=>(
            <div key={name} style={{textAlign:"right"}}>
              <div style={{fontFamily:mono,fontSize:8,color:"#8fa3bf",textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>{name} · total tokens</div>
              <div style={{fontFamily:display,fontSize:16,fontWeight:700,color:T.brassLight,fontVariantNumeric:"tabular-nums"}}>{tok.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Layer rows */}
      <div>
        {pd.layers.map((layer, i) => {
          const isOpen = layerOpen[layer.key];
          const oc = overlapColor(layer.overlap);
          const lc = layerColors[i];
          return (
            <div key={layer.key} style={{borderBottom:`1px solid ${T.lineSoft}`}}>
              <div
                onClick={() => !layer.same && toggle(layer.key)}
                style={{display:"grid",gridTemplateColumns:"200px 1fr 1fr 90px 28px",alignItems:"center",padding:"10px 18px",cursor:layer.same?"default":"pointer",background:isOpen?T.cardAlt:"transparent",transition:"background .15s"}}
              >
                {/* Layer label */}
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:3,height:32,background:lc,flexShrink:0}}/>
                  <div>
                    <div style={{fontFamily:mono,fontSize:9,fontWeight:700,color:lc,letterSpacing:.5}}>{layer.label}</div>
                    {layer.same
                      ? <div style={{fontFamily:mono,fontSize:8.5,color:T.moss,fontWeight:600}}>● Identical</div>
                      : <div style={{fontFamily:mono,fontSize:8.5,color:T.flag}}>◉ Different</div>
                    }
                  </div>
                </div>
                {/* Agent 1 */}
                <div style={{padding:"0 14px",borderLeft:`1px solid ${T.lineSoft}`}}>
                  <div style={{fontFamily:mono,fontSize:8,color:"#8fa3bf",marginBottom:2}}>{pd.agent1}</div>
                  <div style={{fontFamily:body,fontSize:11.5,color:T.navy,fontWeight:500}}>{layer.name1}</div>
                  {!layer.same&&layer.tok1>0&&<div style={{fontFamily:mono,fontSize:9,color:T.muted,marginTop:1}}>{layer.tok1} tokens · {layer.words1} words</div>}
                </div>
                {/* Agent 2 */}
                <div style={{padding:"0 14px",borderLeft:`1px solid ${T.lineSoft}`}}>
                  <div style={{fontFamily:mono,fontSize:8,color:"#8fa3bf",marginBottom:2}}>{pd.agent2}</div>
                  <div style={{fontFamily:body,fontSize:11.5,color:T.navy,fontWeight:500}}>{layer.name2}</div>
                  {!layer.same&&layer.tok2>0&&<div style={{fontFamily:mono,fontSize:9,color:T.muted,marginTop:1}}>{layer.tok2} tokens · {layer.words2} words</div>}
                </div>
                {/* Overlap */}
                <div style={{textAlign:"center",borderLeft:`1px solid ${T.lineSoft}`,padding:"0 10px"}}>
                  <div style={{fontFamily:mono,fontSize:8,color:"#8fa3bf",marginBottom:3,textTransform:"uppercase",letterSpacing:.5}}>Overlap</div>
                  <div style={{fontFamily:display,fontSize:18,fontWeight:700,color:oc,lineHeight:1}}>{layer.overlap}%</div>
                  <div style={{height:3,background:T.paperDeep,marginTop:4}}>
                    <div style={{height:"100%",width:`${layer.overlap}%`,background:oc}}/>
                  </div>
                </div>
                {!layer.same&&<div style={{textAlign:"center",fontFamily:mono,fontSize:10,color:T.muted}}>{isOpen?"▲":"▼"}</div>}
              </div>
              {/* Expanded side-by-side */}
              {isOpen&&!layer.same&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderTop:`1px solid ${T.lineSoft}`}}>
                  {[{name:pd.agent1,text:layer.text1},{name:pd.agent2,text:layer.text2}].map(({name,text},si)=>(
                    <div key={name} style={{padding:"12px 16px",borderRight:si===0?`1px solid ${T.lineSoft}`:"none",background:T.navyDeep}}>
                      <div style={{fontFamily:mono,fontSize:8.5,color:lc,fontWeight:700,textTransform:"uppercase",letterSpacing:.8,marginBottom:7}}>{name}</div>
                      <div style={{fontFamily:mono,fontSize:10.5,color:"#8fa3bf",lineHeight:1.7,whiteSpace:"pre-wrap",maxHeight:160,overflowY:"auto"}}>{text||"(empty)"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary insight */}
      <div style={{padding:"11px 18px",background:T.cardAlt,display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:T.navy,flexShrink:0}}/>
        <div style={{fontFamily:body,fontSize:12,color:T.mutedDeep,lineHeight:1.5,flex:1}}>
          {pd.layers.filter(l=>!l.same).length===0
            ? `${pd.agent1} and ${pd.agent2} have identical prompt configurations. Output differences are driven entirely by their RAG knowledge base.`
            : `${pd.layers.filter(l=>!l.same).length} of 5 prompt layers differ. ${pd.layers.filter(l=>!l.same&&l.overlap<60).map(l=>l.label.split("·")[1]?.trim()).filter(Boolean).join(" and ")||"These layers"} drive the most divergence. Click any row to compare the actual prompt text side by side.`
          }
        </div>
        <div style={{fontFamily:mono,fontSize:9,color:T.muted,flexShrink:0}}>Configure in Resume & Playbook tabs</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 4: TEST MY TEAM
// ══════════════════════════════════════════════════════════════════════════════
function TestTeamScreen({filterAgent,onBack,showToast}){
  const [stage,setStage]=useState(filterAgent?2:1);
  const [selectedAgents,setSelectedAgents]=useState(filterAgent?[filterAgent.id]:[]);
  const [selectedScenario,setSelectedScenario]=useState(BEE_SCENARIOS[0]);
  const [runState,setRunState]=useState("idle");
  const [results,setResults]=useState({});
  const [promptOpenMap,setPromptOpenMap]=useState({});
  const maxSelect=2;

  const toggleAgent=(id)=>{
    setSelectedAgents(prev=>{
      if(prev.includes(id)) return prev.filter(x=>x!==id);
      if(prev.length>=maxSelect){showToast("Maximum 2 agents","⚠");return prev;}
      return [...prev,id];
    });
  };

  const runTest=async()=>{
    if(selectedAgents.length===0){showToast("Select at least one agent","⚠");return;}
    setRunState("running");
    setResults({});
    const scenarioMsg=`Analyze this government procurement spend scenario for the City of Austin, Texas:\n\nScenario: ${selectedScenario.title}\nDetails: ${selectedScenario.meta}\nAmount at risk: ${selectedScenario.amount}\n\nProvide: 1) Executive summary 2) Key findings 3) Three specific recommended actions.`;
    try{
      const newResults={};
      for(const agentId of selectedAgents){
        // Fetch RAG entries for display (brief.js also fetches internally for the prompt)
        const ragRes=await fetch("/api/rag-query",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({queryText:selectedScenario.queryText,jurisdiction:selectedScenario.jurisdiction,matchCount:5,tenant_id:"global",agent_id:agentId})});
        const ragJson=await ragRes.json();
        const ragEntries=ragJson.entries||[];
        // Run briefing — brief.js assembles full 5-layer prompt using agent_configs
        const briefRes=await fetch("/api/brief",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
          messages:[{role:"user",content:scenarioMsg}],
          agent_id:agentId,
          tenant_id:"global",
          ragContext:{queryText:selectedScenario.queryText,jurisdiction:selectedScenario.jurisdiction,triggers:[]},
        })});
        const briefJson=await briefRes.json();
        const briefText=briefJson.content?.[0]?.text||briefJson.error||"No response";
        const assembledSystem=briefJson._system||"(system prompt not returned — redeploy brief.js)";
        const debugInfo=briefJson._debug||{};
        newResults[agentId]={briefText,ragEntries,promptText:assembledSystem,debugInfo,promptChars:assembledSystem.length,promptTokens:Math.round(assembledSystem.length/4)};
      }
      // Compute output delta and prompt diff if 2 agents
      if(selectedAgents.length===2){
        const [a1,a2]=selectedAgents;
        const delta=computeDelta(newResults[a1].briefText,newResults[a2].briefText);
        const agent1=AGENTS.find(a=>a.id===a1);
        const agent2=AGENTS.find(a=>a.id===a2);
        const promptDiff=computePromptDiff(newResults[a1],newResults[a2],agent1?.name.split(" ")[0]||a1,agent2?.name.split(" ")[0]||a2);
        newResults._delta=delta;
        newResults._promptDiff=promptDiff;
        newResults._a1=a1;
        newResults._a2=a2;
      }
      setResults(newResults);
      setRunState("done");
      setStage(3);
      showToast("🐝 Test complete","🐝");
    }catch(err){
      setRunState("error");
      showToast("Test failed: "+err.message,"⚠");
    }
  };

  const agentResult=(id)=>results[id];
  const s1a=selectedAgents[0]?AGENTS.find(a=>a.id===selectedAgents[0]):null;
  const s2a=selectedAgents[1]?AGENTS.find(a=>a.id===selectedAgents[1]):null;

  return(
    <div style={{flex:1,overflowY:"auto",padding:"24px 28px 60px",background:T.paperDeep}}>
      {/* Title */}
      <div style={{fontFamily:mono,fontSize:9.5,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.8,fontWeight:600,marginBottom:5}}>Acquired Skillset · Agent Testing</div>
      <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:5}}>
        <div style={{fontFamily:display,fontSize:28,fontWeight:500,color:T.navy,letterSpacing:"-.5px"}}>{filterAgent?`Testing ${filterAgent.name.split(" ")[0]}.`:"Test My Team."}</div>
      </div>
      <div style={{fontFamily:body,fontStyle:"italic",fontSize:13,color:T.mutedDeep,marginBottom:16,maxWidth:580}}>Run standardized procurement scenarios against your agents. Full prompt and RAG context visible here — not available in AI Review.</div>
      <div style={{height:2,background:T.brass,marginBottom:20}}/>

      {/* Stage nav — hide Pick Agents when launched from Personnel File */}
      <div style={{display:"flex",gap:0,marginBottom:22,borderBottom:`2px solid ${T.brass}`}}>
        {[["① Pick Agents",1],["② Pick Scenario",2],["③ Results",3]].filter(([,n])=>!(filterAgent&&n===1)).map(([label,n])=>(
          <button key={n} onClick={()=>setStage(n)} style={{padding:"8px 22px",fontFamily:mono,fontSize:10,letterSpacing:1,textTransform:"uppercase",border:"none",background:"transparent",cursor:"pointer",color:stage===n?T.navy:T.muted,fontWeight:stage===n?700:400,borderBottom:`2px solid ${stage===n?T.navy:"transparent"}`,marginBottom:-2}}>
            {label}
          </button>
        ))}
      </div>

      {/* STAGE 1: PICK AGENTS */}
      {stage===1&&(
        <div>
          <div style={{fontFamily:body,fontSize:12,color:T.muted,fontStyle:"italic",marginBottom:14,padding:"9px 14px",background:`${T.brass}06`,border:`1px solid ${T.brass}20`}}>
            Select 1 or 2 agents to test against the scenario. Max 2.
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:16}}>
            {AGENTS.map(a=>{
              const isSel=selectedAgents.includes(a.id);
              const borderColor=isSel?(a.color===T.moss?T.moss:T.brass):T.line;
              return(
                <div key={a.id} onClick={()=>toggleAgent(a.id)} style={{background:T.card,border:`2px solid ${borderColor}`,position:"relative",cursor:"pointer",padding:"12px 10px",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",background:isSel?`${borderColor}08`:T.card,boxShadow:isSel?`0 0 0 1px ${borderColor}30`:"none",transition:"all .15s"}}>
                  {isSel&&<div style={{position:"absolute",top:7,right:7,width:16,height:16,borderRadius:"50%",background:borderColor,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:T.card,fontSize:8,fontWeight:700}}>✓</span></div>}
                  <AgentAvatar who={a.id} size={48} ring={true}/>
                  <div style={{fontFamily:display,fontSize:12,fontWeight:600,color:T.navy,marginTop:6,marginBottom:1}}>{a.name.split(" ")[0]}</div>
                  <div style={{fontFamily:body,fontSize:9.5,color:T.mutedDeep,fontStyle:"italic",marginBottom:6,lineHeight:1.3}}>{a.role}</div>
                  <div style={{fontFamily:mono,fontSize:8,padding:"1px 5px",border:`1px solid ${T.brass}40`,color:T.brassDeep,background:`${T.brass}08`,marginBottom:6}}>{a.arch}</div>
                  <div style={{width:"100%",height:4,background:T.paperDeep,border:`1px solid ${T.lineSoft}`,position:"relative",marginBottom:5}}>
                    <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${a.skill}%`,background:a.color===T.moss?T.moss:T.brass}}/>
                  </div>
                  <div style={{fontFamily:mono,fontSize:10,fontWeight:700,color:a.situational>=30?T.brass:T.muted}}>{a.situational}%</div>
                  <div style={{fontFamily:body,fontSize:9,color:T.muted,fontStyle:"italic"}}>situational awareness</div>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <button onClick={()=>selectedAgents.length>0&&setStage(2)} disabled={selectedAgents.length===0} style={{background:selectedAgents.length>0?`linear-gradient(135deg,${T.brass},${T.brassDeep})`:T.line,border:"none",color:selectedAgents.length>0?T.navy:T.muted,padding:"11px 28px",fontFamily:display,fontSize:14,fontWeight:700,cursor:selectedAgents.length>0?"pointer":"not-allowed"}}>
              Next: Pick Scenario →
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: PICK SCENARIO */}
      {stage===2&&(
        <div>
          <div style={{fontFamily:body,fontSize:12,color:T.muted,fontStyle:"italic",marginBottom:14,padding:"9px 14px",background:`${T.brass}06`,border:`1px solid ${T.brass}20`}}>
            Select a pre-built Austin 2025 scenario. Each test makes {selectedAgents.length} live API call{selectedAgents.length>1?"s":""}. Estimated cost: ~${(selectedAgents.length*0.03).toFixed(2)}–${(selectedAgents.length*0.06).toFixed(2)} per run.
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:16}}>
            {BEE_SCENARIOS.map(sc=>(
              <div key={sc.id} onClick={()=>setSelectedScenario(sc)} style={{background:selectedScenario.id===sc.id?`${T.brass}08`:T.card,border:`1.5px solid ${selectedScenario.id===sc.id?T.brass:T.line}`,padding:"12px",cursor:"pointer",transition:"all .15s",position:"relative"}}>
                {selectedScenario.id===sc.id&&<Corners/>}
                <div style={{fontSize:16,marginBottom:6}}>{sc.flag}</div>
                <div style={{fontFamily:mono,fontSize:8.5,color:T.brassDeep,textTransform:"uppercase",letterSpacing:.8,fontWeight:600,marginBottom:4}}>{sc.flagLabel}</div>
                <div style={{fontFamily:display,fontSize:12.5,fontWeight:600,color:T.navy,lineHeight:1.3,marginBottom:4}}>{sc.title}</div>
                <div style={{fontFamily:body,fontSize:10,color:T.muted,lineHeight:1.4,marginBottom:6}}>{sc.meta}</div>
                <div style={{fontFamily:mono,fontSize:10,color:T.flag,fontWeight:700}}>{sc.amount}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <button onClick={()=>setStage(filterAgent?2:1)} style={{background:"transparent",border:`1px solid ${T.line}`,color:T.mutedDeep,padding:"9px 20px",fontFamily:body,fontSize:13,cursor:"pointer"}}>← Back</button>
            <button onClick={runTest} disabled={runState==="running"} style={{background:runState==="running"?T.line:`linear-gradient(135deg,${T.brass},${T.brassDeep})`,border:"none",color:runState==="running"?T.muted:T.navy,padding:"11px 28px",fontFamily:display,fontSize:14,fontWeight:700,cursor:runState==="running"?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:8}}>
              <span>{runState==="running"?"⏳":"🐝"}</span>{runState==="running"?"Running…":"Run Test →"}
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: RESULTS */}
      {stage===3&&runState==="done"&&(
        <div>
          {/* Scenario context bar */}
          <div style={{background:`linear-gradient(135deg,${T.navy},${T.navyMid})`,color:T.card,padding:"11px 20px",marginBottom:16,display:"flex",alignItems:"center",gap:16}}>
            <div style={{fontFamily:mono,fontSize:9,color:"#8fa3bf",textTransform:"uppercase",letterSpacing:1.2,flexShrink:0}}>Test Scenario</div>
            <div style={{fontFamily:display,fontSize:14,fontWeight:600,color:T.card}}>{selectedScenario.flag} {selectedScenario.title}</div>
            <div style={{fontFamily:mono,fontSize:10,color:"#8fa3bf"}}>{selectedScenario.meta}</div>
            <div style={{flex:1}}/>
            <button onClick={()=>setStage(2)} style={{background:"transparent",border:`1px solid rgba(248,242,226,.3)`,color:"#b8c5d8",padding:"5px 12px",fontFamily:body,fontSize:11,cursor:"pointer"}}>Change scenario</button>
          </div>

          {/* Results side by side */}
          <div style={{display:"grid",gridTemplateColumns:selectedAgents.length===2?"1fr 1fr":"1fr",gap:16,marginBottom:16}}>
            {selectedAgents.map(agentId=>{
              const agent=AGENTS.find(a=>a.id===agentId);
              const r=agentResult(agentId);
              if(!r) return null;
              const promptOpen=promptOpenMap[agentId]||{prompt:false,rag:false};
              return(
                <div key={agentId} style={{display:"flex",flexDirection:"column"}}>
                  {/* Agent bar */}
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:T.cardAlt,border:`1px solid ${agent.color===T.moss?T.moss:T.line}`,borderBottom:"none"}}>
                    <AgentAvatar who={agentId} size={28} ring={true}/>
                    <div>
                      <div style={{fontFamily:display,fontSize:13,fontWeight:600,color:T.navy}}>{agent.name}</div>
                      <div style={{fontFamily:mono,fontSize:9,color:T.muted}}>{agent.code} · {agent.arch} · {agent.situational}% awareness</div>
                    </div>
                    <div style={{marginLeft:"auto",fontFamily:mono,fontSize:10,color:T.brassDeep,fontWeight:700}}>{fmt$(agent.reportCost)}</div>
                  </div>
                  {/* Brief body */}
                  <div style={{background:T.card,border:`1px solid ${T.line}`,borderTop:"none",padding:"16px 18px",flex:1}}>
                    <div style={{fontFamily:body,fontSize:12.5,color:T.mutedDeep,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{r.briefText}</div>
                  </div>
                  {/* Prompt + RAG reveal — shows real assembled prompt from brief.js */}
                  <div style={{background:T.navyDeep,border:`1px solid rgba(255,255,255,.1)`,borderTop:"none"}}>
                    <div style={{display:"flex",alignItems:"center",borderBottom:`1px solid rgba(255,255,255,.1)`}}>
                      {[["Full System Prompt","prompt"],["RAG Chunks","rag"]].map(([label,key])=>(
                        <button key={key} onClick={()=>setPromptOpenMap(m=>({...m,[agentId]:{...promptOpen,[key]:!promptOpen[key]}}))} style={{padding:"7px 14px",fontFamily:mono,fontSize:9.5,color:promptOpen[key]?T.brassLight:"#8fa3bf",textTransform:"uppercase",letterSpacing:.8,cursor:"pointer",border:"none",background:"transparent",borderBottom:`2px solid ${promptOpen[key]?T.brass:"transparent"}`}}>{label}</button>
                      ))}
                      <div style={{flex:1}}/>
                      {r.debugInfo&&(
                        <div style={{display:"flex",gap:10,padding:"4px 12px"}}>
                          {[["Role",r.debugInfo.role_name],["Format",r.debugInfo.format_name],["Layers",r.debugInfo.layers_assembled],["~Tokens",r.promptTokens]].map(([k,v])=>(
                            <div key={k}><span style={{fontFamily:mono,fontSize:8,color:"#8fa3bf"}}>{k}: </span><span style={{fontFamily:mono,fontSize:8,color:T.brassLight,fontWeight:700}}>{v}</span></div>
                          ))}
                        </div>
                      )}
                      <span style={{fontFamily:mono,fontSize:9,color:T.brassLight,padding:"7px 12px",alignSelf:"center",borderLeft:"1px solid rgba(255,255,255,.1)"}}>Admin Only</span>
                    </div>
                    {promptOpen.prompt&&(
                      <div style={{padding:"12px 16px",maxHeight:240,overflowY:"auto"}}>
                        {/* Per-layer breakdown with color coding */}
                        {["=== ROLE & IDENTITY ===","=== BACKGROUND KNOWLEDGE ===","=== OUTPUT FORMAT ===","=== CONSTRAINTS & GUARDRAILS ==="].map((header,i)=>{
                          const colors=["#9b6ef3","#5a9b6f","#b6873a","#a83319"];
                          const labels=["01 · Role","02 · RAG","04 · Format","05 · Guardrails"];
                          const start=r.promptText.indexOf(header);
                          if(start===-1) return null;
                          const end=r.promptText.indexOf("\n\n---\n\n",start);
                          const section=(end===-1?r.promptText.slice(start):r.promptText.slice(start,end)).replace(header,"").trim();
                          return(
                            <div key={header} style={{marginBottom:10,borderLeft:`3px solid ${colors[i]}`,paddingLeft:10}}>
                              <div style={{fontFamily:mono,fontSize:8.5,color:colors[i],fontWeight:700,letterSpacing:.8,marginBottom:4}}>{labels[i]}</div>
                              <div style={{fontFamily:mono,fontSize:10.5,color:"#8fa3bf",lineHeight:1.6,whiteSpace:"pre-wrap",maxHeight:80,overflowY:"auto"}}>{section}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {promptOpen.rag&&(
                      <div style={{padding:"12px 16px",maxHeight:200,overflowY:"auto"}}>
                        {r.ragEntries.length===0&&<div style={{fontFamily:mono,fontSize:11,color:T.flag,fontStyle:"italic"}}>⚠ No chunks retrieved — add training documents for this scenario type.</div>}
                        {r.ragEntries.map((e,i)=>(
                          <div key={i} style={{background:`${T.moss}10`,borderLeft:`3px solid ${T.moss}`,padding:"6px 10px",marginBottom:6,fontSize:10.5,color:T.mossLight,lineHeight:1.5}}>
                            <strong style={{color:T.card}}>{e.title}</strong> <span style={{color:T.brassLight,fontFamily:mono,fontSize:9}}>{Math.round((e.similarity||0)*100)}% match</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── PROMPT COMPARISON PANEL ── only if 2 agents */}
          {selectedAgents.length===2&&results._promptDiff&&(
            <PromptComparisonPanel pd={results._promptDiff}/>
          )}

          {/* ── OUTPUT DELTA PANEL ── only if 2 agents */}
          {selectedAgents.length===2&&results._delta&&(()=>{
            const d=results._delta;
            const a1=AGENTS.find(a=>a.id===results._a1);
            const a2=AGENTS.find(a=>a.id===results._a2);
            const metrics=[
              ["Word Count",d.beforeWords,d.afterWords,d.wordDiff],
              ["Statutes Cited",d.statutesBefore,d.statutesAfter,d.statutesAfter-d.statutesBefore],
              ["$ Thresholds",d.dollarsBefore,d.dollarsAfter,d.dollarsAfter-d.dollarsBefore],
              ["Org References",d.orgsBefore,d.orgsAfter,d.orgsAfter-d.orgsBefore],
              ["Action Items",d.actionsBefore,d.actionsAfter,d.actionsAfter-d.actionsBefore],
            ];
            return(
              <div style={{background:T.card,border:`1px solid ${T.line}`,marginBottom:16,position:"relative"}}>
                <Corners/>
                <div style={{padding:"12px 18px",borderBottom:`1px solid ${T.lineSoft}`,display:"flex",alignItems:"baseline",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.8,fontWeight:600,marginBottom:3}}>Report Comparison</div>
                    <div style={{fontFamily:display,fontSize:14,fontWeight:600,color:T.navy}}>Quality delta between agents</div>
                  </div>
                  <div style={{fontFamily:body,fontSize:11,color:T.moss,fontStyle:"italic"}}>Full prompt & RAG context visible above ↑</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",padding:"14px 18px",gap:0,borderBottom:`1px solid ${T.lineSoft}`}}>
                  {metrics.map(([label,v1,v2,diff],i)=>(
                    <div key={label} style={{padding:`0 ${i>0?"14px":"0"} 0 ${i>0?"14px":"0"}`,borderRight:i<4?`1px solid ${T.lineSoft}`:"none"}}>
                      <div style={{fontFamily:mono,fontSize:8.5,color:T.muted,textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:8}}>{label}</div>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                        <AgentAvatar who={results._a1} size={16} ring={false}/>
                        <span style={{fontFamily:mono,fontSize:13,fontWeight:700,color:T.ink}}>{v1}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                        <AgentAvatar who={results._a2} size={16} ring={false}/>
                        <span style={{fontFamily:mono,fontSize:13,fontWeight:700,color:T.ink}}>{v2}</span>
                      </div>
                      <div style={{fontFamily:mono,fontSize:10,fontWeight:700,color:diff>0?T.moss:diff<0?T.flag:T.muted}}>
                        {diff>0?`+${diff} ${a2?.name.split(" ")[0]}`:diff<0?`+${Math.abs(diff)} ${a1?.name.split(" ")[0]}`:"No diff"}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{padding:"12px 18px",background:T.cardAlt,display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:T.moss,flexShrink:0}}/>
                  <div style={{fontFamily:body,fontSize:12,color:T.mutedDeep,lineHeight:1.5,flex:1}}>
                    Comparison complete. Review the prompts and RAG chunks above to understand why the outputs differ.
                    <span style={{color:T.muted,fontStyle:"italic"}}> Full quality rubric available in v5.</span>
                  </div>
                  {(a1&&a1.trainable||a2&&a2.trainable)&&(
                    <button style={{background:T.moss,border:"none",color:"#fff",padding:"8px 18px",fontFamily:display,fontSize:13,fontWeight:700,cursor:"pointer",flexShrink:0,marginLeft:16}}
                      onClick={()=>onBack()}>+ Add Training →</button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Back to top only — navigate via header or scroll */}
          <div style={{display:"flex",justifyContent:"center",marginTop:24}}>
            <button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})} style={{background:"transparent",border:`1px solid ${T.line}`,color:T.mutedDeep,padding:"9px 28px",fontFamily:body,fontSize:13,cursor:"pointer"}}>↑ Back to Top</button>
          </div>
        </div>
      )}

      {stage===3&&runState==="running"&&(
        <div style={{textAlign:"center",padding:"80px 40px"}}>
          <div style={{width:52,height:52,border:`4px solid ${T.brass}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 20px"}}/>
          <div style={{fontFamily:display,fontSize:20,fontWeight:600,color:T.navy,marginBottom:10}}>Running analysis…</div>
          <div style={{fontFamily:mono,fontSize:12,color:T.muted,fontStyle:"italic",marginBottom:6}}>Gathering content from knowledge base…</div>
          <div style={{fontFamily:mono,fontSize:11,color:T.muted,fontStyle:"italic"}}>Making {selectedAgents.length} live API call{selectedAgents.length>1?"s":""}. This may take 15–30 seconds.</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function TeamBuilder(){
  const [screen,setScreen]=useState("roster"); // roster | personnel | teach | test
  const [activeAgent,setActiveAgent]=useState(null);
  const [editingEntry,setEditingEntry]=useState(null);
  const [testFilterAgent,setTestFilterAgent]=useState(null);
  const [entries,setEntries]=useState([]);
  const [entriesLoading,setEntriesLoading]=useState(true);
  const [toast,setToast]=useState(null);

  const showToast=useCallback((msg,icon="✓")=>{setToast({msg,icon});setTimeout(()=>setToast(null),3000);},[]);

  // Load entries from Supabase for the active agent
  useEffect(()=>{
    async function load(){
      setEntriesLoading(true);
      try{
        const agentParam=activeAgent?`&agent_id=${activeAgent.id}`:"";
        const res=await fetch(`/api/load-entries?tenant_id=global${agentParam}`);
        if(res.ok){
          const data=await res.json();
          if(data.entries) setEntries(data.entries);
        }
      }catch(err){console.warn("Could not load entries:",err.message);}
      finally{setEntriesLoading(false);}
    }
    if(screen==="personnel") load();
  },[screen,activeAgent]);

  const handleViewFile=(agent)=>{setActiveAgent(agent);setScreen("personnel");};
  const handleAddTraining=(agent)=>{setActiveAgent(agent);setEditingEntry(null);setScreen("teach");};
  const handleTestTeam=()=>{setTestFilterAgent(null);setScreen("test");};
  const handleTestAgent=(agent)=>{setTestFilterAgent(agent);setScreen("test");};
  const handleEditEntry=(entry)=>{setEditingEntry(entry);setScreen("teach");};

  const handleDeleteEntry=async(entry)=>{
    if(!window.confirm(`Delete "${entry.title}"? This removes it permanently.`)) return;
    if(entry.id&&!entry.id.startsWith("e-")){
      try{
        const res=await fetch("/api/ingest",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:entry.id,tenant_id:"global"})});
        if(!res.ok) showToast("Removed locally — Supabase delete may have failed","⚠");
      }catch{showToast("Removed locally — network error","⚠");}
    }
    setEntries(prev=>prev.filter(e=>e.id!==entry.id));
    showToast("Document deleted","🗑");
  };

  const handleSaved=(entry)=>{
    if(editingEntry){setEntries(prev=>prev.map(e=>e.id===entry.id?entry:e));}
    else{setEntries(prev=>[entry,...prev]);}
    setEditingEntry(null);
    setScreen("personnel");
  };

  return(
    <div style={{background:T.paperDeep,minHeight:"100vh",display:"flex",flexDirection:"column",fontFamily:body,color:T.ink}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{height:100%}
        input::placeholder,textarea::placeholder{color:${T.muted}}
        button:hover{opacity:.88}
        .page-nav-link:hover{text-decoration:underline;text-underline-offset:3px}
        @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${T.paperDeep}}
        ::-webkit-scrollbar-thumb{background:${T.line};border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:${T.brass}}
        input[type=range]{cursor:pointer}
        select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23786d52'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center}
      `}</style>

      {/* Header */}
      <div style={{background:T.navy,color:T.card,padding:"0 28px",display:"flex",alignItems:"center",height:60,borderBottom:`3px solid ${T.brass}`,gap:12,flexShrink:0}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:T.brass,color:T.navy,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:display,fontWeight:700,fontSize:15,border:`2px solid ${T.card}`,flexShrink:0}}>N</div>
        <div>
          <div style={{fontFamily:display,fontSize:17,fontWeight:600,letterSpacing:.2,lineHeight:1}}>NIGP Spend Analyzer</div>
          <div style={{fontFamily:body,fontSize:9.5,color:"#b8c5d8",letterSpacing:1.5,textTransform:"uppercase",marginTop:3}}>
            Procurement Intelligence <span style={{color:T.brass,fontWeight:600}}>· Build AI Analyst Team</span>
          </div>
        </div>
        <div style={{flex:1}}/>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {screen!=="roster"&&(
            <button onClick={()=>{
              if(screen==="test"&&testFilterAgent){setScreen("personnel");}
              else{setScreen("roster");setActiveAgent(null);}
            }} style={{background:"transparent",border:`1px solid ${T.card}40`,color:T.card,padding:"6px 14px",fontSize:12,fontFamily:body,cursor:"pointer"}}>← {screen==="test"&&testFilterAgent?"Personnel File":"Team Builder"}</button>
          )}
          <button onClick={()=>window.close?window.close():window.history.back()} style={{background:"transparent",border:`1px solid ${T.card}40`,color:T.card,padding:"6px 14px",fontSize:12,fontFamily:body,cursor:"pointer"}}>← Back to Dashboard</button>
          <button style={{background:"transparent",border:`1px solid ${T.card}40`,color:T.card,padding:"6px 14px",fontSize:12,fontFamily:body,cursor:"pointer"}}>? Help</button>
        </div>
      </div>

      {/* Screen router */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
        {screen==="roster"&&<RosterScreen onViewFile={handleViewFile} onAddTraining={handleAddTraining} onTestTeam={handleTestTeam} showToast={showToast}/>}
        {screen==="personnel"&&activeAgent&&<PersonnelScreen agent={activeAgent} entries={entries} entriesLoading={entriesLoading} onBack={()=>{setScreen("roster");setActiveAgent(null);}} onAddTraining={handleAddTraining} onTestAgent={handleTestAgent} onEditEntry={handleEditEntry} onDeleteEntry={handleDeleteEntry} showToast={showToast}/>}
        {screen==="teach"&&activeAgent&&<TeachScreen agent={activeAgent} existingEntry={editingEntry} onBack={()=>setScreen(editingEntry?"personnel":"roster")} onSaved={handleSaved} showToast={showToast}/>}
        {screen==="test"&&<TestTeamScreen filterAgent={testFilterAgent} onBack={()=>setScreen(testFilterAgent?"personnel":"roster")} showToast={showToast}/>}
      </div>

      <Toast toast={toast}/>
    </div>
  );
}
