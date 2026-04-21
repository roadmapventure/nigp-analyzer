import React, { useState, useRef, useCallback } from "react";

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED_ENTRIES = [
  { id:"e-001", title:"Texas LGC §252 — Competitive Bidding Requirements", source:"Texas Local Government Code · Added Apr 10", category:"Jurisdiction", jurisdiction:"Texas", priority:75, triggers:["maverick","po-split"], status:"active", isDemo:true },
  { id:"e-002", title:"Uniform Guidance 2 CFR Part 200 — Federal Procurement", source:"Office of Management & Budget · Added Apr 8", category:"Compliance", jurisdiction:"Federal", priority:90, triggers:["all"], status:"active", isDemo:true },
  { id:"e-003", title:"GAO Standards for Internal Control in Government", source:"Government Accountability Office · Added Apr 8", category:"Compliance", jurisdiction:"Federal", priority:85, triggers:["maverick","po-split"], status:"active", isDemo:true },
  { id:"e-004", title:"NIGP Code of Ethics & Professional Standards", source:"National Institute of Governmental Purchasing · Added Apr 9", category:"Best Practice", jurisdiction:"All", priority:60, triggers:["all"], status:"active", isDemo:true },
  { id:"e-005", title:"NASPO Cooperative Purchasing Best Practices", source:"NASPO ValuePoint · Added Apr 9", category:"Best Practice", jurisdiction:"All", priority:55, triggers:["maverick","single-source"], status:"active", isDemo:true },
  { id:"e-006", title:"Maverick Spend Reduction Playbook", source:"Internal · Roadmap Venture · Added Apr 17", category:"Internal", jurisdiction:"All", priority:80, triggers:["maverick"], status:"active", isDemo:true },
  { id:"e-007", title:"California Public Contract Code §20160", source:"State of California · Added Apr 5", category:"Jurisdiction", jurisdiction:"California", priority:70, triggers:["maverick"], status:"disabled", isDemo:true },
];

const CATEGORIES    = ["Compliance","Jurisdiction","Best Practice","Internal"];
const JURISDICTIONS = ["All","Federal","Texas","California","Florida","New York","Illinois"];
const FLAG_TRIGGERS = [
  { id:"maverick",      label:"Maverick Spend" },
  { id:"po-split",      label:"PO Splitting"   },
  { id:"spike",         label:"Spend Spike"    },
  { id:"single-source", label:"Single Source"  },
  { id:"vendor-hhi",    label:"Vendor HHI"     },
  { id:"long-tail",     label:"Long-Tail"      },
];
const CAT_COLORS = {
  Compliance:      { text:"#f5a623", bg:"rgba(245,166,35,0.13)",  border:"rgba(245,166,35,0.35)"  },
  Jurisdiction:    { text:"#2d8cf0", bg:"rgba(45,140,240,0.13)",  border:"rgba(45,140,240,0.35)"  },
  "Best Practice": { text:"#00d2b4", bg:"rgba(0,210,180,0.13)",   border:"rgba(0,210,180,0.35)"   },
  Internal:        { text:"#9b6ef3", bg:"rgba(155,110,243,0.13)", border:"rgba(155,110,243,0.35)" },
};

// ─── AUSTIN TEST SCENARIOS ────────────────────────────────────────────────────
const BEE_SCENARIOS = [
  { id:"maverick", flag:"🔴", flagLabel:"Maverick Spend", flagColor:"#e85d4a", flagBg:"rgba(232,93,74,0.12)", flagBorder:"rgba(232,93,74,0.3)", title:"High Uncontracted IT Purchases", meta:"$2.1M in technology spend outside any master agreement · 847 transactions · 23 vendors", amount:"$2,142,880 at risk",
    queryText:"High uncontracted technology spend $2.1M across 847 transactions with 23 vendors, no master agreements in place, maverick spend concern", jurisdiction:"Texas" },
  { id:"posplit", flag:"🟠", flagLabel:"PO Splitting", flagColor:"#f5a623", flagBg:"rgba(245,166,35,0.12)", flagBorder:"rgba(245,166,35,0.3)", title:"Suspicious Sub-Threshold Orders", meta:"14 POs to same vendor in 30 days · All under $49,500 · Dept of Public Works", amount:"$674,200 structured",
    queryText:"14 purchase orders to same vendor in 30 days all under $49500 threshold, suspected bid splitting, Department of Public Works", jurisdiction:"Texas" },
  { id:"concentration", flag:"🔴", flagLabel:"Vendor Concentration", flagColor:"#e85d4a", flagBg:"rgba(232,93,74,0.12)", flagBorder:"rgba(232,93,74,0.3)", title:"Single Vendor: 34% of Facilities Spend", meta:"HHI: 3,240 · Top vendor controls $18.7M of $55M facilities budget · 1 contract", amount:"$18,720,000 single source",
    queryText:"Single vendor controls 34% of facilities spend HHI 3240 highly concentrated market single source dependency risk $18.7M", jurisdiction:"Texas" },
  { id:"spike", flag:"🟡", flagLabel:"Spend Spike", flagColor:"#ffbb28", flagBg:"rgba(255,187,40,0.12)", flagBorder:"rgba(255,187,40,0.3)", title:"December Surge — End of Year Rush", meta:"340% above monthly average in Dec · $4.2M in final 3 weeks · 12 departments", amount:"$4,200,000 spike",
    queryText:"December spending surge 340% above monthly average $4.2M in final 3 weeks year-end spending rush 12 departments", jurisdiction:"Texas" },
  { id:"full", flag:"🔵", flagLabel:"Combined Risk", flagColor:"#0088fe", flagBg:"rgba(0,136,254,0.12)", flagBorder:"rgba(0,136,254,0.3)", title:"Full Austin 2025 Portfolio", meta:"$372M total · All 6 flags active · 264 NIGP classes · 2,847 vendors", amount:"$372,988,798 total",
    queryText:"Full procurement portfolio analysis $372M total spend 2847 vendors 264 NIGP classes all risk flags active maverick spend vendor concentration PO splitting", jurisdiction:"Texas" },
];

const BEE_BEFORE = {
  maverick: { summary:"The City of Austin's procurement data shows $2.1M in technology spend occurring outside formal contract structures across 847 transactions with 23 vendors. This uncontracted spend pattern represents a process gap in procurement oversight and creates risk exposure for the organization.", findings:"The volume and distribution of uncontracted transactions suggests a systemic issue rather than isolated exceptions. Technology purchases appear to be initiated without proper contract establishment, bypassing standard procurement channels.", actions:["Review all uncontracted technology purchases and establish appropriate master agreements for recurring vendor relationships.","Implement pre-purchase approval workflows for purchases above internal thresholds to prevent future maverick spend.","Conduct spend analysis to identify which vendor relationships warrant formal contract establishment."], note:"No jurisdiction-specific regulations cited · No NIGP frameworks referenced · General procurement guidance only" },
  posplit: { summary:"Fourteen purchase orders were issued to the same vendor within 30 days, all structured below $49,500. This pattern warrants review as it may indicate deliberate threshold management to avoid competitive bidding requirements.", findings:"The clustering of orders near but below common competitive bidding thresholds is statistically unusual. The Department of Public Works should review its procurement approval process to ensure compliance with applicable purchasing policies.", actions:["Conduct internal audit of the 14 purchase orders to determine if they represent a single procurement artificially divided.","Review vendor approval process for Public Works department purchasing.","Implement ERP controls to flag multiple orders to same vendor within rolling 30-day windows."], note:"No jurisdiction-specific regulations cited · No statutory thresholds referenced · General guidance only" },
  concentration: { summary:"A single vendor accounts for approximately 34% of total facilities budget spend, with an HHI score of 3,240. This level of concentration creates supply chain risk and may limit the organization's negotiating leverage.", findings:"The Herfindahl-Hirschman Index score of 3,240 exceeds thresholds typically associated with competitive markets. Dependence on a single supplier for a large share of facilities spend could create operational disruption risk if the vendor relationship changes.", actions:["Evaluate current vendor contract terms and assess whether competitive re-solicitation is appropriate at next renewal.","Develop a vendor diversification strategy for the facilities category.","Establish concentration monitoring with alerts when a single vendor exceeds 20-25% of category spend."], note:"No jurisdiction-specific regulations cited · No NIGP sole-source standards referenced" },
  spike: { summary:"December spending showed a 340% increase above monthly averages, with $4.2M concentrated in the final three weeks of the fiscal year across 12 departments. This year-end surge pattern is a common indicator of budget exhaustion spending.", findings:"Year-end spending surges can indicate departments are rushing to expend remaining budget allocations without adequate planning or competitive sourcing. The 12-department scope suggests this is an organization-wide pattern rather than isolated to one area.", actions:["Review December purchases for compliance with procurement policies, particularly for purchases above competitive bidding thresholds.","Implement quarterly budget utilization reviews to reduce end-of-year pressure.","Develop guidance for departments on year-end procurement planning."], note:"No procurement law cited · No risk management framework referenced" },
  full: { summary:"Austin's 2025 procurement data covering $372M across 2,847 vendors and 264 NIGP classes shows several areas requiring attention including uncontracted spend, vendor concentration, and end-of-year purchasing patterns. Overall procurement health requires remediation in multiple categories.", findings:"The combination of maverick spend, PO splitting indicators, high vendor concentration, and year-end surges suggests gaps in procurement policy enforcement and contract coverage. The breadth of issues across multiple departments indicates systemic rather than isolated concerns.", actions:["Prioritize competitive bidding compliance review for high-dollar categories with uncontracted spend.","Implement vendor concentration monitoring across all major spend categories.","Develop an organization-wide procurement health dashboard for ongoing monitoring."], note:"General analysis only · No jurisdiction-specific law or NIGP standards applied" },
};

const BEE_AFTER = {
  maverick: { summary:"Austin's $2.1M in uncontracted technology spend likely violates Texas Local Government Code §252.021, which requires competitive bidding for contracts exceeding $50,000. Multiple vendor totals within the 847 uncontracted transactions exceed this statutory threshold without documented competitive process — creating direct legal exposure for the City.", findings:"Under Texas LGC §252, purchases structured to avoid competitive bidding thresholds constitute bid splitting and may expose procurement officers to personal liability. The NIGP Code of Ethics further requires that all purchases above applicable thresholds maintain documented competitive justification.", highlight:"Texas Local Government Code §252.021 requires competitive bidding for contracts over $50,000. Purchases lacking this documentation may be subject to legal challenge and audit findings.", highlightCite:"📖 Texas LGC §252 — Competitive Bidding Requirements · HIGH PRIORITY", actions:[{ text:"Immediate: Commission a legal review of all uncontracted transactions above $50,000. Document findings under Texas LGC §252.021(b). Engage City Attorney if violations are confirmed.", tag:"HIGH PRIORITY", tagColor:"#e85d4a" },{ text:"30 days: Establish NASPO ValuePoint cooperative contracts for recurring technology categories. Cooperative contracts satisfy Texas competitive bidding requirements under Government Code §791.", tag:"NASPO COOPERATIVE", tagColor:"#f5a623" },{ text:"90 days: Implement a Procurement Risk Register per NIGP risk management standards with mandatory competitive bidding documentation above $50,000 threshold.", tag:"RISK REGISTER", tagColor:"#00d2b4" }], sources:[{ title:"Texas LGC §252 — Competitive Bidding Requirements", meta:"Jurisdiction: Texas · High Priority", sim:"94%" },{ title:"NIGP Code of Ethics & Professional Standards", meta:"Jurisdiction: All · Medium Priority", sim:"87%" },{ title:"NASPO Cooperative Purchasing Best Practices", meta:"Jurisdiction: All · Medium Priority", sim:"81%" }], delta:["Texas LGC §252 competitive bidding threshold cited","NIGP Ethics — sole source justification requirement added","NASPO cooperative contract pathway recommended","3 frameworks cited · 2 jurisdiction-specific rules applied"] },
  posplit: { summary:"The pattern of 14 sub-threshold purchase orders to a single vendor within 30 days is consistent with deliberate bid splitting under Texas law. Texas LGC §252.021 prohibits structuring purchases to avoid the $50,000 competitive bidding threshold, and the cumulative $674,200 spent clearly exceeds that limit.", findings:"This pattern is explicitly prohibited under both Texas LGC §252 and NIGP's Code of Ethics. Individual procurement officers involved in approving these orders may face personal liability under Texas Government Code. The Department of Public Works purchasing process requires immediate review.", highlight:"Purchases structured to avoid competitive bidding thresholds constitute bid splitting under Texas LGC §252. Cumulative vendor spend of $674,200 triggered the competitive bidding requirement regardless of individual PO amounts.", highlightCite:"📖 Texas LGC §252 — Competitive Bidding Requirements · HIGH PRIORITY", actions:[{ text:"Immediate: Halt further purchases from this vendor pending legal review. Document the 14 POs as a potential bid splitting violation under Texas LGC §252.021(b).", tag:"LEGAL REVIEW", tagColor:"#e85d4a" },{ text:"30 days: Conduct a competitive solicitation for the underlying requirement. If a sole source exists, prepare a written sole source justification per NIGP Ethics standards.", tag:"COMPETITIVE BID REQUIRED", tagColor:"#f5a623" },{ text:"90 days: Implement ERP controls to aggregate vendor spend and flag cumulative totals approaching $50,000 per NIGP risk management framework Stage 1 guidance.", tag:"SYSTEM CONTROL", tagColor:"#00d2b4" }], sources:[{ title:"Texas LGC §252 — Competitive Bidding Requirements", meta:"Jurisdiction: Texas · High Priority", sim:"96%" },{ title:"NIGP Code of Ethics & Professional Standards", meta:"Jurisdiction: All · Medium Priority", sim:"89%" },{ title:"Risk Management Best Practice — NIGP", meta:"Jurisdiction: All · Medium Priority", sim:"74%" }], delta:["Texas LGC §252 bid splitting prohibition directly cited","Cumulative threshold calculation explained per statute","NIGP Ethics personal liability provision surfaced","3 frameworks cited · Texas-specific legal exposure quantified"] },
  concentration: { summary:"An HHI of 3,240 in the facilities category indicates a highly concentrated market by both Department of Justice guidelines and NIGP procurement standards. The single vendor at 34% of category spend requires documented sole source justification under NIGP's Code of Ethics, and the contract should be evaluated for competitive re-solicitation.", findings:"NIGP's professional standards specify that vendor concentration above 25% of category spend warrants a formal sole source review with written justification. The GAO Green Book further requires that internal controls include periodic vendor concentration monitoring as part of procurement oversight.", highlight:"Vendor concentration above 25% of category spend requires documented sole-source justification per NIGP Code of Ethics. An HHI above 2,500 is classified as highly concentrated under standard market analysis frameworks.", highlightCite:"📖 NIGP Code of Ethics & Professional Standards · MEDIUM PRIORITY", actions:[{ text:"Immediate: Prepare a sole source justification for the current facilities vendor relationship. Document why competitive sourcing is not feasible if that is the determination.", tag:"SOLE SOURCE DOCS", tagColor:"#e85d4a" },{ text:"60 days: Issue a market survey or Request for Information to assess vendor availability. NASPO ValuePoint has pre-competed facilities management contracts available to Texas agencies.", tag:"MARKET SURVEY", tagColor:"#f5a623" },{ text:"Next contract cycle: Structure facilities procurement across minimum 3 vendors per NIGP diversification best practice to reduce HHI below 2,500.", tag:"DIVERSIFICATION", tagColor:"#00d2b4" }], sources:[{ title:"NIGP Code of Ethics & Professional Standards", meta:"Jurisdiction: All · Medium Priority", sim:"92%" },{ title:"NASPO Cooperative Purchasing Best Practices", meta:"Jurisdiction: All · Medium Priority", sim:"85%" },{ title:"GAO Standards for Internal Control", meta:"Jurisdiction: Federal · Critical Priority", sim:"78%" }], delta:["NIGP 25% concentration threshold explicitly cited","GAO internal control standard applied","NASPO alternative sourcing pathway identified","3 frameworks cited · Specific HHI remediation target given"] },
  spike: { summary:"The December spending surge represents a procurement risk pattern documented in NIGP's Risk Management Standard. Stage 1 of the NIGP risk management framework requires procurement professionals to identify risk factors at the point of need — year-end surges indicate this step was bypassed for $4.2M in purchases.", findings:"NIGP's Risk Management Best Practice identifies year-end budget exhaustion spending as a Stage 2 strategic risk requiring a formal procurement strategy before execution. Purchases made under time pressure at year-end are statistically more likely to be uncompetitive, overpriced, or outside established contracts.", highlight:"NIGP Risk Management Standard Stage 2 requires a procurement strategy assessment prior to execution. Year-end spending surges that bypass this stage represent both process and financial risk.", highlightCite:"📖 Risk Management Best Practice — NIGP · MEDIUM PRIORITY", actions:[{ text:"Immediate: Audit December purchases above $50,000 for competitive bidding compliance under Texas LGC §252. Year-end urgency does not exempt purchases from statutory requirements.", tag:"COMPLIANCE AUDIT", tagColor:"#e85d4a" },{ text:"Q3 Planning: Implement quarterly budget utilization reviews using NIGP's Risk Register framework to surface year-end pressure early and allow planned procurement.", tag:"RISK REGISTER", tagColor:"#f5a623" },{ text:"Policy: Establish a year-end procurement freeze for non-emergency purchases in the final 2 weeks of the fiscal year, consistent with NIGP best practice.", tag:"POLICY UPDATE", tagColor:"#00d2b4" }], sources:[{ title:"Risk Management Best Practice — NIGP", meta:"Jurisdiction: All · Medium Priority", sim:"91%" },{ title:"NIGP Code of Ethics & Professional Standards", meta:"Jurisdiction: All · Medium Priority", sim:"82%" },{ title:"Texas LGC §252 — Competitive Bidding Requirements", meta:"Jurisdiction: Texas · High Priority", sim:"76%" }], delta:["NIGP Risk Management 8-stage framework applied","Year-end surge identified as Stage 2 strategic risk","Texas LGC §252 compliance obligation in time-pressure situations cited","3 frameworks cited · Risk management lifecycle mapped to finding"] },
  full: { summary:"Austin's $372M procurement portfolio shows systemic compliance gaps against Texas statutory requirements and NIGP professional standards. The combination of bid splitting indicators ($674K), uncontracted spend ($2.1M), highly concentrated vendor markets (HHI 3,240), and year-end surges ($4.2M) represents compounding legal and operational risk requiring prioritized remediation.", findings:"Texas LGC §252 competitive bidding requirements apply to the majority of identified risk categories. NIGP's Code of Ethics and Risk Management Standard provide the professional framework for remediation. Uniform Guidance 2 CFR §200 applies to any federally-funded spend within this portfolio.", highlight:"Four concurrent risk categories in a single portfolio — maverick spend, bid splitting, vendor concentration, and year-end surges — indicate procurement policy enforcement gaps rather than isolated incidents. NIGP standards require a formal Risk Register for portfolios of this complexity.", highlightCite:"📖 NIGP Code of Ethics · Texas LGC §252 · Risk Management Standard — Combined", actions:[{ text:"30 days: Conduct a competitive bidding compliance review of all transactions above $50,000 lacking master agreement coverage. Texas LGC §252 violations create audit and legal risk.", tag:"PRIORITY 1 — LEGAL", tagColor:"#e85d4a" },{ text:"60 days: Establish a Procurement Risk Register covering all 6 identified risk flags using NIGP's 8-stage risk management framework. Assign owners and mitigation timelines.", tag:"PRIORITY 2 — GOVERNANCE", tagColor:"#f5a623" },{ text:"90 days: Leverage NASPO ValuePoint cooperative contracts for top uncontracted spend categories. Pre-competed contracts satisfy Texas competitive bidding requirements.", tag:"PRIORITY 3 — CONTRACTS", tagColor:"#00d2b4" }], sources:[{ title:"Texas LGC §252 — Competitive Bidding Requirements", meta:"Jurisdiction: Texas · High Priority", sim:"95%" },{ title:"NIGP Code of Ethics & Professional Standards", meta:"Jurisdiction: All · Medium Priority", sim:"91%" },{ title:"Risk Management Best Practice — NIGP", meta:"Jurisdiction: All · Medium Priority", sim:"88%" },{ title:"Uniform Guidance 2 CFR Part 200", meta:"Jurisdiction: Federal · Critical Priority", sim:"83%" }], delta:["Texas LGC §252 applied across all 4 risk categories","NIGP 8-stage Risk Register framework recommended","Uniform Guidance federal applicability flagged","NASPO cooperative contract pathway for 3 categories","4 frameworks cited · Jurisdiction-specific legal exposure mapped"] },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function priorityInfo(v) {
  if (v >= 80) return { label:"Critical", color:"#e85d4a" };
  if (v >= 65) return { label:"High",     color:"#f5a623" };
  if (v >= 40) return { label:"Medium",   color:"#2d8cf0" };
  return              { label:"Low",      color:"#5a7a9a" };
}
function Tag({ color, children }) {
  return <span style={{ display:"inline-block", background:`${color}18`, border:`1px solid ${color}40`, borderRadius:4, padding:"2px 7px", fontSize:10, fontWeight:700, color, fontFamily:"monospace", letterSpacing:"0.3px", whiteSpace:"nowrap" }}>{children}</span>;
}
function TriggerTags({ triggers, compact }) {
  if (!triggers?.length) return null;
  if (triggers.includes("all")) return <Tag color="#8aadca">All Flags</Tag>;
  const show = compact ? triggers.slice(0,2) : triggers;
  return <span style={{ display:"flex", gap:4, flexWrap:"wrap" }}>{show.map(t => { const f=FLAG_TRIGGERS.find(f=>f.id===t); return f ? <Tag key={t} color="#8aadca">{compact ? f.label.split(" ")[0] : f.label}</Tag> : null; })}{compact && triggers.length > 2 && <Tag color="#5a7a9a">+{triggers.length-2}</Tag>}</span>;
}

// ─── PDF EXTRACTOR ────────────────────────────────────────────────────────────
async function extractTextFromFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (file.type==="application/pdf" || file.name.endsWith(".pdf")) {
          const bytes = new Uint8Array(e.target.result);
          let raw = "";
          for (let i=0; i<bytes.length; i++) {
            const c = bytes[i];
            if (c>=32 && c<=126) raw += String.fromCharCode(c);
            else if (c===10 || c===13) raw += " ";
          }
          const words = raw.replace(/[^a-zA-Z0-9\s.,;:\-()%$#@!?'"]/g," ").replace(/\s+/g," ").split(" ").filter(w=>w.length>=3 && /[a-zA-Z]{2,}/.test(w));
          resolve({ text:words.join(" ").trim(), wordCount:words.length });
        } else {
          const text = e.target.result;
          resolve({ text, wordCount:text.split(/\s+/).filter(w=>w.length>0).length });
        }
      } catch { resolve({ text:"", wordCount:0 }); }
    };
    file.type==="application/pdf" || file.name.endsWith(".pdf") ? reader.readAsArrayBuffer(file) : reader.readAsText(file);
  });
}

// ─── AI METADATA VIA api/brief ────────────────────────────────────────────────
async function generateMetadata(filename, extractedText) {
  const snippet = extractedText.slice(0, 3000);
  try {
    const res = await fetch("/api/brief", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        system:"You are a procurement document classifier. Return ONLY valid JSON — no markdown fences, no explanation, no preamble.",
        messages:[{ role:"user", content:`Analyze this government procurement document and return ONLY a JSON object:\n{"title":"Clean readable title","category":"one of: Compliance, Jurisdiction, Best Practice, Internal","jurisdiction":"one of: All, Federal, Texas, California, Florida, New York, Illinois","priority":<0-100>,"triggers":<array from: ["maverick","po-split","spike","single-source","vendor-hhi","long-tail"] or ["all"]>}\n\nFilename: ${filename}\n\nText:\n${snippet}` }]
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.content?.[0]?.text || "";
    const clean = raw.replace(/^```json\s*/i,"").replace(/```\s*$/,"").trim();
    const parsed = JSON.parse(clean);
    if (parsed.triggers && !Array.isArray(parsed.triggers)) parsed.triggers = [];
    return parsed;
  } catch { return null; }
}

// ─── ROW MENU ────────────────────────────────────────────────────────────────
function RowMenu({ entry, onToggleStatus, onEdit }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position:"relative", display:"inline-block" }}>
      <button onClick={() => setOpen(o=>!o)}
        style={{ background:"transparent", border:"1px solid #1e3050", borderRadius:5, width:28, height:26, cursor:"pointer", color:"#5a7a9a", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s", lineHeight:1 }}
        onMouseEnter={e=>e.currentTarget.style.borderColor="#2d8cf0"}
        onMouseLeave={e=>e.currentTarget.style.borderColor="#1e3050"}
      >⋯</button>
      {open && (
        <div style={{ position:"absolute", right:0, top:"calc(100% + 4px)", background:"#111827", border:"1px solid #1e3050", borderRadius:8, minWidth:155, boxShadow:"0 8px 24px rgba(0,0,0,0.5)", zIndex:200, overflow:"hidden" }}>
          <button onClick={() => { setOpen(false); onEdit(entry); }}
            style={{ width:"100%", background:"none", border:"none", padding:"9px 14px", textAlign:"left", color:"#8aadca", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontFamily:"inherit" }}
            onMouseEnter={e=>e.currentTarget.style.background="#1a2a3a"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
            <span>✎</span> Edit Entry
          </button>
          <button onClick={() => { setOpen(false); onToggleStatus(entry.id); }}
            style={{ width:"100%", background:"none", border:"none", padding:"9px 14px", textAlign:"left", color:entry.status==="active"?"#f5a623":"#3ec878", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontFamily:"inherit" }}
            onMouseEnter={e=>e.currentTarget.style.background="#1a2a3a"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
            <span>{entry.status==="active"?"⏸":"▶"}</span> {entry.status==="active"?"Disable":"Enable"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── NEW / EDIT ENTRY SCREEN ──────────────────────────────────────────────────
function NewEntryScreen({ onBack, onSaved, showToast, existingEntry }) {
  const isEditing = !!existingEntry;
  const [uploadState, setUploadState] = useState(isEditing ? "ready" : "idle");
  const [uploadProgress, setUploadProgress] = useState(isEditing ? 100 : 0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedText, setExtractedText] = useState(existingEntry?.content || "");
  const [wordCount, setWordCount] = useState(existingEntry?.content ? existingEntry.content.split(/\s+/).length : 0);
  const [extractedOpen, setExtractedOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(existingEntry ? {
    id:existingEntry.id, title:existingEntry.title||"", category:existingEntry.category||"Compliance",
    jurisdiction:existingEntry.jurisdiction||"All", priority:existingEntry.priority??50,
    triggers:existingEntry.triggers||[], status:existingEntry.status||"active",
  } : { title:"", category:"Compliance", jurisdiction:"All", priority:50, triggers:[], status:"active" });
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploadState("uploading"); setUploadProgress(0); setUploadedFile(file);
    let prog = 0;
    const ticker = setInterval(() => { prog += Math.random()*18+8; if(prog>=90){clearInterval(ticker);prog=90;} setUploadProgress(Math.min(90,prog)); }, 180);
    const { text, wordCount:wc } = await extractTextFromFile(file);
    clearInterval(ticker); setUploadProgress(100); setExtractedText(text); setWordCount(wc);
    await new Promise(r=>setTimeout(r,400));
    setUploadState("ready");
    showToast("✨ Claude is analyzing your document…","✨");
    const meta = await generateMetadata(file.name, text);
    if (meta) {
      setForm(f => ({ ...f, title:meta.title||f.title, category:meta.category||f.category, jurisdiction:meta.jurisdiction||f.jurisdiction, priority:meta.priority??f.priority, triggers:Array.isArray(meta.triggers)?meta.triggers:f.triggers }));
      showToast("Metadata generated — review before saving");
    } else { showToast("Could not auto-generate metadata — fill in manually","⚠"); }
  };

  const toggleTrigger = (id) => {
    if (id==="all") { setForm(f=>({...f,triggers:f.triggers.includes("all")?[]:["all"]})); return; }
    setForm(f=>{ const base=f.triggers.filter(t=>t!=="all"); return {...f,triggers:base.includes(id)?base.filter(t=>t!==id):[...base,id]}; });
  };

  const handleSave = async () => {
    if (!form.title || !extractedText) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/ingest", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({...form,content:extractedText}) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error||"Save failed","⚠"); setIsSaving(false); return; }
      showToast(isEditing ? "Entry updated ✦" : "Entry saved & indexed ✦");
      onSaved({...form, id:data.entry?.id||form.id||`e-${Date.now()}`, source:`${isEditing?existingEntry.source:""||`Added ${new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})}`}`, content:extractedText});
    } catch(err) { showToast("Network error: "+err.message,"⚠"); }
    setIsSaving(false);
  };

  const locked = uploadState !== "ready";
  const pInfo  = priorityInfo(form.priority);

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px 28px 60px", maxWidth:820 }}>
      <button onClick={onBack} style={{ background:"none", border:"none", color:"#5a7a9a", fontSize:12, cursor:"pointer", fontFamily:"monospace", letterSpacing:"0.5px", marginBottom:22, padding:0, display:"flex", alignItems:"center", gap:6 }}>← Back to Knowledge Library</button>
      <div style={{ marginBottom:26 }}>
        <div style={{ fontFamily:"monospace", fontSize:10, fontWeight:700, color:"#00d2b4", letterSpacing:"2.5px", textTransform:"uppercase", marginBottom:6 }}>▸ {isEditing?"Edit Entry":"New Entry"} — AI Relevancy</div>
        <div style={{ fontSize:22, fontWeight:800, color:"#e8f0fe", marginBottom:4 }}>{isEditing?"Edit Knowledge Base Entry":"Add to Knowledge Base"}</div>
        <div style={{ fontSize:13, color:"#5a7a9a", lineHeight:1.5 }}>{isEditing?"Update the metadata for this entry. The document text is already indexed.":"Upload a procurement document. Claude will extract the text, suggest metadata, and index it for briefings."}</div>
      </div>

      {/* Upload zone states */}
      {uploadState==="idle" && !isEditing && (
        <div onClick={() => fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}}
          style={{ border:"2px dashed #243a58", borderRadius:12, padding:"36px 32px", textAlign:"center", cursor:"pointer", background:"rgba(13,20,36,0.6)", marginBottom:28, transition:"all 0.2s" }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#00d2b4";e.currentTarget.style.background="rgba(0,210,180,0.03)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="#243a58";e.currentTarget.style.background="rgba(13,20,36,0.6)";}}>
          <div style={{ fontSize:36, marginBottom:12 }}>📄</div>
          <div style={{ fontSize:16, fontWeight:700, color:"#e8f0fe", marginBottom:6 }}>Upload a procurement document</div>
          <div style={{ fontSize:12, color:"#5a7a9a", marginBottom:18, lineHeight:1.5 }}>PDF, DOCX, or TXT · Up to 20MB<br/>NIGP guides, compliance frameworks, state laws, best practice playbooks</div>
          <div style={{ display:"inline-block", background:"rgba(0,210,180,0.1)", border:"1px solid rgba(0,210,180,0.35)", borderRadius:6, padding:"9px 22px", fontSize:12, fontWeight:700, color:"#00d2b4", fontFamily:"monospace", letterSpacing:"1px", textTransform:"uppercase" }}>Select File</div>
          <input ref={fileRef} type="file" accept=".pdf,.txt,.docx" style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])} />
        </div>
      )}
      {uploadState==="uploading" && !isEditing && (
        <div style={{ border:"2px solid rgba(45,140,240,0.4)", borderRadius:12, padding:"32px", textAlign:"center", background:"rgba(45,140,240,0.04)", marginBottom:28 }}>
          <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
          <div style={{ fontSize:15, fontWeight:700, color:"#2d8cf0", marginBottom:14 }}>Extracting document text…</div>
          <div style={{ fontFamily:"monospace", fontSize:12, color:"#5a7a9a", marginBottom:10 }}>{uploadedFile?.name}</div>
          <div style={{ background:"#1e3050", borderRadius:20, height:5, width:"100%", maxWidth:340, margin:"0 auto 10px", overflow:"hidden" }}><div style={{ height:"100%", borderRadius:20, background:"linear-gradient(90deg,#2d8cf0,#00d2b4)", width:`${uploadProgress}%`, transition:"width 0.2s" }}/></div>
          <div style={{ fontSize:11, color:"#2d8cf0", fontFamily:"monospace" }}>Extracting text · {Math.round(uploadProgress)}% complete</div>
        </div>
      )}
      {uploadState==="ready" && (
        <div style={{ border:`2px solid ${isEditing?"rgba(45,140,240,0.4)":"rgba(62,200,120,0.4)"}`, borderRadius:12, padding:"20px 24px", background:isEditing?"rgba(45,140,240,0.05)":"rgba(62,200,120,0.05)", marginBottom:20, display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:42, height:42, background:isEditing?"rgba(45,140,240,0.12)":"rgba(62,200,120,0.12)", border:`1px solid ${isEditing?"rgba(45,140,240,0.35)":"rgba(62,200,120,0.35)"}`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>📄</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#e8f0fe", marginBottom:2 }}>{isEditing ? existingEntry.title : uploadedFile?.name}</div>
            <div style={{ fontSize:11, color:isEditing?"#2d8cf0":"#3ec878", fontFamily:"monospace" }}>{isEditing ? `✎ Editing — ${wordCount.toLocaleString()} words in knowledge base` : `✓ ${wordCount.toLocaleString()} words extracted · Ready to index`}</div>
          </div>
          <div style={{ fontSize:24 }}>{isEditing ? "✏️" : "✅"}</div>
        </div>
      )}

      {uploadState==="ready" && !isEditing && (
        <div style={{ background:"rgba(155,110,243,0.08)", border:"1px solid rgba(155,110,243,0.25)", borderRadius:10, padding:"13px 18px", display:"flex", alignItems:"flex-start", gap:12, marginBottom:24 }}>
          <div style={{ fontSize:18, flexShrink:0, marginTop:1 }}>✨</div>
          <div style={{ fontSize:12, color:"#8aadca", lineHeight:1.6 }}><strong style={{ color:"#9b6ef3" }}>Claude analyzed your document</strong> and suggested the metadata below. Review and adjust before saving.</div>
        </div>
      )}

      {/* Fields */}
      <div style={{ opacity:locked?0.38:1, pointerEvents:locked?"none":"auto", transition:"opacity 0.3s" }}>
        <div style={{ fontFamily:"monospace", fontSize:10, fontWeight:700, color:locked?"#3a5070":"#00d2b4", letterSpacing:"2px", textTransform:"uppercase", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
          {locked?"🔒":"✦"} AI Relevancy Settings
          {locked && <span style={{ fontSize:10, color:"#3a5070", fontWeight:400, letterSpacing:0, textTransform:"none", fontFamily:"inherit" }}>— unlocks after upload</span>}
        </div>

        {/* Title */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontFamily:"monospace", fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"#5a7a9a", marginBottom:5, display:"flex", alignItems:"center", gap:6 }}>
            Document Title
            {!locked && !isEditing && <span style={{ background:"rgba(155,110,243,0.12)", border:"1px solid rgba(155,110,243,0.3)", borderRadius:3, padding:"1px 5px", fontSize:8, fontWeight:700, color:"#9b6ef3" }}>AI SUGGESTED</span>}
          </div>
          <input style={{ width:"100%", background:!locked&&form.title?"rgba(0,210,180,0.04)":"#111827", border:`1px solid ${!locked&&form.title?"rgba(0,210,180,0.3)":"#1e3050"}`, borderRadius:6, padding:"9px 12px", fontSize:13, color:"#e8f0fe", outline:"none", fontFamily:"inherit" }}
            value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder={locked?"Auto-generated after upload…":"Enter document title…"} disabled={locked} />
        </div>

        {/* Category + Jurisdiction */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
          {[{key:"category",label:"Category",options:CATEGORIES},{key:"jurisdiction",label:"Jurisdiction",options:JURISDICTIONS}].map(({key,label,options}) => (
            <div key={key}>
              <div style={{ fontFamily:"monospace", fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"#5a7a9a", marginBottom:5, display:"flex", alignItems:"center", gap:6 }}>
                {label}
                {!locked && !isEditing && <span style={{ background:"rgba(155,110,243,0.12)", border:"1px solid rgba(155,110,243,0.3)", borderRadius:3, padding:"1px 5px", fontSize:8, fontWeight:700, color:"#9b6ef3" }}>AI SUGGESTED</span>}
              </div>
              <select style={{ width:"100%", background:!locked?"rgba(0,210,180,0.04)":"#111827", border:`1px solid ${!locked?"rgba(0,210,180,0.3)":"#1e3050"}`, borderRadius:6, padding:"8px 12px", fontSize:13, color:"#e8f0fe", outline:"none", fontFamily:"inherit", cursor:locked?"default":"pointer" }}
                value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} disabled={locked}>
                {options.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Priority */}
        <div style={{ marginBottom:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <div style={{ fontFamily:"monospace", fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"#5a7a9a", display:"flex", alignItems:"center", gap:6 }}>
              Priority Weight
              {!locked && !isEditing && <span style={{ background:"rgba(155,110,243,0.12)", border:"1px solid rgba(155,110,243,0.3)", borderRadius:3, padding:"1px 5px", fontSize:8, fontWeight:700, color:"#9b6ef3" }}>AI SUGGESTED</span>}
            </div>
            <span style={{ fontFamily:"monospace", fontSize:11, fontWeight:700, color:pInfo.color }}>{pInfo.label} &nbsp;{form.priority} / 100</span>
          </div>
          <input type="range" min={0} max={100} value={form.priority} onChange={e=>setForm(f=>({...f,priority:+e.target.value}))}
            style={{ width:"100%", accentColor:pInfo.color, cursor:locked?"default":"pointer" }} disabled={locked} />
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:3 }}>
            {["Low","Medium","High","Critical"].map(l=><span key={l} style={{ fontSize:9, color:"#3a5070", fontFamily:"monospace" }}>{l}</span>)}
          </div>
        </div>

        {/* Triggers */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontFamily:"monospace", fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"#5a7a9a", marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
            Flag Triggers
            {!locked && !isEditing && <span style={{ background:"rgba(155,110,243,0.12)", border:"1px solid rgba(155,110,243,0.3)", borderRadius:3, padding:"1px 5px", fontSize:8, fontWeight:700, color:"#9b6ef3" }}>AI SUGGESTED</span>}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {FLAG_TRIGGERS.map(f => { const on=form.triggers.includes("all")||form.triggers.includes(f.id); return (
              <label key={f.id} style={{ display:"flex", alignItems:"center", gap:7, cursor:locked?"default":"pointer", background:on?"rgba(0,210,180,0.08)":"rgba(14,21,32,0.6)", border:`1px solid ${on?"rgba(0,210,180,0.4)":"#1e3050"}`, borderRadius:6, padding:"7px 10px", fontSize:12, color:on?"#00d2b4":"#5a7a9a", fontWeight:on?700:400, transition:"all 0.15s" }}>
                <input type="checkbox" checked={on} onChange={()=>toggleTrigger(f.id)} disabled={locked} style={{ accentColor:"#00d2b4", width:13, height:13, cursor:locked?"default":"pointer" }}/>{f.label}
              </label>
            );})}
          </div>
          <label style={{ display:"flex", alignItems:"center", gap:7, cursor:locked?"default":"pointer", marginTop:6, background:form.triggers.includes("all")?"rgba(0,210,180,0.08)":"rgba(14,21,32,0.6)", border:`1px solid ${form.triggers.includes("all")?"rgba(0,210,180,0.4)":"#1e3050"}`, borderRadius:6, padding:"7px 10px", fontSize:12, color:form.triggers.includes("all")?"#00d2b4":"#5a7a9a", fontWeight:form.triggers.includes("all")?700:400 }}>
            <input type="checkbox" checked={form.triggers.includes("all")} onChange={()=>toggleTrigger("all")} disabled={locked} style={{ accentColor:"#00d2b4", width:13, height:13 }}/>All Flags (always retrieve for every briefing)
          </label>
        </div>

        {/* Extracted text collapsible */}
        {uploadState==="ready" && (
          <div style={{ marginBottom:28 }}>
            <button onClick={()=>setExtractedOpen(o=>!o)} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"10px 14px", background:"#111827", border:"1px solid #1e3050", borderRadius:extractedOpen?"8px 8px 0 0":8, fontSize:12, color:"#5a7a9a", fontFamily:"monospace", transition:"all 0.15s" }}>
              <span>📄</span><span>View extracted document text</span>
              <span style={{ background:"rgba(232,93,74,0.1)", border:"1px solid rgba(232,93,74,0.25)", borderRadius:4, padding:"1px 6px", fontSize:9, fontWeight:700, color:"#e85d4a", marginLeft:4 }}>READ ONLY</span>
              <span style={{ marginLeft:"auto", fontSize:10 }}>{extractedOpen?"▲":"▼"}</span>
            </button>
            {extractedOpen && (
              <div style={{ background:"#0a0f1a", border:"1px solid #1e3050", borderTop:"none", borderRadius:"0 0 8px 8px", padding:"14px 16px", fontSize:11, color:"#5a7a9a", fontFamily:"monospace", lineHeight:1.8, maxHeight:180, overflowY:"auto", whiteSpace:"pre-wrap", userSelect:"none" }}>
                {extractedText.split(/\s+/).filter(w=>/[a-zA-Z]{2,}/.test(w)).slice(0,300).join(" ")}
                {extractedText.length>0 ? "\n\n[Read-only · Full text stored in Supabase]" : ""}
              </div>
            )}
          </div>
        )}

        {/* Save footer */}
        {uploadState==="ready" && (
          <div style={{ display:"flex", alignItems:"center", gap:12, paddingTop:20, borderTop:"1px solid #1e3050" }}>
            <button onClick={handleSave} disabled={!form.title||isSaving}
              style={{ background:"linear-gradient(135deg,#2d8cf0,#00d2b4)", border:"none", borderRadius:8, padding:"12px 32px", fontSize:13, fontWeight:700, color:"#0a0f1a", cursor:(!form.title||isSaving)?"not-allowed":"pointer", fontFamily:"inherit", opacity:(!form.title||isSaving)?0.5:1, transition:"opacity 0.2s", display:"flex", alignItems:"center", gap:8 }}>
              {isSaving ? "⏳ Saving…" : isEditing ? "Update Entry" : "Save & Index Entry"}
            </button>
            <button onClick={onBack} style={{ background:"transparent", border:"1px solid #1e3050", borderRadius:8, padding:"12px 22px", fontSize:13, fontWeight:700, color:"#5a7a9a", cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
            <div style={{ fontSize:11, color:"#3a5070", lineHeight:1.5 }}>Document text embedded and stored in Supabase.<br/>Retrieved automatically during AI briefings.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AI BEE SCREEN ────────────────────────────────────────────────────────────
function AIBeeScreen({ showToast }) {
  const [selectedScenario, setSelectedScenario] = useState(BEE_SCENARIOS[0]);
  const [runState, setRunState] = useState("idle"); // idle | running | done
  const [beforeContent, setBeforeContent] = useState(null);
  const [afterContent, setAfterContent]   = useState(null);

  const runTest = async () => {
    setRunState("running");
    setBeforeContent(null);
    setAfterContent(null);
    await new Promise(r => setTimeout(r, 1800));
    setBeforeContent(BEE_BEFORE[selectedScenario.id]);
    setAfterContent(BEE_AFTER[selectedScenario.id]);
    setRunState("done");
  };

  const B = beforeContent;
  const A = afterContent;

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}>

      {/* Page header */}
      <div style={{ padding:"18px 26px 14px", borderBottom:"1px solid #1e3050", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", gap:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:40, height:40, background:"linear-gradient(135deg,#f5a623,#ffc84a)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0, boxShadow:"0 0 20px rgba(245,166,35,0.2)" }}>🐝</div>
          <div>
            <div style={{ fontSize:19, fontWeight:800, color:"#e8f0fe" }}>AI Bee <span style={{ fontSize:13, fontWeight:400, color:"#5a7a9a" }}>— Intelligence Testing</span></div>
            <div style={{ fontSize:12, color:"#5a7a9a", marginTop:2 }}>Validate how each knowledge base document improves AI briefing quality before publishing</div>
          </div>
        </div>
        <div style={{ fontFamily:"monospace", fontSize:10, color:"#f5a623", background:"rgba(245,166,35,0.1)", border:"1px solid rgba(245,166,35,0.25)", borderRadius:5, padding:"4px 12px", flexShrink:0 }}>🐝 Does it know its stuff?</div>
      </div>

      {/* Scenario strip */}
      <div style={{ padding:"14px 26px 12px", borderBottom:"1px solid #1e3050", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ fontFamily:"monospace", fontSize:9, fontWeight:700, color:"#5a7a9a", letterSpacing:"2px", textTransform:"uppercase" }}>① Choose a test scenario — Austin 2025 spend data</div>
          <button onClick={runTest} disabled={runState==="running"}
            style={{ background:"linear-gradient(135deg,#f5a623,#ffc84a)", border:"none", borderRadius:8, padding:"9px 22px", fontSize:13, fontWeight:700, color:"#080d17", cursor:runState==="running"?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:8, boxShadow:"0 4px 16px rgba(245,166,35,0.25)", opacity:runState==="running"?0.7:1, flexShrink:0 }}>
            <span>{runState==="running"?"⏳":"🐝"}</span> {runState==="running"?"Running…":"Run Test"}
          </button>
        </div>
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
          {BEE_SCENARIOS.map(sc => (
            <div key={sc.id} onClick={() => { setSelectedScenario(sc); setRunState("idle"); setBeforeContent(null); setAfterContent(null); }}
              style={{ flexShrink:0, background:selectedScenario.id===sc.id?"rgba(245,166,35,0.06)":"#111827", border:`1px solid ${selectedScenario.id===sc.id?"#f5a623":"#1e3050"}`, borderRadius:8, padding:"10px 14px", cursor:"pointer", transition:"all 0.15s", minWidth:185, maxWidth:220 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:10, fontWeight:700, fontFamily:"monospace", padding:"2px 7px", borderRadius:3, marginBottom:6, background:sc.flagBg, color:sc.flagColor, border:`1px solid ${sc.flagBorder}` }}>{sc.flag} {sc.flagLabel}</div>
              <div style={{ fontSize:12, fontWeight:700, color:"#e8f0fe", marginBottom:3, lineHeight:1.3 }}>{sc.title}</div>
              <div style={{ fontSize:10, color:"#5a7a9a", lineHeight:1.4 }}>{sc.meta}</div>
              <div style={{ fontFamily:"monospace", fontSize:11, fontWeight:700, color:"#f5a623", marginTop:5 }}>{sc.amount}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison panels */}
      <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 1fr", overflow:"hidden", minHeight:0 }}>

        {/* BEFORE */}
        <div style={{ display:"flex", flexDirection:"column", overflow:"hidden", borderRight:"1px solid #1e3050" }}>
          <div style={{ padding:"11px 20px", borderBottom:"1px solid #1e3050", background:"rgba(30,48,80,0.3)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:16 }}>🤖</span>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:"#6a8faa" }}>Standard Brief</div>
                <div style={{ fontSize:10, color:"#3a5070", marginTop:1 }}>Base Claude · No knowledge base</div>
              </div>
            </div>
            <span style={{ fontFamily:"monospace", fontSize:9, fontWeight:700, background:"rgba(106,143,170,0.15)", border:"1px solid rgba(106,143,170,0.25)", borderRadius:3, padding:"2px 7px", color:"#6a8faa", letterSpacing:"0.5px" }}>GENERIC</span>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"18px 20px" }}>
            {!B && (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"#3a5070", gap:10, textAlign:"center", padding:40 }}>
                <div style={{ fontSize:32, opacity:0.4 }}>🤖</div>
                <div style={{ fontSize:13, lineHeight:1.6 }}>Select a scenario above<br/>and click <strong style={{ color:"#6a8faa" }}>🐝 Run Test</strong><br/>to see the standard AI output</div>
              </div>
            )}
            {B && (
              <>
                <Section title="Executive Summary"><p style={para}>{B.summary}</p></Section>
                <Section title="Key Findings"><p style={para}>{B.findings}</p></Section>
                <Section title="Recommended Actions">
                  {B.actions.map((a,i) => <Action key={i} n={i+1}>{a}</Action>)}
                </Section>
                <div style={{ marginTop:16, padding:"10px 12px", background:"rgba(106,143,170,0.06)", border:"1px solid rgba(106,143,170,0.15)", borderRadius:7, fontSize:11, color:"#3a5070", fontStyle:"italic" }}>ℹ {B.note}</div>
              </>
            )}
          </div>
        </div>

        {/* AFTER */}
        <div style={{ display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"11px 20px", borderBottom:"1px solid #1e3050", background:"rgba(245,166,35,0.05)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:16 }}>🐝</span>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:"#f5a623" }}>Expert Brief</div>
                <div style={{ fontSize:10, color:"rgba(245,166,35,0.5)", marginTop:1 }}>RAG-enhanced · NIGP knowledge base active</div>
              </div>
            </div>
            <span style={{ fontFamily:"monospace", fontSize:9, fontWeight:700, background:"rgba(245,166,35,0.12)", border:"1px solid rgba(245,166,35,0.3)", borderRadius:3, padding:"2px 7px", color:"#f5a623", letterSpacing:"0.5px" }}>✦ EXPERT</span>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"18px 20px" }}>
            {!A && (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"#3a5070", gap:10, textAlign:"center", padding:40 }}>
                <div style={{ fontSize:32, opacity:0.4 }}>🐝</div>
                <div style={{ fontSize:13, lineHeight:1.6 }}>The Expert Brief will appear here<br/>with knowledge base citations<br/>and jurisdiction-specific guidance</div>
              </div>
            )}
            {A && (
              <>
                <Section title="Executive Summary" accent="#f5a623"><p style={para}>{A.summary}</p></Section>
                <Section title="Compliance Risk" accent="#f5a623">
                  <p style={para}>{A.findings}</p>
                  <div style={{ background:"rgba(245,166,35,0.08)", borderLeft:"2px solid #f5a623", padding:"10px 14px", borderRadius:"0 6px 6px 0", marginTop:8 }}>
                    <div style={{ fontSize:12, color:"#e8f0fe", lineHeight:1.7 }}>{A.highlight}</div>
                    <div style={{ fontSize:10, color:"#f5a623", fontFamily:"monospace", fontWeight:700, marginTop:5 }}>{A.highlightCite}</div>
                  </div>
                </Section>
                <Section title="Recommended Actions" accent="#f5a623">
                  {A.actions.map((a,i) => (
                    <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:8 }}>
                      <div style={{ width:18, height:18, background:"rgba(45,140,240,0.15)", border:"1px solid rgba(45,140,240,0.3)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#2d8cf0", flexShrink:0, marginTop:2 }}>{i+1}</div>
                      <div style={{ fontSize:12, color:"#8aadca", lineHeight:1.65 }}>{a.text} <span style={{ display:"inline-block", background:`${a.tagColor}18`, border:`1px solid ${a.tagColor}40`, borderRadius:4, padding:"1px 6px", fontSize:9, fontWeight:700, color:a.tagColor, fontFamily:"monospace", marginLeft:4 }}>{a.tag}</span></div>
                    </div>
                  ))}
                </Section>
                {/* KB sources */}
                <div style={{ marginTop:16, paddingTop:14, borderTop:"1px solid #1e3050" }}>
                  <div style={{ fontFamily:"monospace", fontSize:9, fontWeight:700, color:"#9b6ef3", letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>📚 Knowledge base entries retrieved</div>
                  {A.sources.map((s,i) => (
                    <div key={i} style={{ background:"rgba(155,110,243,0.07)", border:"1px solid rgba(155,110,243,0.2)", borderRadius:6, padding:"7px 11px", marginBottom:5, display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:"#e8f0fe" }}>{s.title}</div>
                        <div style={{ fontSize:10, color:"#5a7a9a", marginTop:1 }}>{s.meta}</div>
                      </div>
                      <div style={{ fontFamily:"monospace", fontSize:10, color:"#9b6ef3", flexShrink:0 }}>{s.sim}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delta bar */}
      {runState==="done" && A && (
        <div style={{ background:"rgba(245,166,35,0.04)", borderTop:"1px solid rgba(245,166,35,0.2)", padding:"8px 20px", display:"flex", alignItems:"center", gap:14, flexShrink:0, flexWrap:"wrap" }}>
          <div style={{ fontFamily:"monospace", fontSize:9, fontWeight:700, color:"#f5a623", letterSpacing:"2px", textTransform:"uppercase", flexShrink:0 }}>🐝 What the knowledge base added</div>
          {A.delta.map((d,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color: i===A.delta.length-1?"#3ec878":"#6a8faa", fontWeight:i===A.delta.length-1?700:400 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:i===A.delta.length-1?"#3ec878":"#f5a623", flexShrink:0 }}/>
              {d}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Small helpers for AI Bee brief rendering
const para = { fontSize:12, color:"#6a8faa", lineHeight:1.75, marginBottom:8 };
function Section({ title, accent="#00d2b4", children }) {
  return (
    <div style={{ marginBottom:18 }}>
      <div style={{ fontSize:11, fontWeight:700, color:accent, fontFamily:"monospace", letterSpacing:"1px", textTransform:"uppercase", marginBottom:8, paddingBottom:5, borderBottom:`1px solid ${accent}22` }}>{title}</div>
      {children}
    </div>
  );
}
function Action({ n, children }) {
  return (
    <div style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:7 }}>
      <div style={{ width:18, height:18, background:"rgba(45,140,240,0.15)", border:"1px solid rgba(45,140,240,0.3)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#2d8cf0", flexShrink:0, marginTop:2 }}>{n}</div>
      <div style={{ fontSize:12, color:"#6a8faa", lineHeight:1.65 }}>{children}</div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function RagAdmin() {
  const [entries, setEntries]           = useState(SEED_ENTRIES);
  const [activeNav, setActiveNav]       = useState("knowledge");
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch]             = useState("");
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [toast, setToast]               = useState(null);
  const [systemPrompt, setSystemPrompt] = useState(`You are an AI procurement analyst powered by NIGP's proprietary knowledge base. When analyzing spend data, ground your recommendations in NIGP methodology, Uniform Guidance compliance requirements, and NASPO cooperative contract benchmarks. Always cite the specific framework or regulation when flagging procurement concerns. Tailor recommendations to the agency's jurisdiction where applicable.`);

  const showToast = useCallback((msg, icon="✓") => { setToast({msg,icon}); setTimeout(()=>setToast(null),3000); }, []);

  const stats = {
    total:    entries.length,
    active:   entries.filter(e=>e.status==="active").length,
    disabled: entries.filter(e=>e.status==="disabled").length,
    states:   [...new Set(entries.filter(e=>e.jurisdiction!=="All"&&e.jurisdiction!=="Federal").map(e=>e.jurisdiction))].length,
  };

  const catMap = { all:null, compliance:"Compliance", jurisdiction:"Jurisdiction", "best-practice":"Best Practice", internal:"Internal" };
  const filtered = entries.filter(e => {
    const catOk = !catMap[activeFilter] || e.category===catMap[activeFilter];
    const txtOk = !search || e.title.toLowerCase().includes(search.toLowerCase()) || (e.source||"").toLowerCase().includes(search.toLowerCase());
    return catOk && txtOk;
  });

  const handleSaved = (entry) => {
    if (editingEntry) {
      setEntries(prev => prev.map(e => e.id===entry.id ? entry : e));
      setEditingEntry(null);
    } else {
      setEntries(prev => [entry, ...prev]);
    }
    setShowNewEntry(false);
  };
  const handleEditEntry = (entry) => { setEditingEntry(entry); setShowNewEntry(true); };
  const toggleStatus = (id) => setEntries(prev => prev.map(e => e.id===id ? {...e,status:e.status==="active"?"disabled":"active"} : e));

  const FTABS = [
    { id:"all",           label:`All (${entries.length})` },
    { id:"compliance",    label:`Compliance (${entries.filter(e=>e.category==="Compliance").length})` },
    { id:"best-practice", label:`Best Practice (${entries.filter(e=>e.category==="Best Practice").length})` },
    { id:"jurisdiction",  label:`Jurisdiction (${entries.filter(e=>e.category==="Jurisdiction").length})` },
    { id:"internal",      label:`Internal (${entries.filter(e=>e.category==="Internal").length})` },
  ];

  const NAV = [
    { section:"AI KNOWLEDGE", items:[
      { id:"knowledge",        icon:"📚", label:"Knowledge Library", badge:stats.active },
      { id:"ai-behavior",      icon:"🤖", label:"AI Behavior" },
      { id:"flag-mapping",     icon:"🚩", label:"Flag Mapping" },
    ]},
    { section:"CONFIGURATION", items:[
      { id:"jurisdictions",    icon:"🗺",  label:"Jurisdictions", badge:stats.states||undefined },
      { id:"prompt-templates", icon:"📝", label:"Prompt Templates" },
      { id:"usage",            icon:"💰", label:"Usage & Cost" },
    ]},
    { section:"SYSTEM", items:[
      { id:"ai-bee",           icon:"🐝", label:"AI Bee", badge:"NEW", badgeAmber:true },
      { id:"api",              icon:"🔑", label:"API Settings" },
      { id:"access",           icon:"👤", label:"Access Control" },
    ]},
  ];

  return (
    <div style={{ background:"#0a0f1a", minHeight:"100vh", display:"flex", flexDirection:"column", fontFamily:"'DM Sans','Segoe UI',sans-serif", color:"#e8f0fe" }}>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, backgroundImage:"linear-gradient(rgba(45,140,240,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(45,140,240,0.025) 1px,transparent 1px)", backgroundSize:"32px 32px" }} />

      {/* TOP BAR */}
      <header style={{ position:"relative", zIndex:10, background:"#0d1424", borderBottom:"1px solid #1e3050", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", height:50, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:11 }}>
          <div style={{ width:30, height:30, background:"linear-gradient(135deg,#2d8cf0,#00d2b4)", borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, color:"#0a0f1a", flexShrink:0 }}>N</div>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:"#e8f0fe", lineHeight:1.15 }}>NIGP Spend Analyzer</div>
            <div style={{ fontSize:10, color:"#3a5070", fontFamily:"monospace", letterSpacing:"0.4px" }}>Government Procurement Intelligence · AI Administration</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button style={{ background:"rgba(45,140,240,0.12)", border:"1px solid rgba(45,140,240,0.35)", borderRadius:6, padding:"5px 14px", fontSize:11, fontWeight:700, color:"#2d8cf0", cursor:"pointer", fontFamily:"monospace" }}>⚙ Admin Mode</button>
          <button style={{ background:"#111827", border:"1px solid #1e3050", borderRadius:6, padding:"5px 14px", fontSize:11, fontWeight:700, color:"#5a7a9a", cursor:"pointer", fontFamily:"monospace" }}>← Back to Analyzer</button>
        </div>
      </header>

      {/* BODY */}
      <div style={{ display:"flex", flex:1, position:"relative", zIndex:1, overflow:"auto", minHeight:0 }}>

        {/* SIDEBAR */}
        <nav style={{ width:195, background:"#0d1424", borderRight:"1px solid #1e3050", padding:"16px 0", flexShrink:0, overflowY:"auto" }}>
          {NAV.map(group => (
            <div key={group.section} style={{ marginBottom:6 }}>
              <div style={{ padding:"6px 16px 3px", fontSize:9, fontWeight:700, color:"#3a5070", letterSpacing:"1.8px", textTransform:"uppercase", fontFamily:"monospace" }}>{group.section}</div>
              {group.items.map(item => {
                const active = activeNav===item.id && !showNewEntry;
                const isAiBee = item.id==="ai-bee";
                return (
                  <button key={item.id} onClick={() => { setActiveNav(item.id); setShowNewEntry(false); setEditingEntry(null); }}
                    style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 16px", background:active?(isAiBee?"rgba(245,166,35,0.08)":"rgba(45,140,240,0.1)"):"transparent", borderLeft:`2px solid ${active?(isAiBee?"#f5a623":"#2d8cf0"):"transparent"}`, border:"none", outline:"none", cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}>
                    <span style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:active?(isAiBee?"#f5a623":"#e8f0fe"):"#5a7a9a", fontWeight:active?700:400 }}>
                      <span style={{ fontSize:14 }}>{item.icon}</span>{item.label}
                    </span>
                    {item.badge != null && (
                      <span style={{ background:item.badgeAmber?"rgba(245,166,35,0.18)":"rgba(45,140,240,0.18)", border:`1px solid ${item.badgeAmber?"rgba(245,166,35,0.3)":"rgba(45,140,240,0.3)"}`, borderRadius:20, padding:"1px 7px", fontSize:10, fontWeight:700, color:item.badgeAmber?"#f5a623":"#2d8cf0", fontFamily:"monospace" }}>{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* CONTENT */}
        <div style={{ flex:1, display:"flex", overflow:"auto", minWidth:0 }}>
          <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>

            {/* NEW / EDIT ENTRY */}
            {showNewEntry && activeNav==="knowledge" && (
              <NewEntryScreen onBack={() => { setShowNewEntry(false); setEditingEntry(null); }} onSaved={handleSaved} showToast={showToast} existingEntry={editingEntry} />
            )}

            {/* KNOWLEDGE LIBRARY */}
            {activeNav==="knowledge" && !showNewEntry && (
              <div style={{ flex:1, overflowY:"auto", padding:"22px 24px 40px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div>
                    <h2 style={{ fontSize:21, fontWeight:800, color:"#e8f0fe", marginBottom:3, margin:0 }}>📚 Knowledge Library</h2>
                    <p style={{ fontSize:12, color:"#5a7a9a", marginTop:4 }}>Procurement expertise documents Claude reads before generating briefings</p>
                  </div>
                  <button onClick={() => { setEditingEntry(null); setShowNewEntry(true); }} style={{ background:"linear-gradient(135deg,#2d8cf0,#00d2b4)", border:"none", borderRadius:7, padding:"9px 18px", fontSize:13, fontWeight:700, color:"#0a0f1a", cursor:"pointer", flexShrink:0 }}>+ Add Entry</button>
                </div>
                {/* Stats */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
                  {[
                    { val:stats.total,  label:"TOTAL DOCUMENTS", sub:"In knowledge base",           accent:"#e8f0fe" },
                    { val:stats.active, label:"ACTIVE",           sub:`${stats.disabled} disabled`,  accent:"#3ec878" },
                    { val:stats.states||"—", label:"STATES COVERED", sub:"Non-federal jurisdictions", accent:"#2d8cf0" },
                    { val:"Today",      label:"LAST UPDATED",     sub:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}), accent:"#f5a623" },
                  ].map((s,i) => (
                    <div key={i} style={{ background:"#111827", border:"1px solid #1e3050", borderRadius:10, padding:"13px 16px" }}>
                      <div style={{ fontSize:26, fontWeight:800, color:s.accent, fontFamily:"monospace", lineHeight:1, marginBottom:3 }}>{s.val}</div>
                      <div style={{ fontSize:9, fontWeight:700, color:"#5a7a9a", letterSpacing:"1px", textTransform:"uppercase", marginBottom:2 }}>{s.label}</div>
                      <div style={{ fontSize:11, color:"#3a5070" }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
                {/* Filters */}
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:16, flexWrap:"wrap" }}>
                  {FTABS.map(t => (
                    <button key={t.id} onClick={() => setActiveFilter(t.id)} style={{ background:activeFilter===t.id?"rgba(45,140,240,0.12)":"transparent", border:`1px solid ${activeFilter===t.id?"rgba(45,140,240,0.5)":"#1e3050"}`, borderRadius:6, padding:"5px 13px", fontSize:12, fontWeight:600, color:activeFilter===t.id?"#2d8cf0":"#5a7a9a", cursor:"pointer", transition:"all 0.15s" }}>{t.label}</button>
                  ))}
                  <div style={{ flex:1, minWidth:150, position:"relative" }}>
                    <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", fontSize:12, color:"#3a5070", pointerEvents:"none" }}>🔍</span>
                    <input style={{ width:"100%", background:"#111827", border:"1px solid #1e3050", borderRadius:6, padding:"6px 10px 6px 28px", fontSize:12, color:"#e8f0fe", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}
                      placeholder="Search library…" value={search} onChange={e=>setSearch(e.target.value)} />
                  </div>
                </div>
                {/* Table */}
                <table style={{ width:"100%", borderCollapse:"collapse", background:"#111827", borderRadius:10, overflow:"hidden", border:"1px solid #1e3050" }}>
                  <thead>
                    <tr style={{ background:"#0e1520" }}>
                      {["Document","Category","Priority","Triggers","Status",""].map(h => (
                        <th key={h} style={{ padding:"9px 13px", textAlign:"left", fontFamily:"monospace", fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"#3a5070", borderBottom:"1px solid #1e3050" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length===0 && <tr><td colSpan={6} style={{ padding:"28px 16px", textAlign:"center", color:"#3a5070", fontSize:13 }}>No entries match your filter.</td></tr>}
                    {filtered.map((entry,i) => {
                      const catC  = CAT_COLORS[entry.category]||CAT_COLORS["Compliance"];
                      const pInfo = priorityInfo(entry.priority);
                      const isLast = i===filtered.length-1;
                      return (
                        <tr key={entry.id}>
                          <td style={{ padding:"12px 13px", borderBottom:isLast?"none":"1px solid rgba(30,48,80,0.5)", maxWidth:280 }}>
                            <div style={{ fontSize:13, fontWeight:700, color:entry.status==="disabled"?"#3a5070":"#e8f0fe", marginBottom:2, lineHeight:1.3 }}>
                              {entry.title}
                              {entry.isDemo && <span style={{ display:"inline-block", background:"rgba(155,110,243,0.12)", border:"1px solid rgba(155,110,243,0.3)", borderRadius:3, padding:"1px 5px", fontSize:9, fontWeight:700, color:"#9b6ef3", fontFamily:"monospace", letterSpacing:"0.5px", marginLeft:7, verticalAlign:"middle" }}>DEMO</span>}
                            </div>
                            <div style={{ fontSize:11, color:"#3a5070" }}>{entry.source}</div>
                          </td>
                          <td style={{ padding:"12px 13px", borderBottom:isLast?"none":"1px solid rgba(30,48,80,0.5)" }}>
                            <span style={{ background:catC.bg, border:`1px solid ${catC.border}`, borderRadius:4, padding:"3px 8px", fontSize:10, fontWeight:700, color:catC.text, fontFamily:"monospace", textTransform:"uppercase", letterSpacing:"0.3px", whiteSpace:"nowrap" }}>{entry.category}</span>
                          </td>
                          <td style={{ padding:"12px 13px", borderBottom:isLast?"none":"1px solid rgba(30,48,80,0.5)", whiteSpace:"nowrap" }}>
                            <span style={{ fontSize:12, fontWeight:700, color:pInfo.color }}>● {pInfo.label}</span>
                          </td>
                          <td style={{ padding:"12px 13px", borderBottom:isLast?"none":"1px solid rgba(30,48,80,0.5)" }}>
                            <TriggerTags triggers={entry.triggers} compact />
                          </td>
                          <td style={{ padding:"12px 13px", borderBottom:isLast?"none":"1px solid rgba(30,48,80,0.5)", whiteSpace:"nowrap" }}>
                            {entry.status==="active" ? <span style={{ fontSize:11, fontWeight:700, color:"#3ec878" }}>● Active</span> : <span style={{ fontSize:11, fontWeight:700, color:"#3a5070" }}>○ Disabled</span>}
                          </td>
                          <td style={{ padding:"12px 13px", borderBottom:isLast?"none":"1px solid rgba(30,48,80,0.5)", textAlign:"right", width:40, position:"relative" }}>
                            <RowMenu entry={entry} onToggleStatus={toggleStatus} onEdit={handleEditEntry} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* AI BEE */}
            {activeNav==="ai-bee" && <AIBeeScreen showToast={showToast} />}

            {/* PROMPT TEMPLATES */}
            {activeNav==="prompt-templates" && (
              <div style={{ flex:1, overflowY:"auto", padding:"22px 24px 40px" }}>
                <h2 style={{ fontSize:21, fontWeight:800, color:"#e8f0fe", marginBottom:4, marginTop:0 }}>Prompt Templates</h2>
                <p style={{ fontSize:12, color:"#5a7a9a", marginBottom:22 }}>Configure the system prompt injected into every AI briefing call via <code style={{ fontFamily:"monospace", color:"#2d8cf0", fontSize:11 }}>api/brief.js</code></p>
                <div style={{ background:"#111827", border:"1px solid #1e3050", borderRadius:12, padding:22 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <span style={{ fontFamily:"monospace", fontSize:9, fontWeight:700, color:"#00d2b4", letterSpacing:"2px", textTransform:"uppercase" }}>▸ AI System Prompt</span>
                    <span style={{ fontFamily:"monospace", fontSize:10, color:"#3a5070" }}>{systemPrompt.length} chars · ~{Math.round(systemPrompt.length/4)} tokens</span>
                  </div>
                  <textarea value={systemPrompt} onChange={e=>setSystemPrompt(e.target.value)} rows={9} style={{ width:"100%", background:"#0a0f1a", border:"1px solid #1e3050", borderRadius:8, padding:"13px 15px", fontSize:12, color:"#8aadca", fontFamily:"monospace", lineHeight:1.7, resize:"vertical", outline:"none", boxSizing:"border-box" }} />
                  <button onClick={() => showToast("System prompt saved")} style={{ marginTop:12, background:"rgba(45,140,240,0.12)", border:"1px solid rgba(45,140,240,0.4)", borderRadius:6, padding:"8px 20px", fontSize:11, fontWeight:700, color:"#2d8cf0", cursor:"pointer", fontFamily:"monospace", letterSpacing:"1px", textTransform:"uppercase" }}>Save Prompt</button>
                </div>
              </div>
            )}

            {/* API SETTINGS */}
            {activeNav==="api" && (
              <div style={{ flex:1, overflowY:"auto", padding:"22px 24px 40px" }}>
                <h2 style={{ fontSize:21, fontWeight:800, color:"#e8f0fe", marginBottom:4, marginTop:0 }}>API Settings</h2>
                <p style={{ fontSize:12, color:"#5a7a9a", marginBottom:22 }}>Configure RAG pipeline endpoints and Vercel Edge Function settings</p>
                {[
                  { label:"Anthropic API Key", val:"sk-ant-••••••••••••XQ4",    note:"Set in Vercel → Settings → Environment Variables", warn:false },
                  { label:"RAG Endpoint",      val:"/api/brief.js",             note:"Vercel Edge Function — currently active",           warn:false },
                  { label:"Vector Store",      val:"Supabase pgvector",         note:"Connected — knowledge_entries table",               warn:false },
                  { label:"Embeddings",        val:"text-embedding-3-small",    note:"OpenAI · ~$0.00002 per entry",                     warn:false },
                  { label:"Model",             val:"claude-haiku-4-5-20251001", note:"~$0.02–0.03 per briefing at max_tokens: 6000",     warn:false },
                  { label:"Top-k Retrieval",   val:"5 chunks",                  note:"Knowledge base passages retrieved per query",      warn:false },
                ].map(row => (
                  <div key={row.label} style={{ background:"#111827", border:`1px solid ${row.warn?"rgba(232,93,74,0.35)":"#1e3050"}`, borderRadius:10, padding:"15px 18px", marginBottom:9, display:"flex", justifyContent:"space-between", alignItems:"center", gap:16 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#e8f0fe", marginBottom:2 }}>{row.label}</div>
                      <div style={{ fontSize:11, color:"#5a7a9a" }}>{row.note}</div>
                    </div>
                    <span style={{ fontFamily:"monospace", fontSize:12, color:row.warn?"#e85d4a":"#00d2b4", background:"#0a0f1a", border:"1px solid #1e3050", borderRadius:5, padding:"4px 11px", flexShrink:0 }}>{row.val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* PLACEHOLDERS */}
            {["ai-behavior","flag-mapping","jurisdictions","usage","access"].includes(activeNav) && (
              <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#3a5070", gap:10 }}>
                <div style={{ fontSize:38 }}>🔧</div>
                <div style={{ fontFamily:"monospace", fontSize:12, fontWeight:700, letterSpacing:"1px", textTransform:"uppercase" }}>{activeNav.replace(/-/g," ")} — Next Sprint</div>
                <div style={{ fontSize:12 }}>This configuration screen is part of the next build sprint.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position:"fixed", bottom:22, right:22, background:"#111827", border:"1px solid #1e3050", borderRadius:8, padding:"10px 16px", fontSize:12, color:"#e8f0fe", fontFamily:"monospace", boxShadow:"0 8px 28px rgba(0,0,0,0.5)", zIndex:999, display:"flex", alignItems:"center", gap:8, animation:"slideUp 0.2s ease" }}>
          <span>{toast.icon}</span><span>{toast.msg}</span>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        html, body, #root { height:100%; }
        input::placeholder, textarea::placeholder { color:#2a3a52; }
        select option { background:#111827; color:#e8f0fe; }
        tbody tr:hover { background:rgba(45,140,240,0.04) !important; }
        button:hover { opacity:0.82; }
        @keyframes slideUp { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);} }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:#0a0f1a; }
        ::-webkit-scrollbar-thumb { background:#1e3050; border-radius:3px; }
        input[type=range] { cursor:pointer; }
      `}</style>
    </div>
  );
}
