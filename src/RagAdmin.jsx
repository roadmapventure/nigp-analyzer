import { useState, useRef, useCallback } from "react";

// ─── SEED DATA (demo only — real entries load from Supabase) ──────────────────
const SEED_ENTRIES = [
  { id: "e-001", title: "Texas LGC §252 — Competitive Bidding Requirements", source: "Texas Local Government Code · Added Apr 10", category: "Jurisdiction", jurisdiction: "Texas", priority: 75, triggers: ["maverick", "po-split"], status: "active", isDemo: true },
  { id: "e-002", title: "Uniform Guidance 2 CFR Part 200 — Federal Procurement", source: "Office of Management & Budget · Added Apr 8", category: "Compliance", jurisdiction: "Federal", priority: 90, triggers: ["all"], status: "active", isDemo: true },
  { id: "e-003", title: "GAO Standards for Internal Control in Government", source: "Government Accountability Office · Added Apr 8", category: "Compliance", jurisdiction: "Federal", priority: 85, triggers: ["maverick", "po-split"], status: "active", isDemo: true },
  { id: "e-004", title: "NIGP Code of Ethics & Professional Standards", source: "National Institute of Governmental Purchasing · Added Apr 9", category: "Best Practice", jurisdiction: "All", priority: 60, triggers: ["all"], status: "active", isDemo: true },
  { id: "e-005", title: "NASPO Cooperative Purchasing Best Practices", source: "NASPO ValuePoint · Added Apr 9", category: "Best Practice", jurisdiction: "All", priority: 55, triggers: ["maverick", "single-source"], status: "active", isDemo: true },
  { id: "e-006", title: "Maverick Spend Reduction Playbook", source: "Internal · Roadmap Venture · Added Apr 17", category: "Internal", jurisdiction: "All", priority: 80, triggers: ["maverick"], status: "active", isDemo: true },
  { id: "e-007", title: "California Public Contract Code §20160", source: "State of California · Added Apr 5", category: "Jurisdiction", jurisdiction: "California", priority: 70, triggers: ["maverick"], status: "disabled", isDemo: true },
];

const CATEGORIES    = ["Compliance", "Jurisdiction", "Best Practice", "Internal"];
const JURISDICTIONS = ["All", "Federal", "Texas", "California", "Florida", "New York", "Illinois"];
const FLAG_TRIGGERS = [
  { id: "maverick",      label: "Maverick Spend" },
  { id: "po-split",      label: "PO Splitting"   },
  { id: "spike",         label: "Spend Spike"    },
  { id: "single-source", label: "Single Source"  },
  { id: "vendor-hhi",    label: "Vendor HHI"     },
  { id: "long-tail",     label: "Long-Tail"      },
];

const CAT_COLORS = {
  Compliance:      { text: "#f5a623", bg: "rgba(245,166,35,0.13)",  border: "rgba(245,166,35,0.35)"  },
  Jurisdiction:    { text: "#2d8cf0", bg: "rgba(45,140,240,0.13)",  border: "rgba(45,140,240,0.35)"  },
  "Best Practice": { text: "#00d2b4", bg: "rgba(0,210,180,0.13)",   border: "rgba(0,210,180,0.35)"   },
  Internal:        { text: "#9b6ef3", bg: "rgba(155,110,243,0.13)", border: "rgba(155,110,243,0.35)" },
};

function priorityInfo(v) {
  if (v >= 80) return { label: "Critical", color: "#e85d4a" };
  if (v >= 65) return { label: "High",     color: "#f5a623" };
  if (v >= 40) return { label: "Medium",   color: "#2d8cf0" };
  return              { label: "Low",      color: "#5a7a9a" };
}

function Tag({ color, children }) {
  return (
    <span style={{ display:"inline-block", background:`${color}18`, border:`1px solid ${color}40`, borderRadius:4, padding:"2px 7px", fontSize:10, fontWeight:700, color, fontFamily:"monospace", letterSpacing:"0.3px", whiteSpace:"nowrap" }}>
      {children}
    </span>
  );
}

function TriggerTags({ triggers, compact }) {
  if (!triggers?.length) return null;
  if (triggers.includes("all")) return <Tag color="#8aadca">All Flags</Tag>;
  const show = compact ? triggers.slice(0, 2) : triggers;
  return (
    <span style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
      {show.map(t => { const f = FLAG_TRIGGERS.find(f => f.id === t); return f ? <Tag key={t} color="#8aadca">{compact ? f.label.split(" ")[0] : f.label}</Tag> : null; })}
      {compact && triggers.length > 2 && <Tag color="#5a7a9a">+{triggers.length - 2}</Tag>}
    </span>
  );
}

// ─── PDF TEXT EXTRACTOR (browser-side, no library needed) ─────────────────────
async function extractTextFromFile(file) {
  // For PDFs we read as ArrayBuffer and extract raw text strings
  // This is a simple extraction — good enough for procurement docs
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          // Extract readable strings from PDF binary
          const bytes = new Uint8Array(e.target.result);
          let text = "";
          for (let i = 0; i < bytes.length; i++) {
            const c = bytes[i];
            if (c >= 32 && c <= 126) text += String.fromCharCode(c);
            else if (c === 10 || c === 13) text += " ";
          }
          // Clean up: remove runs of special chars, keep readable words
          const cleaned = text
            .replace(/[^\x20-\x7E\n]/g, " ")
            .replace(/\s{3,}/g, "  ")
            .replace(/[^\w\s.,;:§\-()%$#@!?'"\/]/g, " ")
            .replace(/\s{2,}/g, " ")
            .trim();
          const words = cleaned.split(/\s+/).filter(w => w.length > 2);
          resolve({ text: words.join(" "), wordCount: words.length });
        } else {
          // TXT or DOCX plain text
          const text = e.target.result;
          const words = text.split(/\s+/).filter(w => w.length > 0);
          resolve({ text, wordCount: words.length });
        }
      } catch {
        resolve({ text: "", wordCount: 0 });
      }
    };
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
}

// ─── AI METADATA GENERATOR ────────────────────────────────────────────────────
async function generateMetadata(filename, extractedText) {
  const snippet = extractedText.slice(0, 3000);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        messages: [{
          role: "user",
          content: `You are analyzing a government procurement document to populate a knowledge base. Based on the filename and text excerpt below, return ONLY a JSON object with these exact fields — no markdown, no explanation:

{
  "title": "Clean readable title (not the filename)",
  "category": "one of: Compliance, Jurisdiction, Best Practice, Internal",
  "jurisdiction": "one of: All, Federal, Texas, California, Florida, New York, Illinois — pick All if it applies broadly",
  "priority": a number 0-100 (80+ for critical federal law, 65-79 for state law or high-impact, 40-64 for best practices, under 40 for general guides),
  "triggers": array of zero or more from: ["maverick", "po-split", "spike", "single-source", "vendor-hhi", "long-tail"] — or ["all"] if universally applicable
}

Filename: ${filename}

Text excerpt:
${snippet}`
        }]
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.content?.[0]?.text || "";
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

// ─── NEW ENTRY SCREEN ─────────────────────────────────────────────────────────
function NewEntryScreen({ onBack, onSaved, showToast }) {
  const [uploadState, setUploadState] = useState("idle"); // idle | uploading | ready
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [extractedOpen, setExtractedOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", category: "Compliance", jurisdiction: "All",
    priority: 50, triggers: [], status: "active",
  });
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploadState("uploading");
    setUploadProgress(0);
    setUploadedFile(file);

    // Animate progress bar
    let prog = 0;
    const ticker = setInterval(() => {
      prog += Math.random() * 18 + 8;
      if (prog >= 90) { clearInterval(ticker); prog = 90; }
      setUploadProgress(Math.min(90, prog));
    }, 180);

    // Extract text
    const { text, wordCount: wc } = await extractTextFromFile(file);
    clearInterval(ticker);
    setUploadProgress(100);
    setExtractedText(text);
    setWordCount(wc);

    // Small pause so user sees 100%
    await new Promise(r => setTimeout(r, 400));
    setUploadState("ready");

    // Generate metadata via Claude
    showToast("✨ Claude is analyzing your document…", "✨");
    const meta = await generateMetadata(file.name, text);
    if (meta) {
      setForm(f => ({
        ...f,
        title:        meta.title        || f.title,
        category:     meta.category     || f.category,
        jurisdiction: meta.jurisdiction || f.jurisdiction,
        priority:     meta.priority     ?? f.priority,
        triggers:     meta.triggers     || f.triggers,
      }));
      showToast("Metadata generated — review before saving");
    } else {
      showToast("Could not auto-generate metadata — fill in manually", "⚠");
    }
  };

  const toggleTrigger = (id) => {
    if (id === "all") {
      setForm(f => ({ ...f, triggers: f.triggers.includes("all") ? [] : ["all"] }));
      return;
    }
    setForm(f => {
      const base = f.triggers.filter(t => t !== "all");
      return { ...f, triggers: base.includes(id) ? base.filter(t => t !== id) : [...base, id] };
    });
  };

  const handleSave = async () => {
    if (!form.title || !extractedText) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, content: extractedText }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Save failed", "⚠"); setIsSaving(false); return; }
      showToast("Entry saved & indexed ✦");
      onSaved({ ...form, id: data.entry?.id || `e-${Date.now()}`, source: `Added ${new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})}`, content: extractedText });
    } catch (err) {
      showToast("Network error: " + err.message, "⚠");
    }
    setIsSaving(false);
  };

  const locked = uploadState !== "ready";
  const pInfo  = priorityInfo(form.priority);

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px 28px 60px", maxWidth:820 }}>

      {/* Back link */}
      <button onClick={onBack} style={{ background:"none", border:"none", color:"#5a7a9a", fontSize:12, cursor:"pointer", fontFamily:"monospace", letterSpacing:"0.5px", marginBottom:22, padding:0, display:"flex", alignItems:"center", gap:6 }}>
        ← Back to Knowledge Library
      </button>

      {/* Header */}
      <div style={{ marginBottom:26 }}>
        <div style={{ fontFamily:"monospace", fontSize:10, fontWeight:700, color:"#00d2b4", letterSpacing:"2.5px", textTransform:"uppercase", marginBottom:6 }}>▸ New Entry — AI Relevancy</div>
        <div style={{ fontSize:22, fontWeight:800, color:"#e8f0fe", marginBottom:4 }}>Add to Knowledge Base</div>
        <div style={{ fontSize:13, color:"#5a7a9a", lineHeight:1.5 }}>Upload a procurement document. Claude will extract the text, suggest metadata, and index it for retrieval during briefings.</div>
      </div>

      {/* ── UPLOAD ZONE ── */}
      {uploadState === "idle" && (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          style={{ border:"2px dashed #243a58", borderRadius:12, padding:"36px 32px", textAlign:"center", cursor:"pointer", background:"rgba(13,20,36,0.6)", marginBottom:28, transition:"all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="#00d2b4"; e.currentTarget.style.background="rgba(0,210,180,0.03)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor="#243a58"; e.currentTarget.style.background="rgba(13,20,36,0.6)"; }}
        >
          <div style={{ fontSize:36, marginBottom:12 }}>📄</div>
          <div style={{ fontSize:16, fontWeight:700, color:"#e8f0fe", marginBottom:6 }}>Upload a procurement document</div>
          <div style={{ fontSize:12, color:"#5a7a9a", marginBottom:18, lineHeight:1.5 }}>PDF, DOCX, or TXT · Up to 20MB<br />NIGP guides, compliance frameworks, state laws, best practice playbooks</div>
          <div style={{ display:"inline-block", background:"rgba(0,210,180,0.1)", border:"1px solid rgba(0,210,180,0.35)", borderRadius:6, padding:"9px 22px", fontSize:12, fontWeight:700, color:"#00d2b4", fontFamily:"monospace", letterSpacing:"1px", textTransform:"uppercase" }}>
            Select File
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.txt,.docx" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />
        </div>
      )}

      {uploadState === "uploading" && (
        <div style={{ border:"2px solid rgba(45,140,240,0.4)", borderRadius:12, padding:"32px", textAlign:"center", background:"rgba(45,140,240,0.04)", marginBottom:28 }}>
          <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
          <div style={{ fontSize:15, fontWeight:700, color:"#2d8cf0", marginBottom:14 }}>Extracting document text…</div>
          <div style={{ fontFamily:"monospace", fontSize:12, color:"#5a7a9a", marginBottom:10 }}>{uploadedFile?.name}</div>
          <div style={{ background:"#1e3050", borderRadius:20, height:5, width:"100%", maxWidth:340, margin:"0 auto 10px", overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:20, background:"linear-gradient(90deg,#2d8cf0,#00d2b4)", width:`${uploadProgress}%`, transition:"width 0.2s" }} />
          </div>
          <div style={{ fontSize:11, color:"#2d8cf0", fontFamily:"monospace" }}>Extracting text · {Math.round(uploadProgress)}% complete</div>
        </div>
      )}

      {uploadState === "ready" && (
        <div style={{ border:"2px solid rgba(62,200,120,0.4)", borderRadius:12, padding:"20px 24px", background:"rgba(62,200,120,0.05)", marginBottom:20, display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:42, height:42, background:"rgba(62,200,120,0.12)", border:"1px solid rgba(62,200,120,0.35)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>📄</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#e8f0fe", marginBottom:2 }}>{uploadedFile?.name}</div>
            <div style={{ fontSize:11, color:"#3ec878", fontFamily:"monospace" }}>✓ {wordCount.toLocaleString()} words extracted · Ready to index</div>
          </div>
          <div style={{ fontSize:24 }}>✅</div>
        </div>
      )}

      {/* AI banner — shown after upload */}
      {uploadState === "ready" && (
        <div style={{ background:"rgba(155,110,243,0.08)", border:"1px solid rgba(155,110,243,0.25)", borderRadius:10, padding:"13px 18px", display:"flex", alignItems:"flex-start", gap:12, marginBottom:24 }}>
          <div style={{ fontSize:18, flexShrink:0, marginTop:1 }}>✨</div>
          <div style={{ fontSize:12, color:"#8aadca", lineHeight:1.6 }}>
            <strong style={{ color:"#9b6ef3" }}>Claude analyzed your document</strong> and suggested the metadata below. Review and adjust before saving — these settings control when this document gets retrieved during briefings.
          </div>
        </div>
      )}

      {/* ── FIELDS — locked until upload complete ── */}
      <div style={{ opacity: locked ? 0.38 : 1, pointerEvents: locked ? "none" : "auto", transition:"opacity 0.3s" }}>
        <div style={{ fontFamily:"monospace", fontSize:10, fontWeight:700, color: locked ? "#3a5070" : "#00d2b4", letterSpacing:"2px", textTransform:"uppercase", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
          {locked ? "🔒" : "✦"} AI Relevancy Settings
          {locked && <span style={{ fontSize:10, color:"#3a5070", fontWeight:400, letterSpacing:0, textTransform:"none", fontFamily:"inherit" }}>— unlocks after upload</span>}
        </div>

        {/* Title */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontFamily:"monospace", fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"#5a7a9a", marginBottom:5, display:"flex", alignItems:"center", gap:6 }}>
            Document Title
            {!locked && <span style={{ background:"rgba(155,110,243,0.12)", border:"1px solid rgba(155,110,243,0.3)", borderRadius:3, padding:"1px 5px", fontSize:8, fontWeight:700, color:"#9b6ef3" }}>AI SUGGESTED</span>}
          </div>
          <input
            style={{ width:"100%", background: !locked && form.title ? "rgba(0,210,180,0.04)" : "#111827", border:`1px solid ${!locked && form.title ? "rgba(0,210,180,0.3)" : "#1e3050"}`, borderRadius:6, padding:"9px 12px", fontSize:13, color:"#e8f0fe", outline:"none", fontFamily:"inherit" }}
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder={locked ? "Auto-generated after upload…" : "Enter document title…"}
            disabled={locked}
          />
        </div>

        {/* Category + Jurisdiction */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
          {[
            { key:"category", label:"Category", options: CATEGORIES },
            { key:"jurisdiction", label:"Jurisdiction", options: JURISDICTIONS },
          ].map(({ key, label, options }) => (
            <div key={key}>
              <div style={{ fontFamily:"monospace", fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"#5a7a9a", marginBottom:5, display:"flex", alignItems:"center", gap:6 }}>
                {label}
                {!locked && <span style={{ background:"rgba(155,110,243,0.12)", border:"1px solid rgba(155,110,243,0.3)", borderRadius:3, padding:"1px 5px", fontSize:8, fontWeight:700, color:"#9b6ef3" }}>AI SUGGESTED</span>}
              </div>
              <select
                style={{ width:"100%", background: !locked ? "rgba(0,210,180,0.04)" : "#111827", border:`1px solid ${!locked ? "rgba(0,210,180,0.3)" : "#1e3050"}`, borderRadius:6, padding:"8px 12px", fontSize:13, color:"#e8f0fe", outline:"none", fontFamily:"inherit", cursor: locked ? "default" : "pointer" }}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                disabled={locked}
              >
                {options.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* Priority */}
        <div style={{ marginBottom:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <div style={{ fontFamily:"monospace", fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"#5a7a9a", display:"flex", alignItems:"center", gap:6 }}>
              Priority Weight
              {!locked && <span style={{ background:"rgba(155,110,243,0.12)", border:"1px solid rgba(155,110,243,0.3)", borderRadius:3, padding:"1px 5px", fontSize:8, fontWeight:700, color:"#9b6ef3" }}>AI SUGGESTED</span>}
            </div>
            <span style={{ fontFamily:"monospace", fontSize:11, fontWeight:700, color: pInfo.color }}>{pInfo.label} &nbsp;{form.priority} / 100</span>
          </div>
          <input type="range" min={0} max={100} value={form.priority}
            onChange={e => setForm(f => ({ ...f, priority: +e.target.value }))}
            style={{ width:"100%", accentColor: pInfo.color, cursor: locked ? "default" : "pointer" }}
            disabled={locked}
          />
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:3 }}>
            {["Low","Medium","High","Critical"].map(l => <span key={l} style={{ fontSize:9, color:"#3a5070", fontFamily:"monospace" }}>{l}</span>)}
          </div>
        </div>

        {/* Flag Triggers */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontFamily:"monospace", fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"#5a7a9a", marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
            Flag Triggers
            {!locked && <span style={{ background:"rgba(155,110,243,0.12)", border:"1px solid rgba(155,110,243,0.3)", borderRadius:3, padding:"1px 5px", fontSize:8, fontWeight:700, color:"#9b6ef3" }}>AI SUGGESTED</span>}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {FLAG_TRIGGERS.map(f => {
              const on = form.triggers.includes("all") || form.triggers.includes(f.id);
              return (
                <label key={f.id} style={{ display:"flex", alignItems:"center", gap:7, cursor: locked ? "default" : "pointer", background: on ? "rgba(0,210,180,0.08)" : "rgba(14,21,32,0.6)", border:`1px solid ${on ? "rgba(0,210,180,0.4)" : "#1e3050"}`, borderRadius:6, padding:"7px 10px", fontSize:12, color: on ? "#00d2b4" : "#5a7a9a", fontWeight: on ? 700 : 400, transition:"all 0.15s" }}>
                  <input type="checkbox" checked={on} onChange={() => toggleTrigger(f.id)} disabled={locked}
                    style={{ accentColor:"#00d2b4", width:13, height:13, cursor: locked ? "default" : "pointer" }} />
                  {f.label}
                </label>
              );
            })}
          </div>
          <label style={{ display:"flex", alignItems:"center", gap:7, cursor: locked ? "default" : "pointer", marginTop:6, background: form.triggers.includes("all") ? "rgba(0,210,180,0.08)" : "rgba(14,21,32,0.6)", border:`1px solid ${form.triggers.includes("all") ? "rgba(0,210,180,0.4)" : "#1e3050"}`, borderRadius:6, padding:"7px 10px", fontSize:12, color: form.triggers.includes("all") ? "#00d2b4" : "#5a7a9a", fontWeight: form.triggers.includes("all") ? 700 : 400 }}>
            <input type="checkbox" checked={form.triggers.includes("all")} onChange={() => toggleTrigger("all")} disabled={locked}
              style={{ accentColor:"#00d2b4", width:13, height:13 }} />
            All Flags (always retrieve for every briefing)
          </label>
        </div>

        {/* Extracted text — collapsible read-only */}
        {uploadState === "ready" && (
          <div style={{ marginBottom:28 }}>
            <button
              onClick={() => setExtractedOpen(o => !o)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"10px 14px", background:"#111827", border:"1px solid #1e3050", borderRadius: extractedOpen ? "8px 8px 0 0" : 8, fontSize:12, color:"#5a7a9a", fontFamily:"monospace", transition:"all 0.15s" }}
            >
              <span>📄</span>
              <span>View extracted document text</span>
              <span style={{ background:"rgba(232,93,74,0.1)", border:"1px solid rgba(232,93,74,0.25)", borderRadius:4, padding:"1px 6px", fontSize:9, fontWeight:700, color:"#e85d4a", marginLeft:4 }}>READ ONLY</span>
              <span style={{ marginLeft:"auto", fontSize:10 }}>{extractedOpen ? "▲" : "▼"}</span>
            </button>
            {extractedOpen && (
              <div style={{ background:"#0a0f1a", border:"1px solid #1e3050", borderTop:"none", borderRadius:"0 0 8px 8px", padding:"14px 16px", fontSize:11, color:"#5a7a9a", fontFamily:"monospace", lineHeight:1.8, maxHeight:180, overflowY:"auto", whiteSpace:"pre-wrap", userSelect:"none" }}>
                {extractedText.slice(0, 1200)}{extractedText.length > 1200 ? "\n\n[… truncated for display — full text stored in Supabase]" : ""}
              </div>
            )}
          </div>
        )}

        {/* Save footer */}
        {uploadState === "ready" && (
          <div style={{ display:"flex", alignItems:"center", gap:12, paddingTop:20, borderTop:"1px solid #1e3050" }}>
            <button
              onClick={handleSave}
              disabled={!form.title || isSaving}
              style={{ background:"linear-gradient(135deg,#2d8cf0,#00d2b4)", border:"none", borderRadius:8, padding:"12px 32px", fontSize:13, fontWeight:700, color:"#0a0f1a", cursor: (!form.title || isSaving) ? "not-allowed" : "pointer", fontFamily:"inherit", opacity: (!form.title || isSaving) ? 0.5 : 1, transition:"opacity 0.2s", display:"flex", alignItems:"center", gap:8 }}
            >
              {isSaving ? "⏳ Indexing…" : "Save & Index Entry"}
            </button>
            <button onClick={onBack} style={{ background:"transparent", border:"1px solid #1e3050", borderRadius:8, padding:"12px 22px", fontSize:13, fontWeight:700, color:"#5a7a9a", cursor:"pointer", fontFamily:"inherit" }}>
              Cancel
            </button>
            <div style={{ fontSize:11, color:"#3a5070", lineHeight:1.5 }}>
              Document text will be embedded and stored in Supabase.<br />Retrieved automatically during AI briefings.
            </div>
          </div>
        )}
      </div>
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
  const [toast, setToast]               = useState(null);
  const [systemPrompt, setSystemPrompt] = useState(
    `You are an AI procurement analyst powered by NIGP's proprietary knowledge base. When analyzing spend data, ground your recommendations in NIGP methodology, Uniform Guidance compliance requirements, and NASPO cooperative contract benchmarks. Always cite the specific framework or regulation when flagging procurement concerns. Tailor recommendations to the agency's jurisdiction where applicable.`
  );

  const showToast = useCallback((msg, icon = "✓") => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const stats = {
    total:    entries.length,
    active:   entries.filter(e => e.status === "active").length,
    disabled: entries.filter(e => e.status === "disabled").length,
    states:   [...new Set(entries.filter(e => e.jurisdiction !== "All" && e.jurisdiction !== "Federal").map(e => e.jurisdiction))].length,
  };

  const catMap = { all: null, compliance: "Compliance", jurisdiction: "Jurisdiction", "best-practice": "Best Practice", internal: "Internal" };
  const filtered = entries.filter(e => {
    const catOk = !catMap[activeFilter] || e.category === catMap[activeFilter];
    const txtOk = !search || e.title.toLowerCase().includes(search.toLowerCase()) || (e.source || "").toLowerCase().includes(search.toLowerCase());
    return catOk && txtOk;
  });

  const handleSaved = (entry) => {
    setEntries(prev => [entry, ...prev]);
    setShowNewEntry(false);
  };

  const toggleStatus = (id) => setEntries(prev => prev.map(e => e.id === id ? { ...e, status: e.status === "active" ? "disabled" : "active" } : e));

  const FTABS = [
    { id: "all",           label: `All (${entries.length})` },
    { id: "compliance",    label: `Compliance (${entries.filter(e=>e.category==="Compliance").length})` },
    { id: "best-practice", label: `Best Practice (${entries.filter(e=>e.category==="Best Practice").length})` },
    { id: "jurisdiction",  label: `Jurisdiction (${entries.filter(e=>e.category==="Jurisdiction").length})` },
    { id: "internal",      label: `Internal (${entries.filter(e=>e.category==="Internal").length})` },
  ];

  const NAV = [
    { section: "AI KNOWLEDGE", items: [
      { id: "knowledge",        icon: "📚", label: "Knowledge Library", badge: stats.active },
      { id: "ai-behavior",      icon: "🤖", label: "AI Behavior" },
      { id: "flag-mapping",     icon: "🚩", label: "Flag Mapping" },
    ]},
    { section: "CONFIGURATION", items: [
      { id: "jurisdictions",    icon: "🗺",  label: "Jurisdictions", badge: stats.states },
      { id: "prompt-templates", icon: "📝", label: "Prompt Templates" },
      { id: "usage",            icon: "💰", label: "Usage & Cost" },
    ]},
    { section: "SYSTEM", items: [
      { id: "api",              icon: "🔑", label: "API Settings" },
      { id: "access",           icon: "👤", label: "Access Control" },
    ]},
  ];

  return (
    <div style={{ background:"#0a0f1a", minHeight:"100vh", display:"flex", flexDirection:"column", fontFamily:"'DM Sans','Segoe UI',sans-serif", color:"#e8f0fe", overflow:"hidden", height:"100vh" }}>

      {/* Grid texture */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, backgroundImage:"linear-gradient(rgba(45,140,240,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(45,140,240,0.025) 1px,transparent 1px)", backgroundSize:"32px 32px" }} />

      {/* ── TOP BAR ── */}
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

      {/* ── BODY ── */}
      <div style={{ display:"flex", flex:1, position:"relative", zIndex:1, overflow:"hidden", minHeight:0 }}>

        {/* ── SIDEBAR ── */}
        <nav style={{ width:195, background:"#0d1424", borderRight:"1px solid #1e3050", padding:"16px 0", flexShrink:0, overflowY:"auto" }}>
          {NAV.map(group => (
            <div key={group.section} style={{ marginBottom:6 }}>
              <div style={{ padding:"6px 16px 3px", fontSize:9, fontWeight:700, color:"#3a5070", letterSpacing:"1.8px", textTransform:"uppercase", fontFamily:"monospace" }}>{group.section}</div>
              {group.items.map(item => {
                const active = activeNav === item.id && !showNewEntry;
                return (
                  <button key={item.id} onClick={() => { setActiveNav(item.id); setShowNewEntry(false); }} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 16px", background: active ? "rgba(45,140,240,0.1)" : "transparent", borderLeft:`2px solid ${active ? "#2d8cf0" : "transparent"}`, border:"none", outline:"none", cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}>
                    <span style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color: active ? "#e8f0fe" : "#5a7a9a", fontWeight: active ? 700 : 400 }}>
                      <span style={{ fontSize:14 }}>{item.icon}</span>{item.label}
                    </span>
                    {item.badge != null && (
                      <span style={{ background:"rgba(45,140,240,0.18)", border:"1px solid rgba(45,140,240,0.3)", borderRadius:20, padding:"1px 7px", fontSize:10, fontWeight:700, color:"#2d8cf0", fontFamily:"monospace" }}>{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── CONTENT AREA ── */}
        <div style={{ flex:1, display:"flex", overflow:"hidden", minWidth:0 }}>
          <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>

            {/* ── NEW ENTRY SCREEN ── */}
            {showNewEntry && activeNav === "knowledge" && (
              <NewEntryScreen
                onBack={() => setShowNewEntry(false)}
                onSaved={handleSaved}
                showToast={showToast}
              />
            )}

            {/* ── KNOWLEDGE LIBRARY ── */}
            {activeNav === "knowledge" && !showNewEntry && (
              <div style={{ flex:1, overflowY:"auto", padding:"22px 24px 40px" }}>

                {/* Page header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div>
                    <h2 style={{ fontSize:21, fontWeight:800, color:"#e8f0fe", marginBottom:3, margin:0 }}>📚 Knowledge Library</h2>
                    <p style={{ fontSize:12, color:"#5a7a9a", marginTop:4 }}>Procurement expertise documents Claude reads before generating briefings</p>
                  </div>
                  <button onClick={() => setShowNewEntry(true)} style={{ background:"linear-gradient(135deg,#2d8cf0,#00d2b4)", border:"none", borderRadius:7, padding:"9px 18px", fontSize:13, fontWeight:700, color:"#0a0f1a", cursor:"pointer", flexShrink:0 }}>
                    + Add Entry
                  </button>
                </div>

                {/* Stats — states covered instead of jurisdictions count */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
                  {[
                    { val: stats.total,    label:"TOTAL DOCUMENTS",  sub:"In knowledge base",          accent:"#e8f0fe" },
                    { val: stats.active,   label:"ACTIVE",           sub:`${stats.disabled} disabled`,  accent:"#3ec878" },
                    { val: stats.states || "—", label:"STATES COVERED", sub:"Non-federal jurisdictions", accent:"#2d8cf0" },
                    { val: "Today",        label:"LAST UPDATED",     sub: new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}), accent:"#f5a623" },
                  ].map((s, i) => (
                    <div key={i} style={{ background:"#111827", border:"1px solid #1e3050", borderRadius:10, padding:"13px 16px" }}>
                      <div style={{ fontSize:26, fontWeight:800, color:s.accent, fontFamily:"monospace", lineHeight:1, marginBottom:3 }}>{s.val}</div>
                      <div style={{ fontSize:9, fontWeight:700, color:"#5a7a9a", letterSpacing:"1px", textTransform:"uppercase", marginBottom:2 }}>{s.label}</div>
                      <div style={{ fontSize:11, color:"#3a5070" }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Filter tabs + search — NO drop zone */}
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:16, flexWrap:"wrap" }}>
                  {FTABS.map(t => (
                    <button key={t.id} onClick={() => setActiveFilter(t.id)} style={{ background: activeFilter === t.id ? "rgba(45,140,240,0.12)" : "transparent", border:`1px solid ${activeFilter === t.id ? "rgba(45,140,240,0.5)" : "#1e3050"}`, borderRadius:6, padding:"5px 13px", fontSize:12, fontWeight:600, color: activeFilter === t.id ? "#2d8cf0" : "#5a7a9a", cursor:"pointer", transition:"all 0.15s" }}>
                      {t.label}
                    </button>
                  ))}
                  <div style={{ flex:1, minWidth:150, position:"relative" }}>
                    <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", fontSize:12, color:"#3a5070", pointerEvents:"none" }}>🔍</span>
                    <input style={{ width:"100%", background:"#111827", border:"1px solid #1e3050", borderRadius:6, padding:"6px 10px 6px 28px", fontSize:12, color:"#e8f0fe", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}
                      placeholder="Search library…" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>

                {/* Table */}
                <table style={{ width:"100%", borderCollapse:"collapse", background:"#111827", borderRadius:10, overflow:"hidden", border:"1px solid #1e3050" }}>
                  <thead>
                    <tr style={{ background:"#0e1520" }}>
                      {["Document","Category","Priority","Triggers","Status","Actions"].map(h => (
                        <th key={h} style={{ padding:"9px 13px", textAlign:"left", fontFamily:"monospace", fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"#3a5070", borderBottom:"1px solid #1e3050" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan={6} style={{ padding:"28px 16px", textAlign:"center", color:"#3a5070", fontSize:13 }}>No entries match your filter.</td></tr>
                    )}
                    {filtered.map((entry, i) => {
                      const catC  = CAT_COLORS[entry.category] || CAT_COLORS["Compliance"];
                      const pInfo = priorityInfo(entry.priority);
                      const isLast = i === filtered.length - 1;
                      return (
                        <tr key={entry.id}>
                          <td style={{ padding:"12px 13px", borderBottom: isLast ? "none" : "1px solid rgba(30,48,80,0.5)", maxWidth:280 }}>
                            <div style={{ fontSize:13, fontWeight:700, color: entry.status === "disabled" ? "#3a5070" : "#e8f0fe", marginBottom:2, lineHeight:1.3 }}>
                              {entry.title}
                              {entry.isDemo && (
                                <span style={{ display:"inline-block", background:"rgba(155,110,243,0.12)", border:"1px solid rgba(155,110,243,0.3)", borderRadius:3, padding:"1px 5px", fontSize:9, fontWeight:700, color:"#9b6ef3", fontFamily:"monospace", letterSpacing:"0.5px", marginLeft:7, verticalAlign:"middle" }}>DEMO</span>
                              )}
                            </div>
                            <div style={{ fontSize:11, color:"#3a5070" }}>{entry.source}</div>
                          </td>
                          <td style={{ padding:"12px 13px", borderBottom: isLast ? "none" : "1px solid rgba(30,48,80,0.5)" }}>
                            <span style={{ background:catC.bg, border:`1px solid ${catC.border}`, borderRadius:4, padding:"3px 8px", fontSize:10, fontWeight:700, color:catC.text, fontFamily:"monospace", textTransform:"uppercase", letterSpacing:"0.3px", whiteSpace:"nowrap" }}>
                              {entry.category}
                            </span>
                          </td>
                          <td style={{ padding:"12px 13px", borderBottom: isLast ? "none" : "1px solid rgba(30,48,80,0.5)", whiteSpace:"nowrap" }}>
                            <span style={{ fontSize:12, fontWeight:700, color:pInfo.color }}>● {pInfo.label}</span>
                          </td>
                          <td style={{ padding:"12px 13px", borderBottom: isLast ? "none" : "1px solid rgba(30,48,80,0.5)" }}>
                            <TriggerTags triggers={entry.triggers} compact />
                          </td>
                          <td style={{ padding:"12px 13px", borderBottom: isLast ? "none" : "1px solid rgba(30,48,80,0.5)", whiteSpace:"nowrap" }}>
                            {entry.status === "active"
                              ? <span style={{ fontSize:11, fontWeight:700, color:"#3ec878" }}>● Active</span>
                              : <span style={{ fontSize:11, fontWeight:700, color:"#3a5070" }}>○ Disabled</span>}
                          </td>
                          <td style={{ padding:"12px 13px", borderBottom: isLast ? "none" : "1px solid rgba(30,48,80,0.5)", whiteSpace:"nowrap" }}>
                            <button onClick={() => toggleStatus(entry.id)} style={{ background:"transparent", border:`1px solid ${entry.status === "active" ? "rgba(245,166,35,0.3)" : "rgba(62,200,120,0.3)"}`, borderRadius:5, padding:"3px 9px", fontSize:11, color: entry.status === "active" ? "#f5a623" : "#3ec878", cursor:"pointer", fontFamily:"monospace" }}>
                              {entry.status === "active" ? "Disable" : "Enable"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── PROMPT TEMPLATES ── */}
            {activeNav === "prompt-templates" && (
              <div style={{ flex:1, overflowY:"auto", padding:"22px 24px 40px" }}>
                <h2 style={{ fontSize:21, fontWeight:800, color:"#e8f0fe", marginBottom:4, marginTop:0 }}>Prompt Templates</h2>
                <p style={{ fontSize:12, color:"#5a7a9a", marginBottom:22 }}>Configure the system prompt injected into every AI briefing call via <code style={{ fontFamily:"monospace", color:"#2d8cf0", fontSize:11 }}>api/brief.js</code></p>
                <div style={{ background:"#111827", border:"1px solid #1e3050", borderRadius:12, padding:22 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <span style={{ fontFamily:"monospace", fontSize:9, fontWeight:700, color:"#00d2b4", letterSpacing:"2px", textTransform:"uppercase" }}>▸ AI System Prompt</span>
                    <span style={{ fontFamily:"monospace", fontSize:10, color:"#3a5070" }}>{systemPrompt.length} chars · ~{Math.round(systemPrompt.length / 4)} tokens</span>
                  </div>
                  <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={9}
                    style={{ width:"100%", background:"#0a0f1a", border:"1px solid #1e3050", borderRadius:8, padding:"13px 15px", fontSize:12, color:"#8aadca", fontFamily:"monospace", lineHeight:1.7, resize:"vertical", outline:"none", boxSizing:"border-box" }} />
                  <button onClick={() => showToast("System prompt saved")}
                    style={{ marginTop:12, background:"rgba(45,140,240,0.12)", border:"1px solid rgba(45,140,240,0.4)", borderRadius:6, padding:"8px 20px", fontSize:11, fontWeight:700, color:"#2d8cf0", cursor:"pointer", fontFamily:"monospace", letterSpacing:"1px", textTransform:"uppercase" }}>
                    Save Prompt
                  </button>
                </div>
              </div>
            )}

            {/* ── API SETTINGS ── */}
            {activeNav === "api" && (
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
                  <div key={row.label} style={{ background:"#111827", border:`1px solid ${row.warn ? "rgba(232,93,74,0.35)" : "#1e3050"}`, borderRadius:10, padding:"15px 18px", marginBottom:9, display:"flex", justifyContent:"space-between", alignItems:"center", gap:16 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#e8f0fe", marginBottom:2 }}>{row.label}</div>
                      <div style={{ fontSize:11, color:"#5a7a9a" }}>{row.note}</div>
                    </div>
                    <span style={{ fontFamily:"monospace", fontSize:12, color: row.warn ? "#e85d4a" : "#00d2b4", background:"#0a0f1a", border:"1px solid #1e3050", borderRadius:5, padding:"4px 11px", flexShrink:0 }}>{row.val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── PLACEHOLDERS ── */}
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

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:22, right:22, background:"#111827", border:"1px solid #1e3050", borderRadius:8, padding:"10px 16px", fontSize:12, color:"#e8f0fe", fontFamily:"monospace", boxShadow:"0 8px 28px rgba(0,0,0,0.5)", zIndex:999, display:"flex", alignItems:"center", gap:8, animation:"slideUp 0.2s ease" }}>
          <span>{toast.icon}</span><span>{toast.msg}</span>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder, textarea::placeholder { color: #2a3a52; }
        select option { background: #111827; color: #e8f0fe; }
        tbody tr:hover { background: rgba(45,140,240,0.04) !important; }
        button:hover { opacity: 0.82; }
        @keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #0a0f1a; }
        ::-webkit-scrollbar-thumb { background: #1e3050; border-radius: 3px; }
        input[type=range] { cursor: pointer; }
      `}</style>
    </div>
  );
}
