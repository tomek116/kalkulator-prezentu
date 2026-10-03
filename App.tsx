import { useState, useRef, useEffect, useCallback } from "react";

type Screen = "start" | "closeness" | "naughtynice" | "budget" | "result" | "final";
type Budget = "cute" | "sephora" | "invested" | "debt";

interface Selections {
  closeness: string;
  naughtynice: number;
  budget: Budget | null;
}

// ─── Music ────────────────────────────────────────────────────────────────────
const F = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0 };
const BEAT = 60 / 158;
const JINGLE: [number, number][] = [
  [F.E4, 1], [F.E4, 1], [F.E4, 2],
  [F.E4, 1], [F.E4, 1], [F.E4, 2],
  [F.E4, 1], [F.G4, 1], [F.C4, 1.5], [F.D4, 0.5], [F.E4, 4],
  [F.F4, 1], [F.F4, 1], [F.F4, 1.5], [F.F4, 0.5],
  [F.F4, 1], [F.E4, 1], [F.E4, 1], [F.E4, 1],
  [F.G4, 1], [F.G4, 1], [F.F4, 1], [F.D4, 1], [F.C4, 4],
];
const LOOP_SECS = JINGLE.reduce((s, [, d]) => s + d, 0) * BEAT;

function note(ctx: AudioContext, freq: number, t: number, dur: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g);
  g.connect(ctx.destination);
  osc.type = "triangle";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.001, t);
  g.gain.linearRampToValueAtTime(0.14, t + 0.04);
  g.gain.linearRampToValueAtTime(0.08, t + dur * 0.65);
  g.gain.linearRampToValueAtTime(0.001, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function useMusic() {
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const tmRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveRef = useRef(false);

  const scheduleLoop = useCallback((ctx: AudioContext, startAt: number) => {
    if (!liveRef.current) return;
    let t = startAt;
    for (const [freq, dur] of JINGLE) {
      note(ctx, freq, t, dur * BEAT * 0.86);
      t += dur * BEAT;
    }
    const wait = (startAt + LOOP_SECS - 0.45 - ctx.currentTime) * 1000;
    tmRef.current = setTimeout(() => {
      if (liveRef.current && ctxRef.current) scheduleLoop(ctxRef.current, startAt + LOOP_SECS);
    }, Math.max(0, wait));
  }, []);

  const toggle = useCallback(() => {
    if (playing) {
      liveRef.current = false;
      setPlaying(false);
      if (tmRef.current) clearTimeout(tmRef.current);
      ctxRef.current?.close();
      ctxRef.current = null;
    } else {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      ctxRef.current = ctx;
      liveRef.current = true;
      setPlaying(true);
      scheduleLoop(ctx, ctx.currentTime + 0.12);
    }
  }, [playing, scheduleLoop]);

  useEffect(() => () => {
    liveRef.current = false;
    if (tmRef.current) clearTimeout(tmRef.current);
    ctxRef.current?.close();
  }, []);

  return { playing, toggle };
}

// ─── Snow ─────────────────────────────────────────────────────────────────────
const SNOW = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: ((i * 39 + 11) % 96) + 2,
  size: [10, 14, 18, 12, 16, 9][i % 6],
  dur: [9, 11, 7.5, 13, 8.5, 10.5][i % 6],
  delay: -((i * 1.9) % 15),
  char: ["❄", "❅", "❆"][i % 3],
  opacity: [0.6, 0.35, 0.5, 0.45, 0.7, 0.4][i % 6],
}));

// ─── Naughty/Nice scale ───────────────────────────────────────────────────────
const SCALE: Record<number, { emoji: string; label: string; sub: string; fill: string }> = {
  1: { emoji: "🪨", label: "Węgiel owinięty węglem", sub: "Mikołaj wyjechał z kraju, dosłownie", fill: "#F87171" },
  2: { emoji: "🧦", label: "Skarpeta trochę za lekka", sub: "Pani Mikołajowa złożyła oficjalny raport", fill: "#FCA5A5" },
  3: { emoji: "🦌", label: "Elfy trwają w debacie", sub: "Rudolph postanowił zachować neutralność", fill: "#FFD700" },
  4: { emoji: "🎁", label: "Solidnie na liście Grzecznych", sub: "kilka incydentów, ale Mikołaj wybacza", fill: "#86EFAC" },
  5: { emoji: "🎅", label: "Właściwie to sam Mikołaj", sub: "Biegun Północny wzywa cię do domu", fill: "#4ADE80" },
};

// ─── Gift results ─────────────────────────────────────────────────────────────
const RESULTS: Record<Budget, { items: string[]; verdict: string; emoji: string }> = {
  cute: {
    items: ["Świeczka zapachowa", "Etui do iphona 15", "Karta podarunkowa Action", "Wkłady do Instaxa","Sztuczne kwiatki do dekoracji", "Maseczki do twarzy", "Cute spinki do włosów", "Odlewki perfum (np. Chanel Chance, Prada Milano)", "Karta podarunkowa Rituals", "Karta podarunkowa Rossmann","Akcesoria z Hello Kitty","Kapcie Hello Kitty", "Etui na słuchawki","Gniotki","Dekoracje do pokoju", "Czekoladki Toffifee lub kinderki"],
    verdict: "Małe, ale cieszy najbardziej (i portfel nie płacze)",
    emoji: "🎁",
  },
  sephora: {
    items: ["Zestaw kosmetyków z Ritualsa (Ayurveda,Sakura)","Głośniki do komputera", "Kamerka do komputara", "Karta podarunkowa House lub Cropp","Zestaw do robienia brasoletek","Koreański SPF(np. Skin1004,Skin79, Holika Holika)","Szlafrok biały lub hello kitty", "Karta podarunkowa Starbucks","Portfel skórzany damski", "Bidon (chodzi mi o taki typu stanley)", "Naszyjnik lub pierścionek srebrny","Nowa gra Minecraft Dungeons 2","Robuxy", "Kocyk w kolorze Jelenia (deer blanket w google trzeba wpisać)","Kocyk Hello Kitty", "Airtag","Mini Lodówka do pokoju", "Pieniążki na sheina i Temu (w ostateczności)"],
    verdict: "Złoty środek: ani za skromnie, ani na bogato",
    emoji: "✨",
  },
  invested: {
    items: ["Torebka jakaś ładna czarna","Monitor do komputera", "Róż Rare Beauty (Odcień Hope lub Happy)","Dior paleta rozświetlaczy do makijażu","Puder do twarzy Huda Beauty (kolor pound cake)", "Karta podarunkowa Sephora","Stanik (np. Victoria Secret, Tezenis, H&M)", "Bransoletka na charmsy z pandory","Zegarek tarczowy","Voucher na wyjatkowyprezent.pl", "Aparat cyfrowy/Kamera jakaś dobra (np. Canon)"],
    verdict: "Pełen profesjonalizm, Mikołaj ma dziś dobry dzień",
    emoji: "🎯",
  },
  debt: {
    items: ["Dyson Airwrap", "Buty jakieś ładne", "Wyjazd za granice","Victoria Secret Piżama","Test Dna sprawdzający damską linie (familytreedna.com)", "Pełnowymiarowy perfum (np. Chanel Chance, Prada Milano, Billie Eilish, YSL)","Biżuteria z Apart", "Gramofon i płyty winylowe", "Karta podarunkowa do konkretnej galerii handlowej", "Ipad","Apple Watch","Nintendo Switch","PS5", "Oculus Quest 3 lub 3S"],
    verdict: "Mikołaj właśnie sprawdził stan konta i spanikował",
    emoji: "👑",
  },
};

// ─── Reusable components ──────────────────────────────────────────────────────
function Dots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-2 justify-center mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="rounded-full transition-all duration-300"
          style={{ width: i === current ? 24 : 8, height: 8, background: i <= current ? "#FFD700" : "rgba(255,255,255,0.22)" }} />
      ))}
    </div>
  );
}

function Opt({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-4 px-6 rounded-full text-white text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.97]"
      style={{
        background: "rgba(255,255,255,0.1)",
        border: "1.5px solid rgba(255,255,255,0.2)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 600,
        fontSize: 15,
        cursor: "pointer",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#E8192C"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; }}
    >
      {label}
    </button>
  );
}

function NaughtySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const info = SCALE[value];
  const pct = ((value - 1) / 4) * 100;
  const shortLabels = ["Węgiel\nna węglu", "Skarpeta\nza lekka", "Elfy\ndebatują", "Lista\ngrzecznych", "Właściwie\nMikołaj"];

  return (
    <div>
      <style>{`
        .xsl { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 9999px; outline: none; cursor: pointer; }
        .xsl::-webkit-slider-thumb { -webkit-appearance: none; width: 30px; height: 30px; border-radius: 50%; background: white; cursor: pointer; box-shadow: 0 2px 12px rgba(0,0,0,0.35); }
        .xsl::-moz-range-thumb { width: 30px; height: 30px; border-radius: 50%; background: white; cursor: pointer; border: none; box-shadow: 0 2px 12px rgba(0,0,0,0.35); }
        .scale-card { animation: scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes scaleIn { from { transform: scale(0.88); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>

      <div key={value} className="scale-card text-center mb-5 py-5 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.09)", border: "1.5px solid rgba(255,255,255,0.15)" }}
      >
        <div style={{ fontSize: 38 }}>{info.emoji}</div>
        <div style={{ color: "white", fontWeight: 800, fontSize: 19, marginTop: 8, lineHeight: 1.2 }}>{info.label}</div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>{info.sub}</div>
      </div>

      <div className="mb-2">
        <input
          type="range" min={1} max={5} step={1} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="xsl"
          style={{ background: `linear-gradient(to right, ${info.fill} ${pct}%, rgba(255,255,255,0.18) ${pct}%)` }}
        />
      </div>

      <div className="flex" style={{ padding: "0 2px" }}>
        {[1, 2, 3, 4, 5].map((v, i) => (
          <button key={v} onClick={() => onChange(v)}
            style={{ flex: 1, background: "none", border: "none", cursor: "pointer", textAlign: "center", padding: "2px 0" }}
          >
            <div style={{ color: v === value ? "#FFD700" : "rgba(255,255,255,0.38)", fontWeight: v === value ? 800 : 500, fontSize: 13, transition: "color 0.15s" }}>
              {v}
            </div>
            <div style={{ color: v === value ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.28)", fontSize: 9, lineHeight: 1.3, whiteSpace: "pre-line", transition: "color 0.15s" }}>
              {shortLabels[i]}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [selections, setSelections] = useState<Selections>({ closeness: "", naughtynice: 3, budget: null });
  const [sliderVal, setSliderVal] = useState(3);
  const [checked, setChecked] = useState(false);
  const [sent, setSent] = useState(false);
  const { playing, toggle } = useMusic();

  const go = (next: Screen, sel?: Partial<Selections>) => {
    if (sel) setSelections(s => ({ ...s, ...sel }));
    setScreen(next);
  };

  const result = selections.budget ? RESULTS[selections.budget] : null;
  const stepOf: Partial<Record<Screen, number>> = { closeness: 0, naughtynice: 1, budget: 2 };
  const currentStep = stepOf[screen] ?? -1;

  return (
    <div className="min-h-screen w-full relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0B3321 0%, #0D4228 50%, #0A2E1C 100%)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <style>{`
        @keyframes snowfall {
          0% { transform: translateY(-30px) rotate(0deg); opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 0.5; }
          100% { transform: translateY(108vh) rotate(540deg); opacity: 0; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.4); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-star {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
        @keyframes slide-in {
          from { transform: translateX(55px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fade-scale-in {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .screen-enter { animation: slide-in 0.3s ease-out both; }
        .fade-scale { animation: fade-scale-in 0.25s ease-out both; }
        .btn-primary { transition: background 0.15s, transform 0.1s, color 0.15s; }
        .btn-primary:hover { background: #E8192C !important; color: #ffffff !important; transform: scale(1.04); }
        .btn-primary:active { transform: scale(0.96); }
        .btn-confirm { transition: background 0.15s, transform 0.1s, color 0.15s; }
        .btn-confirm:hover { background: #E8192C !important; color: #ffffff !important; transform: scale(1.03); }
        .btn-confirm:active { transform: scale(0.97); }
      `}</style>

      {/* Snowflakes */}
      {SNOW.map(s => (
        <div key={s.id} style={{
          position: "fixed", top: 0, left: `${s.left}%`,
          fontSize: s.size, opacity: s.opacity, color: "white",
          animation: `snowfall ${s.dur}s linear ${s.delay}s infinite`,
          pointerEvents: "none", userSelect: "none", zIndex: 0,
        }}>
          {s.char}
        </div>
      ))}

      {/* Twinkling bg lights */}
      {[...Array(12)].map((_, i) => (
        <div key={i} style={{
          position: "fixed",
          left: `${((i * 83) % 97) + 1.5}%`,
          top: `${((i * 61 + 20) % 85) + 5}%`,
          width: 4, height: 4, borderRadius: "50%",
          background: ["#E8192C", "#FFD700", "#4ADE80", "#ffffff"][i % 4],
          animation: `twinkle ${2 + (i % 3)}s ease-in-out ${(i * 0.4) % 2.5}s infinite`,
          pointerEvents: "none", zIndex: 0,
        }} />
      ))}

      {/* Music toggle */}
      <button
        onClick={toggle}
        style={{
          position: "fixed", top: 18, right: 18, zIndex: 50,
          background: playing ? "#E8192C" : "rgba(255,255,255,0.12)",
          border: "1.5px solid rgba(255,255,255,0.25)",
          borderRadius: 999, padding: "8px 14px",
          color: "white", fontSize: 13, fontWeight: 700,
          cursor: "pointer", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", gap: 6,
          transition: "background 0.15s, transform 0.1s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
      >
        {playing ? <>🔊 <span style={{ fontSize: 11 }}>Dzwonki</span></> : <>🔇 <span style={{ fontSize: 11 }}>Dzwonki</span></>}
      </button>

      {/* Main content */}
      <div className="w-full max-w-sm mx-auto px-5 py-10 min-h-screen flex flex-col justify-center relative" style={{ zIndex: 1 }}>

        {/* ── START ─────────────────────────────────────────────────────── */}
        {screen === "start" && (
          <div key="start" className="screen-enter text-center">
            <div className="relative flex items-center justify-center mb-5" style={{ height: 130 }}>
              <div style={{ position: "absolute", width: 120, height: 120, animation: "spin-slow 20s linear infinite" }}>
                <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M60 4l4.5 14.5L77 8l-6.5 14L86 19l-12 10 15 4.5-15 4.5 12 10-14.5-3L77 60l-12.5-8.5L60 66l-4.5-14.5L43 60l6.5-14L34 49l12-10-15-4.5 15-4.5-12-10 14.5 3L43 8z" fill="#4ADE80" opacity="0.7" />
                  <circle cx="60" cy="60" r="54" stroke="#E8192C" strokeWidth="3" strokeDasharray="8 6" opacity="0.5" />
                  {[0, 60, 120, 180, 240, 300].map((deg, i) => {
                    const rad = (deg * Math.PI) / 180;
                    const x = 60 + 54 * Math.cos(rad);
                    const y = 60 + 54 * Math.sin(rad);
                    return <circle key={i} cx={x} cy={y} r="5" fill={["#E8192C", "#FFD700", "#4ADE80"][i % 3]} />;
                  })}
                </svg>
              </div>
              <div style={{ fontSize: 52, position: "relative", zIndex: 1 }}>🎄</div>
              <div style={{
                position: "absolute", top: 2, right: "calc(50% - 68px)",
                background: "#E8192C", color: "white",
                fontWeight: 900, fontSize: 12, borderRadius: 999,
                padding: "3px 10px", boxShadow: "0 2px 0 rgba(0,0,0,0.2)", zIndex: 2,
                letterSpacing: "0.02em", animation: "float 2.2s ease-in-out infinite",
              }}>
                HO HO HO!
              </div>
              <div style={{ position: "absolute", top: 6, left: "calc(50% - 68px)", fontSize: 20, zIndex: 2, animation: "pulse-star 1.6s ease-in-out infinite" }}>
                ⭐
              </div>
            </div>

            <div className="mb-1">
              <div style={{ fontFamily: "'Mountains of Christmas', cursive", fontWeight: 700, fontSize: 58, lineHeight: 1.0, letterSpacing: "0.01em", color: "#ffffff", textShadow: "0 2px 18px rgba(255,255,255,0.2)" }}>
                Świąteczny Kalkulator Prezentów 
              </div>
              <div style={{ fontFamily: "'Mountains of Christmas', cursive", fontWeight: 700, fontSize: 58, lineHeight: 1.0, letterSpacing: "0.01em", color: "#D42B2B", textShadow: "0 2px 20px rgba(200,40,40,0.45)" }}>
                dla Alex
              </div>
              <div style={{ fontFamily: "'Mountains of Christmas', cursive", fontWeight: 700, fontSize: 32, lineHeight: 1.15, letterSpacing: "0.02em", color: "#4ADE80", textShadow: "0 1px 14px rgba(74,222,128,0.4)" }}>
                Sprawdź jaki prezent dla mnie kupić
              </div>
            </div>

            <div className="flex justify-center mt-4 mb-8">
              <span style={{ background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.25)", color: "white", borderRadius: 999, padding: "7px 18px", fontSize: 13, fontWeight: 600, letterSpacing: "0.01em" }}>
                To tylko luźne inspiracje, a nie lista życzeń z sądu! 😉
              </span>
            </div>

            <button
              className="btn-primary w-full py-4 rounded-full text-center"
              onClick={() => go("closeness")}
              style={{ background: "#ffffff", color: "#0B3321", fontWeight: 800, fontSize: 17, letterSpacing: "-0.01em", border: "none", cursor: "pointer" }}
            >
              Zaczynamy →
            </button>
            <p className="mt-4" style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
              Wyniki są prawnie wiążące. 🎄
            </p>
          </div>
        )}

        {/* ── CLOSENESS ────────────────────────────────────────────────── */}
        {screen === "closeness" && (
          <div key="closeness" className="screen-enter">
            <Dots current={0} total={3} />
            <h2 className="text-white mb-2" style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>
              Jak blisko jesteśmy, naprawdę?
            </h2>
            <p className="mb-6" style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
              Bądź szczery. Mikołaj patrzy i ja też.
            </p>
            <div className="flex flex-col gap-3">
              {[
                "Najbliższa rodzina 🎄",
                "Najlepszy przyjaciel 🦌",
                "Znajomy ⛄",
                "Ktoś, kto lajkuje moje stories 🔔",
                "Osoba, która zapomniałam w zeszłym roku 🪨",
              ].map(label => (
                <Opt key={label} label={label} onClick={() => go("naughtynice", { closeness: label })} />
              ))}
            </div>
          </div>
        )}

        {/* ── NAUGHTY / NICE ────────────────────────────────────────────── */}
        {screen === "naughtynice" && (
          <div key="naughtynice" className="screen-enter">
            <Dots current={1} total={3} />
            <h2 className="text-white mb-1" style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2 }}>
              W skali 1–5, jak grzeczny lub niegrzeczny byłeś dla mnie w tym roku?
            </h2>
            <p className="mb-5" style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
              1 = wiesz co zrobiłeś. 5 = właściwie Mikołaj.
            </p>
            <NaughtySlider value={sliderVal} onChange={setSliderVal} />
            <button
              className="btn-confirm w-full py-4 rounded-full mt-6"
              onClick={() => go("budget", { naughtynice: sliderVal })}
              style={{ background: "#ffffff", color: "#0B3321", fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer" }}
            >
              Zatwierdź →
            </button>
          </div>
        )}

        {/* ── BUDGET ────────────────────────────────────────────────────── */}
        {screen === "budget" && (
          <div key="budget" className="screen-enter">
            <Dots current={2} total={3} />
            <h2 className="text-white mb-2" style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>
              A budżet?
            </h2>
            <p className="mb-6" style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
              To jest chwila prawdy. 🎁
            </p>
            <div className="flex flex-col gap-3">
              {([
                ["cute", "Skromny prezencik"],
                ["sephora", "Stać mnie na coś większego"],
                ["invested", "Mam dużoo pieniędzy"],
                ["debt", "Jestem drugim Elonem Muskiem!!!"],
              ] as [Budget, string][]).map(([key, label]) => (
                <Opt key={key} label={label} onClick={() => go("result", { budget: key })} />
              ))}
            </div>
          </div>
        )}

        {/* ── RESULT ────────────────────────────────────────────────────── */}
        {screen === "result" && result && (
          <div key="result" className="screen-enter">
            <div className="rounded-3xl p-7 mb-5" style={{ background: "white" }}>
              <p style={{ color: "#E8192C", fontWeight: 700, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
                Twój przypisany prezent to…
              </p>
              <div style={{ fontSize: 40, marginBottom: 16 }}>{result.emoji}</div>
              <ul className="space-y-2 mb-6">
                {result.items.map(item => (
                  <li key={item} className="flex items-center gap-2" style={{ color: "#0f0a0a", fontWeight: 600, fontSize: 15 }}>
                    <span className="inline-block rounded-full flex-shrink-0" style={{ width: 8, height: 8, background: "#E8192C" }} />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="rounded-2xl px-4 py-3" style={{ background: "#F0FFF4", borderLeft: "3px solid #4ADE80" }}>
                <p style={{ color: "#0f0a0a", fontWeight: 700, fontSize: 14, fontStyle: "italic" }}>
                  "{result.verdict}"
                </p>
              </div>
            </div>
            <button
              className="btn-confirm w-full py-4 rounded-full text-center"
              onClick={() => go("final")}
              style={{ background: "#ffffff", color: "#0B3321", fontWeight: 700, fontSize: 16, border: "none", cursor: "pointer" }}
            >
              Akceptuję swój los →
            </button>
          </div>
        )}

        {/* ── FINAL ─────────────────────────────────────────────────────── */}
        {screen === "final" && (
          <div key="final" className="screen-enter text-center">
            <div className="flex justify-center gap-4 mb-4">
              {["🎁", "🦌", "⭐"].map((e, i) => (
                <div key={e} style={{ fontSize: 30, animation: `float ${1.8 + i * 0.3}s ease-in-out ${i * 0.4}s infinite` }}>
                  {e}
                </div>
              ))}
            </div>

            <h2 className="text-white mb-1" style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>
              Twój prezent został przypisany.
            </h2>
            <p className="mb-7" style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>
              Elfy mają listę. Nie ma odwrotu. 🎅
            </p>

            <div className="rounded-2xl p-5 mb-6 text-left"
              style={{ background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.22)" }}
            >
              <label className="flex items-start gap-3 cursor-pointer" onClick={() => setChecked(c => !c)}>
                <div className="flex-shrink-0 rounded-md transition-all duration-200 flex items-center justify-center"
                  style={{ width: 22, height: 22, marginTop: 1, background: checked ? "#FFD700" : "rgba(255,255,255,0.18)", border: checked ? "none" : "2px solid rgba(255,255,255,0.4)" }}
                >
                  {checked && (
                    <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                      <path d="M1.5 5L5 8.5L11.5 1.5" stroke="#0B3321" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={{ color: "white", fontWeight: 600, fontSize: 14, lineHeight: 1.5 }}>
                  "Rozumiem, że 'po prostu powiedz mi, czego chcesz' nie jest już akceptowalnym pytaniem."
                </span>
              </label>
            </div>

            {sent ? (
              <div className="fade-scale rounded-2xl py-5 px-6 text-center" style={{ background: "#FFD700" }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>🎅</div>
                <p style={{ color: "#0B3321", fontWeight: 800, fontSize: 15 }}>
                  Mikołaj ma twój zrzut ekranu. Elfy obserwują.
                </p>
              </div>
            ) : (
              <button
                onClick={() => { if (checked) setSent(true); }}
                className="w-full py-4 rounded-full text-center transition-all duration-150"
                style={{
                  background: checked ? "#ffffff" : "rgba(255,255,255,0.2)",
                  color: checked ? "#0B3321" : "rgba(255,255,255,0.45)",
                  fontWeight: 700, fontSize: 16, border: "none",
                  cursor: checked ? "pointer" : "not-allowed",
                  transition: "background 0.15s, color 0.15s, transform 0.1s",
                }}
                onMouseEnter={e => { if (checked) { (e.currentTarget as HTMLButtonElement).style.background = "#E8192C"; (e.currentTarget as HTMLButtonElement).style.color = "#ffffff"; (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.03)"; } }}
                onMouseLeave={e => { if (checked) { (e.currentTarget as HTMLButtonElement).style.background = "#ffffff"; (e.currentTarget as HTMLButtonElement).style.color = "#0B3321"; (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; } }}
              >
                Wyślij Mi Dowód Zakupu
              </button>
            )}
            {!checked && !sent && (
              <p className="mt-3" style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                Najpierw zaznacz pole. Tak, to. 👆
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
