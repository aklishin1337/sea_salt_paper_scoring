import { useState, useEffect } from "react";

// ─── Storage helpers ───────────────────────────────────────────────────────────
const KEYS = { roster: "ssp:roster", games: "ssp:games" };

function loadKey(key) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}
function saveKey(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ─── Constants ────────────────────────────────────────────────────────────────
const THRESHOLDS = { 2: 40, 3: 35, 4: 30 };
const P_COLORS = ["#38bdf8", "#fb923c", "#34d399", "#f472b6", "#a78bfa", "#fbbf24", "#f87171", "#86efac", "#7dd3fc", "#fdba74", "#c4b5fd", "#6ee7b7"];
const P_EMOJIS = ["🐟", "🦀", "🐙", "🦞", "🐡", "🦑", "🐬", "🦈", "🐳", "🦭", "🐚", "🪸"];
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap');`;

const C = {
  bg: "#08111f",
  surface: "#0d1e33",
  card: "#112240",
  border: "#1a3050",
  accent: "#38bdf8",
  warm: "#fb923c",
  text: "#cde4f7",
  muted: "#4a6a8a",
  gold: "#fbbf24",
  danger: "#f87171",
};

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// ─── Numpad ───────────────────────────────────────────────────────────────────
function NumPad({ label, color, onEnter, onCancel }) {
  const [val, setVal] = useState("");
  const press = (d) => { if (val.length < 3) setVal(v => v + d); };
  const del = () => setVal(v => v.slice(0, -1));
  const confirm = () => { const n = parseInt(val, 10); if (!isNaN(n) && n >= 0) onEnter(n); };

  return (
    <div style={S.overlay}>
      <div style={S.numpadSheet}>
        <div style={{ fontSize: 12, letterSpacing: 3, color: C.muted, textTransform: "uppercase", textAlign: "center", marginBottom: 6 }}>
          {label}
        </div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 56, fontWeight: 900, color: color || C.accent, textAlign: "center", marginBottom: 18, letterSpacing: -2, minHeight: 66 }}>
          {val || "0"}
        </div>
        <div style={S.numGrid}>
          {[1,2,3,4,5,6,7,8,9].map(d => (
            <button key={d} style={S.numBtn} onClick={() => press(String(d))}>{d}</button>
          ))}
          <button style={S.numBtn} onClick={del}>⌫</button>
          <button style={S.numBtn} onClick={() => press("0")}>0</button>
          <button style={{ ...S.numBtn, background: (color || C.accent) + "22", border: `1.5px solid ${color || C.accent}`, color: color || C.accent, fontSize: 22 }} onClick={confirm}>✓</button>
        </div>
        <button style={S.cancelBtn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Roster Screen ────────────────────────────────────────────────────────────
function RosterScreen({ roster, onSave, onBack }) {
  const [players, setPlayers] = useState(roster.map(p => ({ ...p })));
  const [newName, setNewName] = useState("");

  const add = () => {
    const n = newName.trim();
    if (!n) return;
    const idx = players.length;
    setPlayers(p => [...p, { id: Date.now().toString(), name: n, color: P_COLORS[idx % P_COLORS.length], emoji: P_EMOJIS[idx % P_EMOJIS.length] }]);
    setNewName("");
  };
  const remove = (id) => setPlayers(p => p.filter(x => x.id !== id));
  const rename = (id, name) => setPlayers(p => p.map(x => x.id === id ? { ...x, name } : x));

  return (
    <div style={S.screen}>
      <style>{FONTS}</style>
      <div style={S.topBar}>
        <button style={S.backBtn} onClick={onBack}>←</button>
        <span style={S.topBarTitle}>Roster</span>
        <button style={{ ...S.topBarAction, color: C.accent }} onClick={() => onSave(players)}>Save</button>
      </div>
      <div style={S.scrollArea}>
        <div style={{ padding: "8px 0 16px", color: C.muted, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>
          {players.length} player{players.length !== 1 ? "s" : ""} in roster
        </div>
        {players.map((p) => (
          <div key={p.id} style={{ ...S.rosterRow, borderColor: p.color + "44" }}>
            <span style={{ fontSize: 22 }}>{p.emoji}</span>
            <input
              style={{ ...S.nameInput, flex: 1, borderColor: p.color + "55" }}
              value={p.name}
              onChange={e => rename(p.id, e.target.value)}
              maxLength={12}
            />
            <button style={{ background: "none", border: "none", color: C.danger, fontSize: 18, cursor: "pointer", padding: "4px 8px" }} onClick={() => remove(p.id)}>✕</button>
          </div>
        ))}
        <div style={S.addRow}>
            <input
              style={{ ...S.nameInput, flex: 1 }}
              placeholder="New player name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && add()}
              maxLength={12}
            />
            <button style={S.addBtn} onClick={add}>+ Add</button>
          </div>
      </div>
    </div>
  );
}

// ─── Setup Screen ─────────────────────────────────────────────────────────────
function SetupScreen({ roster, onStart, onRoster, onAddToRoster, onBack }) {
  const [selected, setSelected] = useState(roster.slice(0, 2).map(p => p.id));
  const [newName, setNewName] = useState("");

  const togglePlayer = (id) => {
    if (selected.includes(id)) {
      if (selected.length > 2) setSelected(s => s.filter(x => x !== id));
    } else {
      if (selected.length < 4) setSelected(s => [...s, id]);
    }
  };

  const addNew = () => {
    const n = newName.trim();
    if (!n) return;
    const newPlayer = onAddToRoster(n);
    setSelected(s => s.length < 4 ? [...s, newPlayer.id] : s);
    setNewName("");
  };

  const canStart = selected.length >= 2 && selected.length <= 4;
  const threshold = THRESHOLDS[selected.length] || 30;

  return (
    <div style={S.screen}>
      <style>{FONTS}</style>
      <div style={S.heroGlow} />
      <div style={{ position: "relative", zIndex: 1, padding: "56px 20px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
          <div>
            <button style={S.backBtn} onClick={onBack}>←</button>
            <div style={S.eyebrow}>score tracker</div>
            <div style={S.heroTitle}>Sea Salt<br />&amp; Paper</div>
            <div style={{ fontSize: 28, marginTop: 4 }}>🐠</div>
          </div>
          <button style={S.rosterBtn} onClick={onRoster}>👥 Roster</button>
        </div>

        {roster.length === 0 ? (
          <div style={{ ...S.card, textAlign: "center", padding: "32px 20px" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
            <div style={{ color: C.muted, marginBottom: 16 }}>No players yet. Add one below or set up your full roster.</div>
            <div style={S.addRow}>
              <input
                style={{ ...S.nameInput, flex: 1 }}
                placeholder="Player name..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addNew()}
                maxLength={12}
              />
              <button style={S.addBtn} onClick={addNew}>+ Add</button>
            </div>
            <button style={{ ...S.rosterBtn, marginTop: 12, width: "100%" }} onClick={onRoster}>👥 Manage Roster</button>
          </div>
        ) : (
          <>
            <div style={S.card}>
              <div style={S.cardLabel}>Select players ({selected.length} / 4 selected)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
                {roster.map(p => {
                  const isOn = selected.includes(p.id);
                  const full = selected.length >= 4 && !isOn;
                  return (
                    <button key={p.id} style={{ ...S.playerSelectRow, borderColor: isOn ? p.color : C.border, background: isOn ? p.color + "15" : "transparent", opacity: full ? 0.4 : 1 }} onClick={() => !full && togglePlayer(p.id)}>
                      <span style={{ fontSize: 20 }}>{p.emoji}</span>
                      <span style={{ ...S.playerSelectName, color: isOn ? p.color : C.muted }}>{p.name}</span>
                      <div style={{ ...S.checkCircle, borderColor: isOn ? p.color : C.border, background: isOn ? p.color : "transparent" }}>
                        {isOn && <span style={{ color: "#08111f", fontSize: 12, fontWeight: 700 }}>✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div style={{ ...S.addRow, marginTop: 12 }}>
                <input
                  style={{ ...S.nameInput, flex: 1, fontSize: 14, padding: "8px 12px" }}
                  placeholder="Add new player..."
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addNew()}
                  maxLength={12}
                />
                <button style={{ ...S.addBtn, padding: "8px 14px", fontSize: 13 }} onClick={addNew}>+ Add</button>
              </div>
              {canStart && (
                <div style={{ marginTop: 10, fontSize: 13, color: C.muted }}>
                  Win at <span style={{ color: C.accent, fontWeight: 700 }}>{threshold}</span> points
                </div>
              )}
            </div>
            <button style={{ ...S.startBtn, marginTop: 16, opacity: canStart ? 1 : 0.4 }} onClick={() => {
              if (!canStart) return;
              const players = selected.map(id => roster.find(p => p.id === id));
              onStart(players);
            }}>
              Start Game
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Game Screen ──────────────────────────────────────────────────────────────
function GameScreen({ players, onFinish, onAbandon }) {
  const threshold = THRESHOLDS[players.length] || 30;
  const [scores, setScores] = useState(players.map(() => 0));
  const [rounds, setRounds] = useState([]);
  const [inputFor, setInputFor] = useState(null);
  const [winner, setWinner] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const addScore = (idx, pts) => {
    const ns = [...scores];
    ns[idx] += pts;
    setScores(ns);
    const nr = [...rounds, { player: idx, points: pts, totals: [...ns] }];
    setRounds(nr);
    setInputFor(null);
    const over = ns.map(s => s >= threshold);
    if (over.some(Boolean)) {
      const max = Math.max(...ns.filter((_, i) => over[i]));
      setWinner(ns.findIndex(s => s === max));
    }
  };

  const undo = () => {
    if (!rounds.length) return;
    const rebuilt = players.map(() => 0);
    rounds.slice(0, -1).forEach(r => { rebuilt[r.player] += r.points; });
    setScores(rebuilt);
    setRounds(r => r.slice(0, -1));
    setWinner(null);
  };

  const finishGame = () => {
    const totalRounds = Math.ceil(rounds.length / players.length);
    onFinish({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      players: players.map((p, i) => ({ id: p.id, name: p.name, color: p.color, emoji: p.emoji, score: scores[i] })),
      winnerId: winner !== null ? players[winner].id : null,
      rounds,
      totalRounds,
      threshold,
    });
  };

  const maxScore = Math.max(...scores);

  if (winner !== null) {
    return (
      <div style={{ ...S.screen, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <style>{FONTS}</style>
        <div style={{ fontSize: 80, marginBottom: 12, filter: `drop-shadow(0 0 24px ${players[winner].color}88)` }}>{players[winner].emoji}</div>
        <div style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: C.gold, marginBottom: 8 }}>Winner!</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 900, color: players[winner].color, marginBottom: 4 }}>{players[winner].name}</div>
        <div style={{ fontSize: 18, color: C.muted, marginBottom: 36 }}>{scores[winner]} pts · {Math.ceil(rounds.length / players.length)} rounds</div>
        <div style={{ ...S.card, width: "100%", marginBottom: 28 }}>
          {players.map((p, i) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < players.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ color: i === winner ? C.gold : C.text }}>{p.emoji} {p.name}</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: p.color }}>{scores[i]}</span>
            </div>
          ))}
        </div>
        <button style={S.startBtn} onClick={finishGame}>Save &amp; Continue</button>
      </div>
    );
  }

  return (
    <div style={S.screen}>
      <style>{FONTS}</style>
      {inputFor !== null && (
        <NumPad label={`Score for ${players[inputFor].name}`} color={players[inputFor].color} onEnter={pts => addScore(inputFor, pts)} onCancel={() => setInputFor(null)} />
      )}
      <div style={S.topBar}>
        <button style={S.backBtn} onClick={onAbandon}>✕</button>
        <span style={S.topBarTitle}>Round {Math.floor(rounds.length / players.length) + 1}</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={S.iconBtn} onClick={() => setShowHistory(h => !h)}>📜</button>
          <button style={S.iconBtn} onClick={undo}>↩</button>
        </div>
      </div>
      <div style={{ padding: "4px 20px 8px", fontSize: 12, color: C.muted }}>
        Win at <b style={{ color: C.accent }}>{threshold}</b> pts
      </div>
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {players.map((p, i) => {
          const pct = Math.min(scores[i] / threshold, 1);
          const leading = scores[i] === maxScore && scores[i] > 0;
          return (
            <button key={p.id} style={{ ...S.playerCard, borderColor: leading ? p.color + "bb" : p.color + "33" }} onClick={() => setInputFor(i)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 22 }}>{p.emoji}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, color: p.color }}>{p.name}</span>
                  {leading && <span style={S.leadBadge}>LEAD</span>}
                </div>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, fontWeight: 900, color: p.color, lineHeight: 1 }}>{scores[i]}</span>
              </div>
              <div style={S.progressBg}>
                <div style={{ ...S.progressFill, width: `${pct * 100}%`, background: p.color, boxShadow: `0 0 10px ${p.color}66` }} />
              </div>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 6 }}>tap to add score</div>
            </button>
          );
        })}
      </div>
      {showHistory && rounds.length > 0 && (
        <div style={{ margin: "12px 16px 0", ...S.card }}>
          <div style={S.cardLabel}>Recent entries</div>
          {[...rounds].reverse().slice(0, 8).map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: players[r.player].color }}>{players[r.player].emoji} {players[r.player].name}</span>
              <span style={{ color: C.warm }}>+{r.points}</span>
              <span style={{ color: C.muted }}>{r.totals[r.player]} total</span>
            </div>
          ))}
        </div>
      )}
      <button style={{ ...S.newGameBtn, margin: "16px 16px 48px" }} onClick={onAbandon}>Abandon game</button>
    </div>
  );
}

// ─── History Screen ───────────────────────────────────────────────────────────
function HistoryScreen({ games, onBack, onDeleteGame }) {
  const [confirmId, setConfirmId] = useState(null);
  const confirmGame = games.find(g => g.id === confirmId);

  return (
    <div style={S.screen}>
      <style>{FONTS}</style>

      {confirmId && confirmGame && (
        <div style={S.overlay}>
          <div style={{ ...S.numpadSheet, padding: "28px 24px 44px" }}>
            <div style={{ fontSize: 36, textAlign: "center", marginBottom: 12 }}>🗑️</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: C.text, textAlign: "center", marginBottom: 8 }}>Delete this game?</div>
            <div style={{ fontSize: 13, color: C.muted, textAlign: "center", marginBottom: 4 }}>
              {fmtDate(confirmGame.date)} · {fmtTime(confirmGame.date)}
            </div>
            <div style={{ fontSize: 13, color: C.muted, textAlign: "center", marginBottom: 24 }}>
              This will also affect stats and can't be undone.
            </div>
            <button
              style={{ ...S.startBtn, background: "linear-gradient(135deg, #f87171, #dc2626)", marginBottom: 10 }}
              onClick={() => { onDeleteGame(confirmId); setConfirmId(null); }}
            >
              Yes, delete it
            </button>
            <button style={S.cancelBtn} onClick={() => setConfirmId(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={S.topBar}>
        <button style={S.backBtn} onClick={onBack}>←</button>
        <span style={S.topBarTitle}>Game History</span>
        <span style={{ width: 44 }} />
      </div>
      <div style={S.scrollArea}>
        {games.length === 0 ? (
          <div style={{ textAlign: "center", color: C.muted, marginTop: 60 }}>No games played yet.</div>
        ) : (
          [...games].reverse().map(g => {
            const winner = g.players.find(p => p.id === g.winnerId);
            return (
              <div key={g.id} style={{ ...S.card, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{fmtDate(g.date)}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{fmtTime(g.date)} · {g.totalRounds} rounds</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {winner && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, background: winner.color + "20", border: `1px solid ${winner.color}55`, borderRadius: 10, padding: "4px 10px" }}>
                        <span style={{ fontSize: 14 }}>{winner.emoji}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: winner.color }}>{winner.name}</span>
                      </div>
                    )}
                    <button
                      style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 9px", color: C.muted, fontSize: 15, cursor: "pointer", lineHeight: 1, flexShrink: 0 }}
                      onClick={() => setConfirmId(g.id)}
                    >🗑️</button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {g.players.map(p => (
                    <div key={p.id} style={{ fontSize: 13, color: p.id === g.winnerId ? p.color : C.muted }}>
                      {p.emoji} {p.name}: <b style={{ fontFamily: "'DM Mono', monospace" }}>{p.score}</b>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Stats Screen ─────────────────────────────────────────────────────────────
function StatsScreen({ games, roster, onBack }) {
  const stats = roster.map(p => {
    const myGames = games.filter(g => g.players.some(gp => gp.id === p.id));
    const wins = games.filter(g => g.winnerId === p.id).length;
    const scores = myGames.map(g => g.players.find(gp => gp.id === p.id)?.score || 0);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const bestScore = scores.length ? Math.max(...scores) : 0;
    let bestRound = 0;
    games.forEach(g => {
      g.rounds.forEach(r => {
        const gp = g.players[r.player];
        if (gp?.id === p.id && r.points > bestRound) bestRound = r.points;
      });
    });
    const winGames = games.filter(g => g.winnerId === p.id);
    const fastestWin = winGames.length ? Math.min(...winGames.map(g => g.totalRounds)) : null;
    return { ...p, gamesPlayed: myGames.length, wins, avgScore, bestScore, bestRound, fastestWin };
  }).filter(p => p.gamesPlayed > 0).sort((a, b) => b.wins - a.wins);

  return (
    <div style={S.screen}>
      <style>{FONTS}</style>
      <div style={S.topBar}>
        <button style={S.backBtn} onClick={onBack}>←</button>
        <span style={S.topBarTitle}>Stats &amp; Leaderboard</span>
        <span style={{ width: 44 }} />
      </div>
      <div style={S.scrollArea}>
        {stats.length === 0 ? (
          <div style={{ textAlign: "center", color: C.muted, marginTop: 60 }}>Play some games to see stats!</div>
        ) : stats.map((p, rank) => (
          <div key={p.id} style={{ ...S.card, marginBottom: 10, borderColor: rank === 0 ? C.gold + "66" : p.color + "33" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: rank === 0 ? C.gold : C.muted, width: 32, textAlign: "center" }}>
                {rank === 0 ? "🏆" : rank + 1}
              </div>
              <span style={{ fontSize: 22 }}>{p.emoji}</span>
              <span style={{ fontSize: 17, fontWeight: 600, color: p.color }}>{p.name}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { label: "Wins", val: p.wins },
                { label: "Games", val: p.gamesPlayed },
                { label: "Avg Score", val: p.avgScore },
                { label: "Best Score", val: p.bestScore },
                { label: "Best Round", val: p.bestRound },
                { label: "Fastest Win", val: p.fastestWin !== null ? `${p.fastestWin}r` : "—" },
              ].map(({ label, val }) => (
                <div key={label} style={{ background: C.surface, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 500, color: p.color }}>{val}</div>
                  <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
function HomeScreen({ roster, games, onPlay, onRoster, onHistory, onStats }) {
  const recentGames = [...games].reverse().slice(0, 3);
  const topPlayer = (() => {
    if (!games.length) return null;
    const wins = {};
    games.forEach(g => { if (g.winnerId) wins[g.winnerId] = (wins[g.winnerId] || 0) + 1; });
    const topId = Object.entries(wins).sort((a, b) => b[1] - a[1])[0]?.[0];
    return roster.find(p => p.id === topId);
  })();

  return (
    <div style={S.screen}>
      <style>{FONTS}</style>
      <div style={S.heroGlow} />
      <div style={{ position: "relative", zIndex: 1, padding: "56px 20px 40px" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={S.eyebrow}>score tracker</div>
          <div style={S.heroTitle}>Sea Salt<br />&amp; Paper</div>
          <div style={{ fontSize: 28, marginTop: 6 }}>🐠</div>
        </div>
        <button style={{ ...S.startBtn, marginBottom: 16 }} onClick={onPlay}>▶ New Game</button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { icon: "👥", label: "Roster", action: onRoster },
            { icon: "📜", label: "History", action: onHistory },
            { icon: "🏆", label: "Stats", action: onStats },
          ].map(({ icon, label, action }) => (
            <button key={label} style={S.navTile} onClick={action}>
              <span style={{ fontSize: 24 }}>{icon}</span>
              <span style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{label}</span>
            </button>
          ))}
        </div>
        {games.length > 0 && (
          <div style={S.card}>
            <div style={S.cardLabel}>Quick stats</div>
            <div style={{ display: "flex", gap: 12, marginBottom: recentGames.length ? 14 : 0 }}>
              <div style={{ flex: 1, background: C.surface, borderRadius: 10, padding: "12px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, color: C.accent }}>{games.length}</div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>Games</div>
              </div>
              {topPlayer && (
                <div style={{ flex: 2, background: C.surface, borderRadius: 10, padding: "12px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 28 }}>{topPlayer.emoji}</span>
                  <div>
                    <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Top player</div>
                    <div style={{ fontWeight: 600, color: topPlayer.color, fontSize: 15 }}>{topPlayer.name}</div>
                  </div>
                </div>
              )}
            </div>
            {recentGames.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Recent games</div>
                {recentGames.map(g => {
                  const w = g.players.find(p => p.id === g.winnerId);
                  return (
                    <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 12, color: C.muted }}>{fmtDate(g.date)}</span>
                      {w && <span style={{ fontSize: 13, color: w.color }}>{w.emoji} {w.name}</span>}
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: C.muted }}>{g.totalRounds}r</span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [roster, setRoster] = useState(() => loadKey(KEYS.roster) || []);
  const [games, setGames] = useState(() => loadKey(KEYS.games) || []);
  const [activePlayers, setActivePlayers] = useState([]);

  const saveRoster = (r) => {
    setRoster(r);
    saveKey(KEYS.roster, r);
    setScreen("home");
  };

  const saveGame = (game) => {
    const ng = [...games, game];
    setGames(ng);
    saveKey(KEYS.games, ng);
    setScreen("home");
  };

  const addToRoster = (name) => {
    const idx = roster.length;
    const newPlayer = {
      id: Date.now().toString(),
      name,
      color: P_COLORS[idx % P_COLORS.length],
      emoji: P_EMOJIS[idx % P_EMOJIS.length],
    };
    const nr = [...roster, newPlayer];
    setRoster(nr);
    saveKey(KEYS.roster, nr);
    return newPlayer;
  };

  const deleteGame = (id) => {
    const ng = games.filter(g => g.id !== id);
    setGames(ng);
    saveKey(KEYS.games, ng);
  };

  if (screen === "roster") return <RosterScreen roster={roster} onSave={saveRoster} onBack={() => setScreen("home")} />;
  if (screen === "history") return <HistoryScreen games={games} onBack={() => setScreen("home")} onDeleteGame={deleteGame} />;
  if (screen === "stats") return <StatsScreen games={games} roster={roster} onBack={() => setScreen("home")} />;
  if (screen === "setup") return <SetupScreen roster={roster} onStart={p => { setActivePlayers(p); setScreen("game"); }} onRoster={() => setScreen("roster")} onAddToRoster={addToRoster} onBack={() => setScreen("home")} />;
  if (screen === "game") return <GameScreen players={activePlayers} onFinish={saveGame} onAbandon={() => setScreen("home")} />;

  return <HomeScreen roster={roster} games={games} onPlay={() => setScreen("setup")} onRoster={() => setScreen("roster")} onHistory={() => setScreen("history")} onStats={() => setScreen("stats")} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  screen: { minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.text, overflowX: "hidden", maxWidth: 480, margin: "0 auto" },
  heroGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 280, background: "radial-gradient(ellipse 130% 70% at 70% -10%, #0f3460 0%, #08111f 65%)", pointerEvents: "none" },
  eyebrow: { fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: C.accent, marginBottom: 6, fontFamily: "'DM Mono', monospace" },
  heroTitle: { fontFamily: "'Playfair Display', serif", fontSize: 46, fontWeight: 900, lineHeight: 1.08, color: C.text },
  card: { background: C.card, borderRadius: 16, padding: "18px 18px 14px", border: `1px solid ${C.border}` },
  cardLabel: { fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: C.muted, marginBottom: 14, fontFamily: "'DM Mono', monospace" },
  startBtn: { width: "100%", padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #38bdf8, #0ea5e9)", color: "#08111f", fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" },
  navTile: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 8px", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "52px 16px 12px", background: `linear-gradient(180deg, ${C.surface} 0%, transparent 100%)` },
  topBarTitle: { fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: C.text },
  topBarAction: { background: "none", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: "4px 8px" },
  backBtn: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px", color: C.text, fontSize: 16, cursor: "pointer" },
  iconBtn: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", fontSize: 15, cursor: "pointer", color: C.text },
  scrollArea: { padding: "8px 20px 48px", overflowY: "auto" },
  rosterRow: { display: "flex", alignItems: "center", gap: 10, background: C.card, borderRadius: 12, border: "1.5px solid", padding: "10px 12px", marginBottom: 8 },
  nameInput: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 16, fontFamily: "'DM Sans', sans-serif", outline: "none" },
  addRow: { display: "flex", gap: 10, marginTop: 12 },
  addBtn: { background: C.accent + "22", border: `1px solid ${C.accent}`, borderRadius: 10, padding: "10px 16px", color: C.accent, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" },
  playerSelectRow: { display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "1.5px solid", borderRadius: 12, padding: "12px 14px", cursor: "pointer", width: "100%", textAlign: "left", fontFamily: "'DM Sans', sans-serif" },
  playerSelectName: { flex: 1, fontSize: 16, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" },
  checkCircle: { width: 22, height: 22, borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  rosterBtn: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  playerCard: { background: C.card, borderRadius: 16, border: "1.5px solid", padding: "14px 16px 10px", cursor: "pointer", textAlign: "left", width: "100%", transition: "transform 0.1s" },
  progressBg: { height: 4, background: C.border, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4, transition: "width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" },
  leadBadge: { fontSize: 9, letterSpacing: 2, background: C.gold + "25", color: C.gold, border: `1px solid ${C.gold}55`, borderRadius: 6, padding: "2px 6px", fontWeight: 700, fontFamily: "'DM Mono', monospace" },
  newGameBtn: { display: "block", width: "calc(100% - 32px)", padding: "13px", borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "flex-end", backdropFilter: "blur(6px)" },
  numpadSheet: { width: "100%", background: C.surface, borderRadius: "22px 22px 0 0", padding: "24px 20px 44px", border: `1px solid ${C.border}` },
  numGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 },
  numBtn: { padding: "17px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 22, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  cancelBtn: { width: "100%", padding: "13px", borderRadius: 12, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: 15, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
};
