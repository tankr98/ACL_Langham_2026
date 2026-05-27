import { useState, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Langham brand palette
// ---------------------------------------------------------------------------
const LANG_PINK       = "#E8839B";
const LANG_PINK_LIGHT = "#FAE8EE";
const LANG_PINK_MID   = "#F2A7BB";
const LANG_DARK       = "#2C2420";
const LANG_DARK2      = "#1A1210";
const LANG_MID        = "#6B5C52";
const LANG_GOLD       = "#B89A6A";
const LANG_IVORY      = "#FAF7F2";
const LANG_CREAM      = "#F5F0E8";
const LANG_BORDER     = "#EAE2D8";
const GO_GREEN        = "#2D7A5F";
const NO_RED          = "#C04A5E";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fmt$ = (v) => new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", maximumFractionDigits:0 }).format(v || 0);
const fmtPct = (v) => `${(v || 0).toFixed(1)}%`;

const dateRange = (start, end) => {
  const dates = [];
  const s = new Date(start + "T12:00:00");
  const e = new Date(end   + "T12:00:00");
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
};

const dayName = (dateStr) =>
  new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday:"long" });

const EVENT_TYPES = [
  "Gala / Banquet","Corporate Conference","Wedding",
  "Product Launch","Board Meeting","Social Reception","Hybrid Event",
];

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------
const EVENT_DEFAULTS = {
  eventName:       "Grand Gala Dinner",
  eventType:       "Gala / Banquet",
  startDate:       "2026-05-19",
  endDate:         "2026-05-21",
  isHoliday:       false,
  // Financials
  groupADR:        450,
  fbRevenue:       38000,
  avRevenue:       8500,
  miscRevenue:     3200,
  staffCost:       12000,
  fbCost:          15200,
  bundledCost:     21800,
  // Parking
  excessParking:   false,
  parkingDays:     1,
};

// ---------------------------------------------------------------------------
// UI Primitives
// ---------------------------------------------------------------------------
const SectionLabel = ({ children }) => (
  <div style={{ display:"flex", alignItems:"center", gap:12, margin:"26px 0 14px" }}>
    <span style={{ fontSize:11, letterSpacing:3, textTransform:"uppercase", color:LANG_PINK,
      fontFamily:"'Playfair Display',serif", fontWeight:600 }}>{children}</span>
    <div style={{ flex:1, height:1, background:`linear-gradient(to right,${LANG_PINK}60,transparent)` }} />
  </div>
);

const Field = ({ label, value, onChange, type="text", prefix, options, note, disabled }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
    <label style={{ fontSize:11, letterSpacing:1.5, textTransform:"uppercase", color:LANG_MID,
      fontFamily:"'Lato',sans-serif", fontWeight:600 }}>{label}</label>
    <div style={{ position:"relative" }}>
      {prefix && <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
        color:LANG_GOLD, fontSize:14, fontWeight:700 }}>{prefix}</span>}
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
          style={{ width:"100%", padding:"10px 13px", border:`1px solid ${LANG_BORDER}`, borderRadius:8,
            fontSize:14, color:LANG_DARK, background:"#fff", appearance:"none", cursor:"pointer",
            outline:"none", boxSizing:"border-box" }}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === "checkbox" ? (
        <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)}
          style={{ width:18, height:18, cursor:"pointer", accentColor:LANG_PINK }} />
      ) : (
        <input type={type} value={value} disabled={disabled}
          onChange={e => onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
          style={{ width:"100%", padding:prefix?"10px 13px 10px 28px":"10px 13px",
            border:`1px solid ${LANG_BORDER}`, borderRadius:8, fontSize:14, color:LANG_DARK,
            background: disabled ? LANG_CREAM : "#fff", boxSizing:"border-box", outline:"none" }} />
      )}
    </div>
    {note && <span style={{ fontSize:11, color:"#A09080" }}>{note}</span>}
  </div>
);

// ---------------------------------------------------------------------------
// Night-by-night room table (input)
// ---------------------------------------------------------------------------
const NightRoomTable = ({ dates, roomsMap, onRoomsChange, isHoliday }) => (
  <div style={{ border:`1px solid ${LANG_BORDER}`, borderRadius:10, overflow:"hidden" }}>
    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
      <thead>
        <tr style={{ background:LANG_CREAM }}>
          {["Date","Day","Holiday","Group Rooms Needed"].map(h => (
            <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11,
              letterSpacing:1.5, textTransform:"uppercase", color:LANG_MID, fontWeight:600,
              borderBottom:`1px solid ${LANG_BORDER}` }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dates.map((date, i) => (
          <tr key={date} style={{ background: i % 2 === 0 ? "#fff" : LANG_IVORY,
            borderBottom:`1px solid ${LANG_BORDER}` }}>
            <td style={{ padding:"10px 14px", color:LANG_DARK, fontWeight:600 }}>
              {new Date(date + "T12:00:00").toLocaleDateString("en-US",{month:"short", day:"numeric"})}
            </td>
            <td style={{ padding:"10px 14px", color:LANG_MID }}>{dayName(date)}</td>
            <td style={{ padding:"10px 14px", color:LANG_MID }}>{isHoliday ? "Yes" : "—"}</td>
            <td style={{ padding:"10px 14px" }}>
              <input type="number" value={roomsMap[date] ?? 10}
                onChange={e => onRoomsChange(date, parseFloat(e.target.value) || 0)}
                style={{ width:90, padding:"6px 10px", border:`1px solid ${LANG_BORDER}`,
                  borderRadius:6, fontSize:14, color:LANG_DARK, outline:"none",
                  fontFamily:"'Lato',sans-serif" }} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ---------------------------------------------------------------------------
// Model status badge
// ---------------------------------------------------------------------------
const ModelBadge = ({ status, metrics }) => {
  const cfg = {
    idle:    { bg:LANG_CREAM,    border:LANG_BORDER, dot:LANG_MID,  text:"Model ready — update inputs to run" },
    loading: { bg:"#FFF8E8",    border:LANG_GOLD,   dot:LANG_GOLD, text:"Running regression model…" },
    ready:   { bg:"#EAF5EF",    border:GO_GREEN,    dot:GO_GREEN,
      text: metrics
        ? `Model active · LCR R²=${metrics.lcr?.r2} · ADR R²=${metrics.adr?.r2} · F&B R²=${metrics.fnb?.r2}`
        : "Model active" },
    error:   { bg:"#FFF3E8",    border:LANG_GOLD,   dot:LANG_GOLD, text:"API unavailable — using historical benchmarks" },
  }[status] || {};

  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px",
      background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:8, marginBottom:14 }}>
      <div style={{ width:8, height:8, borderRadius:"50%", background:cfg.dot, flexShrink:0,
        animation: status === "loading" ? "pulse 1s ease-in-out infinite" : "none" }} />
      <span style={{ fontSize:12, letterSpacing:0.5, color:LANG_MID }}>{cfg.text}</span>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Nightly breakdown table (output)
// ---------------------------------------------------------------------------
const BreakdownTable = ({ nights, groupADR, fbRevenue, avRevenue, miscRevenue,
                          staffCost, fbCost, bundledCost, parkingCost }) => {
  if (!nights || nights.length === 0) return null;

  const n = nights.length;

  // Split financials proportionally by group_rooms
  const totalGroupRooms = nights.reduce((s, r) => s + r.group_rooms, 0);

  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, fontFamily:"'Lato',sans-serif" }}>
        <thead>
          <tr style={{ background:LANG_CREAM, borderBottom:`2px solid ${LANG_BORDER}` }}>
            {[
              "Date","Day","Holiday",
              "Pred. LCR","Pred. ADR","Pred. F&B/Night",
              "Est. Leisure Profit / Night",
              "Group Profit / Night",
              "Daily Displacement Value",
            ].map(h => (
              <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:11,
                letterSpacing:1.2, textTransform:"uppercase", color:LANG_MID, fontWeight:600,
                whiteSpace:"nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {nights.map((r, i) => {
            // Group Profit for this night (proportional by room count)
            const roomShare = totalGroupRooms > 0 ? r.group_rooms / totalGroupRooms : 1 / n;

            // Room revenue contribution this night
            const nightRoomRev = groupADR * r.group_rooms;
            // Apply proportional share of ancillary & costs
            const nightFB     = fbRevenue   * roomShare;
            const nightAV     = avRevenue   * roomShare;
            const nightMisc   = miscRevenue * roomShare;
            const nightStaff  = staffCost   * roomShare;
            const nightFBCost = fbCost      * roomShare;
            const nightBundled= bundledCost * roomShare;
            const nightParking= parkingCost * roomShare;

            // Formula: (GroupADR-150)*rooms + 0.2*F&B + AV + Misc - Staff - FBCost - Bundled - Parking
            const groupProfitNight =
              (groupADR - 150) * r.group_rooms +
              (0.2 * nightFB) +
              nightAV + nightMisc -
              nightStaff - nightFBCost - nightBundled - nightParking;

            // Est. Leisure Profit for this night (what the model says we'd earn)
            // = LCR * rooms * adj_rev_per_room  (already computed as night_contribution)
            const leisureProfitNight = r.night_contribution;

            // Daily Displacement Value = leisure profit - group profit
            const dailyDisp = leisureProfitNight - groupProfitNight;
            const dispColor = dailyDisp > 0 ? NO_RED : GO_GREEN;

            return (
              <tr key={i} style={{ borderBottom:`1px solid ${LANG_BORDER}`,
                background: i % 2 === 0 ? "#fff" : LANG_IVORY }}>
                <td style={{ padding:"11px 12px", color:LANG_DARK, fontWeight:600 }}>
                  {new Date(r.date + "T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}
                </td>
                <td style={{ padding:"11px 12px", color:LANG_MID }}>{r.day_of_week}</td>
                <td style={{ padding:"11px 12px", color:LANG_MID }}>{r.is_holiday ? "Yes" : "—"}</td>
                <td style={{ padding:"11px 12px", fontFamily:"'Playfair Display',serif",
                  fontWeight:700, color:LANG_DARK }}>{fmtPct(r.predicted_lcr * 100)}</td>
                <td style={{ padding:"11px 12px", fontFamily:"'Playfair Display',serif",
                  color:LANG_GOLD }}>{fmt$(r.predicted_adr)}</td>
                <td style={{ padding:"11px 12px", fontFamily:"'Playfair Display',serif",
                  color:LANG_GOLD }}>{fmt$(r.predicted_fnb)}</td>
                <td style={{ padding:"11px 12px", fontFamily:"'Playfair Display',serif",
                  fontWeight:700, color:NO_RED }}>{fmt$(leisureProfitNight)}</td>
                <td style={{ padding:"11px 12px", fontFamily:"'Playfair Display',serif",
                  fontWeight:700, color:LANG_DARK }}>{fmt$(groupProfitNight)}</td>
                <td style={{ padding:"11px 12px", fontFamily:"'Playfair Display',serif",
                  fontWeight:700, color:dispColor }}>
                  {dailyDisp > 0 ? "+" : ""}{fmt$(dailyDisp)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ background:LANG_CREAM, borderTop:`2px solid ${LANG_BORDER}` }}>
            <td colSpan={6} style={{ padding:"12px", fontSize:12, letterSpacing:1.5,
              textTransform:"uppercase", color:LANG_MID, fontWeight:700 }}>TOTALS</td>
            <td style={{ padding:"12px", fontFamily:"'Playfair Display',serif", fontWeight:700,
              color:NO_RED, fontSize:15 }}>
              {fmt$(nights.reduce((s, r) => s + r.night_contribution, 0))}
            </td>
            <td style={{ padding:"12px", fontFamily:"'Playfair Display',serif", fontWeight:700,
              color:LANG_DARK, fontSize:15 }}>—</td>
            <td style={{ padding:"12px", fontFamily:"'Playfair Display',serif", fontWeight:700,
              fontSize:15,
              color: nights.reduce((s,r)=>s+r.night_contribution,0) > 0 ? NO_RED : GO_GREEN }}>
              Net on breakdown
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function HotelProfitabilityTool() {
  const [event, setEvent]   = useState(EVENT_DEFAULTS);
  const [roomsMap, setRoomsMap] = useState({ "2026-05-19": 10, "2026-05-20": 15, "2026-05-21": 10 });
  const [tab, setTab]       = useState("decision");
  const [mounted, setMounted] = useState(false);

  const [modelStatus,  setModelStatus]  = useState("idle");
  const [modelResult,  setModelResult]  = useState(null);

  useEffect(() => { setMounted(true); }, []);

  const setE = k => v => setEvent(p => ({ ...p, [k]: v }));

  // ── Derive date list from startDate / endDate ──────────────────────────────
  const dates = (() => {
    try { return dateRange(event.startDate, event.endDate); }
    catch { return []; }
  })();

  // Keep roomsMap in sync when dates change (add new dates, preserve existing)
  useEffect(() => {
    setRoomsMap(prev => {
      const next = {};
      dates.forEach(d => { next[d] = prev[d] ?? 10; });
      return next;
    });
  }, [event.startDate, event.endDate]);

  // ── Financial calculations ─────────────────────────────────────────────────
  const totalGroupRooms = dates.reduce((s, d) => s + (roomsMap[d] ?? 10), 0);
  const roomRevenue     = event.groupADR * totalGroupRooms;
  const totalRevenue    = roomRevenue + event.fbRevenue + event.avRevenue + event.miscRevenue;
  const totalCosts      = event.staffCost + event.fbCost + event.bundledCost;
  const parkingCost     = event.excessParking ? event.parkingDays * 8000 : 0;

  // Group Profit = (GroupADR-150)*totalRoomNights + 0.2*F&B + AV + Misc - costs - parking
  const groupProfit =
    (event.groupADR - 150) * totalGroupRooms +
    (0.2 * event.fbRevenue) +
    event.avRevenue + event.miscRevenue -
    event.staffCost - event.fbCost - event.bundledCost -
    parkingCost;

  const eventMargin = totalRevenue > 0 ? (groupProfit / totalRevenue) * 100 : 0;
  const fbMargin    = event.fbRevenue > 0 ? ((event.fbRevenue - event.fbCost) / event.fbRevenue) * 100 : 0;

  // ── Build nights array for API call ───────────────────────────────────────
  const buildNights = useCallback(() =>
    dates.map(date => ({
      date,
      group_rooms: roomsMap[date] ?? 10,
      is_holiday:  event.isHoliday,
    })),
  [dates, roomsMap, event.isHoliday]);

  // ── Call regression API ───────────────────────────────────────────────────
  const runModel = useCallback(async () => {
    if (dates.length === 0) return;
    setModelStatus("loading");
    try {
      const res = await fetch("/api/displacement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nights:               buildNights(),
          group_profit:         groupProfit,
          excess_parking_days:  event.excessParking ? event.parkingDays : 0,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setModelResult(data);
      setModelStatus("ready");
    } catch (err) {
      // Fallback — flat historical benchmarks
      const FALLBACK = { lcr: 0.74, adr: 420, fnb: 85 };
      const nights = buildNights().map(n => {
        const adj = (FALLBACK.adr - 150) + (FALLBACK.fnb * 0.2);
        return {
          ...n,
          day_of_week:         dayName(n.date),
          predicted_lcr:       FALLBACK.lcr,
          predicted_adr:       FALLBACK.adr,
          predicted_fnb:       FALLBACK.fnb,
          adj_rev_per_room:    adj,
          night_contribution:  FALLBACK.lcr * n.group_rooms * adj,
        };
      });
      const totalDisp = nights.reduce((s, n) => s + n.night_contribution, 0);
      setModelResult({
        nights,
        total_displacement:    totalDisp,
        parking_cost:          parkingCost,
        adjusted_group_profit: groupProfit,
        displacement_value:    totalDisp - groupProfit,
        verdict:               totalDisp - groupProfit < 0 ? "Book the group" : "Decline the group",
        model_metrics:         null,
      });
      setModelStatus("error");
    }
  }, [buildNights, groupProfit, event.excessParking, event.parkingDays, dates.length, parkingCost]);

  // Auto-run on input changes (debounced)
  useEffect(() => {
    if (!mounted || dates.length === 0) return;
    const t = setTimeout(runModel, 700);
    return () => clearTimeout(t);
  }, [mounted, JSON.stringify(buildNights()), groupProfit, event.excessParking, event.parkingDays]);

  // ── Derived display values ─────────────────────────────────────────────────
  const totalDisplacement = modelResult?.total_displacement ?? 0;
  const dispValue         = modelResult?.displacement_value ?? 0;
  const isGo              = dispValue <= 0;
  const avgLCR = modelResult?.nights?.length
    ? modelResult.nights.reduce((s, n) => s + n.predicted_lcr, 0) / modelResult.nights.length : 0.74;

  if (!mounted) return null;

  return (
    <div style={{ minHeight:"100vh", background:LANG_IVORY, fontFamily:"'Lato',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background:"#FCEEF3", padding:"28px 52px", display:"flex", alignItems:"center",
        justifyContent:"space-between", borderBottom:`3px solid ${LANG_PINK}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:24 }}>
          <div style={{ width:4, height:48, background:`${LANG_DARK2}60`, borderRadius:99 }} />
          <div>
            <div style={{ fontSize:11, letterSpacing:5, color:`${LANG_DARK2}90`, textTransform:"uppercase",
              marginBottom:5, fontWeight:500 }}>Event Profitability + Displacement Suite</div>
            <div style={{ fontSize:28, fontFamily:"'Playfair Display',serif", fontWeight:600,
              color:LANG_DARK2, letterSpacing:3, textTransform:"uppercase" }}>The Langham, Pasadena</div>
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:11, color:`${LANG_DARK2}70`, letterSpacing:2, marginBottom:4, textTransform:"uppercase" }}>Analysis Date</div>
          <div style={{ fontSize:15, color:LANG_DARK2, fontFamily:"'Playfair Display',serif", fontWeight:500, fontStyle:"italic" }}>
            {new Date().toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:"#fff", borderBottom:`1px solid ${LANG_BORDER}`, padding:"0 52px", display:"flex" }}>
        {[["decision","Go / No-Go"],["breakdown","Nightly Breakdown"],["inputs","Inputs"]].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:"16px 26px", border:"none", background:"none", cursor:"pointer",
              fontSize:12, letterSpacing:2, textTransform:"uppercase", fontWeight:600,
              color:tab===t?LANG_DARK:LANG_MID,
              borderBottom:tab===t?`2px solid ${LANG_PINK}`:"2px solid transparent",
              transition:"all 0.2s" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding:"32px 52px", maxWidth:1240, margin:"0 auto" }}>

        {/* ===== GO / NO-GO TAB ===== */}
        {tab === "decision" && (
          <div style={{ maxWidth:780, margin:"0 auto", display:"flex", flexDirection:"column", gap:14 }}>
            <ModelBadge status={modelStatus} metrics={modelResult?.model_metrics} />

            {/* Hero verdict */}
            <div style={{ background:isGo?"#EAF5EF":"#FAEAED",
              border:`1.5px solid ${isGo?GO_GREEN:NO_RED}`, borderRadius:14,
              padding:"24px 28px", display:"flex", alignItems:"center", gap:20 }}>
              <div style={{ width:52, height:52, background:isGo?GO_GREEN:NO_RED, borderRadius:"50%",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:22, color:"#fff", flexShrink:0, fontWeight:700 }}>
                {isGo ? "✓" : "✕"}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:32, fontFamily:"'Playfair Display',serif", fontWeight:700,
                  color:isGo?"#1A3A28":"#3C1420", lineHeight:1 }}>{isGo ? "GO" : "NO-GO"}</div>
                <div style={{ fontSize:15, color:isGo?"#3A6A50":"#7A3040", marginTop:6, lineHeight:1.5 }}>
                  {isGo
                    ? "Group profit exceeds displaced leisure revenue — book the group."
                    : "Displaced leisure revenue exceeds group profit — decline the group."}
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize:34, fontFamily:"'Playfair Display',serif", fontWeight:700,
                  color:isGo?GO_GREEN:NO_RED }}>
                  {isGo ? "+" : ""}{fmt$(Math.abs(dispValue))}
                </div>
                <div style={{ fontSize:11, color:LANG_MID, marginTop:4, letterSpacing:1.5, textTransform:"uppercase" }}>
                  Net Displacement Value
                </div>
              </div>
            </div>

            {/* 3 metric cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
              {[
                { label:"Group Profit",          value:fmt$(groupProfit),          sub:`${dates.length} nights · ${totalGroupRooms} total rooms`, color:LANG_DARK },
                { label:"Total Leisure Displaced",value:fmt$(totalDisplacement),    sub:`${fmtPct(avgLCR*100)} avg LCR`, color:NO_RED },
                { label:"Displacement Value",     value:(isGo?"+":"")+fmt$(Math.abs(dispValue)),
                  sub:isGo?"Value accretive":"Value dilutive", color:isGo?GO_GREEN:NO_RED, outlined:true },
              ].map(({ label, value, sub, color, outlined }) => (
                <div key={label} style={{ background:"#fff",
                  border:`1.5px solid ${outlined?(isGo?GO_GREEN:NO_RED):LANG_BORDER}`,
                  borderRadius:12, padding:"20px 22px" }}>
                  <div style={{ fontSize:11, letterSpacing:2, textTransform:"uppercase",
                    color:LANG_MID, fontWeight:600, marginBottom:8 }}>{label}</div>
                  <div style={{ fontSize:30, fontFamily:"'Playfair Display',serif",
                    fontWeight:700, color, lineHeight:1 }}>{value}</div>
                  <div style={{ fontSize:13, color:LANG_MID, marginTop:6 }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Revenue bars */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {/* Event Revenue */}
              <div style={{ background:"#fff", border:`1px solid ${LANG_BORDER}`, borderRadius:12, padding:"22px 24px" }}>
                <div style={{ fontSize:11, letterSpacing:2, textTransform:"uppercase",
                  color:LANG_MID, fontWeight:600, marginBottom:18 }}>Event Revenue Streams</div>
                {[
                  { label:"Room Rev.", value:roomRevenue,       color:LANG_DARK },
                  { label:"F&B Rev.",  value:event.fbRevenue,   color:LANG_PINK },
                  { label:"AV / Tech", value:event.avRevenue,   color:"#7A9AB0" },
                  { label:"Misc.",     value:event.miscRevenue, color:LANG_GOLD },
                ].map(({ label, value, color }) => {
                  const pct = totalRevenue > 0 ? Math.min((value/totalRevenue)*100, 100) : 0;
                  return (
                    <div key={label} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:11 }}>
                      <span style={{ width:70, fontSize:13, color:LANG_MID, flexShrink:0 }}>{label}</span>
                      <div style={{ flex:1, height:8, background:LANG_CREAM, borderRadius:99, overflow:"hidden" }}>
                        <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:99, transition:"width 0.5s ease" }} />
                      </div>
                      <span style={{ width:62, textAlign:"right", fontSize:14,
                        fontFamily:"'Playfair Display',serif", fontWeight:700, color:LANG_DARK }}>{fmt$(value)}</span>
                    </div>
                  );
                })}
                <div style={{ borderTop:`1px solid ${LANG_BORDER}`, marginTop:12, paddingTop:12 }}>
                  {parkingCost > 0 && (
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:13, color:NO_RED }}>Parking Cost</span>
                      <span style={{ fontSize:14, fontFamily:"'Playfair Display',serif", fontWeight:700, color:NO_RED }}>−{fmt$(parkingCost)}</span>
                    </div>
                  )}
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:14, color:LANG_MID }}>Group Profit</span>
                    <span style={{ fontSize:16, fontFamily:"'Playfair Display',serif",
                      fontWeight:700, color:groupProfit>=0?GO_GREEN:NO_RED }}>{fmt$(groupProfit)}</span>
                  </div>
                </div>
              </div>

              {/* Leisure Displacement */}
              <div style={{ background:"#fff", border:`1px solid ${LANG_PINK}50`, borderRadius:12, padding:"22px 24px" }}>
                <div style={{ fontSize:11, letterSpacing:2, textTransform:"uppercase",
                  color:NO_RED, fontWeight:600, marginBottom:18 }}>Leisure Revenue Displaced</div>
                {modelResult?.nights && (() => {
                  const avgADR = modelResult.nights.reduce((s,n)=>s+n.predicted_adr,0)/modelResult.nights.length;
                  const avgFNB = modelResult.nights.reduce((s,n)=>s+n.predicted_fnb,0)/modelResult.nights.length;
                  const roomDisp = avgLCR * totalGroupRooms * (avgADR - 150);
                  const fnbDisp  = avgLCR * totalGroupRooms * avgFNB * 0.2;
                  return [
                    { label:"Room Rev.", value:roomDisp, color:NO_RED },
                    { label:"F&B Rev.",  value:fnbDisp,  color:"#D4713F" },
                  ].map(({ label, value, color }) => {
                    const pct = totalDisplacement > 0 ? Math.min((value/totalDisplacement)*100, 100) : 0;
                    return (
                      <div key={label} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:11 }}>
                        <span style={{ width:70, fontSize:13, color:LANG_MID, flexShrink:0 }}>{label}</span>
                        <div style={{ flex:1, height:8, background:LANG_CREAM, borderRadius:99, overflow:"hidden" }}>
                          <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:99, transition:"width 0.5s ease" }} />
                        </div>
                        <span style={{ width:62, textAlign:"right", fontSize:14,
                          fontFamily:"'Playfair Display',serif", fontWeight:700, color:LANG_DARK }}>{fmt$(value)}</span>
                      </div>
                    );
                  });
                })()}
                <div style={{ borderTop:`1px solid ${LANG_PINK}30`, marginTop:12, paddingTop:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ fontSize:14, color:LANG_MID }}>Total Displaced</span>
                    <span style={{ fontSize:16, fontFamily:"'Playfair Display',serif",
                      fontWeight:700, color:NO_RED }}>{fmt$(totalDisplacement)}</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:12, color:LANG_MID }}>Avg Predicted LCR</span>
                    <span style={{ fontSize:13, fontFamily:"'Playfair Display',serif", color:LANG_MID }}>{fmtPct(avgLCR*100)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* F&B margin pill */}
            <div style={{ background:"#fff", border:`1.5px solid ${fbMargin>=60?GO_GREEN:fbMargin>=40?LANG_GOLD:NO_RED}40`,
              borderRadius:12, padding:"18px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:12, letterSpacing:2, textTransform:"uppercase", color:LANG_MID, fontWeight:600 }}>F&B Margin</span>
              <span style={{ fontSize:28, fontFamily:"'Playfair Display',serif", fontWeight:700,
                color:fbMargin>=60?GO_GREEN:fbMargin>=40?LANG_GOLD:NO_RED }}>{fmtPct(fbMargin)}</span>
            </div>

            <div style={{ textAlign:"center", fontSize:12, color:LANG_MID, fontStyle:"italic", paddingBottom:4 }}>
              Note: Parking costs (if applicable) are deducted from Group Profit before the displacement calculation.
            </div>
          </div>
        )}

        {/* ===== NIGHTLY BREAKDOWN TAB ===== */}
        {tab === "breakdown" && (
          <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", flexDirection:"column", gap:14 }}>
            <ModelBadge status={modelStatus} metrics={modelResult?.model_metrics} />

            {/* Formula box */}
            <div style={{ background:"#fff", border:`1px solid ${LANG_BORDER}`, borderRadius:12, padding:"18px 24px" }}>
              <div style={{ fontSize:11, letterSpacing:2, textTransform:"uppercase",
                color:LANG_MID, fontWeight:600, marginBottom:10 }}>Formula Applied Each Night</div>
              <div style={{ fontFamily:"'Lato',sans-serif", fontSize:13, color:LANG_DARK, lineHeight:2 }}>
                <span style={{ color:NO_RED, fontWeight:600 }}>Est. Leisure Profit / Night</span>
                {" = Predicted LCR × Group Rooms × [(Pred. ADR − $150) + (Pred. F&B × 0.20)]"}
                <br />
                <span style={{ color:LANG_DARK, fontWeight:600 }}>Group Profit / Night</span>
                {" = (Group ADR − $150) × Rooms + (0.20 × F&B) + AV + Misc − Costs − Parking (proportional)"}
                <br />
                <span style={{ color:isGo?GO_GREEN:NO_RED, fontWeight:600 }}>Daily Displacement Value</span>
                {" = Est. Leisure Profit − Group Profit  |  "}
                <span style={{ color:NO_RED }}>Positive = Leisure wins</span>
                {" · "}
                <span style={{ color:GO_GREEN }}>Negative = Group wins</span>
              </div>
            </div>

            {modelStatus === "loading" && (
              <div style={{ textAlign:"center", padding:40, color:LANG_MID, fontStyle:"italic" }}>
                Running regression model across {dates.length} night{dates.length!==1?"s":""}…
              </div>
            )}

            {modelResult && (
              <BreakdownTable
                nights={modelResult.nights}
                groupADR={event.groupADR}
                fbRevenue={event.fbRevenue}
                avRevenue={event.avRevenue}
                miscRevenue={event.miscRevenue}
                staffCost={event.staffCost}
                fbCost={event.fbCost}
                bundledCost={event.bundledCost}
                parkingCost={parkingCost}
              />
            )}

            {/* Summary totals */}
            {modelResult && (
              <div style={{ background:"#fff", border:`1px solid ${LANG_BORDER}`, borderRadius:12, padding:"20px 24px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                  {[
                    { label:"Total Leisure Displaced", value:fmt$(modelResult.total_displacement), color:NO_RED },
                    { label:"Group Profit",            value:fmt$(groupProfit),                   color:LANG_DARK },
                    { label:"Parking Deduction",       value:parkingCost>0?`−${fmt$(parkingCost)}`:"None", color:parkingCost>0?NO_RED:LANG_MID },
                    { label:"Net Displacement Value",  value:(isGo?"+":"")+fmt$(Math.abs(dispValue)),
                      color:isGo?GO_GREEN:NO_RED },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div style={{ fontSize:11, letterSpacing:1.5, textTransform:"uppercase",
                        color:LANG_MID, fontWeight:600, marginBottom:6 }}>{label}</div>
                      <div style={{ fontSize:24, fontFamily:"'Playfair Display',serif",
                        fontWeight:700, color }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:14, padding:"12px 16px", background:isGo?"#EAF5EF":"#FAEAED",
                  borderRadius:8, fontSize:14, fontWeight:600,
                  color:isGo?"#1A3A28":"#3C1420", textAlign:"center" }}>
                  Verdict: {modelResult.verdict}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== INPUTS TAB ===== */}
        {tab === "inputs" && (
          <div style={{ maxWidth:600, margin:"0 auto" }}>
            <div style={{ background:"#fff", border:`1px solid ${LANG_BORDER}`, borderRadius:14, padding:"30px 34px" }}>

              <SectionLabel>Event Details</SectionLabel>
              <div style={{ display:"grid", gap:12 }}>
                <Field label="Event Name"  value={event.eventName} onChange={setE("eventName")} />
                <Field label="Event Type"  value={event.eventType} onChange={setE("eventType")} options={EVENT_TYPES} />
              </div>

              <SectionLabel>Booking Dates</SectionLabel>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <Field label="Start Date" value={event.startDate} onChange={setE("startDate")} type="date" />
                <Field label="End Date"   value={event.endDate}   onChange={setE("endDate")}   type="date" />
              </div>
              <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:10 }}>
                <Field label="Holiday Period?" value={event.isHoliday} onChange={setE("isHoliday")} type="checkbox" />
                <span style={{ fontSize:13, color:LANG_MID, paddingTop:2 }}>Check if dates fall within a hotel holiday period</span>
              </div>

              <SectionLabel>Rooms Needed per Night</SectionLabel>
              {dates.length === 0 ? (
                <div style={{ fontSize:13, color:LANG_MID, fontStyle:"italic" }}>Enter valid start and end dates above.</div>
              ) : (
                <NightRoomTable
                  dates={dates}
                  roomsMap={roomsMap}
                  onRoomsChange={(date, val) => setRoomsMap(p => ({ ...p, [date]: val }))}
                  isHoliday={event.isHoliday}
                />
              )}

              <SectionLabel>Group Financials</SectionLabel>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <Field label="Group ADR (per room/night)" value={event.groupADR} onChange={setE("groupADR")} type="number" prefix="$"
                  note="Used in group profit calc: (ADR−$150)×rooms" />
                <Field label="Total F&B Revenue" value={event.fbRevenue} onChange={setE("fbRevenue")} type="number" prefix="$" />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:12 }}>
                <Field label="AV / Tech Revenue"  value={event.avRevenue}   onChange={setE("avRevenue")}   type="number" prefix="$" />
                <Field label="Misc. Revenue"       value={event.miscRevenue} onChange={setE("miscRevenue")} type="number" prefix="$" />
              </div>

              <SectionLabel>Direct Costs</SectionLabel>
              <div style={{ display:"grid", gap:12 }}>
                <Field label="Staff & Labor"            value={event.staffCost}   onChange={setE("staffCost")}   type="number" prefix="$" />
                <Field label="F&B Cost"                 value={event.fbCost}      onChange={setE("fbCost")}      type="number" prefix="$" />
                <Field label="AV / Rooming / Setup / OH" value={event.bundledCost} onChange={setE("bundledCost")} type="number" prefix="$" />
              </div>

              <SectionLabel>Parking</SectionLabel>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <Field label="Excess Parking Required?" value={event.excessParking} onChange={setE("excessParking")} type="checkbox" />
                <span style={{ fontSize:13, color:LANG_MID, paddingTop:2 }}>$8,000 per day deducted from group profit</span>
              </div>
              {event.excessParking && (
                <div style={{ marginTop:12, maxWidth:200 }}>
                  <Field label="Number of Parking Days" value={event.parkingDays} onChange={setE("parkingDays")} type="number"
                    note={`Total deduction: ${fmt$(event.parkingDays * 8000)}`} />
                </div>
              )}

              {/* Profit preview */}
              <div style={{ marginTop:22, padding:"16px 18px", background:LANG_PINK_LIGHT,
                borderRadius:10, fontSize:13, color:LANG_MID, lineHeight:1.8 }}>
                <div style={{ fontWeight:700, color:LANG_DARK, marginBottom:4 }}>Calculated Group Profit Preview</div>
                <div>(Group ADR − $150) × {totalGroupRooms} rooms = {fmt$((event.groupADR-150)*totalGroupRooms)}</div>
                <div>+ 20% F&B = {fmt$(0.2*event.fbRevenue)}</div>
                <div>+ AV + Misc = {fmt$(event.avRevenue+event.miscRevenue)}</div>
                <div>− Costs = {fmt$(event.staffCost+event.fbCost+event.bundledCost)}</div>
                {parkingCost > 0 && <div>− Parking = {fmt$(parkingCost)}</div>}
                <div style={{ borderTop:`1px solid ${LANG_BORDER}`, marginTop:6, paddingTop:6,
                  fontWeight:700, color:groupProfit>=0?GO_GREEN:NO_RED }}>
                  = {fmt$(groupProfit)}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign:"center", padding:"28px", color:`${LANG_PINK}50`, fontSize:12,
        letterSpacing:3, fontFamily:"'Playfair Display',serif", fontStyle:"italic", textTransform:"uppercase" }}>
        The Langham, Pasadena · Event Profitability + Displacement Suite · Confidential
      </div>
    </div>
  );
}
