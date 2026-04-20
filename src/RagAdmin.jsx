import { useState, useRef, useCallback } from "react";

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED_ENTRIES = [
  {
    id: "e-001",
    title: "Texas LGC §252 — Competitive Bidding Requirements",
    source: "Texas Local Government Code · Added Apr 10",
    category: "Jurisdiction",
    jurisdiction: "Texas",
    priority: 75,
    triggers: ["maverick", "po-split"],
    status: "active",
    content: `Under Texas Local Government Code §252.021, a governmental entity must use competitive bidding for contracts over $50,000. Purchases structured to avoid this threshold constitute bid splitting and may violate state law. Entities must maintain documentation of competitive process for all purchases exceeding the micro-purchase threshold of $3,000.`,
  },
  {
    id: "e-002",
    title: "Uniform Guidance 2 CFR Part 200 — Federal Procurement",
    source: "Office of Management & Budget · Added Apr 8",
    category: "Compliance",
    jurisdiction: "Federal",
    priority: 90,
    triggers: ["all"],
    status: "active",
    content: `Federal award recipients must follow procurement standards under 2 CFR §200.317-320. Micro-purchase threshold is $10,000; simplified acquisition threshold is $250,000. Competitive procurement required above simplified threshold. Non-competitive sole-source justification must be documented and approved.`,
  },
  {
    id: "e-003",
    title: "GAO Standards for Internal Control in Government",
    source: "Government Accountability Office · Added Apr 8",
    category: "Compliance",
    jurisdiction: "Federal",
    priority: 85,
    triggers: ["maverick", "po-split"],
    status: "active",
    content: `The GAO Green Book establishes internal control standards for federal entities and is widely adopted by state/local governments. Procurement controls require separation of duties, documented approval workflows, and periodic spend reviews to detect anomalous purchasing patterns.`,
  },
  {
    id: "e-004",
    title: "NIGP Code of Ethics & Professional Standards",
    source: "National Institute of Governmental Purchasing · Added Apr 9",
    category: "Best Practice",
    jurisdiction: "All",
    priority: 60,
    triggers: ["all"],
    status: "active",
    content: `NIGP's Code of Ethics requires procurement professionals to promote fair and open competition, avoid conflicts of interest, and maintain impartiality in vendor selection. Single-source awards require written justification. Vendor concentration above 25% of category spend warrants review.`,
  },
  {
    id: "e-005",
    title: "NASPO Cooperative Purchasing Best Practices",
    source: "NASPO ValuePoint · Added Apr 9",
    category: "Best Practice",
    jurisdiction: "All",
    priority: 55,
    triggers: ["maverick", "single-source"],
    status: "active",
    content: `NASPO cooperative contracts provide pre-competed pricing available to all state and local governments. Agencies should leverage cooperative purchasing to reduce maverick spend. Cooperative contracts do not require individual competitive solicitation per NASPO model legislation adopted in 49 states.`,
  },
  {
    id: "e-006",
    title: "Maverick Spend Reduction Playbook",
    source: "Internal · Roadmap Venture · Added Apr 17",
    category: "Internal",
    jurisdiction: "All",
    priority: 80,
    triggers: ["maverick"],
    status: "active",
    content: `Maverick spend occurs when purchases bypass established contracts or procurement channels. Root causes include lack of user awareness, insufficient contract coverage, and urgent operational needs. Reduction strategies: contract compliance training, p-card policy reinforcement, preferred vendor catalog, and spend threshold alerts in ERP.`,
  },
  {
    id: "e-007",
    title: "California Public Contract Code §20160",
    source: "State of California · Added Apr 5",
    category: "Jurisdiction",
    jurisdiction: "California",
    priority: 70,
    triggers: ["maverick"],
    status: "disabled",
    content: `California public agencies must competitively bid contracts exceeding $50,000 under Public Contract Code §20160. Emergency exceptions require board approval within 60 days. Informal bidding procedures apply for contracts between $15,000 and $50,000 with a minimum of three written quotes.`,
  },
];

const CATEGORIES   = ["Compliance", "Jurisdiction", "Best Practice", "Internal"];
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
  Compliance:     { text: "#f5a623", bg: "rgba(245,166,35,0.13)",  border: "rgba(245,166,35,0.35)"  },
  Jurisdiction:   { text: "#2d8cf0", bg: "rgba(45,140,240,0.13)",  border: "rgba(45,140,240,0.35)"  },
  "Best Practice":{ text: "#00d2b4", bg: "rgba(0,210,180,0.13)",   border: "rgba(0,210,180,0.35)"   },
  Internal:       { text: "#9b6ef3", bg: "rgba(155,110,243,0.13)", border: "rgba(155,110,243,0.35)" },
};

const PRIORITY_SCALE = ["Low", "Medium", "High", "Critical"];

function priorityInfo(v) {
  if (v >= 80) return { label: "Critical", color: "#e85d4a" };
  if (v >= 65) return { label: "High",     color: "#f5a623" };
  if (v >= 40) return { label: "Medium",   color: "#2d8cf0" };
  return              { label: "Low",      color: "#5a7a9a" };
}

function TriggerTags({ triggers, compact }) {
  if (!triggers?.length) return null;
  if (triggers.includes("all")) return <Tag color="#8aadca">All Flags</Tag>;
  const show = compact ? triggers.slice(0, 2) : triggers;
  return (
    <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {show.map(t => {
        const f = FLAG_TRIGGERS.find(f => f.id === t);
        return f ? <Tag key={t} color="#8aadca">{compact ? f.label.split(" ")[0] : f.label}</Tag> : null;
      })}
      {compact && triggers.length > 2 && <Tag color="#5a7a9a">+{triggers.length - 2}</Tag>}
    </span>
  );
}

function Tag({ color, children }) {
  return (
    <span style={{
      display: "inline-block",
      background: `${color}18`, border: `1px solid ${color}40`,
      borderRadius: 4, padding: "2px 7px",
      fontSize: 10, fontWeight: 700, color,
      fontFamily: "monospace", letterSpacing: "0.3px", whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

// ─── EDIT PANEL ───────────────────────────────────────────────────────────────
function EditPanel({ entry, onSave, onCancel }) {
  const [form, setForm] = useState({ ...entry });
  const pInfo = priorityInfo(form.priority);

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

  const preview = form.content
    ? `[${form.jurisdiction !== "All" ? `JURISDICTION: ${form.jurisdiction} · ` : ""}${pInfo.label.toUpperCase()} PRIORITY]\n${form.content.slice(0, 200)}${form.content.length > 200 ? "..." : ""}`
    : "";

  return (
    <div style={{ width: 340, flexShrink: 0, background: "#0d1424", borderLeft: "1px solid #1e3050", display: "flex", flexDirection: "column", overflowY: "auto" }}>

      {/* Panel header */}
      <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #1e3050", background: "#0a0f1a", flexShrink: 0 }}>
        <div style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: "#2d8cf0", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 2 }}>
          ➤ {entry._isNew ? "New Entry" : "Edit Entry"}
        </div>
        <div style={{ fontSize: 11, color: "#5a7a9a", lineHeight: 1.3 }}>
          {entry._isNew ? "Knowledge Library" : entry.title.slice(0, 35) + (entry.title.length > 35 ? "…" : "")}
        </div>
      </div>

      {/* Fields */}
      <div style={{ padding: "16px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Title */}
        <Field label="TITLE">
          <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Texas LGC §252 — Competitive Bidding…" />
        </Field>

        {/* Category + Jurisdiction */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="CATEGORY">
            <select style={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="JURISDICTION">
            <select style={inp} value={form.jurisdiction} onChange={e => setForm(f => ({ ...f, jurisdiction: e.target.value }))}>
              {JURISDICTIONS.map(j => <option key={j}>{j}</option>)}
            </select>
          </Field>
        </div>

        {/* Priority */}
        <Field label="PRIORITY WEIGHT" right={<span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: pInfo.color }}>{pInfo.label}&nbsp;&nbsp;{form.priority} / 100</span>}>
          <input type="range" min={0} max={100} value={form.priority}
            onChange={e => setForm(f => ({ ...f, priority: +e.target.value }))}
            style={{ width: "100%", accentColor: pInfo.color, cursor: "pointer", marginTop: 4 }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
            {PRIORITY_SCALE.map(l => <span key={l} style={{ fontSize: 9, color: "#3a5070", fontFamily: "monospace" }}>{l}</span>)}
          </div>
        </Field>

        {/* Flag triggers */}
        <Field label="TRIGGERS ON THESE FLAGS">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 4 }}>
            {FLAG_TRIGGERS.map(f => {
              const on = form.triggers.includes("all") || form.triggers.includes(f.id);
              return (
                <label key={f.id} style={{
                  display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
                  background: on ? "rgba(0,210,180,0.08)" : "rgba(14,21,32,0.6)",
                  border: `1px solid ${on ? "rgba(0,210,180,0.4)" : "#1e3050"}`,
                  borderRadius: 6, padding: "6px 10px",
                  fontSize: 12, color: on ? "#00d2b4" : "#5a7a9a", fontWeight: on ? 700 : 400,
                  transition: "all 0.15s",
                }}>
                  <input type="checkbox" checked={on} onChange={() => toggleTrigger(f.id)}
                    style={{ accentColor: "#00d2b4", width: 13, height: 13, cursor: "pointer" }} />
                  {f.label}
                </label>
              );
            })}
          </div>
          <label style={{
            display: "flex", alignItems: "center", gap: 7, cursor: "pointer", marginTop: 6,
            background: form.triggers.includes("all") ? "rgba(0,210,180,0.08)" : "rgba(14,21,32,0.6)",
            border: `1px solid ${form.triggers.includes("all") ? "rgba(0,210,180,0.4)" : "#1e3050"}`,
            borderRadius: 6, padding: "6px 10px",
            fontSize: 12, color: form.triggers.includes("all") ? "#00d2b4" : "#5a7a9a",
            fontWeight: form.triggers.includes("all") ? 700 : 400,
          }}>
            <input type="checkbox" checked={form.triggers.includes("all")} onChange={() => toggleTrigger("all")}
              style={{ accentColor: "#00d2b4", width: 13, height: 13, cursor: "pointer" }} />
            All Flags (always inject)
          </label>
        </Field>

        {/* Guidance content */}
        <Field label="GUIDANCE CONTENT">
          <textarea style={{ ...inp, minHeight: 100, resize: "vertical", lineHeight: 1.6, marginTop: 2 }}
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Enter the procurement guidance text Claude will use when this entry is retrieved…" />
        </Field>

        {/* Preview */}
        {preview && (
          <Field label="PREVIEW — HOW CLAUDE WILL SEE THIS" labelColor="#9b6ef3">
            <div style={{
              background: "#0a0f1a", border: "1px solid rgba(155,110,243,0.3)",
              borderRadius: 7, padding: "11px 13px",
              fontSize: 11, color: "#8aadca", fontFamily: "monospace", lineHeight: 1.7,
              whiteSpace: "pre-wrap", marginTop: 2,
            }}>{preview}</div>
          </Field>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "13px 20px", borderTop: "1px solid #1e3050", display: "flex", gap: 10, background: "#0a0f1a", flexShrink: 0 }}>
        <button style={{ flex: 1, background: "#111827", border: "1px solid #1e3050", borderRadius: 7, padding: 10, fontSize: 12, fontWeight: 700, color: "#5a7a9a", cursor: "pointer", fontFamily: "inherit" }} onClick={onCancel}>Cancel</button>
        <button
          style={{ flex: 2, background: "linear-gradient(135deg,#2d8cf0,#00d2b4)", border: "none", borderRadius: 7, padding: 10, fontSize: 12, fontWeight: 700, color: "#0a0f1a", cursor: "pointer", fontFamily: "inherit", opacity: (!form.title || !form.content) ? 0.4 : 1, transition: "opacity 0.2s" }}
          disabled={!form.title || !form.content}
          onClick={() => onSave(form)}
        >Save Entry</button>
      </div>
    </div>
  );
}

function Field({ label, labelColor, right, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: labelColor || "#5a7a9a" }}>{label}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

const inp = {
  background: "#111827", border: "1px solid #1e3050", borderRadius: 6,
  padding: "8px 11px", fontSize: 12, color: "#e8f0fe", outline: "none",
  fontFamily: "inherit", width: "100%",
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function RagAdmin() {
  const [entries, setEntries]     = useState(SEED_ENTRIES);
  const [activeNav, setActiveNav] = useState("knowledge");
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch]       = useState("");
  const [editEntry, setEditEntry] = useState(null);
  const [toast, setToast]         = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    `You are an AI procurement analyst powered by NIGP's proprietary knowledge base. When analyzing spend data, ground your recommendations in NIGP methodology, Uniform Guidance compliance requirements, and NASPO cooperative contract benchmarks. Always cite the specific framework or regulation when flagging procurement concerns. Tailor recommendations to the agency's jurisdiction where applicable.`
  );
  const fileRef = useRef(null);

  const showToast = (msg, icon = "✓") => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 2800);
  };

  const stats = {
    total:  entries.length,
    active: entries.filter(e => e.status === "active").length,
    disabled: entries.filter(e => e.status === "disabled").length,
    jurisdictions: [...new Set(entries.filter(e => e.jurisdiction !== "All").map(e => e.jurisdiction))].length,
  };

  // ── filter ──
  const catMap = { all: null, compliance: "Compliance", jurisdiction: "Jurisdiction", "best-practice": "Best Practice", internal: "Internal" };
  const filtered = entries.filter(e => {
    const catOk = !catMap[activeFilter] || e.category === catMap[activeFilter];
    const txtOk = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.source.toLowerCase().includes(search.toLowerCase());
    return catOk && txtOk;
  });

  const openNew = () => setEditEntry({ id: `e-${Date.now()}`, title: "", source: "", category: "Compliance", jurisdiction: "All", priority: 50, triggers: [], status: "active", content: "", _isNew: true });

  const saveEntry = (entry) => {
    if (entry._isNew) {
      const { _isNew, ...clean } = entry;
      setEntries(prev => [{ ...clean, source: `Added ${new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})}` }, ...prev]);
      showToast("Entry added to knowledge base");
    } else {
      setEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
      showToast("Entry saved");
    }
    setEditEntry(null);
  };

  const deleteEntry = (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    if (editEntry?.id === id) setEditEntry(null);
    showToast("Entry removed", "🗑");
  };

  const toggleStatus = (id) => setEntries(prev => prev.map(e => e.id === id ? { ...e, status: e.status === "active" ? "disabled" : "active" } : e));

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) { showToast(`${files.length} file queued — fill in details`, "📄"); openNew(); }
  }, []);

  // ── NAV items ──
  const NAV = [
    { section: "AI KNOWLEDGE", items: [
      { id: "knowledge",       icon: "📚", label: "Knowledge Library", badge: stats.active },
      { id: "ai-behavior",     icon: "🤖", label: "AI Behavior" },
      { id: "flag-mapping",    icon: "🚩", label: "Flag Mapping" },
    ]},
    { section: "CONFIGURATION", items: [
      { id: "jurisdictions",   icon: "🗺",  label: "Jurisdictions", badge: stats.jurisdictions },
      { id: "prompt-templates",icon: "📝", label: "Prompt Templates" },
      { id: "usage",           icon: "💰", label: "Usage & Cost" },
    ]},
    { section: "SYSTEM", items: [
      { id: "api",             icon: "🔑", label: "API Settings" },
      { id: "access",          icon: "👤", label: "Access Control" },
    ]},
  ];

  // ── Filter tabs ──
  const FTABS = [
    { id: "all",           label: `All (${entries.length})` },
    { id: "compliance",    label: `Compliance (${entries.filter(e=>e.category==="Compliance").length})` },
    { id: "best-practice", label: `Best Practice (${entries.filter(e=>e.category==="Best Practice").length})` },
    { id: "jurisdiction",  label: `Jurisdiction (${entries.filter(e=>e.category==="Jurisdiction").length})` },
    { id: "internal",      label: `Internal (${entries.filter(e=>e.category==="Internal").length})` },
  ];

  return (
    <div style={{ background: "#0a0f1a", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#e8f0fe", overflow: "hidden", height: "100vh" }}>

      {/* Grid texture */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "linear-gradient(rgba(45,140,240,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(45,140,240,0.025) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />

      {/* ── TOP BAR ── */}
      <header style={{ position: "relative", zIndex: 10, background: "#0d1424", borderBottom: "1px solid #1e3050", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 50, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#2d8cf0,#00d2b4)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#0a0f1a", flexShrink: 0 }}>N</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#e8f0fe", lineHeight: 1.15 }}>NIGP Spend Analyzer</div>
            <div style={{ fontSize: 10, color: "#3a5070", fontFamily: "monospace", letterSpacing: "0.4px" }}>Government Procurement Intelligence · AI Administration</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ background: "rgba(45,140,240,0.12)", border: "1px solid rgba(45,140,240,0.35)", borderRadius: 6, padding: "5px 14px", fontSize: 11, fontWeight: 700, color: "#2d8cf0", cursor: "pointer", fontFamily: "monospace" }}>
            ⚙ Admin Mode
          </button>
          <button style={{ background: "#111827", border: "1px solid #1e3050", borderRadius: 6, padding: "5px 14px", fontSize: 11, fontWeight: 700, color: "#5a7a9a", cursor: "pointer", fontFamily: "monospace" }}>
            ← Back to Analyzer
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{ display: "flex", flex: 1, position: "relative", zIndex: 1, overflow: "hidden", minHeight: 0 }}>

        {/* ── SIDEBAR ── */}
        <nav style={{ width: 195, background: "#0d1424", borderRight: "1px solid #1e3050", padding: "16px 0", flexShrink: 0, overflowY: "auto" }}>
          {NAV.map(group => (
            <div key={group.section} style={{ marginBottom: 6 }}>
              <div style={{ padding: "6px 16px 3px", fontSize: 9, fontWeight: 700, color: "#3a5070", letterSpacing: "1.8px", textTransform: "uppercase", fontFamily: "monospace" }}>{group.section}</div>
              {group.items.map(item => {
                const active = activeNav === item.id;
                return (
                  <button key={item.id} onClick={() => setActiveNav(item.id)} style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 16px",
                    background: active ? "rgba(45,140,240,0.1)" : "transparent",
                    borderLeft: `2px solid ${active ? "#2d8cf0" : "transparent"}`,
                    border: "none", outline: "none",
                    cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: active ? "#e8f0fe" : "#5a7a9a", fontWeight: active ? 700 : 400 }}>
                      <span style={{ fontSize: 14 }}>{item.icon}</span>{item.label}
                    </span>
                    {item.badge != null && (
                      <span style={{ background: "rgba(45,140,240,0.18)", border: "1px solid rgba(45,140,240,0.3)", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 700, color: "#2d8cf0", fontFamily: "monospace" }}>{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── CONTENT AREA ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", minWidth: 0 }}>

          {/* ── KNOWLEDGE LIBRARY ── */}
          {activeNav === "knowledge" && (
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {/* Main panel */}
              <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px 40px" }}>

                {/* Page header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 21, fontWeight: 800, color: "#e8f0fe", marginBottom: 3, display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                      📚 Knowledge Library
                    </h2>
                    <p style={{ fontSize: 12, color: "#5a7a9a", marginTop: 4 }}>Manage the guidance documents Claude uses when generating procurement briefings</p>
                  </div>
                  <button onClick={openNew} style={{ background: "linear-gradient(135deg,#2d8cf0,#00d2b4)", border: "none", borderRadius: 7, padding: "9px 18px", fontSize: 13, fontWeight: 700, color: "#0a0f1a", cursor: "pointer", flexShrink: 0 }}>
                    + Add Entry
                  </button>
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
                  {[
                    { val: stats.total,         label: "TOTAL ENTRIES",   sub: "Active knowledge sources",  accent: "#e8f0fe" },
                    { val: stats.active,         label: "ACTIVE",          sub: `${stats.disabled} disabled`, accent: "#3ec878" },
                    { val: stats.jurisdictions,  label: "JURISDICTIONS",   sub: "TX · Federal · All",        accent: "#2d8cf0" },
                    { val: "Today",              label: "LAST UPDATED",    sub: new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}), accent: "#f5a623" },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "#111827", border: "1px solid #1e3050", borderRadius: 10, padding: "13px 16px" }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: s.accent, fontFamily: "monospace", lineHeight: 1, marginBottom: 3 }}>{s.val}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#5a7a9a", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: "#3a5070" }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Filter tabs + search */}
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14, flexWrap: "wrap" }}>
                  {FTABS.map(t => (
                    <button key={t.id} onClick={() => setActiveFilter(t.id)} style={{
                      background: activeFilter === t.id ? "rgba(45,140,240,0.12)" : "transparent",
                      border: `1px solid ${activeFilter === t.id ? "rgba(45,140,240,0.5)" : "#1e3050"}`,
                      borderRadius: 6, padding: "5px 13px", fontSize: 12, fontWeight: 600,
                      color: activeFilter === t.id ? "#2d8cf0" : "#5a7a9a",
                      cursor: "pointer", transition: "all 0.15s",
                    }}>{t.label}</button>
                  ))}
                  <div style={{ flex: 1, minWidth: 150, position: "relative" }}>
                    <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#3a5070", pointerEvents: "none" }}>🔍</span>
                    <input style={{ width: "100%", background: "#111827", border: "1px solid #1e3050", borderRadius: 6, padding: "6px 10px 6px 28px", fontSize: 12, color: "#e8f0fe", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                      placeholder="Search library..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  style={{ border: `1.5px dashed ${dragOver ? "#00d2b4" : "#1e3050"}`, borderRadius: 8, padding: "10px 18px", marginBottom: 14, background: dragOver ? "rgba(0,210,180,0.04)" : "transparent", textAlign: "center", fontSize: 12, color: "#3a5070", transition: "all 0.2s", cursor: "pointer" }}
                >
                  {dragOver ? "📂 Drop to queue document" : "📄 Drop a PDF or DOCX here to add a new entry"}
                  <input ref={fileRef} type="file" multiple accept=".pdf,.txt,.docx" style={{ display: "none" }} onChange={e => { if (e.target.files.length) { showToast("File queued — fill in entry details", "📄"); openNew(); } }} />
                </div>

                {/* Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", background: "#111827", borderRadius: 10, overflow: "hidden", border: "1px solid #1e3050" }}>
                  <thead>
                    <tr style={{ background: "#0e1520" }}>
                      {["Entry","Category","Priority","Triggers","Status","Actions"].map(h => (
                        <th key={h} style={{ padding: "9px 13px", textAlign: "left", fontFamily: "monospace", fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#3a5070", borderBottom: "1px solid #1e3050" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: "28px 16px", textAlign: "center", color: "#3a5070", fontSize: 13 }}>No entries match your filter.</td></tr>
                    )}
                    {filtered.map((entry, i) => {
                      const catC  = CAT_COLORS[entry.category] || CAT_COLORS["Compliance"];
                      const pInfo = priorityInfo(entry.priority);
                      const isLast = i === filtered.length - 1;
                      const isSelected = editEntry?.id === entry.id;
                      return (
                        <tr key={entry.id} style={{ background: isSelected ? "rgba(45,140,240,0.05)" : "transparent", borderLeft: `2px solid ${isSelected ? "#2d8cf0" : "transparent"}`, transition: "background 0.15s" }}>
                          <td style={{ padding: "12px 13px", borderBottom: isLast ? "none" : "1px solid rgba(30,48,80,0.5)", maxWidth: 260 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: entry.status === "disabled" ? "#3a5070" : "#e8f0fe", marginBottom: 2, lineHeight: 1.3 }}>{entry.title}</div>
                            <div style={{ fontSize: 11, color: "#3a5070" }}>{entry.source}</div>
                          </td>
                          <td style={{ padding: "12px 13px", borderBottom: isLast ? "none" : "1px solid rgba(30,48,80,0.5)" }}>
                            <span style={{ background: catC.bg, border: `1px solid ${catC.border}`, borderRadius: 4, padding: "3px 8px", fontSize: 10, fontWeight: 700, color: catC.text, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.3px", whiteSpace: "nowrap" }}>
                              {entry.category}
                            </span>
                          </td>
                          <td style={{ padding: "12px 13px", borderBottom: isLast ? "none" : "1px solid rgba(30,48,80,0.5)", whiteSpace: "nowrap" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: pInfo.color }}>● {pInfo.label}</span>
                          </td>
                          <td style={{ padding: "12px 13px", borderBottom: isLast ? "none" : "1px solid rgba(30,48,80,0.5)" }}>
                            <TriggerTags triggers={entry.triggers} compact />
                          </td>
                          <td style={{ padding: "12px 13px", borderBottom: isLast ? "none" : "1px solid rgba(30,48,80,0.5)", whiteSpace: "nowrap" }}>
                            {entry.status === "active"
                              ? <span style={{ fontSize: 11, fontWeight: 700, color: "#3ec878" }}>● Active</span>
                              : <span style={{ fontSize: 11, fontWeight: 700, color: "#3a5070" }}>○ Disabled</span>}
                          </td>
                          <td style={{ padding: "12px 13px", borderBottom: isLast ? "none" : "1px solid rgba(30,48,80,0.5)", whiteSpace: "nowrap" }}>
                            <button onClick={() => setEditEntry(isSelected ? null : { ...entry })} style={{ background: "transparent", border: "1px solid #1e3050", borderRadius: 5, padding: "3px 9px", fontSize: 11, color: "#5a7a9a", cursor: "pointer", fontFamily: "monospace", marginRight: 6 }}>
                              {isSelected ? "✕ Close" : "✎ Edit"}
                            </button>
                            <button onClick={() => toggleStatus(entry.id)} style={{ background: "transparent", border: `1px solid ${entry.status === "active" ? "rgba(245,166,35,0.3)" : "rgba(62,200,120,0.3)"}`, borderRadius: 5, padding: "3px 9px", fontSize: 11, color: entry.status === "active" ? "#f5a623" : "#3ec878", cursor: "pointer", fontFamily: "monospace" }}>
                              {entry.status === "active" ? "Disable" : "Enable"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Edit panel */}
              {editEntry && <EditPanel entry={editEntry} onSave={saveEntry} onCancel={() => setEditEntry(null)} />}
            </div>
          )}

          {/* ── PROMPT TEMPLATES ── */}
          {activeNav === "prompt-templates" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px 40px" }}>
              <h2 style={{ fontSize: 21, fontWeight: 800, color: "#e8f0fe", marginBottom: 4, marginTop: 0 }}>Prompt Templates</h2>
              <p style={{ fontSize: 12, color: "#5a7a9a", marginBottom: 22 }}>
                Configure the system prompt injected into every AI briefing call via{" "}
                <code style={{ fontFamily: "monospace", color: "#2d8cf0", fontSize: 11 }}>api/brief.js</code>
              </p>
              <div style={{ background: "#111827", border: "1px solid #1e3050", borderRadius: 12, padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 9, fontWeight: 700, color: "#00d2b4", letterSpacing: "2px", textTransform: "uppercase" }}>▸ AI System Prompt</span>
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: "#3a5070" }}>{systemPrompt.length} chars · ~{Math.round(systemPrompt.length / 4)} tokens</span>
                </div>
                <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={9}
                  style={{ width: "100%", background: "#0a0f1a", border: "1px solid #1e3050", borderRadius: 8, padding: "13px 15px", fontSize: 12, color: "#8aadca", fontFamily: "monospace", lineHeight: 1.7, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
                <button onClick={() => showToast("System prompt saved")}
                  style={{ marginTop: 12, background: "rgba(45,140,240,0.12)", border: "1px solid rgba(45,140,240,0.4)", borderRadius: 6, padding: "8px 20px", fontSize: 11, fontWeight: 700, color: "#2d8cf0", cursor: "pointer", fontFamily: "monospace", letterSpacing: "1px", textTransform: "uppercase" }}>
                  Save Prompt
                </button>
              </div>
            </div>
          )}

          {/* ── API SETTINGS ── */}
          {activeNav === "api" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px 40px" }}>
              <h2 style={{ fontSize: 21, fontWeight: 800, color: "#e8f0fe", marginBottom: 4, marginTop: 0 }}>API Settings</h2>
              <p style={{ fontSize: 12, color: "#5a7a9a", marginBottom: 22 }}>Configure RAG pipeline endpoints and Vercel Edge Function settings</p>
              {[
                { label: "Anthropic API Key",  val: "sk-ant-••••••••••••XQ4",          note: "Set in Vercel → Settings → Environment Variables", warn: false },
                { label: "RAG Endpoint",       val: "/api/brief.js",                   note: "Vercel Edge Function — currently active", warn: false },
                { label: "Vector Store",       val: "Not configured",                  note: "Supabase pgvector recommended for production", warn: true },
                { label: "Model",              val: "claude-haiku-4-5-20251001",       note: "~$0.02–0.03 per briefing at max_tokens: 6000", warn: false },
                { label: "Max Tokens",         val: "6000",                            note: "Increase to 8000 for longer reports", warn: false },
                { label: "Top-k Retrieval",    val: "5 chunks",                        note: "Knowledge base passages retrieved per query", warn: false },
              ].map(row => (
                <div key={row.label} style={{ background: "#111827", border: `1px solid ${row.warn ? "rgba(232,93,74,0.35)" : "#1e3050"}`, borderRadius: 10, padding: "15px 18px", marginBottom: 9, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e8f0fe", marginBottom: 2 }}>{row.label}</div>
                    <div style={{ fontSize: 11, color: "#5a7a9a" }}>{row.note}</div>
                  </div>
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: row.warn ? "#e85d4a" : "#00d2b4", background: "#0a0f1a", border: "1px solid #1e3050", borderRadius: 5, padding: "4px 11px", flexShrink: 0 }}>{row.val}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── PLACEHOLDER SCREENS ── */}
          {["ai-behavior","flag-mapping","jurisdictions","usage","access"].includes(activeNav) && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#3a5070", gap: 10 }}>
              <div style={{ fontSize: 38 }}>🔧</div>
              <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
                {activeNav.replace(/-/g," ")} — Next Sprint
              </div>
              <div style={{ fontSize: 12 }}>This configuration screen is part of the next build sprint.</div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 22, right: 22, background: "#111827", border: "1px solid #1e3050", borderRadius: 8, padding: "10px 16px", fontSize: 12, color: "#e8f0fe", fontFamily: "monospace", boxShadow: "0 8px 28px rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", gap: 8, animation: "slideUp 0.2s ease" }}>
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
