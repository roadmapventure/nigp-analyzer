// ══════════════════════════════════════════════════════════════════════════════
// PERSONNEL SCREEN v2 — Tabbed workspace with live agent_configs
// Drop this file into src/ and import into TeamBuilder.jsx replacing
// the existing PersonnelScreen function.
//
// Props match existing TeamBuilder call:
//   agent, entries, entriesLoading,
//   onBack, onAddTraining (unused — training now inline),
//   onTestAgent (unused — test now inline),
//   onEditEntry, onDeleteEntry, showToast
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from "react";

// ── Design tokens (must match TeamBuilder) ────────────────────────────────────
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

const CATEGORIES    = ["Compliance","Jurisdiction","Best Practice","Internal","Standards","Methodology","Playbook","Template","Statute"];
const BRENT_CATEGORIES = ["Portal Navigation","Data Schema","Export Method","Auth Pattern","State Portal","Open Records","Research Method","Data Dictionary"];
const JURISDICTIONS = ["All","Federal","Texas","California","Florida","New York","Illinois"];
const FLAG_TRIGGERS = [
  { id:"maverick",      label:"Maverick Spend" },
  { id:"po-split",      label:"PO Splitting"   },
  { id:"spike",         label:"Spend Spike"    },
  { id:"single-source", label:"Single Source"  },
  { id:"vendor-hhi",    label:"Vendor HHI"     },
  { id:"long-tail",     label:"Long-Tail"      },
];
const BEE_SCENARIOS = [
  { id:"maverick",      flag:"🔴", flagLabel:"Maverick Spend",       title:"High Uncontracted IT Purchases",    meta:"$2.1M outside master agreements · 847 txns · 23 vendors",       amount:"$2,142,880 at risk",    queryText:"High uncontracted technology spend $2.1M across 847 transactions with 23 vendors, no master agreements, maverick spend", jurisdiction:"Texas" },
  { id:"posplit",       flag:"🟠", flagLabel:"PO Splitting",         title:"Suspicious Sub-Threshold Orders",   meta:"14 POs same vendor · 30 days · Under $49,500",                   amount:"$674,200 structured",   queryText:"14 purchase orders to same vendor in 30 days all under $49500 threshold, suspected bid splitting, Public Works", jurisdiction:"Texas" },
  { id:"concentration", flag:"🔴", flagLabel:"Vendor Concentration", title:"Single Vendor: 34% of Facilities", meta:"HHI: 3,240 · $18.7M of $55M budget",                            amount:"$18,720,000 single source", queryText:"Single vendor controls 34% of facilities spend HHI 3240 highly concentrated single source risk $18.7M", jurisdiction:"Texas" },
  { id:"spike",         flag:"🟡", flagLabel:"Spend Spike",          title:"December Surge — Year End",         meta:"340% above avg · $4.2M in final 3 weeks · 12 depts",            amount:"$4,200,000 spike",      queryText:"December spending surge 340% above monthly average $4.2M in final 3 weeks year-end spending rush 12 departments", jurisdiction:"Texas" },
  { id:"full",          flag:"🔵", flagLabel:"Combined Risk",        title:"Full Austin 2025 Portfolio",        meta:"$372M total · All 6 flags · 264 NIGP classes · 2,847 vendors",  amount:"$372,988,798 total",    queryText:"Full procurement portfolio $372M total spend 2847 vendors 264 NIGP classes all risk flags maverick PO splitting vendor concentration", jurisdiction:"Texas" },
];
const NAV_GROUPS = [
  { id:"overview",  label:"Overview",  tabs:[{ id:"profile",  label:"Profile",  icon:"◈" }] },
  { id:"configure", label:"Configure", tabs:[
    { id:"resume",   label:"Resume",   icon:"▣" },
    { id:"training", label:"Training", icon:"◎" },
    { id:"playbook", label:"Playbook", icon:"⬟" },
  ]},
  { id:"operate",   label:"Operate",   tabs:[
    { id:"workflow", label:"Assignments",        icon:"⬡" },
    { id:"projects", label:"Completed Projects", icon:"◰" },
  ]},
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function skillLabel(s){ return s<30?"Trainee":s<55?"Developing":s<75?"Proficient":s<90?"Expert":"Principal"; }
function fmt$(n){ return "$"+Math.round(n).toLocaleString(); }
function readinessColor(s){ return s>=80?T.moss:s>=55?T.brass:s>=30?"#c47a20":T.flag; }
function readinessLabel(s){ return s>=80?"High Confidence":s>=55?"Moderate":s>=30?"Developing":"Needs Setup"; }
function priorityInfo(v){ if(v>=80)return{label:"Critical",color:T.flag}; if(v>=65)return{label:"High",color:T.brass}; if(v>=40)return{label:"Medium",color:T.navy}; return{label:"Low",color:T.muted}; }

// ── API helpers ───────────────────────────────────────────────────────────────
async function apiGetConfigs(agent_id, type) {
  const res = await fetch(`/api/agent-configs?tenant_id=global&agent_id=${agent_id}&type=${type}`);
  if (!res.ok) throw new Error("Failed to load configs");
  const data = await res.json();
  return data.configs || [];
}

async function apiSaveConfig(payload) {
  const res = await fetch("/api/agent-configs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, tenant_id: "global" }),
  });
  if (!res.ok) throw new Error("Failed to save config");
  return (await res.json()).config;
}

async function apiPatchConfig(id, fields) {
  const res = await fetch("/api/agent-configs", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, tenant_id: "global", ...fields }),
  });
  if (!res.ok) throw new Error("Failed to update config");
  return (await res.json()).config;
}

async function apiDeleteConfig(id) {
  const res = await fetch("/api/agent-configs", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, tenant_id: "global" }),
  });
  if (!res.ok) throw new Error("Failed to delete config");
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function Corners({ color=T.brass }){
  return(<>
    <svg width="10" height="10" style={{position:"absolute",top:4,left:4,color}} viewBox="0 0 10 10" fill="currentColor"><path d="M0 0h4v1H1v3H0V0z"/></svg>
    <svg width="10" height="10" style={{position:"absolute",top:4,right:4,color}} viewBox="0 0 10 10" fill="currentColor"><path d="M10 0H6v1h3v3h1V0z"/></svg>
    <svg width="10" height="10" style={{position:"absolute",bottom:4,left:4,color}} viewBox="0 0 10 10" fill="currentColor"><path d="M0 10h4v-1H1V6H0v4z"/></svg>
    <svg width="10" height="10" style={{position:"absolute",bottom:4,right:4,color}} viewBox="0 0 10 10" fill="currentColor"><path d="M10 10H6v-1h3V6h1v4z"/></svg>
  </>);
}

const AISugg = () => (
  <span style={{fontFamily:mono,fontSize:8,background:"rgba(155,110,243,0.12)",border:"1px solid rgba(155,110,243,0.3)",padding:"1px 5px",color:"#9b6ef3",letterSpacing:.3}}>AI SUGGESTED</span>
);

function SkillBar({ skill, color=T.brass }){
  return(
    <div>
      <div style={{height:6,background:T.paperDeep,border:`1px solid ${T.lineSoft}`,position:"relative"}}>
        <div style={{position:"absolute",inset:0,right:`${100-skill}%`,background:`linear-gradient(90deg,${color},${T.brassDeep})`}}/>
        {[30,55,75,90].map(t=><div key={t} style={{position:"absolute",top:-2,bottom:-2,left:`${t}%`,width:1,background:T.line}}/>)}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontFamily:mono,fontSize:8,color:T.muted,marginTop:3}}>
        <span>Trainee</span><span>Developing</span><span>Proficient</span><span>Expert</span><span>Principal</span>
      </div>
    </div>
  );
}

// ── Config Card — shared by Resume (role_prompt) and Playbook (output_format) ─
function ConfigCard({ config, onSetDefault, onToggleSelectable, onEdit, onDelete, editingId, setEditingId, showToast }) {
  const [editText, setEditText] = useState(config.text);
  const [editName, setEditName] = useState(config.name);
  const [saving, setSaving] = useState(false);
  const isEditing = editingId === config.id;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiPatchConfig(config.id, { name: editName, text: editText });
      onEdit(updated);
      setEditingId(null);
      showToast("Saved ✦");
    } catch (e) { showToast("Save failed","⚠"); }
    setSaving(false);
  };

  return (
    <div style={{border:`1px solid ${config.is_default?T.moss:T.lineSoft}`,marginBottom:9,background:config.is_default?`${T.moss}06`:"transparent"}}>
      {/* Header row */}
      <div style={{padding:"8px 12px",display:"flex",alignItems:"center",gap:8,borderBottom:`1px solid ${config.is_default?T.moss+"30":T.lineSoft}`,flexWrap:"wrap"}}>
        <div style={{fontFamily:body,fontSize:12,fontWeight:600,color:config.is_default?T.moss:T.ink,flex:1,minWidth:120}}>{config.name}</div>

        {/* Default badge / Set Default button */}
        {config.is_default
          ? <span style={{fontFamily:mono,fontSize:8.5,padding:"1px 7px",background:`${T.moss}15`,color:T.moss,border:`1px solid ${T.moss}`,fontWeight:700}}>● DEFAULT</span>
          : <button onClick={()=>onSetDefault(config.id)} style={{fontFamily:mono,fontSize:8.5,color:T.brass,background:"transparent",border:`1px solid ${T.brass}`,padding:"1px 8px",cursor:"pointer",fontWeight:700}}>Set Default</button>
        }

        {/* Expose to users toggle */}
        <button
          onClick={()=>onToggleSelectable(config.id, !config.is_user_selectable)}
          title="When on, users can choose this option in the analysis UI"
          style={{fontFamily:mono,fontSize:8.5,padding:"1px 8px",cursor:"pointer",border:`1px solid ${config.is_user_selectable?T.brass:T.lineSoft}`,background:config.is_user_selectable?`${T.brass}15`:"transparent",color:config.is_user_selectable?T.brassDeep:T.muted,letterSpacing:.3}}
        >
          {config.is_user_selectable?"◎ User Selectable":"○ Admin Only"}
        </button>

        {/* Edit / Delete */}
        <button onClick={()=>setEditingId(isEditing?null:config.id)} style={{fontFamily:mono,fontSize:8.5,color:T.muted,background:"transparent",border:`1px solid ${T.lineSoft}`,padding:"1px 8px",cursor:"pointer",textTransform:"uppercase",letterSpacing:.5}}>{isEditing?"Close":"Edit"}</button>
        {!config.is_default&&(
          <button onClick={()=>onDelete(config.id)} style={{fontFamily:mono,fontSize:8.5,color:T.flag,background:"transparent",border:`1px solid ${T.flag}30`,padding:"1px 8px",cursor:"pointer",textTransform:"uppercase",letterSpacing:.5}}>Delete</button>
        )}
      </div>

      {/* Edit form */}
      {isEditing ? (
        <div style={{padding:"10px 12px"}}>
          <input value={editName} onChange={e=>setEditName(e.target.value)} style={{width:"100%",background:T.paper,border:`1px solid ${T.lineSoft}`,padding:"6px 10px",fontFamily:body,fontSize:12,color:T.ink,outline:"none",marginBottom:8,boxSizing:"border-box"}}/>
          <textarea value={editText} onChange={e=>setEditText(e.target.value)} rows={6}
            style={{width:"100%",background:T.paper,border:`1px solid ${T.lineSoft}`,padding:"9px 11px",fontFamily:mono,fontSize:11,color:T.ink,lineHeight:1.6,resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
          <div style={{display:"flex",justifyContent:"flex-end",gap:7,marginTop:7}}>
            <button onClick={()=>setEditingId(null)} style={{fontFamily:mono,fontSize:9,color:T.muted,background:"transparent",border:`1px solid ${T.lineSoft}`,padding:"4px 11px",cursor:"pointer",textTransform:"uppercase"}}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{fontFamily:mono,fontSize:9,color:T.moss,background:"transparent",border:`1px solid ${T.moss}`,padding:"4px 11px",cursor:"pointer",fontWeight:700,textTransform:"uppercase"}}>{saving?"Saving…":"Save"}</button>
          </div>
        </div>
      ) : (
        <div style={{padding:"9px 12px",fontFamily:mono,fontSize:10.5,color:T.mutedDeep,lineHeight:1.6,maxHeight:50,overflow:"hidden",maskImage:"linear-gradient(to bottom,black 50%,transparent 100%)"}}>{config.text}</div>
      )}
    </div>
  );
}

// ── Add Config Form — shared by Resume and Playbook ───────────────────────────
function AddConfigForm({ type, agentId, onSaved, onCancel, showToast }) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [isSelectable, setIsSelectable] = useState(false);
  const [saving, setSaving] = useState(false);

  const placeholder = type === "role_prompt"
    ? "You are [Name], a [role] with [X] years of experience in [specialty]..."
    : "Return a structured [format type] with the following sections:\n1. ...";

  const handleSave = async () => {
    if (!name.trim() || !text.trim()) { showToast("Name and content required","⚠"); return; }
    setSaving(true);
    try {
      const config = await apiSaveConfig({ agent_id: agentId, type, name: name.trim(), text: text.trim(), is_default: isDefault, is_user_selectable: isSelectable });
      onSaved(config);
      showToast("Added ✦");
    } catch (e) { showToast("Save failed: "+e.message,"⚠"); }
    setSaving(false);
  };

  return (
    <div style={{border:`1px solid ${T.brass}`,background:`${T.brass}05`,padding:"12px 14px",marginTop:8}}>
      <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.3,fontWeight:600,marginBottom:10}}>New {type==="role_prompt"?"Role Prompt":"Output Format"}</div>
      <div style={{marginBottom:9}}>
        <div style={{fontFamily:mono,fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Name</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder={type==="role_prompt"?"e.g. Board Presentation Mode":"e.g. Audit Report Format"}
          style={{width:"100%",background:T.paper,border:`1px solid ${T.lineSoft}`,padding:"7px 10px",fontFamily:body,fontSize:12,color:T.ink,outline:"none",boxSizing:"border-box"}}/>
      </div>
      <div style={{marginBottom:9}}>
        <div style={{fontFamily:mono,fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Prompt Text</div>
        <textarea value={text} onChange={e=>setText(e.target.value)} rows={5} placeholder={placeholder}
          style={{width:"100%",background:T.paper,border:`1px solid ${T.lineSoft}`,padding:"8px 10px",fontFamily:mono,fontSize:11,color:T.ink,lineHeight:1.6,resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
      </div>
      <div style={{display:"flex",gap:14,marginBottom:12}}>
        <label style={{display:"flex",alignItems:"center",gap:6,fontFamily:body,fontSize:12,color:T.mutedDeep,cursor:"pointer"}}>
          <input type="checkbox" checked={isDefault} onChange={e=>setIsDefault(e.target.checked)} style={{accentColor:T.moss}}/>
          Set as default
        </label>
        <label style={{display:"flex",alignItems:"center",gap:6,fontFamily:body,fontSize:12,color:T.mutedDeep,cursor:"pointer"}}>
          <input type="checkbox" checked={isSelectable} onChange={e=>setIsSelectable(e.target.checked)} style={{accentColor:T.brass}}/>
          Expose to users in analysis UI
        </label>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
        <button onClick={onCancel} style={{fontFamily:body,fontSize:12,color:T.muted,background:"transparent",border:`1px solid ${T.line}`,padding:"6px 14px",cursor:"pointer"}}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{fontFamily:body,fontSize:12,color:T.navy,background:`linear-gradient(135deg,${T.brass},${T.brassDeep})`,border:"none",padding:"6px 16px",cursor:"pointer",fontWeight:700}}>{saving?"Saving…":"Add Prompt"}</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE HEADER — paper bg, brass 2px underline
// ══════════════════════════════════════════════════════════════════════════════
function PageHeader({ agent, activeTab, subView }) {
  const labels = {
    profile:"Profile", resume:"Resume",
    training: subView==="teach"?"Training · Add Document": subView==="test"?"Training · Test Agent":"Training",
    playbook:"Playbook", workflow:"Assignments", projects:"Completed Projects",
  };
  return (
    <div style={{background:T.paper,padding:"16px 24px 0",borderBottom:`2px solid ${T.brass}`,flexShrink:0}}>
      <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.8,fontWeight:600,marginBottom:4}}>
        Personnel File · {agent.code} · {agent.trainer} Bench · {labels[activeTab]||activeTab}
      </div>
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",paddingBottom:13}}>
        <div>
          <div style={{fontFamily:display,fontSize:26,fontWeight:500,color:T.navy,letterSpacing:"-.5px",lineHeight:1,marginBottom:4}}>
            The personnel file of {agent.name}.
          </div>
          <div style={{fontFamily:body,fontStyle:"italic",fontSize:13,color:T.mutedDeep}}>
            Tenure · {agent.hiredOn} · {skillLabel(agent.skill)}-level analyst
          </div>
        </div>
        <div style={{display:"flex",gap:16,alignItems:"center",paddingBottom:2}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:mono,fontSize:8,color:T.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:1}}>Situational Awareness</div>
            <div style={{fontFamily:display,fontSize:18,fontWeight:700,color:agent.situational>=30?T.brass:T.muted,lineHeight:1}}>{agent.situational}%</div>
          </div>
          <div style={{width:1,height:30,background:T.lineSoft}}/>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:mono,fontSize:8,color:T.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:1}}>Readiness</div>
            <div style={{fontFamily:display,fontSize:18,fontWeight:700,color:readinessColor(agent.skill),lineHeight:1}}>{agent.skill}<span style={{fontFamily:mono,fontSize:9,color:T.muted,fontWeight:400}}>/100</span></div>
          </div>
          <div style={{width:1,height:30,background:T.lineSoft}}/>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:mono,fontSize:8,color:T.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:1}}>Skill</div>
            <div style={{fontFamily:display,fontSize:18,fontWeight:700,color:T.brassDeep,lineHeight:1}}>{agent.skill}<span style={{fontFamily:mono,fontSize:9,color:T.muted,fontWeight:400}}>/100</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROFILE TAB — static/visual only
// ══════════════════════════════════════════════════════════════════════════════
function ProfileTab({ agent }) {
  const layers = [
    { num:"01", label:"Role & Behavior",  tab:"Resume",   strength:agent.skill>60?80:50 },
    { num:"02", label:"Background (RAG)", tab:"Training", strength:agent.chunks>0?Math.min(90,Math.round(agent.chunks/10)):10 },
    { num:"03", label:"Analysis Payload", tab:"Auto",     strength:88 },
    { num:"04", label:"Output Structure", tab:"Playbook", strength:60 },
    { num:"05", label:"Guardrails",       tab:"Playbook", strength:42 },
  ];
  const readiness = Math.round(layers.reduce((s,l)=>s+l.strength,0)/layers.length);

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,alignItems:"start"}}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {/* ID Badge */}
        <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"16px 14px 12px",textAlign:"center",position:"relative"}}>
          <Corners color={agent.color||T.moss}/>
          <div style={{fontFamily:mono,fontSize:8,color:T.brassDeep,textTransform:"uppercase",letterSpacing:2,fontWeight:600,marginBottom:10}}>Bureau of Procurement Intelligence</div>
          <div style={{width:92,height:92,borderRadius:"50%",background:T.paperDeep,border:`2px solid ${agent.color||T.moss}`,margin:"0 auto 8px",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:display,fontSize:32,fontWeight:700,color:agent.color||T.moss}}>{agent.name[0]}</div>
          <div style={{fontFamily:display,fontSize:16,fontWeight:600,color:T.navy,lineHeight:1.1}}>{agent.name}</div>
          <div style={{fontFamily:body,fontSize:11,color:T.mutedDeep,marginTop:2,fontStyle:"italic"}}>{agent.role}</div>
          <div style={{display:"flex",justifyContent:"center",gap:5,marginTop:8,flexWrap:"wrap"}}>
            <span style={{fontFamily:mono,fontSize:9,padding:"2px 7px",background:`${T.muted}12`,color:T.mutedDeep,border:`1px solid ${T.line}`}}>{agent.code}</span>
            <span style={{fontFamily:mono,fontSize:9,padding:"2px 7px",background:`${T.moss}12`,color:T.moss,border:`1px solid ${T.moss}`,fontWeight:700}}>● ACTIVE</span>
            {agent.trainable&&<span style={{fontFamily:mono,fontSize:9,padding:"2px 7px",background:`${T.moss}15`,color:T.moss,border:`1px solid ${T.moss}40`}}>● YOUR TRAINEE</span>}
          </div>
          <div style={{marginTop:10,padding:"7px 10px",background:`${T.moss}08`,border:`1px solid ${T.moss}30`,fontFamily:display,fontStyle:"italic",fontSize:11.5,color:T.moss}}>{agent.quip}</div>
        </div>
        {/* Compensation */}
        <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"13px 15px",position:"relative"}}>
          <Corners/>
          <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.5,fontWeight:600,marginBottom:8}}>Compensation · FY2026 · The Ledger</div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <div><div style={{fontFamily:body,fontSize:8.5,color:T.muted,textTransform:"uppercase",letterSpacing:1.2,fontWeight:600,marginBottom:1}}>Salary Equiv.</div><div style={{fontFamily:display,fontSize:19,fontWeight:600,color:T.navy,fontVariantNumeric:"tabular-nums"}}>{fmt$(agent.salary)}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontFamily:body,fontSize:8.5,color:T.muted,textTransform:"uppercase",letterSpacing:1.2,fontWeight:600,marginBottom:1}}>Yearly Value</div><div style={{fontFamily:display,fontSize:19,fontWeight:600,color:T.moss,fontVariantNumeric:"tabular-nums"}}>{fmt$(agent.value)}</div></div>
          </div>
          {[["Hourly rate",`$${agent.hourly}`],["Hours / report",`${agent.reportHrs}h`],["Cost / report",fmt$(agent.reportCost)],["Revenue model",agent.revenueModel]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${T.lineSoft}`,fontSize:11}}>
              <span style={{color:T.mutedDeep}}>{k}</span>
              <span style={{fontFamily:mono,fontSize:10.5,color:T.ink}}>{v}</span>
            </div>
          ))}
          <div style={{marginTop:7,fontFamily:body,fontSize:10,color:T.muted,fontStyle:"italic"}}><strong style={{fontStyle:"normal"}}>Mock data.</strong> Live billing in v5.</div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {/* Readiness */}
        <div style={{background:T.navy,padding:"14px 18px",position:"relative",border:`1px solid ${T.brass}30`}}>
          <Corners color={T.brass}/>
          <div style={{fontFamily:mono,fontSize:8.5,color:T.brassLight,textTransform:"uppercase",letterSpacing:1.8,fontWeight:600,marginBottom:7}}>Agent Readiness Score</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:12,marginBottom:9}}>
            <div style={{fontFamily:display,fontSize:44,fontWeight:700,color:readinessColor(readiness),lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{readiness}</div>
            <div style={{paddingBottom:4}}><div style={{fontFamily:mono,fontSize:10,color:readinessColor(readiness),fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{readinessLabel(readiness)}</div><div style={{fontFamily:body,fontSize:10,color:"#8fa3bf",marginTop:1}}>weighted composite · 5 layers</div></div>
          </div>
          <div style={{height:6,background:"rgba(255,255,255,0.1)",marginBottom:12}}><div style={{height:"100%",width:`${readiness}%`,background:readinessColor(readiness)}}/></div>
          {layers.map(l=>(
            <div key={l.num} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
              <div style={{fontFamily:mono,fontSize:8,color:"#8fa3bf",width:14,flexShrink:0}}>{l.num}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontFamily:body,fontSize:10,color:T.card}}>{l.label}</span><span style={{fontFamily:mono,fontSize:9,color:readinessColor(l.strength),fontWeight:700}}>{l.strength}</span></div>
                <div style={{height:3,background:"rgba(255,255,255,0.08)"}}><div style={{height:"100%",width:`${l.strength}%`,background:readinessColor(l.strength)}}/></div>
              </div>
              <div style={{fontFamily:mono,fontSize:7.5,color:"#8fa3bf",width:50,flexShrink:0,textAlign:"right",fontStyle:"italic"}}>{l.tab}</div>
            </div>
          ))}
        </div>
        {/* Intelligence assembly */}
        <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"13px 15px",position:"relative"}}>
          <Corners/>
          <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.5,fontWeight:600,marginBottom:4}}>Intelligence Configuration</div>
          <div style={{fontFamily:display,fontSize:14,fontWeight:600,color:T.navy,marginBottom:10}}>How {agent.name.split(" ")[0]}'s prompt is assembled</div>
          <div style={{display:"flex",alignItems:"stretch",marginBottom:10}}>
            {layers.map((l,i)=>(
              <div key={l.num} style={{flex:1,textAlign:"center",padding:"8px 4px",background:`${readinessColor(l.strength)}12`,border:`1px solid ${readinessColor(l.strength)}35`,borderRight:i<layers.length-1?"none":""}}>
                <div style={{fontFamily:mono,fontSize:9,fontWeight:700,color:readinessColor(l.strength),marginBottom:2}}>{l.num}</div>
                <div style={{fontFamily:body,fontSize:8.5,color:T.navy,lineHeight:1.2,marginBottom:3}}>{l.label}</div>
                <div style={{fontFamily:mono,fontSize:8,color:readinessColor(l.strength),fontWeight:700}}>{l.strength}/100</div>
              </div>
            ))}
          </div>
          <div style={{fontFamily:body,fontSize:11,color:T.mutedDeep,lineHeight:1.5,fontStyle:"italic"}}>Configure each layer in Resume, Training, and Playbook tabs.</div>
        </div>
        {/* Quick stats */}
        <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"13px 15px",position:"relative"}}>
          <Corners/>
          <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.5,fontWeight:600,marginBottom:10}}>Quick Stats</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
            {[["Skill",`${agent.skill}/100`,skillLabel(agent.skill),T.brassDeep],["Documents",agent.docs,"training docs",T.navy],["Reports Run","—","mock data",T.moss]].map(([l,v,s,c])=>(
              <div key={l}><div style={{fontFamily:body,fontSize:8,color:T.muted,textTransform:"uppercase",letterSpacing:1.2,fontWeight:600,marginBottom:1}}>{l}</div><div style={{fontFamily:display,fontSize:18,fontWeight:600,color:c,fontVariantNumeric:"tabular-nums",lineHeight:1}}>{v}</div><div style={{fontFamily:mono,fontSize:8.5,color:T.muted,marginTop:1}}>{s}</div></div>
            ))}
          </div>
          <div style={{paddingTop:10,borderTop:`1px solid ${T.lineSoft}`,marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
              <div style={{fontFamily:body,fontSize:8.5,color:T.muted,textTransform:"uppercase",letterSpacing:1.2,fontWeight:600}}>Situational Awareness</div>
              <div style={{fontFamily:mono,fontSize:11,fontWeight:700,color:agent.situational>=30?T.brass:T.muted}}>{agent.situational}%</div>
            </div>
            <div style={{height:7,background:T.paperDeep,border:`1px solid ${T.lineSoft}`,position:"relative",borderRadius:1}}>
              <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${agent.situational}%`,background:agent.situational>=30?T.brass:T.muted,borderRadius:1}}/>
            </div>
          </div>
          <div style={{paddingTop:10,borderTop:`1px solid ${T.lineSoft}`}}>
            <div style={{fontFamily:body,fontSize:8.5,color:T.muted,textTransform:"uppercase",letterSpacing:1.2,fontWeight:600,marginBottom:5}}>Skill Level</div>
            <SkillBar skill={agent.skill} color={agent.color||T.moss}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RESUME TAB — LIVE: loads/saves role_prompt configs
// ══════════════════════════════════════════════════════════════════════════════
function ResumeTab({ agent, showToast }) {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiGetConfigs(agent.id, "role_prompt")
      .then(setConfigs)
      .catch(() => showToast("Could not load role prompts","⚠"))
      .finally(() => setLoading(false));
  }, [agent.id]);

  const handleSetDefault = async (id) => {
    try {
      const updated = await apiPatchConfig(id, { is_default: true });
      // Refresh — server cleared other defaults
      const fresh = await apiGetConfigs(agent.id, "role_prompt");
      setConfigs(fresh);
      showToast("Default updated ✦");
    } catch { showToast("Failed to set default","⚠"); }
  };

  const handleToggleSelectable = async (id, val) => {
    try {
      await apiPatchConfig(id, { is_user_selectable: val });
      setConfigs(prev => prev.map(c => c.id===id ? {...c,is_user_selectable:val} : c));
      showToast(val?"Now user-selectable ✦":"Hidden from users");
    } catch { showToast("Update failed","⚠"); }
  };

  const handleEdit = (updated) => {
    setConfigs(prev => prev.map(c => c.id===updated.id ? updated : c));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this role prompt permanently?")) return;
    try {
      await apiDeleteConfig(id);
      setConfigs(prev => prev.filter(c => c.id!==id));
      showToast("Deleted 🗑");
    } catch { showToast("Delete failed","⚠"); }
  };

  const handleAdded = (config) => {
    setConfigs(prev => {
      const updated = config.is_default ? prev.map(c=>({...c,is_default:false})) : prev;
      return [...updated, config];
    });
    setShowAdd(false);
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:18,alignItems:"start"}}>
      {/* LEFT: vitals + skill ladder */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"13px 15px",position:"relative"}}>
          <Corners/>
          <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.8,fontWeight:600,marginBottom:9}}>Resume · Vitals</div>
          {[["Architecture",agent.arch],["Specialty",agent.specialty],["Trainer",agent.trainer],["Update Cadence","Quarterly"],["Update Rights",`${agent.trainer} admin`],["Visibility","Configurable"]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${T.lineSoft}`,fontSize:11}}>
              <span style={{color:T.muted,fontWeight:500}}>{k}</span>
              <span style={{fontFamily:mono,fontSize:10.5,color:T.ink,textAlign:"right",maxWidth:130}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"13px 15px"}}>
          <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.8,fontWeight:600,marginBottom:9}}>Skill Ladder</div>
          {[["Trainee","0–30"],["Developing","30–55"],["Proficient","55–75"],["Expert","75–90"],["Principal","90–100"]].map(([label,range])=>{
            const active = (label==="Trainee"&&agent.skill<30)||(label==="Developing"&&agent.skill>=30&&agent.skill<55)||(label==="Proficient"&&agent.skill>=55&&agent.skill<75)||(label==="Expert"&&agent.skill>=75&&agent.skill<90)||(label==="Principal"&&agent.skill>=90);
            return(
              <div key={label} style={{display:"flex",justifyContent:"space-between",padding:"5px 8px",marginBottom:2,background:active?`${T.moss}15`:"transparent",border:active?`1px solid ${T.moss}40`:"1px solid transparent"}}>
                <span style={{fontFamily:body,fontSize:11.5,fontWeight:active?700:400,color:active?T.moss:T.mutedDeep}}>{active?"▸ ":""}{label}</span>
                <span style={{fontFamily:mono,fontSize:10.5,color:active?T.moss:T.muted}}>{range}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: live role prompt configs */}
      <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"15px 18px",position:"relative"}}>
        <Corners/>
        <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.5,fontWeight:600,marginBottom:4}}>Layer 01 · Role & Behavior</div>
        <div style={{fontFamily:display,fontSize:16,fontWeight:600,color:T.navy,marginBottom:6}}>Who is {agent.name.split(" ")[0]}, and how does he think?</div>
        <div style={{fontFamily:body,fontSize:12,color:T.mutedDeep,lineHeight:1.6,marginBottom:14,padding:"9px 13px",background:T.cardAlt,borderLeft:`3px solid ${T.brass}`}}>
          First block sent to the LLM. Defines expertise, experience level, and communication style. Set one as <strong>Default</strong> for automatic use. Toggle <strong>User Selectable</strong> to expose it in the analysis dropdown.
        </div>

        {loading && <div style={{fontFamily:body,fontSize:12,color:T.muted,fontStyle:"italic",padding:"20px 0",textAlign:"center"}}>Loading…</div>}

        {!loading && configs.map(config => (
          <ConfigCard key={config.id} config={config}
            onSetDefault={handleSetDefault}
            onToggleSelectable={handleToggleSelectable}
            onEdit={handleEdit}
            onDelete={handleDelete}
            editingId={editingId}
            setEditingId={setEditingId}
            showToast={showToast}
          />
        ))}

        {!loading && !showAdd && (
          <button onClick={()=>setShowAdd(true)} style={{width:"100%",padding:"9px",background:"transparent",border:`1px dashed ${T.lineSoft}`,color:T.brassDeep,fontFamily:body,fontSize:12,cursor:"pointer",marginTop:4,fontWeight:500}}>+ Add New Role Prompt</button>
        )}

        {showAdd && (
          <AddConfigForm type="role_prompt" agentId={agent.id} onSaved={handleAdded} onCancel={()=>setShowAdd(false)} showToast={showToast}/>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TRAINING TAB — LIVE: inline teach + test sub-views
// ══════════════════════════════════════════════════════════════════════════════
function TrainingTab({ agent, entries, entriesLoading, onEditEntry, onDeleteEntry, showToast }) {
  const [subView, setSubView] = useState("list");

  // Teach state
  const [uploadState, setUploadState] = useState("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [extractedOpen, setExtractedOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ title:"", category:"Standards", jurisdiction:"All", priority:50, triggers:[], teaching_note:"" });
  const [expandedEntries, setExpandedEntries] = useState({});
  const toggleEntryExpand = (id) => setExpandedEntries(s=>({...s,[id]:!s[id]}));
  const fileRef = useRef(null);
  const pInfo = priorityInfo(form.priority);
  const locked = uploadState !== "ready";

  // Test state
  const [testStage, setTestStage] = useState(2);
  const [selectedScenario, setSelectedScenario] = useState(BEE_SCENARIOS[0]);
  const [runState, setRunState] = useState("idle");
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState("");
  const [promptOpen, setPromptOpen] = useState({ prompt:false, rag:false });
  const [ragEntries, setRagEntries] = useState([]);
  const [promptText, setPromptText] = useState("");

  // Config selectors for test console
  const [roleConfigs, setRoleConfigs] = useState([]);
  const [formatConfigs, setFormatConfigs] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedFormatId, setSelectedFormatId] = useState("");

  useEffect(() => {
    if (subView === "test") {
      apiGetConfigs(agent.id, "role_prompt").then(cs => {
        setRoleConfigs(cs);
        const def = cs.find(c=>c.is_default);
        if (def) setSelectedRoleId(def.id);
      }).catch(()=>{});
      apiGetConfigs(agent.id, "output_format").then(cs => {
        setFormatConfigs(cs);
        const def = cs.find(c=>c.is_default);
        if (def) setSelectedFormatId(def.id);
      }).catch(()=>{});
    }
  }, [subView, agent.id]);

  const handleFile = async (file) => {
    if (!file) return;
    setUploadState("uploading"); setUploadProgress(0); setUploadedFile(file);
    let prog = 0;
    const ticker = setInterval(() => { prog += Math.random()*18+8; if(prog>=90){clearInterval(ticker);prog=90;} setUploadProgress(Math.min(90,prog)); }, 180);
    try {
      const reader = new FileReader();
      const base64 = await new Promise((res,rej) => {
        reader.onload = e => res(e.target.result.split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const extractRes = await fetch("/api/extract", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ fileData: base64, fileType: file.type, fileName: file.name }) });
      const extractData = await extractRes.json();
      clearInterval(ticker); setUploadProgress(100);
      if (!extractRes.ok || !extractData.text) { setUploadState("idle"); showToast(extractData.error||"Could not extract text","⚠"); return; }
      setExtractedText(extractData.text); setWordCount(extractData.wordCount||0);
      await new Promise(r=>setTimeout(r,400));
      setUploadState("ready");
      showToast("✨ Claude is analyzing your document…","✨");
      // Auto-generate metadata
      try {
        const categoryList = agent.id==="brent"
          ? "Portal Navigation, Data Schema, Export Method, Auth Pattern, State Portal, Open Records, Research Method, Data Dictionary, Compliance, Best Practice, Standards"
          : "Compliance, Jurisdiction, Best Practice, Internal, Standards, Methodology, Playbook, Template, Statute";
        const metaRes = await fetch("/api/brief", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ system:"You are a procurement document classifier. Return ONLY valid JSON — no markdown fences.", messages:[{role:"user",content:`Classify this doc. Return ONLY JSON: {"title":"...","category":"one of: ${categoryList}","jurisdiction":"one of: All, Federal, Texas, California, Florida, New York, Illinois","priority":<0-100>,"triggers":<array from: ["maverick","po-split","spike","single-source","vendor-hhi","long-tail"] or ["all"]>}\n\nFile: ${file.name}\n\n${extractData.text.slice(0,3000)}`}] }) });
        const metaJson = await metaRes.json();
        const raw = metaJson.content?.[0]?.text||"";
        const parsed = JSON.parse(raw.replace(/^```json\s*/i,"").replace(/```\s*$/,"").trim());
        setForm(f=>({...f, title:parsed.title||f.title, category:parsed.category||f.category, jurisdiction:parsed.jurisdiction||f.jurisdiction, priority:parsed.priority??f.priority, triggers:Array.isArray(parsed.triggers)?parsed.triggers:f.triggers}));
        showToast("Metadata generated — review before saving");
      } catch { showToast("Could not auto-generate metadata — fill in manually","⚠"); }
    } catch (err) { clearInterval(ticker); setUploadState("idle"); showToast(err.message||"Upload failed","⚠"); }
  };

  const toggleTrigger = (id) => {
    if(id==="all"){ setForm(f=>({...f,triggers:f.triggers.includes("all")?[]:["all"]})); return; }
    setForm(f=>{ const base=f.triggers.filter(t=>t!=="all"); return{...f,triggers:base.includes(id)?base.filter(t=>t!==id):[...base,id]}; });
  };

  const handleSave = async () => {
    if (!form.title || !extractedText) { showToast("Title and document text are required","⚠"); return; }
    setIsSaving(true);
    try {
      const res = await fetch("/api/ingest", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ ...form, content: extractedText, tenant_id:"global", agent_id: agent.id, teaching_note: form.teaching_note||null }) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error||"Save failed","⚠"); setIsSaving(false); return; }
      showToast("Document indexed ✦");
      setSubView("list");
      setUploadState("idle"); setUploadedFile(null); setExtractedText(""); setWordCount(0);
      setForm({ title:"", category:"Standards", jurisdiction:"All", priority:50, triggers:[], teaching_note:"" });
    } catch (err) { showToast("Network error: "+err.message,"⚠"); }
    setIsSaving(false);
  };

  const runTest = async () => {
    setRunState("running"); setTestResult(null); setTestError(""); setRagEntries([]); setPromptText("");
    const scenarioMsg = `Analyze this government procurement spend scenario for the City of Austin, Texas:\n\nScenario: ${selectedScenario.title}\nDetails: ${selectedScenario.meta}\nAmount at risk: ${selectedScenario.amount}\n\nProvide: 1) Executive summary 2) Key findings 3) Three specific recommended actions.`;
    try {
      // RAG query
      const ragRes = await fetch("/api/rag-query", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ queryText: selectedScenario.queryText, jurisdiction: selectedScenario.jurisdiction, matchCount:5, tenant_id:"global", agent_id: agent.id }) });
      const ragJson = await ragRes.json();
      setRagEntries(ragJson.entries||[]);

      // Brief with full prompt assembly
      const briefRes = await fetch("/api/brief", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({
        messages: [{ role:"user", content: scenarioMsg }],
        agent_id: agent.id,
        tenant_id: "global",
        role_prompt_id: selectedRoleId || undefined,
        output_format_id: selectedFormatId || undefined,
        ragContext: { queryText: selectedScenario.queryText, jurisdiction: selectedScenario.jurisdiction, triggers:[] },
      })});
      const briefJson = await briefRes.json();
      const text = briefJson.content?.[0]?.text || briefJson.error || "No response";
      setTestResult({ text, debug: briefJson._debug, system: briefJson._system||null });
      setRunState("done"); setTestStage(3);
      showToast("🐝 Test complete","🐝");
    } catch (err) { setTestError(err.message); setRunState("error"); showToast("Test failed: "+err.message,"⚠"); }
  };

  const agentEntries = entries.filter(e => e.agent_id===agent.id || (e.agent_id==="legacy"&&agent.id==="robyn"));
  const catColors = { Compliance:T.brass,Jurisdiction:T.navy,Standards:T.brass,Methodology:T.navy,"Best Practice":T.moss,Internal:T.muted,Playbook:T.flag,Template:T.moss,Statute:T.navy };

  // ── LIST ───────────────────────────────────────────────────────────────────
  if (subView==="list") return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:T.navy,padding:"11px 18px",display:"flex",gap:22,alignItems:"center",border:`1px solid ${T.brass}30`}}>
        {[["Documents",agent.docs,T.card],["Class Hrs",agent.classes,T.brassLight],["Chunks",agent.chunks,"#8fa3bf"],["~Tokens",agent.chunks>0?(agent.chunks*0.74/1000).toFixed(0)+"K":"0","#8fa3bf"]].map(([k,v,c])=>(
          <div key={k}><div style={{fontFamily:mono,fontSize:8,color:"#8fa3bf",textTransform:"uppercase",letterSpacing:1.2,marginBottom:2}}>{k}</div><div style={{fontFamily:display,fontSize:17,fontWeight:600,color:c,fontVariantNumeric:"tabular-nums"}}>{v||"0"}</div></div>
        ))}
        <div style={{flex:1}}/>
        <button onClick={()=>setSubView("test")} style={{background:"transparent",border:`1px solid ${T.brassLight}`,color:T.brassLight,padding:"6px 14px",fontFamily:body,fontSize:12,fontWeight:600,cursor:"pointer",marginRight:7}}>🐝 Test Agent</button>
        {agent.trainable && <button onClick={()=>setSubView("teach")} style={{background:T.brass,border:"none",color:T.navy,padding:"6px 14px",fontFamily:body,fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add Courses</button>}
      </div>
      <div style={{background:T.cardAlt,border:`1px dashed ${T.lineSoft}`,padding:"9px 13px"}}>
        <div style={{fontFamily:mono,fontSize:8.5,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.3,fontWeight:600,marginBottom:3}}>How Background Knowledge Works · Layer 02</div>
        <div style={{fontFamily:body,fontSize:11.5,color:T.mutedDeep,lineHeight:1.5}}>Documents are stored in vector format. Before each analysis, the system queries this library and injects the most relevant rules, statutes, and standards as Layer 02 of the prompt.</div>
      </div>
      <div style={{background:T.card,border:`1px solid ${T.line}`}}>
        <div style={{padding:"10px 15px",borderBottom:`1px solid ${T.line}`,display:"flex",alignItems:"baseline",justifyContent:"space-between"}}>
          <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.5,fontWeight:600}}>Exhibit I · Training Courses</div>
          <div style={{fontFamily:mono,fontSize:10,color:T.muted}}>{agentEntries.length} docs loaded</div>
        </div>
        {entriesLoading && <div style={{padding:"28px",textAlign:"center",fontFamily:body,fontSize:13,color:T.muted,fontStyle:"italic"}}>Loading training courses…</div>}
        {!entriesLoading && agentEntries.length===0 && (
          <div style={{padding:"28px",textAlign:"center"}}>
            <div style={{fontFamily:display,fontSize:15,color:T.muted,marginBottom:6}}>No training documents yet</div>
            {agent.trainable && <div style={{fontFamily:body,fontSize:12,color:T.mutedDeep,fontStyle:"italic"}}>Use "Add Courses" to start building {agent.name.split(" ")[0]}'s knowledge base.</div>}
          </div>
        )}
        {agentEntries.map((entry,i)=>{
          const isRetired = entry.status==="disabled";
          const cc = catColors[entry.category]||T.muted;
          return(
            <div key={entry.id} style={{display:"grid",gridTemplateColumns:"52px 1fr",borderBottom:i<agentEntries.length-1?`1px solid ${T.lineSoft}`:"none",opacity:isRetired?0.55:1}}>
              <div style={{padding:"10px 6px",textAlign:"center",borderRight:`1px solid ${T.lineSoft}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3}}>
                <div style={{fontFamily:mono,fontSize:9,color:T.muted}}>{entry.source?.split(" ")[1]||"—"}</div>
                <div style={{fontFamily:mono,fontSize:8,color:T.muted}}>{entry.source?.split(" ")[2]||""}</div>
                {entry.source_type==="agent"&&<div style={{fontFamily:mono,fontSize:8,color:T.moss,marginTop:2}}>🤖 Auto</div>}
                {entry.steps_taken&&<div style={{fontFamily:mono,fontSize:8,color:T.brass,marginTop:2}}>{entry.steps_taken} steps</div>}
                <div style={{width:8,height:8,borderRadius:"50%",background:isRetired?T.muted:T.moss,border:`2px solid ${T.card}`,boxShadow:`0 0 0 2px ${isRetired?T.muted:T.moss}`}}/>
              </div>
              <div style={{padding:"10px 13px"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontFamily:mono,fontSize:9,padding:"1px 5px",border:`1px solid ${cc}40`,color:cc,background:`${cc}12`,fontWeight:600,letterSpacing:.5}}>{(entry.category||"").toUpperCase()}</span>
                  {entry.source_type==="agent"&&(()=>{
                    const isSuccess = entry.teaching_note?.includes("|success");
                    const isFailed  = entry.teaching_note?.includes("|failed");
                    return(<>
                      <span style={{fontFamily:mono,fontSize:9,padding:"1px 5px",border:`1px solid ${T.moss}40`,color:T.moss,background:`${T.moss}12`,fontWeight:600,letterSpacing:.5}}>🤖 FIELD NOTE</span>
                      {isSuccess&&<span style={{fontFamily:mono,fontSize:9,padding:"1px 5px",border:`1px solid ${T.moss}60`,color:T.moss,background:`${T.moss}15`,fontWeight:700,letterSpacing:.5}}>✓ SUCCESS</span>}
                      {isFailed &&<span style={{fontFamily:mono,fontSize:9,padding:"1px 5px",border:`1px solid ${T.flag}60`,color:T.flag,background:`${T.flag}10`,fontWeight:700,letterSpacing:.5}}>✗ FAILED</span>}
                    </>);
                  })()}
                  {entry.steps_taken&&<span style={{fontFamily:mono,fontSize:9,padding:"1px 5px",border:`1px solid ${T.brass}40`,color:T.brass,background:`${T.brass}10`,fontWeight:600,letterSpacing:.5}}>{entry.steps_taken} STEPS</span>}
                  <span style={{fontFamily:mono,fontSize:9,color:T.muted}}>▸ {entry.jurisdiction||"All"}</span>
                  <span style={{fontFamily:mono,fontSize:9,color:isRetired?T.muted:T.moss,marginLeft:"auto",fontWeight:700}}>{isRetired?"○ Disabled":"● Active"}</span>
                  {agent.trainable&&!isRetired&&(
                    <span style={{display:"flex",gap:5}}>
                      <button onClick={()=>onEditEntry(entry)} style={{fontFamily:mono,fontSize:9,color:T.muted,background:"transparent",border:`1px solid ${T.lineSoft}`,padding:"2px 7px",cursor:"pointer",letterSpacing:.5,textTransform:"uppercase"}}>Edit</button>
                      <button onClick={()=>onDeleteEntry(entry)} style={{fontFamily:mono,fontSize:9,color:T.muted,background:"transparent",border:`1px solid ${T.lineSoft}`,padding:"2px 7px",cursor:"pointer",letterSpacing:.5,textTransform:"uppercase"}}>Delete</button>
                    </span>
                  )}
                </div>
                <div style={{fontFamily:display,fontSize:13.5,fontWeight:600,color:isRetired?T.mutedDeep:T.navy,marginBottom:4,fontStyle:isRetired?"italic":"normal"}}>{entry.title}</div>
                {entry.triggers?.length>0&&(
                  <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:3}}>
                    {(entry.triggers.includes("all")?["All Flags"]:entry.triggers).map(t=><span key={t} style={{fontFamily:mono,fontSize:8.5,padding:"1px 6px",background:`${T.flag}10`,color:T.flag,border:`1px solid ${T.flag}35`,letterSpacing:.3}}>⚑ {t.toUpperCase().replace(/-/g," ")}</span>)}
                  </div>
                )}
                {entry.priority!=null&&<div style={{fontFamily:mono,fontSize:9,color:T.muted}}>Priority {entry.priority}/100</div>}
                {/* Expandable learned content — shown for all entries, especially agent field notes */}
                {entry.content&&(
                  <div style={{marginTop:6}}>
                    <button onClick={()=>toggleEntryExpand(entry.id)} style={{fontFamily:mono,fontSize:9,color:T.brassDeep,background:"transparent",border:`1px solid ${T.lineSoft}`,padding:"2px 8px",cursor:"pointer",letterSpacing:.5,textTransform:"uppercase",display:"flex",alignItems:"center",gap:4}}>
                      {expandedEntries[entry.id]?"▾ Hide":"▸ What Brent Learned"}
                    </button>
                    {expandedEntries[entry.id]&&(
                      <div style={{marginTop:6,padding:"10px 12px",background:T.cardAlt,border:`1px solid ${T.lineSoft}`,borderLeft:`3px solid ${entry.source_type==="agent"?T.moss:T.brass}`}}>
                        <div style={{fontFamily:mono,fontSize:8.5,color:T.muted,textTransform:"uppercase",letterSpacing:1.2,fontWeight:600,marginBottom:6}}>
                          {entry.source_type==="agent"?"🤖 Agent Field Note — Learned Content":"📄 Training Document Content"}
                        </div>
                        <div style={{fontFamily:body,fontSize:12,color:T.mutedDeep,lineHeight:1.65,whiteSpace:"pre-wrap"}}>{entry.content}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {agentEntries.length>5&&<div style={{padding:"10px 15px",textAlign:"center",background:T.cardAlt,borderTop:`1px solid ${T.lineSoft}`}}><button style={{background:"transparent",border:`1px solid ${T.line}`,color:T.brassDeep,padding:"5px 18px",fontFamily:mono,fontSize:10,cursor:"pointer",letterSpacing:.8,textTransform:"uppercase"}}>Show all {agentEntries.length} documents ▾</button></div>}
      </div>
    </div>
  );

  // ── TEACH ──────────────────────────────────────────────────────────────────
  if (subView==="teach") return (
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      <div style={{marginBottom:14}}>
        <button onClick={()=>setSubView("list")} style={{background:"transparent",border:`1px solid ${T.line}`,color:T.mutedDeep,padding:"6px 16px",fontFamily:body,fontSize:12,cursor:"pointer",marginBottom:11}}>← Back to Training</button>
        <div style={{fontFamily:display,fontSize:22,fontWeight:500,color:T.navy,letterSpacing:"-.3px",marginBottom:3}}>You're teaching {agent.name.split(" ")[0]}.</div>
        <div style={{fontFamily:body,fontStyle:"italic",fontSize:12.5,color:T.mutedDeep}}>Upload a document, tell {agent.name.split(" ")[0]} how to weight it, and mark which flags it helps trigger.</div>
      </div>
      {/* Agent stats strip */}
      <div style={{background:`linear-gradient(135deg,${T.navy},${T.navyMid})`,padding:"12px 18px",marginBottom:14,display:"flex",alignItems:"center",gap:14,borderBottom:`2px solid ${T.brass}`}}>
        <div style={{width:46,height:46,borderRadius:"50%",background:T.paperDeep,border:`2px solid ${agent.color||T.moss}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:display,fontSize:18,fontWeight:700,color:agent.color||T.moss,flexShrink:0}}>{agent.name[0]}</div>
        <div style={{marginRight:14}}>
          <div style={{fontFamily:mono,fontSize:8.5,color:"#8fa3bf",letterSpacing:1.2,marginBottom:1}}>{agent.code} · {agent.role.toUpperCase()}</div>
          <div style={{fontFamily:display,fontSize:15,fontWeight:600,color:T.card}}>{agent.name}</div>
          <div style={{fontFamily:mono,fontSize:10,color:"#b8c5d8",marginTop:1}}>Currently <span style={{color:T.brassLight,fontWeight:600}}>{skillLabel(agent.skill)} · {agent.skill}/100</span></div>
        </div>
        {[["Documents",agent.docs],["Class Hours",agent.classes],["Chunks",agent.chunks.toLocaleString()],["Tokens",agent.chunks>0?`${(agent.chunks*0.74).toFixed(0)}k`:"0"],["Skill",`${agent.skill}/100`]].map(([k,v],i)=>(
          <div key={k} style={{padding:"0 14px",borderRight:i<4?`1px solid rgba(255,255,255,.12)`:"none"}}>
            <div style={{fontFamily:mono,fontSize:8,color:"#8fa3bf",textTransform:"uppercase",letterSpacing:1.2,marginBottom:1}}>{k}</div>
            <div style={{fontFamily:display,fontSize:k==="Skill"?18:16,fontWeight:600,color:k==="Skill"?T.brassLight:T.card,fontVariantNumeric:"tabular-nums"}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:16,alignItems:"start"}}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Exhibit A */}
          <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"14px 18px",position:"relative"}}>
            <Corners/>
            <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.8,fontWeight:600,marginBottom:12}}>Exhibit A · Course Material</div>
            {uploadState==="idle"&&(
              <div onClick={()=>fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}}
                style={{border:`2px dashed ${T.brass}55`,padding:"28px",textAlign:"center",cursor:"pointer",background:T.cardAlt}}>
                <div style={{fontSize:26,marginBottom:7}}>📄</div>
                <div style={{fontFamily:display,fontSize:14,fontWeight:600,color:T.navy,marginBottom:3}}>Drop a document here</div>
                <div style={{fontFamily:body,fontSize:11.5,color:T.muted,marginBottom:12}}>PDF, DOCX, TXT · Max 20MB</div>
                <div style={{display:"inline-block",background:T.brass,color:T.navy,padding:"7px 18px",fontFamily:body,fontSize:12,fontWeight:700}}>↑ Browse File</div>
                <input ref={fileRef} type="file" accept=".pdf,.txt,.docx" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
              </div>
            )}
            {uploadState==="uploading"&&(
              <div style={{border:`1px solid ${T.brass}40`,padding:"22px",textAlign:"center",background:T.cardAlt}}>
                <div style={{fontFamily:display,fontSize:14,fontWeight:600,color:T.navy,marginBottom:10}}>Extracting document text…</div>
                <div style={{fontFamily:mono,fontSize:11,color:T.muted,marginBottom:8}}>{uploadedFile?.name}</div>
                <div style={{background:T.paperDeep,height:4,width:"100%",maxWidth:300,margin:"0 auto 6px",overflow:"hidden"}}><div style={{height:"100%",background:T.brass,width:`${uploadProgress}%`,transition:"width .2s"}}/></div>
                <div style={{fontFamily:mono,fontSize:11,color:T.brassDeep}}>{Math.round(uploadProgress)}% complete</div>
              </div>
            )}
            {uploadState==="ready"&&(
              <div style={{border:`1px solid ${T.moss}50`,padding:"11px 13px",background:`${T.moss}05`,display:"flex",alignItems:"center",gap:11}}>
                <div style={{width:40,height:48,background:T.flag,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <div style={{fontFamily:mono,fontSize:9,color:T.card,fontWeight:700}}>DOC</div>
                  <div style={{fontFamily:mono,fontSize:8,color:`${T.card}80`,marginTop:2}}>{uploadedFile?(uploadedFile.size/1e6).toFixed(1)+"MB":""}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:display,fontSize:13,fontWeight:600,color:T.navy}}>{uploadedFile?.name}</div>
                  <div style={{fontFamily:body,fontSize:11,color:T.moss,marginTop:1}}>✓ {wordCount.toLocaleString()} words extracted</div>
                </div>
                <button onClick={()=>{setUploadState("idle");setUploadedFile(null);setExtractedText("");setWordCount(0);}} style={{fontFamily:body,fontSize:11,color:T.brassDeep,background:"transparent",border:`1px solid ${T.line}`,padding:"4px 10px",cursor:"pointer"}}>✎ Replace</button>
              </div>
            )}
          </div>

          {/* Exhibit B */}
          <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"14px 18px",position:"relative",opacity:locked?.38:1,pointerEvents:locked?"none":"auto",transition:"opacity .3s"}}>
            <Corners/>
            <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.8,fontWeight:600,marginBottom:14}}>Exhibit B · How {agent.name.split(" ")[0]} Should Weight This</div>
            <div style={{marginBottom:12}}>
              <label style={{fontFamily:body,fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:1.3,fontWeight:600,marginBottom:5,display:"flex",alignItems:"center",gap:6}}>Document Title {!locked&&<AISugg/>}</label>
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Document title…" style={{width:"100%",padding:"8px 11px",fontFamily:body,fontSize:13,color:T.ink,background:T.cardAlt,border:`1px solid ${form.title?T.brass:T.line}`,outline:"none"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              {[{key:"category",label:"Category",options:agent.id==="brent"?[...CATEGORIES,...BRENT_CATEGORIES]:CATEGORIES},{key:"jurisdiction",label:"Jurisdiction",options:JURISDICTIONS}].map(({key,label,options})=>(
                <div key={key}>
                  <label style={{fontFamily:body,fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:1.3,fontWeight:600,marginBottom:5,display:"flex",alignItems:"center",gap:6}}>{label} {!locked&&<AISugg/>}</label>
                  <select value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} style={{width:"100%",padding:"8px 11px",fontFamily:body,fontSize:13,color:T.ink,background:T.cardAlt,border:`1px solid ${T.line}`,outline:"none",cursor:"pointer",appearance:"none"}}>{options.map(o=><option key={o}>{o}</option>)}</select>
                </div>
              ))}
            </div>
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
                <label style={{fontFamily:body,fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:1.3,fontWeight:600}}>Priority Weight</label>
                <span style={{fontFamily:mono,fontSize:11.5,color:pInfo.color,fontWeight:700}}>{pInfo.label} · {form.priority}/100</span>
              </div>
              <input type="range" min={0} max={100} value={form.priority} onChange={e=>setForm(f=>({...f,priority:+e.target.value}))} style={{width:"100%",accentColor:T.brass,marginBottom:3}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontFamily:mono,fontSize:9,color:T.muted}}><span>Low</span><span>Medium</span><span>High</span><span>Critical</span></div>
            </div>
            <div style={{marginBottom:13}}>
              <label style={{fontFamily:body,fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:1.3,fontWeight:600,marginBottom:7,display:"flex",alignItems:"center",gap:6}}>Flag Triggers {!locked&&<AISugg/>}</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:5}}>
                {FLAG_TRIGGERS.map(f=>{
                  const on=form.triggers.includes("all")||form.triggers.includes(f.id);
                  return(<button key={f.id} onClick={()=>toggleTrigger(f.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 9px",background:on?`${T.flag}10`:"transparent",border:`1px solid ${on?T.flag:T.line}`,cursor:"pointer",fontFamily:mono,fontSize:10,color:on?T.flag:T.muted,textAlign:"left",transition:"all .15s"}}><span style={{width:11,height:11,border:`1.5px solid ${on?T.flag:T.line}`,background:on?T.flag:"transparent",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:8,color:T.card,flexShrink:0}}>{on?"✓":""}</span>⚑ {f.label}</button>);
                })}
              </div>
              <button onClick={()=>toggleTrigger("all")} style={{width:"100%",display:"flex",alignItems:"center",gap:7,padding:"6px 9px",background:form.triggers.includes("all")?`${T.flag}08`:"transparent",border:`1px dashed ${form.triggers.includes("all")?T.flag:T.line}`,cursor:"pointer",fontFamily:mono,fontSize:10,color:form.triggers.includes("all")?T.flag:T.muted}}>
                <span style={{width:11,height:11,border:`1.5px solid ${form.triggers.includes("all")?T.flag:T.line}`,background:form.triggers.includes("all")?T.flag:"transparent",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:8,color:T.card,flexShrink:0}}>{form.triggers.includes("all")?"✓":""}</span>
                ⚑ All Flags — always retrieve for every briefing
              </button>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontFamily:body,fontSize:10,color:T.muted,textTransform:"uppercase",letterSpacing:1.3,fontWeight:600,marginBottom:5,display:"block"}}>Teaching Note for {agent.name.split(" ")[0]}</label>
              <textarea value={form.teaching_note} onChange={e=>setForm(f=>({...f,teaching_note:e.target.value}))} placeholder={`Optional. Shapes how ${agent.name.split(" ")[0]} phrases findings that cite this document…`} style={{width:"100%",padding:"8px 11px",fontFamily:body,fontSize:12,color:T.ink,background:T.cardAlt,border:`1px solid ${T.line}`,outline:"none",resize:"vertical",minHeight:70,lineHeight:1.5,fontStyle:"italic",boxSizing:"border-box"}}/>
            </div>
            {uploadState==="ready"&&(
              <div style={{marginBottom:12}}>
                <button onClick={()=>setExtractedOpen(o=>!o)} style={{width:"100%",padding:"8px 11px",background:T.cardAlt,border:`1px solid ${T.line}`,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",fontFamily:mono,fontSize:10,color:T.muted,letterSpacing:.5}}>
                  <span>▾ View extracted document text</span>
                  <span style={{fontFamily:mono,fontSize:9,color:T.flag}}>READ ONLY · {wordCount.toLocaleString()} words</span>
                </button>
                {extractedOpen&&<div style={{background:T.navyDeep,border:`1px solid rgba(255,255,255,.1)`,borderTop:"none",padding:"11px 13px",fontFamily:mono,fontSize:11,color:"#8fa3bf",lineHeight:1.7,maxHeight:160,overflowY:"auto",whiteSpace:"pre-wrap",userSelect:"none"}}>{extractedText.split(/\s+/).slice(0,300).join(" ")}{"\n\n[Read-only · Stored in Supabase]"}</div>}
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:13,borderTop:`1px solid ${T.lineSoft}`}}>
              <button onClick={()=>setSubView("list")} style={{background:"transparent",border:`1px solid ${T.line}`,color:T.mutedDeep,padding:"8px 18px",fontFamily:body,fontSize:12,cursor:"pointer"}}>Cancel</button>
              <button onClick={handleSave} disabled={!form.title||isSaving||locked} style={{background:!form.title||locked?T.line:`linear-gradient(135deg,${T.brass},${T.brassDeep})`,border:"none",color:!form.title||locked?T.muted:T.navy,padding:"9px 22px",fontFamily:display,fontSize:13,fontWeight:700,cursor:!form.title||locked?"not-allowed":"pointer",opacity:isSaving?.7:1}}>
                {isSaving?"⏳ Saving…":`▸ Teach ${agent.name.split(" ")[0]} this course`}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: projected impact + what changes + onboarding checklist */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"13px 15px",position:"relative"}}>
            <Corners/>
            <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.8,fontWeight:600,marginBottom:11}}>Projected Impact</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-around",marginBottom:11}}>
              <div style={{textAlign:"center"}}><div style={{fontFamily:mono,fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>Before</div><div style={{fontFamily:display,fontSize:36,fontWeight:700,color:T.mutedDeep,lineHeight:1}}>{agent.skill}</div><div style={{fontFamily:mono,fontSize:9.5,color:T.muted}}>{skillLabel(agent.skill)}</div></div>
              <div style={{fontFamily:display,fontSize:20,color:T.brassDeep}}>→</div>
              <div style={{textAlign:"center"}}><div style={{fontFamily:mono,fontSize:9,color:T.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>After</div><div style={{fontFamily:display,fontSize:36,fontWeight:700,color:T.moss,lineHeight:1}}>{Math.min(100,agent.skill+3)}</div><div style={{fontFamily:mono,fontSize:9.5,color:T.moss,fontWeight:600}}>▸ {skillLabel(Math.min(100,agent.skill+3))}</div></div>
            </div>
            <div style={{fontFamily:body,fontSize:11,color:T.mutedDeep,lineHeight:1.4,fontStyle:"italic",padding:"7px 9px",background:`${T.moss}08`,border:`1px solid ${T.moss}30`}}>Mock projected impact. Live skill computation in v5.</div>
          </div>
          <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"12px 14px"}}>
            <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.8,fontWeight:600,marginBottom:9}}>What Changes</div>
            {[["Documents",agent.docs,agent.docs+1,true],["Class hours",agent.classes,agent.classes+1,false],["Chunks in RAG",agent.chunks,agent.chunks+"+ new",true],["Tokens indexed","—","+ new chunks",true],["Flag coverage","—","—",false],["Training invested",fmt$(agent.classes*1000),fmt$((agent.classes+1)*1000),false]].map(([k,before,after,live])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${T.lineSoft}`,fontSize:11.5,alignItems:"baseline"}}>
                <span style={{color:T.mutedDeep,display:"flex",alignItems:"center",gap:5}}>{k}{live&&<span style={{fontFamily:mono,fontSize:8,color:T.moss,border:`1px solid ${T.moss}40`,padding:"0 3px",letterSpacing:.5}}>LIVE</span>}</span>
                <div style={{fontFamily:mono,fontSize:11,display:"flex",alignItems:"baseline",gap:5}}><span style={{color:T.muted}}>{before} →</span><span style={{color:T.navy,fontWeight:700}}>{after}</span></div>
              </div>
            ))}
          </div>
          <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"12px 14px"}}>
            <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.8,fontWeight:600,marginBottom:9}}>Onboarding Checklist</div>
            {[
              ["File uploaded & extracted",   uploadState==="ready",  "just now"],
              ["Priority & flags assigned",   uploadState==="ready"&&form.title!=="", "just now"],
              ["Chunked into passages",       false, "starting…"],
              ["Indexed into RAG",            false, "queued"],
              ["Quality check",               false, "scheduled"],
              ["Available in next briefing",  false, "after index"],
            ].map(([label,done,status])=>(
              <div key={label} style={{display:"flex",alignItems:"center",gap:9,padding:"5px 0",borderBottom:`1px solid ${T.lineSoft}`}}>
                <div style={{width:13,height:13,border:`1.5px solid ${done?T.moss:T.line}`,background:done?T.moss:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{done&&<span style={{color:T.card,fontSize:9,fontWeight:700}}>✓</span>}</div>
                <span style={{flex:1,fontFamily:body,fontSize:11.5,color:done?T.ink:T.muted}}>{label}</span>
                <span style={{fontFamily:mono,fontSize:9.5,color:T.muted}}>{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── TEST ───────────────────────────────────────────────────────────────────
  return (
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      <div style={{marginBottom:14}}>
        <button onClick={()=>setSubView("list")} style={{background:"transparent",border:`1px solid ${T.line}`,color:T.mutedDeep,padding:"6px 16px",fontFamily:body,fontSize:12,cursor:"pointer",marginBottom:11}}>← Back to Training</button>
        <div style={{fontFamily:mono,fontSize:9.5,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.8,fontWeight:600,marginBottom:3}}>Acquired Skillset · Agent Testing</div>
        <div style={{fontFamily:display,fontSize:22,fontWeight:500,color:T.navy,letterSpacing:"-.3px",marginBottom:3}}>Testing {agent.name.split(" ")[0]}.</div>
        <div style={{fontFamily:body,fontStyle:"italic",fontSize:12.5,color:T.mutedDeep,maxWidth:560}}>Run standardized procurement scenarios. Full prompt assembly and RAG context visible here — not available in AI Review.</div>
      </div>
      <div style={{height:2,background:T.brass,marginBottom:16}}/>

      {/* Config selectors — always shown in test console */}
      <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"12px 16px",marginBottom:14,display:"flex",gap:16,alignItems:"flex-end",flexWrap:"wrap"}}>
        <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.3,fontWeight:600,alignSelf:"center"}}>Active Configuration →</div>
        <div>
          <div style={{fontFamily:mono,fontSize:8.5,color:T.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Role Prompt</div>
          <select value={selectedRoleId} onChange={e=>setSelectedRoleId(e.target.value)} style={{background:T.cardAlt,border:`1px solid ${T.line}`,padding:"6px 10px",fontFamily:body,fontSize:12,color:T.ink,cursor:"pointer",appearance:"none",minWidth:180}}>
            {roleConfigs.length===0&&<option value="">Loading…</option>}
            {roleConfigs.map(c=><option key={c.id} value={c.id}>{c.name}{c.is_default?" (default)":""}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontFamily:mono,fontSize:8.5,color:T.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Output Format</div>
          <select value={selectedFormatId} onChange={e=>setSelectedFormatId(e.target.value)} style={{background:T.cardAlt,border:`1px solid ${T.line}`,padding:"6px 10px",fontFamily:body,fontSize:12,color:T.ink,cursor:"pointer",appearance:"none",minWidth:180}}>
            {formatConfigs.length===0&&<option value="">Loading…</option>}
            {formatConfigs.map(c=><option key={c.id} value={c.id}>{c.name}{c.is_default?" (default)":""}</option>)}
          </select>
        </div>
      </div>

      {/* Stage tabs */}
      <div style={{display:"flex",gap:0,marginBottom:16,borderBottom:`2px solid ${T.brass}`}}>
        {[["② Pick Scenario",2],["③ Results",3]].map(([label,n])=>(
          <button key={n} onClick={()=>setTestStage(n)} style={{padding:"7px 20px",fontFamily:mono,fontSize:10,letterSpacing:1,textTransform:"uppercase",border:"none",background:"transparent",cursor:"pointer",color:testStage===n?T.navy:T.muted,fontWeight:testStage===n?700:400,borderBottom:`2px solid ${testStage===n?T.navy:"transparent"}`,marginBottom:-2}}>{label}</button>
        ))}
      </div>

      {testStage===2&&(
        <div>
          <div style={{fontFamily:body,fontSize:12,color:T.muted,fontStyle:"italic",marginBottom:12,padding:"8px 13px",background:`${T.brass}06`,border:`1px solid ${T.brass}20`}}>Select a pre-built Austin 2025 scenario. Each test makes 1 live API call using the configuration selected above.</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:9,marginBottom:14}}>
            {BEE_SCENARIOS.map(sc=>(
              <div key={sc.id} onClick={()=>setSelectedScenario(sc)} style={{background:selectedScenario.id===sc.id?`${T.brass}08`:T.card,border:`1.5px solid ${selectedScenario.id===sc.id?T.brass:T.line}`,padding:"11px",cursor:"pointer",transition:"all .15s",position:"relative"}}>
                {selectedScenario.id===sc.id&&<Corners/>}
                <div style={{fontSize:15,marginBottom:5}}>{sc.flag}</div>
                <div style={{fontFamily:mono,fontSize:8,color:T.brassDeep,textTransform:"uppercase",letterSpacing:.8,fontWeight:600,marginBottom:3}}>{sc.flagLabel}</div>
                <div style={{fontFamily:display,fontSize:12,fontWeight:600,color:T.navy,lineHeight:1.3,marginBottom:3}}>{sc.title}</div>
                <div style={{fontFamily:body,fontSize:9.5,color:T.muted,lineHeight:1.4,marginBottom:5}}>{sc.meta}</div>
                <div style={{fontFamily:mono,fontSize:10,color:T.flag,fontWeight:700}}>{sc.amount}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <button onClick={runTest} disabled={runState==="running"} style={{background:runState==="running"?T.line:`linear-gradient(135deg,${T.brass},${T.brassDeep})`,border:"none",color:runState==="running"?T.muted:T.navy,padding:"10px 26px",fontFamily:display,fontSize:13,fontWeight:700,cursor:runState==="running"?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:8}}>
              <span>{runState==="running"?"⏳":"🐝"}</span>{runState==="running"?"Running…":"Run Test →"}
            </button>
          </div>
        </div>
      )}

      {testStage===3&&(
        <div>
          <div style={{background:`linear-gradient(135deg,${T.navy},${T.navyMid})`,color:T.card,padding:"10px 18px",marginBottom:14,display:"flex",alignItems:"center",gap:14}}>
            <div style={{fontFamily:mono,fontSize:9,color:"#8fa3bf",textTransform:"uppercase",letterSpacing:1.2,flexShrink:0}}>Test Scenario</div>
            <div style={{fontFamily:display,fontSize:13,fontWeight:600,color:T.card}}>{selectedScenario.flag} {selectedScenario.title}</div>
            <div style={{fontFamily:mono,fontSize:9.5,color:"#8fa3bf"}}>{selectedScenario.meta}</div>
            <div style={{flex:1}}/>
            <button onClick={()=>{setTestStage(2);setRunState("idle");}} style={{background:"transparent",border:`1px solid rgba(248,242,226,.3)`,color:"#b8c5d8",padding:"4px 11px",fontFamily:body,fontSize:11,cursor:"pointer"}}>Change scenario</button>
          </div>

          {testResult&&(
            <div style={{display:"flex",flexDirection:"column"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 13px",background:T.cardAlt,border:`1px solid ${agent.color||T.moss}`,borderBottom:"none"}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:T.paperDeep,border:`2px solid ${agent.color||T.moss}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:display,fontSize:11,fontWeight:700,color:agent.color||T.moss}}>{agent.name[0]}</div>
                <div><div style={{fontFamily:display,fontSize:13,fontWeight:600,color:T.navy}}>{agent.name}</div><div style={{fontFamily:mono,fontSize:9,color:T.muted}}>{agent.code} · {agent.arch} · {agent.situational}% awareness</div></div>
                <div style={{marginLeft:"auto",fontFamily:mono,fontSize:10,color:T.brassDeep,fontWeight:700}}>{fmt$(agent.reportCost)}</div>
              </div>
              <div style={{background:T.card,border:`1px solid ${T.line}`,borderTop:"none",padding:"15px 17px"}}>
                <div style={{fontFamily:body,fontSize:12.5,color:T.mutedDeep,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{testResult.text}</div>
              </div>
              {testResult.debug&&(
                <div style={{background:`${T.moss}08`,border:`1px solid ${T.moss}30`,borderTop:"none",padding:"8px 13px",display:"flex",gap:16,flexWrap:"wrap"}}>
                  {[["Role",testResult.debug.role_name],["Format",testResult.debug.format_name],["Layers",testResult.debug.layers_assembled],["RAG",testResult.debug.rag_retrieved?"Yes":"No"]].map(([k,v])=>(
                    <div key={k}><span style={{fontFamily:mono,fontSize:9,color:T.muted}}>{k}: </span><span style={{fontFamily:mono,fontSize:9,color:T.moss,fontWeight:700}}>{v}</span></div>
                  ))}
                </div>
              )}
              <div style={{background:T.navyDeep,border:`1px solid rgba(255,255,255,.1)`,borderTop:"none"}}>
                <div style={{display:"flex",borderBottom:`1px solid rgba(255,255,255,.1)`}}>
                  {[["System Prompt","prompt"],["RAG Chunks Retrieved","rag"]].map(([label,key])=>(
                    <button key={key} onClick={()=>setPromptOpen(m=>({...m,[key]:!m[key]}))} style={{padding:"6px 13px",fontFamily:mono,fontSize:9.5,color:promptOpen[key]?T.brassLight:"#8fa3bf",textTransform:"uppercase",letterSpacing:.8,cursor:"pointer",border:"none",background:"transparent",borderBottom:`2px solid ${promptOpen[key]?T.brass:"transparent"}`}}>{label}</button>
                  ))}
                  <div style={{flex:1}}/><span style={{fontFamily:mono,fontSize:9,color:T.brassLight,padding:"6px 11px",alignSelf:"center"}}>Admin Only</span>
                </div>
                {promptOpen.prompt&&(
                  <div style={{padding:"11px 15px",maxHeight:260,overflowY:"auto"}}>
                    {testResult?.system
                      ? ["=== ROLE & IDENTITY ===","=== BACKGROUND KNOWLEDGE ===","=== OUTPUT FORMAT ===","=== CONSTRAINTS & GUARDRAILS ==="].map((header,i)=>{
                          const colors=["#9b6ef3",T.moss,T.brass,T.flag];
                          const labels=["01 · Role","02 · RAG","04 · Format","05 · Guardrails"];
                          const start=testResult.system.indexOf(header);
                          if(start===-1) return null;
                          const end=testResult.system.indexOf("\n\n---\n\n",start);
                          const section=(end===-1?testResult.system.slice(start):testResult.system.slice(start,end)).replace(header,"").trim();
                          return(
                            <div key={header} style={{marginBottom:10,borderLeft:`3px solid ${colors[i]}`,paddingLeft:10}}>
                              <div style={{fontFamily:mono,fontSize:8.5,color:colors[i],fontWeight:700,letterSpacing:.8,marginBottom:4}}>{labels[i]}</div>
                              <div style={{fontFamily:mono,fontSize:10.5,color:"#8fa3bf",lineHeight:1.6,whiteSpace:"pre-wrap",maxHeight:80,overflowY:"auto"}}>{section}</div>
                            </div>
                          );
                        })
                      : <div style={{fontFamily:mono,fontSize:11,color:"#8fa3bf",lineHeight:1.7,whiteSpace:"pre-wrap",fontStyle:"italic"}}>Redeploy brief.js to see the assembled prompt here.</div>
                    }
                  </div>
                )}
                {promptOpen.rag&&(
                  <div style={{padding:"11px 15px",fontFamily:mono,fontSize:11,color:"#8fa3bf",lineHeight:1.7,maxHeight:200,overflowY:"auto"}}>
                    {ragEntries.length===0&&<div style={{color:T.flag,fontStyle:"italic"}}>⚠ No chunks retrieved — add more training documents for this scenario type.</div>}
                    {ragEntries.map((e,i)=>(
                      <div key={i} style={{background:`${T.moss}10`,borderLeft:`3px solid ${T.moss}`,padding:"5px 9px",marginBottom:5,fontSize:10.5,color:T.mossLight,lineHeight:1.5}}>
                        <strong style={{color:T.card}}>{e.title}</strong> <span style={{color:T.brassLight}}>{Math.round((e.similarity||0)*100)}% match</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {testError&&<div style={{background:`${T.flag}10`,border:`1px solid ${T.flag}40`,padding:"12px 16px",color:T.flag,fontSize:13,marginTop:10}}>⚠ {testError}</div>}

          <div style={{display:"flex",gap:10,marginTop:14,justifyContent:"space-between",alignItems:"center"}}>
            <button onClick={()=>{setTestStage(2);setRunState("idle");}} style={{background:"transparent",border:`1px solid ${T.line}`,color:T.mutedDeep,padding:"7px 16px",fontFamily:body,fontSize:12,cursor:"pointer"}}>← Back to Scenarios</button>
            {agent.trainable&&<button onClick={()=>setSubView("teach")} style={{background:T.moss,border:"none",color:"#fff",padding:"7px 18px",fontFamily:display,fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Add Courses →</button>}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PLAYBOOK TAB — LIVE: loads/saves output_format + guardrail configs
// ══════════════════════════════════════════════════════════════════════════════
function PlaybookTab({ agent, showToast }) {
  const [formatConfigs, setFormatConfigs] = useState([]);
  const [guardrailText, setGuardrailText] = useState("");
  const [guardrailId, setGuardrailId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [savingGuardrail, setSavingGuardrail] = useState(false);

  useEffect(() => {
    Promise.all([
      apiGetConfigs(agent.id, "output_format"),
      apiGetConfigs(agent.id, "guardrail"),
    ]).then(([formats, guardrails]) => {
      setFormatConfigs(formats);
      const g = guardrails.find(r=>r.is_default) || guardrails[0];
      if (g) { setGuardrailText(g.text); setGuardrailId(g.id); }
    }).catch(() => showToast("Could not load playbook configs","⚠"))
      .finally(() => setLoading(false));
  }, [agent.id]);

  const handleSetDefault = async (id) => {
    try {
      await apiPatchConfig(id, { is_default: true });
      const fresh = await apiGetConfigs(agent.id, "output_format");
      setFormatConfigs(fresh);
      showToast("Default updated ✦");
    } catch { showToast("Failed","⚠"); }
  };

  const handleToggleSelectable = async (id, val) => {
    try {
      await apiPatchConfig(id, { is_user_selectable: val });
      setFormatConfigs(prev => prev.map(c => c.id===id ? {...c,is_user_selectable:val} : c));
      showToast(val?"Now user-selectable ✦":"Hidden from users");
    } catch { showToast("Update failed","⚠"); }
  };

  const handleEdit = (updated) => setFormatConfigs(prev => prev.map(c => c.id===updated.id ? updated : c));

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this output format permanently?")) return;
    try {
      await apiDeleteConfig(id);
      setFormatConfigs(prev => prev.filter(c => c.id!==id));
      showToast("Deleted 🗑");
    } catch { showToast("Delete failed","⚠"); }
  };

  const handleFormatAdded = (config) => {
    setFormatConfigs(prev => {
      const updated = config.is_default ? prev.map(c=>({...c,is_default:false})) : prev;
      return [...updated, config];
    });
    setShowAdd(false);
  };

  const saveGuardrail = async () => {
    setSavingGuardrail(true);
    try {
      if (guardrailId) {
        await apiPatchConfig(guardrailId, { text: guardrailText });
      } else {
        const created = await apiSaveConfig({ agent_id: agent.id, type:"guardrail", name:"default", text: guardrailText, is_default: true, is_user_selectable: false });
        setGuardrailId(created.id);
      }
      showToast("Guardrails saved ✦");
    } catch { showToast("Save failed","⚠"); }
    setSavingGuardrail(false);
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Output formats */}
      <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"15px 18px",position:"relative"}}>
        <Corners/>
        <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.5,fontWeight:600,marginBottom:4}}>Layer 04 · Output Structure</div>
        <div style={{fontFamily:display,fontSize:16,fontWeight:600,color:T.navy,marginBottom:6}}>How does {agent.name.split(" ")[0]} format his responses?</div>
        <div style={{fontFamily:body,fontSize:12,color:T.mutedDeep,lineHeight:1.5,marginBottom:13,padding:"9px 13px",background:T.cardAlt,borderLeft:`3px solid ${T.brassDeep}`}}>
          Final block sent to the LLM. Set one as <strong>Default</strong> for automatic use. Toggle <strong>User Selectable</strong> to let users choose in the analysis UI.
        </div>
        {loading&&<div style={{fontFamily:body,fontSize:12,color:T.muted,fontStyle:"italic",padding:"20px 0",textAlign:"center"}}>Loading…</div>}
        {!loading&&formatConfigs.map(config=>(
          <ConfigCard key={config.id} config={config}
            onSetDefault={handleSetDefault}
            onToggleSelectable={handleToggleSelectable}
            onEdit={handleEdit}
            onDelete={handleDelete}
            editingId={editingId}
            setEditingId={setEditingId}
            showToast={showToast}
          />
        ))}
        {!loading&&!showAdd&&<button onClick={()=>setShowAdd(true)} style={{width:"100%",padding:"9px",background:"transparent",border:`1px dashed ${T.lineSoft}`,color:T.brassDeep,fontFamily:body,fontSize:12,cursor:"pointer",marginTop:2,fontWeight:500}}>+ Add New Format</button>}
        {showAdd&&<AddConfigForm type="output_format" agentId={agent.id} onSaved={handleFormatAdded} onCancel={()=>setShowAdd(false)} showToast={showToast}/>}
      </div>

      {/* Guardrails */}
      <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"15px 18px",position:"relative"}}>
        <Corners color={T.flag}/>
        <div style={{fontFamily:mono,fontSize:9,color:T.flag,textTransform:"uppercase",letterSpacing:1.5,fontWeight:600,marginBottom:4}}>Layer 05 · Guardrails</div>
        <div style={{fontFamily:display,fontSize:16,fontWeight:600,color:T.navy,marginBottom:6}}>What must {agent.name.split(" ")[0]} never do?</div>
        <div style={{fontFamily:body,fontSize:12,color:T.mutedDeep,lineHeight:1.5,marginBottom:12,padding:"9px 13px",background:`${T.flag}07`,borderLeft:`3px solid ${T.flag}`}}>
          Applied to every prompt regardless of which Role or Format is active. Protects against legal overreach and unsupported claims. Multiple guardrail sets with per-format association — future feature.
        </div>
        {loading?<div style={{fontFamily:body,fontSize:12,color:T.muted,fontStyle:"italic",padding:"16px 0",textAlign:"center"}}>Loading…</div>:(
          <>
            <textarea value={guardrailText} onChange={e=>setGuardrailText(e.target.value)} rows={10}
              style={{width:"100%",background:T.paper,border:`1px solid ${T.lineSoft}`,padding:"10px 12px",fontFamily:mono,fontSize:11,color:T.ink,lineHeight:1.7,resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
              <div style={{fontFamily:mono,fontSize:9,color:T.muted,fontStyle:"italic"}}>Single guardrail set · applied to all prompts · multi-set association coming in future release</div>
              <button onClick={saveGuardrail} disabled={savingGuardrail} style={{fontFamily:mono,fontSize:9,color:T.flag,background:"transparent",border:`1px solid ${T.flag}`,padding:"5px 14px",cursor:"pointer",fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>{savingGuardrail?"Saving…":"Save Guardrails"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STATIC TABS
// ══════════════════════════════════════════════════════════════════════════════
function WorkflowTab() {
  return (
    <div style={{background:T.card,border:`1px dashed ${T.lineSoft}`,padding:"32px 28px",opacity:.65,textAlign:"center"}}>
      <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.5,fontWeight:600,marginBottom:8}}>Exhibit II · Assignments</div>
      <div style={{fontFamily:display,fontSize:18,fontWeight:600,color:T.navy,marginBottom:6}}>Agentic workflow assignments</div>
      <div style={{fontFamily:body,fontSize:13,color:T.muted,fontStyle:"italic"}}>Automated multi-step analysis sequences — Coming Q3 2026</div>
    </div>
  );
}

function ProjectsTab({ agent }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:T.card,border:`1px solid ${T.line}`,padding:"15px 17px",position:"relative"}}>
        <Corners/>
        <div style={{fontFamily:mono,fontSize:9,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.5,fontWeight:600,marginBottom:4}}>This Month · Work Log</div>
        <div style={{fontFamily:display,fontSize:17,fontWeight:600,color:T.navy,marginBottom:13}}>What {agent.name.split(" ")[0]} shipped</div>
        <div style={{fontFamily:body,fontSize:12,color:T.muted,fontStyle:"italic",padding:"20px 0",textAlign:"center"}}>Work log — mock data, v5 feature.</div>
      </div>
      <div style={{fontFamily:body,fontSize:11,color:T.muted,fontStyle:"italic"}}><strong style={{fontStyle:"normal",color:T.mutedDeep}}>Mock data.</strong> Live billing and report tracking activated in v5.</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — drop-in replacement for PersonnelScreen in TeamBuilder.jsx
// ══════════════════════════════════════════════════════════════════════════════
export default function PersonnelScreen({ agent, entries, entriesLoading, onBack, onEditEntry, onDeleteEntry, showToast }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [trainingSubView, setTrainingSubView] = useState("list");
  const [trainingResetKey, setTrainingResetKey] = useState(0);

  // Sync subView label to page header
  const handleTrainingSubView = useCallback((sv) => setTrainingSubView(sv), []);

  const renderTab = () => {
    switch(activeTab) {
      case "profile":  return <ProfileTab agent={agent}/>;
      case "resume":   return <ResumeTab agent={agent} showToast={showToast}/>;
      case "training": return <TrainingTabWithSubViewSync key={trainingResetKey} agent={agent} entries={entries} entriesLoading={entriesLoading} onEditEntry={onEditEntry} onDeleteEntry={onDeleteEntry} showToast={showToast} onSubViewChange={handleTrainingSubView}/>;
      case "playbook": return <PlaybookTab agent={agent} showToast={showToast}/>;
      case "workflow": return <WorkflowTab/>;
      case "projects": return <ProjectsTab agent={agent}/>;
      default:         return null;
    }
  };

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",minHeight:0}}>
      <PageHeader agent={agent} activeTab={activeTab} subView={trainingSubView}/>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* Sidebar */}
        <div style={{width:200,flexShrink:0,background:T.paper,borderRight:`1px solid ${T.line}`,padding:"13px 0",display:"flex",flexDirection:"column",overflowY:"auto"}}>
          <div style={{padding:"0 13px 11px",borderBottom:`1px solid ${T.line}`,marginBottom:9,display:"flex",gap:9,alignItems:"center"}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:T.paperDeep,border:`2px solid ${agent.color||T.moss}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:display,fontSize:14,fontWeight:700,color:agent.color||T.moss,flexShrink:0}}>{agent.name[0]}</div>
            <div>
              <div style={{fontFamily:display,fontSize:12,fontWeight:600,color:T.navy,lineHeight:1.2}}>{agent.name.split(" ")[0]}</div>
              <div style={{fontSize:9,color:T.muted,marginTop:1,fontFamily:mono}}>{agent.code} · {skillLabel(agent.skill)}</div>
            </div>
          </div>
          {NAV_GROUPS.map(group=>(
            <div key={group.id} style={{marginBottom:5}}>
              <div style={{padding:"4px 15px 2px",fontSize:8.5,fontWeight:700,color:T.brassDeep,textTransform:"uppercase",letterSpacing:1.5,fontFamily:mono}}>{group.label}</div>
              {group.tabs.map(t=>{
                const isActive = activeTab===t.id;
                return(
                  <button key={t.id} onClick={()=>{ setActiveTab(t.id); if(t.id==="training"){ setTrainingSubView("list"); setTrainingResetKey(k=>k+1); } }}
                    style={{width:"100%",textAlign:"left",padding:"7px 15px 7px 19px",fontSize:12.5,fontWeight:isActive?600:400,cursor:"pointer",border:"none",fontFamily:body,background:isActive?T.card:"transparent",color:isActive?T.navy:T.mutedDeep,borderLeft:isActive?`3px solid ${T.brass}`:"3px solid transparent",transition:"all 0.15s",display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:10,opacity:.7}}>{t.icon}</span>
                    <span style={{flex:1}}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
          <div style={{marginTop:"auto",padding:"11px 15px",borderTop:`1px solid ${T.line}`}}>
            <button onClick={onBack} style={{width:"100%",background:"transparent",border:`1px solid ${T.line}`,color:T.mutedDeep,padding:"6px",fontFamily:body,fontSize:11,cursor:"pointer"}}>← Team Builder</button>
          </div>
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px 64px",background:T.paperDeep}}>
          {renderTab()}
        </div>
      </div>
    </div>
  );
}

// Wrapper to surface subView state for page header
function TrainingTabWithSubViewSync({ agent, entries, entriesLoading, onEditEntry, onDeleteEntry, showToast, onSubViewChange }) {
  const [subViewLocal, setSubViewLocal] = useState("list");
  const handleSetSubView = (sv) => { setSubViewLocal(sv); onSubViewChange(sv); };
  return <TrainingTabInner agent={agent} entries={entries} entriesLoading={entriesLoading} onEditEntry={onEditEntry} onDeleteEntry={onDeleteEntry} showToast={showToast} subView={subViewLocal} setSubView={handleSetSubView}/>;
}

// Rename internal TrainingTab to accept subView as props for the wrapper
function TrainingTabInner(props) {
  return <TrainingTab {...props}/>;
}
