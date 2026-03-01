import { useState, useRef } from "react";

// ── Design Tokens (Light + Primary Colors) ────────────────────────────────────
const C = {
  bg:          "#f5f7ff",
  surface:     "#ffffff",
  border:      "#e2e6f0",
  text:        "#1a2236",
  muted:       "#6b7a99",
  faint:       "#f0f2fa",
  blue:        "#1d4ed8",
  blueSoft:    "#dbeafe",
  red:         "#dc2626",
  redSoft:     "#fee2e2",
  yellow:      "#d97706",
  yellowSoft:  "#fef3c7",
  green:       "#16a34a",
  greenSoft:   "#dcfce7",
  purple:      "#7c3aed",
  purpleSoft:  "#ede9fe",
};

const BBS = { total: 3000, clinical: 2000, ftf: 750, nonClinical: 1000, weeks: 104 };

const CATEGORY_META = {
  clinical:     { color: C.blue,   bg: C.blueSoft,   label: "Clinical",      bbs: "Section A" },
  supervision:  { color: C.red,    bg: C.redSoft,    label: "Supervision",   bbs: "Direct Supervisor Contact" },
  training:     { color: C.yellow, bg: C.yellowSoft, label: "Training / CE", bbs: "Workshops & Seminars" },
  consultation: { color: C.purple, bg: C.purpleSoft, label: "Consultation",  bbs: "Consultation/Research" },
  advocacy:     { color: C.green,  bg: C.greenSoft,  label: "Advocacy",      bbs: "Client-Centered Advocacy" },
  other:        { color: C.muted,  bg: C.faint,      label: "Uncategorized", bbs: "—" },
};

const PSYCH_KEYWORDS = [
  "therapy","therapist","psycholog","clinical","mental health","social work",
  "counseling","counselor","trauma","anxiety","depression","DBT","CBT",
  "attachment","neuroscience","mindfulness","ptsd","grief","addiction",
  "substance","schizophrenia","bipolar","personality disorder","family systems",
  "psychodynamic","EMDR","somatic","diagnosis","assessment","psychiatry",
  "behavioral","cognitive","emotion regulation","crisis intervention","psychotherapy",
];

function parseICS(text) {
  const events = [];
  const blocks = text.split("BEGIN:VEVENT");
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const get = (key) => { const m = block.match(new RegExp(`${key}[^:]*:([^\r\n]+)`)); return m ? m[1].trim() : ""; };
    const summary = get("SUMMARY");
    if (summary) events.push({ summary, description: get("DESCRIPTION"), dtstart: get("DTSTART"), duration: get("DURATION") });
  }
  return events;
}

function categorizeEvent(ev) {
  const t = (ev.summary + " " + ev.description).toLowerCase();
  if (/supervis/.test(t)) return "supervision";
  if (/therapy|session|client|psychotherapy|intake|assessment|treatment/.test(t)) return "clinical";
  if (/conference|training|workshop|seminar|webinar|ce |ceu|continuing ed/.test(t)) return "training";
  if (/consult|case review/.test(t)) return "consultation";
  if (/advocacy/.test(t)) return "advocacy";
  return "other";
}

function parseDuration(ev) {
  if (ev.duration) { const m = ev.duration.match(/PT?(\d+)H/); if (m) return parseInt(m[1]); }
  return 1;
}

function isPsych(title) {
  const t = title.toLowerCase();
  return PSYCH_KEYWORDS.some(k => t.includes(k.toLowerCase()));
}

function ProgressBar({ value, max, min, color, inverse }) {
  const pct = Math.min(100, (value / (inverse ? max : (min || max))) * 100);
  const over = !inverse && min && value >= min;
  const overMax = inverse && value > max;
  return (
    <div style={{ height: 10, background: C.faint, borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}` }}>
      <div style={{ height: "100%", width: `${pct}%`, borderRadius: 6, background: overMax ? C.red : over ? C.green : color, transition: "width 0.6s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

function StatCard({ label, value, target, unit = "hrs", color, note, inverse }) {
  const met = inverse ? value <= target : value >= target;
  return (
    <div style={{ background: C.surface, border: `1.5px solid ${color}40`, borderRadius: 14, padding: "18px 20px", boxShadow: `0 2px 8px ${color}15` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
        {met !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 700, color: met ? C.green : C.yellow, background: met ? C.greenSoft : C.yellowSoft, padding: "2px 10px", borderRadius: 20, border: `1px solid ${met ? "#bbf7d0" : "#fde68a"}` }}>
            {met ? "✓ MET" : `${(target - value).toLocaleString()} to go`}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
        <span style={{ fontSize: 36, fontWeight: 800, color, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{value.toLocaleString()}</span>
        <span style={{ fontSize: 13, color: C.muted }}>/ {target?.toLocaleString()} {unit}</span>
      </div>
      {target && <ProgressBar value={value} min={!inverse ? target : undefined} max={target} color={color} inverse={inverse} />}
      {note && <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>{note}</div>}
    </div>
  );
}

function TabBtn({ label, icon, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{
      background: active ? C.blue : C.surface,
      border: `1.5px solid ${active ? C.blue : C.border}`,
      borderRadius: 8, padding: "8px 16px", cursor: "pointer",
      color: active ? "#fff" : C.muted, fontSize: 13, fontWeight: active ? 700 : 500,
      display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s", whiteSpace: "nowrap",
      boxShadow: active ? `0 2px 8px ${C.blue}30` : "none",
    }}>
      {icon} {label}
      {badge > 0 && <span style={{ background: active ? "#fff" : C.blue, color: active ? C.blue : "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>{badge}</span>}
    </button>
  );
}

function Card({ children, style }) {
  return <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, ...style }}>{children}</div>;
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>{children}</div>;
}

export default function LCSWDashboard() {
  const [tab, setTab] = useState("overview");
  const [hours, setHours] = useState({ clinical: 0, ftf: 0, supervision: 0, training: 0, consultation: 0, advocacy: 0 });
  const [calEvents, setCalEvents] = useState([]);
  const [gmailResults, setGmailResults] = useState([]);
  const [mediaItems, setMediaItems] = useState([]);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailQuery, setGmailQuery] = useState("");
  const [calLoading, setCalLoading] = useState(false);
  const [mediaInput, setMediaInput] = useState("");
  const [mediaLoading, setMediaLoading] = useState(false);
  const [spotifyData, setSpotifyData] = useState(null);
  const [manual, setManual] = useState({ clinical: "", ftf: "", supervision: "", training: "", consultation: "", advocacy: "" });
  const fileRef = useRef();
  const spotifyRef = useRef();

  const H = Object.fromEntries(Object.entries(hours).map(([k, v]) => [k, v + (parseInt(manual[k]) || 0)]));
  const totalClinical    = H.clinical;
  const totalNonClinical = H.supervision + H.training + H.consultation + H.advocacy;
  const totalHours       = totalClinical + totalNonClinical;
  const weeksEst         = Math.round(totalHours / 30);

  async function scanGmail() {
    setGmailLoading(true); setGmailResults([]);
    try {
      const q = gmailQuery || "supervision OR supervisor OR LCSW OR ASW OR \"weekly log\" OR \"experience verification\" OR clinical hours";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: `You are an expert at finding California LCSW licensure documentation in Gmail.
Search Gmail for emails relevant to LCSW hour documentation: supervision confirmations, weekly logs, experience verification forms, training certificates, conference registrations.
Return ONLY valid JSON array, no markdown:
[{"sender":"...","date":"...","subject":"...","type":"supervision|training|clinical|consultation","hours":0,"hasAttachment":true,"notes":"..."}]
If none found, return [].`,
          messages: [{ role: "user", content: `Search my Gmail for LCSW licensure documentation going back 2+ years. Query: ${q}` }],
          mcp_servers: [{ type: "url", url: "https://gmail.mcp.claude.com/mcp", name: "gmail-mcp" }],
        }),
      });
      const data = await res.json();
      const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "[]";
      const clean = text.replace(/```json|```/g, "").trim();
      const s = clean.indexOf("["), e = clean.lastIndexOf("]");
      if (s !== -1 && e !== -1) {
        const parsed = JSON.parse(clean.slice(s, e + 1));
        setGmailResults(parsed);
        const supH = parsed.filter(r => r.type === "supervision").reduce((a, b) => a + (b.hours || 1), 0);
        const trnH = parsed.filter(r => r.type === "training").reduce((a, b) => a + (b.hours || 1), 0);
        setHours(h => ({ ...h, supervision: h.supervision + supH, training: h.training + trnH }));
      }
    } catch { setGmailResults([{ sender: "Error", date: "", subject: "Could not connect to Gmail. Ensure Gmail is connected in Claude settings.", type: "other", hours: 0 }]); }
    setGmailLoading(false);
  }

  function handleCalFile(e) {
    const file = e.target.files[0]; if (!file) return;
    setCalLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const events = parseICS(ev.target.result).map(ev => ({ ...ev, category: categorizeEvent(ev), durationHrs: parseDuration(ev) }));
      setCalEvents(events);
      const t = { clinical: 0, supervision: 0, training: 0, consultation: 0, advocacy: 0 };
      events.forEach(ev => { if (t[ev.category] !== undefined) t[ev.category] += ev.durationHrs; });
      setHours(h => ({ clinical: h.clinical + t.clinical, ftf: h.ftf + Math.round(t.clinical * 0.6), supervision: h.supervision + t.supervision, training: h.training + t.training, consultation: h.consultation + t.consultation, advocacy: h.advocacy + t.advocacy }));
      setCalLoading(false);
    };
    reader.readAsText(file);
  }

  function handleSpotifyFile(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const pods = Array.isArray(data) ? data.filter(i => i.episode_show_name && isPsych(i.episode_show_name)) : [];
        const hrs = Math.round(pods.reduce((a, b) => a + (b.ms_played || 0), 0) / 3600000 * 10) / 10;
        setSpotifyData({ items: pods.slice(0, 50), totalHrs: hrs });
        setHours(h => ({ ...h, training: h.training + Math.round(hrs) }));
      } catch { setSpotifyData({ error: true }); }
    };
    reader.readAsText(file);
  }

  async function analyzeMedia() {
    if (!mediaInput.trim()) return;
    setMediaLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: `You are an expert on California LCSW CE requirements. Analyze audiobooks and podcasts for BBS qualification under "Workshops, Seminars & Training Sessions" (non-clinical cap: 1,000 hrs).
Be generous — include anything psychology, social work, mental health, therapy, neuroscience, trauma, DBT, CBT, or related.
Return ONLY valid JSON array, no markdown:
[{"title":"...","type":"audiobook|podcast","qualifies":true,"estimatedHours":0,"bbsCategory":"Workshops & Seminars","notes":"..."}]`,
          messages: [{ role: "user", content: `Analyze for California LCSW CE qualification:\n\n${mediaInput}` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "[]";
      const clean = text.replace(/```json|```/g, "").trim();
      const s = clean.indexOf("["), e = clean.lastIndexOf("]");
      if (s !== -1 && e !== -1) {
        const parsed = JSON.parse(clean.slice(s, e + 1));
        setMediaItems(parsed);
        setHours(h => ({ ...h, training: h.training + parsed.filter(m => m.qualifies).reduce((a, b) => a + (b.estimatedHours || 0), 0) }));
      }
    } catch (err) { console.error(err); }
    setMediaLoading(false);
  }

  function exportCSV() {
    const rows = [
      ["LCSW Hours Audit — Yana Nackman", "", "Generated:", new Date().toLocaleDateString()], [""],
      ["CATEGORY", "HOURS", "BBS REQUIREMENT", "STATUS"],
      ["Clinical Hours (Section A)", totalClinical, "Min 2,000", totalClinical >= 2000 ? "MET" : "IN PROGRESS"],
      ["Face-to-Face Psychotherapy", H.ftf, "Min 750", H.ftf >= 750 ? "MET" : "IN PROGRESS"],
      ["Non-Clinical Hours (Section B)", totalNonClinical, "Max 1,000", totalNonClinical > 1000 ? "OVER MAX — REVIEW" : "OK"],
      ["  Supervision", H.supervision, "", ""], ["  Training / CE", H.training, "", ""],
      ["  Consultation", H.consultation, "", ""], ["  Advocacy", H.advocacy, "", ""],
      ["TOTAL HOURS", totalHours, "Min 3,000", totalHours >= 3000 ? "MET" : "IN PROGRESS"], [""],
      ["CALENDAR EVENTS"], ["Date", "Summary", "Category", "Hours"],
      ...calEvents.filter(e => e.category !== "other").map(ev => [ev.dtstart?.slice(0, 8) || "", ev.summary, CATEGORY_META[ev.category]?.label, ev.durationHrs]),
      [""], ["GMAIL EMAILS FOUND"], ["Date", "Subject", "Sender", "Type", "Hours"],
      ...gmailResults.map(r => [r.date, r.subject, r.sender, r.type, r.hours]),
      [""], ["MEDIA / CE ITEMS"], ["Title", "Type", "Qualifies", "Hours"],
      ...mediaItems.map(m => [m.title, m.type, m.qualifies ? "Yes" : "No", m.estimatedHours]),
    ];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "Yana_Nackman_LCSW_Hours.csv"; a.click();
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', 'Segoe UI', sans-serif", padding: 24 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `2px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ width: 46, height: 46, borderRadius: 10, background: C.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#fff", flexShrink: 0 }}>⚕</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>LCSW Hours Audit for Yana Nackman</h1>
            <div style={{ fontSize: 13, color: C.blue, fontWeight: 600, marginTop: 2 }}>California BBS · Associate Clinical Social Worker · Licensure Tracker</div>
          </div>
          <button onClick={exportCSV} style={{
            marginLeft: "auto", background: C.blue, border: "none", color: "#fff",
            borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 13, fontWeight: 700,
            boxShadow: `0 2px 8px ${C.blue}40`,
          }}>⬇ Export BBS Log</button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        <TabBtn label="Overview"     icon="📊" active={tab === "overview"} onClick={() => setTab("overview")} />
        <TabBtn label="Gmail"        icon="📧" active={tab === "gmail"}    onClick={() => setTab("gmail")}    badge={gmailResults.filter(r => r.type !== "error").length} />
        <TabBtn label="Calendar"     icon="📅" active={tab === "calendar"} onClick={() => setTab("calendar")} badge={calEvents.length} />
        <TabBtn label="Media / CE"   icon="🎧" active={tab === "media"}    onClick={() => setTab("media")}    badge={mediaItems.filter(m => m.qualifies).length} />
        <TabBtn label="Manual Entry" icon="✏️" active={tab === "manual"}   onClick={() => setTab("manual")} />
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div>
          {/* Hero */}
          <div style={{ background: C.blue, borderRadius: 16, padding: "26px 28px", marginBottom: 20, color: "#fff", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", boxShadow: `0 4px 20px ${C.blue}30` }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.7, marginBottom: 6 }}>Total Hours Documented</div>
              <div style={{ fontSize: 58, fontWeight: 900, letterSpacing: "-0.03em", fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
                {totalHours.toLocaleString()}
                <span style={{ fontSize: 22, fontWeight: 400, opacity: 0.55 }}> / 3,000</span>
              </div>
              <div style={{ marginTop: 14, maxWidth: 380 }}>
                <div style={{ height: 12, background: "rgba(255,255,255,0.2)", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, totalHours / 30)}%`, background: "#fff", borderRadius: 8, transition: "width 0.6s" }} />
                </div>
              </div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: 11, opacity: 0.65, fontWeight: 700, letterSpacing: "0.1em" }}>REMAINING</div>
              <div style={{ fontSize: 34, fontWeight: 800, fontFamily: "'DM Mono', monospace" }}>{Math.max(0, 3000 - totalHours).toLocaleString()}</div>
              <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>≈ {Math.ceil(Math.max(0, 3000 - totalHours) / 40)} weeks full-time</div>
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
            <StatCard label="Clinical Hours (Sec. A)"    value={totalClinical}    target={2000} color={C.blue}   note="Minimum 2,000 required" />
            <StatCard label="Face-to-Face Psychotherapy" value={H.ftf}            target={750}  color={C.red}    note="Min 750 within clinical" />
            <StatCard label="Non-Clinical Hours (Sec B)" value={totalNonClinical} target={1000} color={C.yellow} note="⚠ Max 1,000 allowed" inverse />
            <StatCard label="Est. Supervised Weeks"      value={weeksEst}         target={104}  color={C.green}  unit="wks" note="Minimum 104 weeks required" />
          </div>

          {/* Category breakdown */}
          <Card>
            <SectionLabel>Hour Breakdown by BBS Category</SectionLabel>
            {Object.entries(CATEGORY_META).filter(([k]) => k !== "other").map(([key, meta]) => {
              const val = H[key] || 0;
              const pct = Math.round((val / Math.max(totalHours, 1)) * 100);
              return (
                <div key={key} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{meta.label}</span>
                      <span style={{ fontSize: 11, color: C.muted, background: C.faint, padding: "1px 8px", borderRadius: 10, border: `1px solid ${C.border}` }}>{meta.bbs}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: meta.color, fontFamily: "'DM Mono', monospace" }}>{val} <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>hrs ({pct}%)</span></span>
                  </div>
                  <ProgressBar value={val} max={Math.max(totalHours, 1)} color={meta.color} />
                </div>
              );
            })}
          </Card>

          {/* Source status row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 14 }}>
            {[
              { label: "Gmail",    icon: "📧", info: `${gmailResults.filter(r => r.type !== "error").length} emails`,             active: gmailResults.length > 0 },
              { label: "Calendar", icon: "📅", info: `${calEvents.length} events`,                                                active: calEvents.length > 0 },
              { label: "Media",    icon: "🎧", info: `${mediaItems.filter(m => m.qualifies).length} qualifying`,                  active: mediaItems.length > 0 },
              { label: "Manual",   icon: "✏️", info: Object.values(manual).some(v => v) ? "Entries added" : "None yet",          active: Object.values(manual).some(v => v) },
            ].map(s => (
              <div key={s.label} style={{
                background: s.active ? C.blueSoft : C.surface, border: `1px solid ${s.active ? C.blue + "40" : C.border}`,
                borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.active ? C.blue : C.muted }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{s.info}</div>
                </div>
                <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: s.active ? C.green : C.border }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── GMAIL ── */}
      {tab === "gmail" && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <SectionLabel>Scan Gmail for Supervision Documentation</SectionLabel>
            <p style={{ fontSize: 13, color: C.muted, margin: "0 0 14px", lineHeight: 1.7 }}>
              Claude will search your Gmail for supervision confirmations, weekly logs, experience verification forms, 
              training certificates, and LCSW hour documentation — going back your full ASW period (2+ years).
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <input value={gmailQuery} onChange={e => setGmailQuery(e.target.value)}
                placeholder="Custom search query (or leave blank for auto)"
                style={{ flex: 1, background: C.faint, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 14px", color: C.text, fontSize: 13, outline: "none" }} />
              <button onClick={scanGmail} disabled={gmailLoading} style={{
                background: C.blue, border: "none", borderRadius: 8, padding: "9px 22px",
                color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13, minWidth: 110,
              }}>{gmailLoading ? "Scanning..." : "Scan Gmail"}</button>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
              Default searches: supervision · supervisor · LCSW · ASW · "weekly log" · "experience verification" · clinical hours
            </div>
          </Card>

          {gmailResults.length > 0 && (
            <div>
              <SectionLabel>{gmailResults.length} Email{gmailResults.length !== 1 ? "s" : ""} Found</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {gmailResults.map((r, i) => {
                  const meta = CATEGORY_META[r.type] || CATEGORY_META.other;
                  return (
                    <div key={i} style={{ background: meta.bg, border: `1.5px solid ${meta.color}30`, borderRadius: 10, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <span style={{ padding: "3px 10px", background: C.surface, color: meta.color, border: `1px solid ${meta.color}50`, borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", marginTop: 2 }}>{meta.label}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.subject}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{r.sender} · {r.date}</div>
                        {r.notes && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{r.notes}</div>}
                      </div>
                      {r.hasAttachment && <span style={{ fontSize: 11, color: C.yellow, fontWeight: 700 }}>📎 Attachment</span>}
                      {r.hours > 0 && <span style={{ fontSize: 14, fontWeight: 800, color: meta.color, fontFamily: "'DM Mono', monospace" }}>{r.hours}h</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CALENDAR ── */}
      {tab === "calendar" && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <SectionLabel>Upload Google Calendar Export</SectionLabel>
            <p style={{ fontSize: 13, color: C.muted, margin: "0 0 14px", lineHeight: 1.7 }}>
              Export from <strong style={{ color: C.text }}>calendar.google.com → Settings → Export</strong>. 
              Unzip the download and upload the <code style={{ background: C.faint, padding: "1px 6px", borderRadius: 4, border: `1px solid ${C.border}` }}>.ics</code> file. 
              Every event gets auto-categorized into BBS hour types.
            </p>
            <input ref={fileRef} type="file" accept=".ics" onChange={handleCalFile} style={{ display: "none" }} />
            <button onClick={() => fileRef.current.click()} style={{
              background: C.blueSoft, border: `1.5px solid ${C.blue}`, color: C.blue,
              borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 700,
            }}>{calLoading ? "Parsing..." : "📂 Upload .ics Calendar File"}</button>
          </Card>

          {calEvents.length > 0 && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))", gap: 8, marginBottom: 14 }}>
                {Object.entries(CATEGORY_META).filter(([k]) => k !== "other").map(([key, meta]) => {
                  const evs = calEvents.filter(e => e.category === key);
                  const hrs = evs.reduce((a, b) => a + b.durationHrs, 0);
                  return (
                    <div key={key} style={{ background: meta.bg, border: `1.5px solid ${meta.color}30`, borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: meta.color }}>{meta.label}</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: meta.color, fontFamily: "'DM Mono', monospace" }}>{hrs}h</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{evs.length} events</div>
                    </div>
                  );
                })}
              </div>
              <Card>
                <SectionLabel>{calEvents.filter(e => e.category !== "other").length} Categorized Events</SectionLabel>
                <div style={{ maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                  {calEvents.filter(e => e.category !== "other").map((ev, i) => {
                    const meta = CATEGORY_META[ev.category];
                    return (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "7px 10px", background: meta.bg, borderRadius: 7, fontSize: 13 }}>
                        <span style={{ color: C.muted, fontSize: 11, minWidth: 78 }}>{ev.dtstart?.slice(0, 8) || "—"}</span>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{ev.summary}</span>
                        <span style={{ fontSize: 11, padding: "2px 8px", background: C.surface, color: meta.color, border: `1px solid ${meta.color}40`, borderRadius: 10 }}>{meta.label}</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", color: meta.color, fontWeight: 700, minWidth: 28, textAlign: "right" }}>{ev.durationHrs}h</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ── MEDIA ── */}
      {tab === "media" && (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <SectionLabel>🎵 Spotify Podcast History</SectionLabel>
            <p style={{ fontSize: 13, color: C.muted, margin: "0 0 12px", lineHeight: 1.7 }}>
              Request your data at <strong style={{ color: C.text }}>spotify.com → Account → Privacy → Download Data</strong> (takes up to 30 days). 
              Upload the file named <code style={{ background: C.faint, padding: "1px 6px", borderRadius: 4, border: `1px solid ${C.border}` }}>StreamingHistory_podcast_0.json</code>.
            </p>
            <input ref={spotifyRef} type="file" accept=".json" onChange={handleSpotifyFile} style={{ display: "none" }} />
            <button onClick={() => spotifyRef.current.click()} style={{
              background: C.greenSoft, border: `1.5px solid ${C.green}`, color: C.green,
              borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700,
            }}>📂 Upload Spotify JSON</button>
            {spotifyData && !spotifyData.error && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: C.greenSoft, border: `1px solid ${C.green}40`, borderRadius: 8, fontSize: 13, color: C.green, fontWeight: 600 }}>
                ✓ Found {spotifyData.totalHrs} hours of psych-related listening across {spotifyData.items.length} episodes
              </div>
            )}
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <SectionLabel>🎧 Audible Books & Podcast Titles</SectionLabel>
            <p style={{ fontSize: 13, color: C.muted, margin: "0 0 12px", lineHeight: 1.7 }}>
              Paste Audible book titles and podcast show names. Claude AI identifies which qualify as CE under BBS 
              "Workshops, Seminars &amp; Training Sessions" — counted toward the 1,000 non-clinical hour cap.
              <br /><strong style={{ color: C.yellow }}>Tip:</strong> Include hours if known (e.g. "The Body Keeps the Score – 12 hrs").
            </p>
            <textarea value={mediaInput} onChange={e => setMediaInput(e.target.value)}
              placeholder={"One title per line:\n\nThe Body Keeps the Score – Bessel van der Kolk (12 hrs)\nTherapy Chat Podcast – Laura Reagan\nDBT Skills Training Manual – Marsha Linehan (8 hrs)\nHidden Brain – NPR\nFinding Our Way Podcast – Prentis Hemphill"}
              style={{ width: "100%", minHeight: 140, background: C.faint, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, color: C.text, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }} />
            <button onClick={analyzeMedia} disabled={mediaLoading || !mediaInput.trim()} style={{
              marginTop: 10, background: mediaInput.trim() ? C.yellow : C.faint,
              border: `1.5px solid ${mediaInput.trim() ? C.yellow : C.border}`,
              borderRadius: 8, padding: "9px 20px", color: mediaInput.trim() ? "#fff" : C.muted,
              fontWeight: 700, cursor: mediaInput.trim() ? "pointer" : "default", fontSize: 13,
            }}>{mediaLoading ? "Analyzing..." : "🤖 Analyze with Claude AI"}</button>
          </Card>

          {mediaItems.length > 0 && (
            <Card>
              <SectionLabel>{mediaItems.filter(m => m.qualifies).length} Qualifying · {mediaItems.filter(m => m.qualifies).reduce((a, b) => a + (b.estimatedHours || 0), 0)} Total Hours</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {mediaItems.map((item, i) => (
                  <div key={i} style={{
                    background: item.qualifies ? C.greenSoft : C.faint,
                    border: `1px solid ${item.qualifies ? C.green + "40" : C.border}`,
                    borderRadius: 10, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start",
                  }}>
                    <span style={{ fontSize: 18 }}>{item.type === "audiobook" ? "📖" : "🎙"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{item.notes}</div>
                      {item.qualifies && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>BBS: {item.bbsCategory}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: item.qualifies ? C.green : C.red }}>{item.qualifies ? "✓ Qualifies" : "✗ No"}</div>
                      {item.qualifies && <div style={{ fontSize: 15, fontWeight: 800, color: C.blue, fontFamily: "'DM Mono', monospace" }}>{item.estimatedHours}h</div>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── MANUAL ENTRY ── */}
      {tab === "manual" && (
        <div>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.7 }}>
            Add hours tracked elsewhere — these stack on top of auto-detected hours. Use for formally tracked clinical hours from your workplace system or any hours not captured by the other tools.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {Object.entries(CATEGORY_META).filter(([k]) => k !== "other").map(([key, meta]) => (
              <div key={key} style={{ background: C.surface, border: `1.5px solid ${meta.color}40`, borderRadius: 12, padding: 18, boxShadow: `0 1px 4px ${meta.color}10` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: meta.color, marginBottom: 2 }}>{meta.label}</div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>BBS: {meta.bbs}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="number" min="0" value={manual[key]}
                    onChange={e => setManual(m => ({ ...m, [key]: e.target.value }))}
                    placeholder="0"
                    style={{ width: 88, background: meta.bg, border: `1.5px solid ${meta.color}60`, borderRadius: 7, padding: "8px 12px", color: meta.color, fontSize: 22, fontFamily: "'DM Mono', monospace", fontWeight: 800, outline: "none" }} />
                  <span style={{ fontSize: 13, color: C.muted }}>hours</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: "14px 18px", background: C.yellowSoft, border: `1px solid ${C.yellow}50`, borderRadius: 10, fontSize: 12, color: C.muted, lineHeight: 1.8 }}>
            <strong style={{ color: C.yellow }}>⚠ BBS Documentation Reminder:</strong> All hours submitted to the BBS must be verified by your supervisor on official BBS Experience Verification forms and signed weekly logs. This tool helps you <em>discover and organize</em> your hours — supervisor signatures on official documents are still required before submission.
          </div>
        </div>
      )}
    </div>
  );
}
