import { useState, useRef, useEffect } from "react";

const ACCOUNTS = [
  { id:"HUF-00204500125", name:"UNICREDIT BK HUNGARY-PAR",  correlationId:"100004001", assetClass:"Asset Services", accountType:"MOT", platform:"TLM",  entity:"HBEU", reconciliationPlatform:"TLM" },
  { id:"EUR-00103200088", name:"DEUTSCHE BANK FRANKFURT",   correlationId:"100004002", assetClass:"Fixed Income",   accountType:"NOS", platform:"TLM",  entity:"HBDE", reconciliationPlatform:"TLM" },
  { id:"GBP-00501100042", name:"BARCLAYS LONDON CLEARING",  correlationId:"100004003", assetClass:"Equities",       accountType:"MOT", platform:"SWIFT", entity:"HBGB", reconciliationPlatform:"SWIFT" },
  { id:"USD-00781200031", name:"JP MORGAN NEW YORK",        correlationId:"100004004", assetClass:"Derivatives",    accountType:"NOS", platform:"TLM",  entity:"HBUS", reconciliationPlatform:"TLM" },
];

const STATS = {
  total:56, generated:34, testing:21, outdated:1,
  submitted:0, approved:null, rejected:null,
  inProduction:null, productionRules:null,
};

const AI_INSIGHTS = [
  { type:"warn",    text:"21 rules in Testing for 14+ days with no progression." },
  { type:"info",    text:"61% of rules are AI-generated this month." },
  { type:"suggest", text:"1 Outdated rule may conflict with 3 Testing rules." },
];

/* ── Shared: Pulsing dot ── */
function AiDot({ color }) {
  return (
    <span style={{ position:"relative", display:"inline-flex", width:8, height:8, alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <span style={{ position:"absolute", width:8, height:8, borderRadius:"50%", background:color, opacity:0.25, animation:"ping 2s ease-in-out infinite" }} />
      <span style={{ width:5, height:5, borderRadius:"50%", background:color }} />
    </span>
  );
}

/* ── Shared: Dropdown ── */
function Dropdown({ current, onSelect, accent, selBg, hoverBg, idColor }) {
  const [open, setOpen] = useState(false);
  const [q, setQ]       = useState("");
  const ref             = useRef();
  const inp             = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => { if (open && inp.current) inp.current.focus(); }, [open]);
  const list = ACCOUNTS.filter(a => a.id.toLowerCase().includes(q.toLowerCase()) || a.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div ref={ref} style={{ position:"relative", display:"inline-block" }}>
      <button onClick={() => { setOpen(o=>!o); setQ(""); }} style={{
        display:"inline-flex", alignItems:"center", gap:5, background:"none",
        border:"none", borderRadius:4, padding:"2px 5px", cursor:"pointer", fontSize:12, fontWeight:700, color:"#1e293b",
      }}>
        <span style={{ fontFamily:"monospace", color:idColor }}>{current.id}</span>
        <span style={{ color:"#64748b", fontWeight:500, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{current.name}</span>
        <span style={{ fontSize:9, color:"#94a3b8" }}>▾</span>
      </button>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, zIndex:999, background:"#fff",
          border:"1.5px solid #e2e8f0", borderRadius:8, boxShadow:"0 8px 30px rgba(0,0,0,0.1)", width:320,
          animation:"fadeDown 0.15s ease" }}>
          <div style={{ padding:"9px 11px", borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"center", gap:7, background:"#fafafa" }}>
            <span style={{ fontSize:12, color:"#94a3b8" }}>⌕</span>
            <input ref={inp} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search accounts…"
              style={{ border:"none", outline:"none", fontSize:12, color:"#1e293b", flex:1, background:"none", fontFamily:"inherit" }} />
          </div>
          <div style={{ maxHeight:190, overflowY:"auto" }}>
            {list.map(a => (
              <div key={a.id} onClick={()=>{ onSelect(a); setOpen(false); setQ(""); }}
                style={{ padding:"9px 12px", cursor:"pointer", display:"flex", flexDirection:"column", gap:1,
                  background:a.id===current.id ? selBg : "#fff",
                  borderLeft:a.id===current.id ? `3px solid ${accent}` : "3px solid transparent",
                  borderBottom:"1px solid #f8fafc" }}
                onMouseEnter={e=>{ if(a.id!==current.id) e.currentTarget.style.background=hoverBg; }}
                onMouseLeave={e=>{ if(a.id!==current.id) e.currentTarget.style.background="#fff"; }}>
                <span style={{ fontSize:11, fontWeight:700, color:accent, fontFamily:"monospace" }}>{a.id}</span>
                <span style={{ fontSize:11, color:"#64748b" }}>{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   ARIZE-INSPIRED
   — clean white, left nav, indigo accent,
     stat tiles with health indicators,
     inline AI observations with eval scores
══════════════════════════════════════════════ */
function ArizeVariant({ account, onSelect }) {
  const accent = "#6366f1";
  const tot    = STATS.total || 1;

  const navItems = ["Overview","Models","Traces","Evaluations","Datasets","Settings"];

  const statTiles = [
    { label:"Total Rules",   value:STATS.total,     sub:"all time",            color:"#6366f1", bg:"#eef2ff" },
    { label:"Generated",     value:STATS.generated, sub:`${Math.round(STATS.generated/tot*100)}% of total`, color:"#6366f1", bg:"#eef2ff" },
    { label:"In Testing",    value:STATS.testing,   sub:"awaiting review",     color:"#f59e0b", bg:"#fffbeb" },
    { label:"Outdated",      value:STATS.outdated,  sub:"needs attention",     color:"#ef4444", bg:"#fef2f2" },
  ];

  return (
    <div style={{ display:"flex", height:"100%", fontFamily:"'Inter','Segoe UI',sans-serif", background:"#fff", minHeight:"100vh" }}>

      {/* Left nav */}
      <nav style={{ width:200, background:"#fff", borderRight:"1px solid #f1f5f9", display:"flex", flexDirection:"column", padding:"20px 0", flexShrink:0 }}>
        {/* Logo */}
        <div style={{ padding:"0 16px 20px", borderBottom:"1px solid #f1f5f9", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:26, height:26, borderRadius:6, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:12, color:"#fff", fontWeight:800 }}>R</span>
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:800, color:"#1e293b", lineHeight:1 }}>ReconAI</div>
              <div style={{ fontSize:9, color:"#94a3b8", letterSpacing:"0.05em" }}>PLATFORM</div>
            </div>
          </div>
        </div>

        {/* Workspace label */}
        <div style={{ padding:"4px 16px 12px", fontSize:10, fontWeight:700, color:"#94a3b8", letterSpacing:"0.1em", textTransform:"uppercase" }}>Workspace</div>

        {navItems.map((item, i) => (
          <div key={item} style={{
            padding:"8px 16px", fontSize:13, fontWeight: i===0 ? 600 : 400,
            color: i===0 ? accent : "#64748b",
            background: i===0 ? "#eef2ff" : "transparent",
            borderLeft: i===0 ? `2px solid ${accent}` : "2px solid transparent",
            cursor:"pointer", display:"flex", alignItems:"center", gap:9,
          }}>
            <span style={{ fontSize:14 }}>{["◈","⬡","◎","✦","⊞","⊙"][i]}</span>
            {item}
          </div>
        ))}

        <div style={{ marginTop:"auto", padding:"16px", borderTop:"1px solid #f1f5f9" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:26, height:26, borderRadius:"50%", background:"#eef2ff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:accent }}>S</div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:"#1e293b" }}>Soumya</div>
              <div style={{ fontSize:10, color:"#94a3b8" }}>Analyst</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <div style={{ flex:1, overflow:"auto", background:"#fafafa" }}>

        {/* Top bar */}
        <div style={{ background:"#fff", borderBottom:"1px solid #f1f5f9", padding:"10px 24px", display:"flex", alignItems:"center", gap:5 }}>
          {["Dashboard","Accounts"].map(c=>(
            <span key={c} style={{ display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ fontSize:12, color:"#94a3b8" }}>{c}</span>
              <span style={{ color:"#e2e8f0", fontSize:11 }}>/</span>
            </span>
          ))}
          <Dropdown current={account} onSelect={onSelect} accent={accent} selBg="#eef2ff" hoverBg="#f8fafc" idColor={accent} />
        </div>

        <div style={{ padding:"24px" }}>

          {/* Account header */}
          <div style={{ marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
              <h1 style={{ fontSize:18, fontWeight:800, color:"#0f172a", letterSpacing:"-0.02em" }}>{account.name}</h1>
              <span style={{ fontSize:11, fontWeight:600, padding:"2px 9px", borderRadius:99, background:"#eef2ff", color:accent }}>Active</span>
            </div>
            {/* Wrapping fields */}
            <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", rowGap:4 }}>
              {[
                { label:"ID",       value:account.correlationId },
                { label:"Class",    value:account.assetClass },
                { label:"Type",     value:account.accountType },
                { label:"Platform", value:account.reconciliationPlatform },
                { label:"Entity",   value:account.entity },
              ].map((f,i,arr)=>(
                <span key={f.label} style={{ display:"inline-flex", alignItems:"baseline", gap:3, whiteSpace:"nowrap" }}>
                  <span style={{ fontSize:11, color:"#94a3b8" }}>{f.label}:</span>
                  <span style={{ fontSize:12, color:"#1e293b", fontWeight:600, fontFamily:"monospace", marginLeft:2 }}>{f.value}</span>
                  {i<arr.length-1 && <span style={{ color:"#e2e8f0", margin:"0 8px" }}>·</span>}
                </span>
              ))}
            </div>
          </div>

          {/* Stat tiles */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
            {statTiles.map(t=>(
              <div key={t.label} style={{ background:"#fff", border:"1px solid #f1f5f9", borderRadius:10, padding:"14px 16px",
                borderTop:`3px solid ${t.color}`, boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize:11, color:"#94a3b8", fontWeight:500, marginBottom:6 }}>{t.label}</div>
                <div style={{ fontSize:28, fontWeight:800, color:"#0f172a", lineHeight:1, letterSpacing:"-0.03em" }}>{t.value}</div>
                <div style={{ fontSize:11, color:t.color, marginTop:5, fontWeight:500 }}>{t.sub}</div>
              </div>
            ))}
          </div>

          {/* Rules log card */}
          <div style={{ background:"#fff", border:"1px solid #f1f5f9", borderRadius:10, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.04)", marginBottom:16 }}>
            <div style={{ padding:"12px 18px", borderBottom:"1px solid #f8fafc", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>Rules Log</span>
                <span style={{ fontSize:11, fontWeight:600, color:"#94a3b8", background:"#f8fafc", padding:"1px 7px", borderRadius:99, border:"1px solid #f1f5f9" }}>{STATS.total} total</span>
              </div>
              <span style={{ fontSize:11, color:accent, fontWeight:600, cursor:"pointer" }}>View all →</span>
            </div>
            <div style={{ padding:"16px 18px" }}>
              {/* Bar */}
              <div style={{ display:"flex", height:10, borderRadius:5, overflow:"hidden", gap:2, marginBottom:14 }}>
                {[
                  { v:STATS.generated, c:"#6366f1" },
                  { v:STATS.testing,   c:"#f59e0b" },
                  { v:STATS.submitted, c:"#8b5cf6" },
                  { v:Math.max((STATS.approved||0)+(STATS.rejected||0),2), c:null, reviewed:true },
                  { v:STATS.outdated,  c:"#ef4444" },
                ].map((s,i)=>{
                  if(s.reviewed) return (
                    <div key={i} style={{ flex:s.v, display:"flex", minWidth:20, overflow:"hidden" }}>
                      <div style={{ flex:Math.max(STATS.approved||0,1), background: STATS.approved?"#10b981":"repeating-linear-gradient(45deg,#d1fae5,#d1fae5 3px,#a7f3d0 3px,#a7f3d0 6px)", borderRight:"1px solid rgba(255,255,255,0.6)" }} />
                      <div style={{ flex:Math.max(STATS.rejected||0,1), background: STATS.rejected?"#ef4444":"repeating-linear-gradient(45deg,#fee2e2,#fee2e2 3px,#fca5a5 3px,#fca5a5 6px)" }} />
                    </div>
                  );
                  return <div key={i} style={{ flex:Math.max(s.v||0,0.4), background:s.c, minWidth:3 }} />;
                })}
              </div>
              {/* Legend */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:12, alignItems:"center" }}>
                {[
                  { v:STATS.generated, c:"#6366f1", l:"Generated" },
                  { v:STATS.testing,   c:"#f59e0b", l:"Testing"   },
                  { v:STATS.submitted, c:"#8b5cf6", l:"Submitted" },
                  { v:STATS.outdated,  c:"#ef4444", l:"Outdated"  },
                ].map(s=>(
                  <div key={s.l} style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <div style={{ width:8, height:8, borderRadius:2, background:s.c }} />
                    <span style={{ fontSize:11, color:"#64748b" }}>{s.l}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:"#0f172a" }}>{s.v}</span>
                    <span style={{ fontSize:10, color:"#94a3b8" }}>({Math.round(s.v/tot*100)}%)</span>
                  </div>
                ))}
                <div style={{ display:"flex", gap:0, background:"#f8fafc", border:"1px solid #f1f5f9", borderRadius:5, overflow:"hidden" }}>
                  {[{c:"#10b981",l:"Approved",v:STATS.approved},{c:"#ef4444",l:"Rejected",v:STATS.rejected}].map((s,i)=>(
                    <div key={s.l} style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 9px", borderRight:i===0?"1px solid #f1f5f9":"none" }}>
                      <div style={{ width:7, height:7, borderRadius:2, background:s.c }} />
                      <span style={{ fontSize:11, color:s.c, fontWeight:600 }}>{s.l}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:"#0f172a" }}>{s.v??'—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Eval panel — Arize style */}
          <div style={{ background:"#fff", border:"1px solid #f1f5f9", borderRadius:10, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ padding:"12px 18px", borderBottom:"1px solid #f8fafc", display:"flex", alignItems:"center", gap:8 }}>
              <AiDot color={accent} />
              <span style={{ fontSize:13, fontWeight:700, color:"#0f172a" }}>AI Evaluations</span>
              <span style={{ fontSize:10, fontWeight:600, padding:"1px 7px", borderRadius:99, background:"#eef2ff", color:accent, border:"1px solid #c7d2fe" }}>3 signals</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column" }}>
              {AI_INSIGHTS.map((ins,i)=>{
                const s = {
                  warn:    { border:"#fde68a", dot:"#f59e0b", label:"WARN",    score:"0.41", lc:"#92400e", bg:"#fffbeb" },
                  info:    { border:"#c7d2fe", dot:accent,    label:"INFO",    score:"0.87", lc:"#3730a3", bg:"#fafafa" },
                  suggest: { border:"#bbf7d0", dot:"#10b981", label:"SUGGEST", score:"0.76", lc:"#065f46", bg:"#fafafa" },
                }[ins.type];
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 18px",
                    borderBottom:i<AI_INSIGHTS.length-1?"1px solid #f8fafc":"none",
                    background:i===0?s.bg:"#fff" }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:s.dot, flexShrink:0 }} />
                    <span style={{ fontSize:10, fontWeight:700, color:s.lc, letterSpacing:"0.08em", width:52, flexShrink:0 }}>{s.label}</span>
                    <span style={{ fontSize:12, color:"#475569", flex:1, lineHeight:1.5 }}>{ins.text}</span>
                    {/* Eval score bar */}
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                      <div style={{ width:60, height:5, borderRadius:99, background:"#f1f5f9", overflow:"hidden" }}>
                        <div style={{ width:`${parseFloat(s.score)*100}%`, height:"100%", background:s.dot, borderRadius:99 }} />
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, color:s.dot, fontFamily:"monospace" }}>{s.score}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Placeholder */}
        <div style={{ margin:"0 24px 24px" }}>
          <div style={{ background:"#fff", border:"1px dashed #e2e8f0", borderRadius:10,
            padding:"40px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:5, minHeight:200 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#94a3b8" }}>Content placeholder</div>
            <div style={{ fontSize:11, color:"#cbd5e1" }}>Table goes here</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   SMARTSTREAM TLM-INSPIRED
   — structured card, lifecycle stages,
     teal/slate palette, operational dashboard feel,
     match rate indicators, status lifecycle row
══════════════════════════════════════════════ */
function TLMVariant({ account, onSelect }) {
  const accent  = "#0d7490";
  const accent2 = "#0e7490";
  const tot     = STATS.total || 1;

  const lifecycle = [
    { label:"Generated", value:STATS.generated, color:"#0d7490", pct: Math.round(STATS.generated/tot*100) },
    { label:"Submitted", value:STATS.submitted,  color:"#7c3aed", pct: Math.round((STATS.submitted||0)/tot*100) },
    { label:"Testing",   value:STATS.testing,    color:"#d97706", pct: Math.round(STATS.testing/tot*100) },
    { label:"Approved",  value:STATS.approved,   color:"#059669", pct: 0 },
    { label:"Rejected",  value:STATS.rejected,   color:"#dc2626", pct: 0 },
    { label:"Outdated",  value:STATS.outdated,   color:"#dc2626", pct: Math.round((STATS.outdated||0)/tot*100) },
  ];

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',sans-serif", background:"#f0f5f7", minHeight:"100vh" }}>

      {/* Header bar — TLM style slate */}
      <div style={{ background:"#0f2d3d", borderBottom:"2px solid #0d7490", padding:"0 24px",
        display:"flex", alignItems:"center", justifyContent:"space-between", height:46 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{ width:22, height:22, borderRadius:4, background:"#0d7490", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:11, fontWeight:800, color:"#fff" }}>T</span>
            </div>
            <span style={{ fontSize:13, fontWeight:700, color:"#fff", letterSpacing:"0.02em" }}>TLM <span style={{ color:"#38bdf8", fontWeight:800 }}>Aurora</span></span>
          </div>
          {["Accounts","Reconciliations","Rules","Reports","Admin"].map((item,i)=>(
            <span key={item} style={{ fontSize:12, color: i===0?"#38bdf8":"rgba(255,255,255,0.5)", cursor:"pointer",
              borderBottom:i===0?"2px solid #38bdf8":"2px solid transparent", padding:"12px 2px", fontWeight:i===0?600:400 }}>
              {item}
            </span>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Soumya · Analyst</span>
          <div style={{ width:26, height:26, borderRadius:"50%", background:"#0d7490", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff" }}>S</div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div style={{ background:"#fff", borderBottom:"1px solid #dde6ea", padding:"8px 24px", display:"flex", alignItems:"center", gap:5 }}>
        {["Dashboard","Accounts"].map(c=>(
          <span key={c} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ fontSize:12, color:"#64748b" }}>{c}</span>
            <span style={{ color:"#cbd5e1", fontSize:11 }}>/</span>
          </span>
        ))}
        <Dropdown current={account} onSelect={onSelect} accent={accent} selBg="#e0f2fe" hoverBg="#f0f9ff" idColor={accent} />
      </div>

      <div style={{ padding:"20px 24px" }}>

        {/* Account card */}
        <div style={{ background:"#fff", border:"1px solid #dde6ea", borderRadius:8, overflow:"hidden", marginBottom:14,
          boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>

          {/* Card header */}
          <div style={{ background:"#f0f9ff", borderBottom:"1px solid #dde6ea", padding:"10px 18px",
            display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:6, height:22, borderRadius:2, background:accent }} />
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"#0f2d3d" }}>
                  <span style={{ fontFamily:"monospace", color:accent }}>{account.id}</span>
                  <span style={{ color:"#cbd5e1", margin:"0 8px" }}>·</span>
                  <span>{account.name}</span>
                </div>
              </div>
            </div>
            <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:4,
              background:"#dcfce7", color:"#15803d", border:"1px solid #bbf7d0" }}>● Active</span>
          </div>

          {/* Account fields */}
          <div style={{ padding:"12px 18px 14px", borderBottom:"1px solid #f0f5f7" }}>
            <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", rowGap:6 }}>
              {[
                { label:"Correlation Account Id", value:account.correlationId },
                { label:"Asset Class",            value:account.assetClass },
                { label:"Account Type",           value:account.accountType },
                { label:"Reconciliation Platform",value:account.reconciliationPlatform },
                { label:"Entity",                 value:account.entity },
              ].map((f,i,arr)=>(
                <span key={f.label} style={{ display:"inline-flex", alignItems:"baseline", gap:3, whiteSpace:"nowrap" }}>
                  <span style={{ fontSize:11, color:"#64748b" }}>{f.label}:</span>
                  <span style={{ fontSize:12, color:"#0f2d3d", fontWeight:700, fontFamily:"monospace", marginLeft:3 }}>{f.value}</span>
                  {i<arr.length-1 && <span style={{ color:"#dde6ea", margin:"0 10px" }}>|</span>}
                </span>
              ))}
            </div>
          </div>

          {/* Rules Log label */}
          <div style={{ padding:"12px 18px 0", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:11, fontWeight:700, color:"#0f2d3d", letterSpacing:"0.06em", textTransform:"uppercase" }}>Rules Log</span>
            <span style={{ fontSize:11, color:"#64748b" }}>—</span>
            <span style={{ fontSize:13, fontWeight:800, color:accent }}>{STATS.total}</span>
            <span style={{ fontSize:11, color:"#94a3b8" }}>total rules</span>
          </div>

          {/* Lifecycle row — TLM style pipeline stages */}
          <div style={{ padding:"12px 18px 6px" }}>
            <div style={{ display:"flex", gap:6, marginBottom:12 }}>
              {lifecycle.map((stage, i) => (
                <div key={stage.label} style={{ flex:1, background: stage.value===null?"#f8fafc":"#fff",
                  border:`1px solid ${stage.value!==null&&stage.value>0?stage.color+"44":"#e8ecef"}`,
                  borderRadius:6, padding:"8px 10px", opacity:stage.value===null?0.45:1 }}>
                  <div style={{ fontSize:18, fontWeight:800, color:stage.value!==null&&stage.value>0?stage.color:"#94a3b8", lineHeight:1 }}>
                    {stage.value??'—'}
                  </div>
                  <div style={{ fontSize:10, color:"#64748b", marginTop:3, fontWeight:500 }}>{stage.label}</div>
                  {stage.value!==null && stage.value>0 && (
                    <div style={{ height:2, background:"#f1f5f9", borderRadius:99, marginTop:6, overflow:"hidden" }}>
                      <div style={{ width:`${Math.round(stage.value/tot*100)}%`, height:"100%", background:stage.color, borderRadius:99 }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Distribution bar */}
            <div style={{ display:"flex", height:10, borderRadius:4, overflow:"hidden", gap:2, marginBottom:4 }}>
              {[
                { v:STATS.generated, c:"#0d7490" },
                { v:STATS.testing,   c:"#d97706" },
                { v:STATS.submitted, c:"#7c3aed" },
                { v:Math.max((STATS.approved||0)+(STATS.rejected||0),2), c:null, reviewed:true },
                { v:STATS.outdated,  c:"#dc2626" },
              ].map((s,i)=>{
                if(s.reviewed) return (
                  <div key={i} style={{ flex:s.v, display:"flex", minWidth:16, overflow:"hidden" }}>
                    <div style={{ flex:Math.max(STATS.approved||0,1), background:STATS.approved?"#059669":"repeating-linear-gradient(45deg,#d1fae5,#d1fae5 3px,#a7f3d0 3px,#a7f3d0 6px)", borderRight:"1px solid rgba(255,255,255,0.5)" }} />
                    <div style={{ flex:Math.max(STATS.rejected||0,1), background:STATS.rejected?"#dc2626":"repeating-linear-gradient(45deg,#fee2e2,#fee2e2 3px,#fca5a5 3px,#fca5a5 6px)" }} />
                  </div>
                );
                return <div key={i} style={{ flex:Math.max(s.v||0,0.4), background:s.c, minWidth:3 }} />;
              })}
            </div>
            {/* Reviewed bracket */}
            <div style={{ display:"flex", marginBottom:14 }}>
              <div style={{ flex:(STATS.generated||0)+(STATS.testing||0)+(STATS.submitted||0)+1.2, minWidth:0 }} />
              <div style={{ flex:Math.max((STATS.approved||0)+(STATS.rejected||0),2), minWidth:16,
                borderLeft:"1px solid #cbd5e1", borderRight:"1px solid #cbd5e1", borderBottom:"1px solid #cbd5e1",
                height:5, borderRadius:"0 0 3px 3px", position:"relative", display:"flex", justifyContent:"center" }}>
                <span style={{ fontSize:7, fontWeight:700, color:"#94a3b8", position:"absolute", bottom:-8,
                  background:"#fff", padding:"0 2px", whiteSpace:"nowrap", letterSpacing:"0.06em" }}>REVIEWED</span>
              </div>
              <div style={{ flex:(STATS.outdated||0)+0.3, minWidth:0 }} />
            </div>
          </div>

          {/* AI Insights — TLM style exception alerts */}
          <div style={{ borderTop:"1px solid #f0f5f7", background:"#f8fbfc" }}>
            <div style={{ padding:"10px 18px 8px", display:"flex", alignItems:"center", gap:7 }}>
              <AiDot color={accent} />
              <span style={{ fontSize:11, fontWeight:700, color:"#0f2d3d", letterSpacing:"0.06em", textTransform:"uppercase" }}>AI Intelligence</span>
              <span style={{ fontSize:10, color:"#94a3b8" }}>· SmartStream Affinity</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {AI_INSIGHTS.map((ins,i)=>{
                const s = {
                  warn:    { l:"1px solid #fde68a", bg:"#fffdf0", dot:"#d97706", label:"EXCEPTION", lc:"#92400e", tc:"#78350f" },
                  info:    { l:"none",               bg:"#f8fbfc", dot:accent,    label:"ANALYSIS",  lc:"#0f2d3d", tc:"#334155" },
                  suggest: { l:"1px solid #bbf7d0", bg:"#f0fdf4", dot:"#059669", label:"ACTION",    lc:"#065f46", tc:"#064e3b" },
                }[ins.type];
                return (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"9px 18px",
                    background:s.bg, borderTop:`1px solid #f0f5f7`, borderLeft:`3px solid ${s.dot}` }}>
                    <span style={{ fontSize:9, fontWeight:700, color:s.lc, letterSpacing:"0.1em",
                      background:"rgba(0,0,0,0.04)", padding:"2px 5px", borderRadius:3, whiteSpace:"nowrap", marginTop:1 }}>{s.label}</span>
                    <span style={{ fontSize:12, color:s.tc, lineHeight:1.6 }}>{ins.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Placeholder */}
        <div style={{ background:"#fff", border:"1px dashed #ccd8df", borderRadius:8,
          padding:"40px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:5, minHeight:200 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#94a3b8" }}>Content placeholder</div>
          <div style={{ fontSize:11, color:"#cbd5e1" }}>Table goes here</div>
        </div>
      </div>
    </div>
  );
}

/* ── Root ── */
export default function App() {
  const [variant, setVariant]   = useState("arize");
  const [account, setAccount]   = useState(ACCOUNTS[0]);

  return (
    <div style={{ minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeDown{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ping{0%{transform:scale(1);opacity:0.3}70%{transform:scale(2.2);opacity:0}100%{transform:scale(2.2);opacity:0}}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#f1f5f9}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px}
      `}</style>

      {/* Toggle */}
      <div style={{ position:"sticky", top:0, zIndex:200, background:"#1e293b",
        padding:"8px 20px", display:"flex", alignItems:"center", gap:8, borderBottom:"1px solid #334155" }}>
        <span style={{ fontSize:10, fontWeight:700, color:"#475569", letterSpacing:"0.1em", textTransform:"uppercase", marginRight:4 }}>Inspiration:</span>
        {[
          { key:"arize", label:"Arize AI style" },
          { key:"tlm",   label:"SmartStream TLM style" },
        ].map(v=>(
          <button key={v.key} onClick={()=>setVariant(v.key)} style={{
            padding:"5px 14px", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.18s",
            background: variant===v.key ? (v.key==="arize"?"#6366f1":"#0d7490") : "transparent",
            color: variant===v.key ? "#fff" : "#64748b",
            border: variant===v.key ? "none" : "1px solid #334155",
          }}>{v.label}</button>
        ))}
      </div>

      {variant === "arize"
        ? <ArizeVariant  account={account} onSelect={setAccount} />
        : <TLMVariant    account={account} onSelect={setAccount} />
      }
    </div>
  );
}
