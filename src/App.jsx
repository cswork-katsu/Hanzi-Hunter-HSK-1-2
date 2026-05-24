import { useState, useEffect, useCallback, useRef } from "react";
import { vocabulary, generateChoices } from "./data/vocabulary";
import { grammarPatterns, buildWeightedPool, pickQuestion } from "./data/grammar";
import { shuffleChallenges } from "./data/characters";
import { submitScore, getLeaderboard, loadGrammarPerformance, updateGrammarPerformance } from "./supabase";
import "./index.css";

const BASE_POINTS = 100;
const STREAK_BONUS = 50;
const STREAK_BONUS_THRESHOLD = 3;

function makeProgressiveQueue() {
  const hsk1 = [...vocabulary.filter(w => w.level === 1)].sort(() => Math.random() - 0.5);
  const hsk2 = [...vocabulary.filter(w => w.level === 2)].sort(() => Math.random() - 0.5);
  return [...hsk1, ...hsk2];
}
function makeRandomQueue() {
  return [...vocabulary].sort(() => Math.random() - 0.5);
}
function buildQuestion(word) {
  return { correct: word, choices: generateChoices(word, vocabulary) };
}

// ══════════════════════════════════════════════════════════════════════════
// HOME SCREEN — mode selector
// ══════════════════════════════════════════════════════════════════════════
function HomeScreen({ onSelectMode, onLeaderboard }) {
  return (
    <div className="screen home-screen">
      <div className="logo-wrap">
        <div className="logo-top">
          <span className="logo-hanzi">汉</span>
          <div className="logo-text">
            <h1>HANZI<br />HUNTER</h1>
          </div>
        </div>
        <p className="tagline">HSK 1–2 · Choose your challenge</p>
      </div>

      <div className="mode-cards">
        <button className="mode-card mode-hunter" onClick={() => onSelectMode("hunter")}>
          <span className="mode-icon">🎯</span>
          <div className="mode-info">
            <span className="mode-name">汉字 Hunter</span>
            <span className="mode-desc">One-strike survival · Match English → hanzi</span>
          </div>
          <span className="mode-arrow">→</span>
        </button>

        <button className="mode-card mode-breaker" onClick={() => onSelectMode("breaker")}>
          <span className="mode-icon">🔬</span>
          <div className="mode-info">
            <span className="mode-name">字形 Breaker</span>
            <span className="mode-desc">Isolate characters · Pinyin → hanzi · Complete words</span>
          </div>
          <span className="mode-arrow">→</span>
        </button>

        <button className="mode-card mode-arena" onClick={() => onSelectMode("arena")}>
          <span className="mode-icon">⚔️</span>
          <div className="mode-info">
            <span className="mode-name">语法 Arena</span>
            <span className="mode-desc">Adaptive grammar · Weak patterns surface more · Tracks progress</span>
          </div>
          <span className="mode-arrow">→</span>
        </button>
      </div>

      <button className="btn-secondary" onClick={onLeaderboard}>🏆 Leaderboard</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// 汉字 HUNTER — original survival mode
// ══════════════════════════════════════════════════════════════════════════
function HunterStart({ onStart, onBack }) {
  const [progressive, setProgressive] = useState(false);
  const [fiftyFifty, setFiftyFifty]   = useState(false);
  return (
    <div className="screen start-screen">
      <button className="btn-back" onClick={onBack}>← Back</button>
      <div className="mode-badge mode-badge-hunter">🎯 汉字 Hunter</div>
      <div className="how-to">
        <div className="rule"><span className="rule-icon">🎯</span><span>Match the English meaning to the correct hanzi</span></div>
        <div className="rule"><span className="rule-icon">☠️</span><span>One wrong answer — game over</span></div>
        <div className="rule"><span className="rule-icon">🔥</span><span>3-in-a-row streak = +50 bonus points</span></div>
        <div className="rule"><span className="rule-icon">♾️</span><span>Endless questions — survive as long as you can!</span></div>
      </div>
      <div className="helpers-section">
        <p className="helpers-title">Training helpers</p>
        <label className="checkbox-row" onClick={() => setProgressive(v => !v)}>
          <span className={`checkbox ${progressive ? "checked" : ""}`}>{progressive && <span className="checkmark">✓</span>}</span>
          <div className="checkbox-text">
            <span className="checkbox-label">Progressive difficulty</span>
            <span className="checkbox-desc">HSK 1 words first, then HSK 2</span>
          </div>
        </label>
        <label className="checkbox-row" onClick={() => setFiftyFifty(v => !v)}>
          <span className={`checkbox ${fiftyFifty ? "checked" : ""}`}>{fiftyFifty && <span className="checkmark">✓</span>}</span>
          <div className="checkbox-text">
            <span className="checkbox-label">50:50 lifeline</span>
            <span className="checkbox-desc">Remove 2 wrong options per question</span>
          </div>
        </label>
      </div>
      <button className="btn-primary" onClick={() => onStart({ progressive, fiftyFifty })}>开始 · START</button>
    </div>
  );
}

function HunterGame({ onGameOver, settings }) {
  const { progressive, fiftyFifty: hasFiftyFifty } = settings;
  const queueRef = useRef(progressive ? makeProgressiveQueue() : makeRandomQueue());
  const usedRef  = useRef(new Set());
  const firstWord = queueRef.current.shift();
  usedRef.current.add(firstWord.hanzi);
  const [question, setQuestion]         = useState(() => buildQuestion(firstWord));
  const [score, setScore]               = useState(0);
  const [streak, setStreak]             = useState(0);
  const [qCount, setQCount]             = useState(1);
  const [selected, setSelected]         = useState(null);
  const [phase, setPhase]               = useState("question");
  const [correct, setCorrect]           = useState(false);
  const [streakPopped, setStreakPopped] = useState(false);
  const [shakeWrong, setShakeWrong]     = useState(false);
  const [dying, setDying]               = useState(false);
  const [fiftyUsed, setFiftyUsed]       = useState(false);
  const [fiftyStock, setFiftyStock]     = useState(hasFiftyFifty ? 1 : 0);
  const [eliminated, setEliminated]     = useState(new Set());

  const nextWord = useCallback(() => {
    if (queueRef.current.length === 0) {
      const refill = (progressive ? makeProgressiveQueue() : makeRandomQueue()).filter(w => !usedRef.current.has(w.hanzi));
      queueRef.current = refill.length > 0 ? refill : (progressive ? makeProgressiveQueue() : makeRandomQueue());
      usedRef.current.clear();
    }
    const word = queueRef.current.shift();
    usedRef.current.add(word.hanzi);
    return buildQuestion(word);
  }, [progressive]);

  const handleFiftyFifty = useCallback(() => {
    if (fiftyUsed || fiftyStock <= 0 || phase !== "question") return;
    const wrong = question.choices.filter(c => c.hanzi !== question.correct.hanzi);
    const toElim = wrong.sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminated(new Set(toElim.map(c => c.hanzi)));
    setFiftyUsed(true);
    setFiftyStock(s => s - 1);
  }, [fiftyUsed, fiftyStock, phase, question]);

  const handleChoice = useCallback((choice) => {
    if (phase !== "question" || eliminated.has(choice.hanzi)) return;
    const isCorrect = choice.hanzi === question.correct.hanzi;
    setSelected(choice.hanzi); setCorrect(isCorrect); setPhase("feedback");
    if (isCorrect) {
      const ns = streak + 1; setStreak(ns);
      const bonus = ns >= STREAK_BONUS_THRESHOLD ? STREAK_BONUS : 0;
      setScore(s => s + BASE_POINTS + bonus);
      if (bonus > 0) { setStreakPopped(true); setTimeout(() => setStreakPopped(false), 900); }
    } else {
      setShakeWrong(true); setDying(true);
      setTimeout(() => setShakeWrong(false), 500);
      setTimeout(() => onGameOver(score, qCount), 1800);
    }
  }, [phase, eliminated, question, streak, score, qCount, onGameOver]);

  const handleNext = useCallback(() => {
    setQuestion(nextWord()); setSelected(null); setPhase("question");
    setCorrect(false); setFiftyUsed(false); setEliminated(new Set());
    setQCount(c => c + 1);
    if (hasFiftyFifty) setFiftyStock(1);
  }, [nextWord, hasFiftyFifty]);

  const progressPct = ((qCount - 1) % vocabulary.length) / vocabulary.length * 100;
  const levelTag = progressive ? (question.correct.level === 1 ? "HSK 1" : "HSK 2") : null;

  return (
    <div className="screen game-screen">
      <div className="game-header">
        <div className="lives"><span className={`heart ${dying ? "dead" : "alive"}`}>♥</span></div>
        <div className="q-counter">#{qCount}{levelTag && <span className={`level-tag level-${question.correct.level}`}>{levelTag}</span>}</div>
        <div className="score-display">
          <span className="score-label">分</span>
          <span className="score-value">{score}</span>
          {streakPopped && <span className="streak-pop">+50🔥</span>}
        </div>
      </div>
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${progressPct}%` }} /></div>
      {streak >= 3 && !dying && <div className="streak-badge">🔥 {streak}-streak!</div>}
      <div className={`question-card ${shakeWrong ? "shake" : ""}`}>
        <p className="question-label">What is the hanzi for…</p>
        <h2 className="english-word">{question.correct.english}</h2>
        {phase === "feedback" && (
          <p className="pinyin-reveal">{correct ? `✓ ${question.correct.hanzi} · ${question.correct.pinyin}` : `✗ Answer: ${question.correct.hanzi} · ${question.correct.pinyin}`}</p>
        )}
      </div>
      <div className="choices-grid">
        {question.choices.map((choice) => {
          const isElim = eliminated.has(choice.hanzi);
          let cls = "choice-btn";
          if (isElim) cls += " eliminated";
          else if (phase === "feedback") {
            if (choice.hanzi === question.correct.hanzi) cls += " correct";
            else if (choice.hanzi === selected) cls += " wrong";
            else cls += " dimmed";
          }
          return (
            <button key={choice.hanzi} className={cls} onClick={() => handleChoice(choice)} disabled={phase === "feedback" || isElim}>
              {isElim ? <span className="choice-hanzi eliminated-x">✕</span>
                : <><span className="choice-hanzi">{choice.hanzi}</span>{phase === "feedback" && <span className="choice-pinyin">{choice.pinyin}</span>}</>}
            </button>
          );
        })}
      </div>
      {hasFiftyFifty && phase === "question" && (
        <button className={`btn-fifty ${fiftyUsed || fiftyStock <= 0 ? "used" : ""}`} onClick={handleFiftyFifty} disabled={fiftyUsed || fiftyStock <= 0}>
          {fiftyUsed ? "50:50 used" : "⚡ 50:50 — Remove 2 options"}
        </button>
      )}
      {phase === "feedback" && !dying && <button className="btn-next" onClick={handleNext}>Next →</button>}
      {dying && <div className="game-over-banner">☠️ Game over — loading your result…</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// 字形 BREAKER — character isolation
// ══════════════════════════════════════════════════════════════════════════
function BreakerGame({ onBack }) {
  const queueRef = useRef(shuffleChallenges());
  const [q, setQ]               = useState(() => queueRef.current.shift());
  const [selected, setSelected] = useState(null);
  const [phase, setPhase]       = useState("question");
  const [score, setScore]       = useState(0);
  const [streak, setStreak]     = useState(0);
  const [qCount, setQCount]     = useState(1);
  const [streakPopped, setStreakPopped] = useState(false);
  const [shakeWrong, setShakeWrong]     = useState(false);

  const choices = useRef([]);
  if (phase === "question" && choices.current.length === 0) {
    const answer = q.answer;
    const raw = [...q.distractors, answer].sort(() => Math.random() - 0.5);
    choices.current = raw;
  }

  const handleChoice = (choice) => {
    if (phase !== "question") return;
    setSelected(choice);
    setPhase("feedback");
    if (choice === q.answer) {
      const ns = streak + 1; setStreak(ns);
      const bonus = ns >= STREAK_BONUS_THRESHOLD ? STREAK_BONUS : 0;
      setScore(s => s + BASE_POINTS + bonus);
      if (bonus > 0) { setStreakPopped(true); setTimeout(() => setStreakPopped(false), 900); }
    } else {
      setStreak(0);
      setShakeWrong(true);
      setTimeout(() => setShakeWrong(false), 500);
    }
  };

  const handleNext = () => {
    if (queueRef.current.length === 0) queueRef.current = shuffleChallenges();
    const next = queueRef.current.shift();
    setQ(next); setSelected(null); setPhase("question");
    setQCount(c => c + 1); choices.current = [];
  };

  const typeLabel = { standalone: "Which word does this character belong to?", partial: "Pick the missing character", pinyin: "Which hanzi matches this pinyin?" };
  const typeBadge = { standalone: "字→词", partial: "填字", pinyin: "拼→字" };

  const renderPrompt = () => {
    if (q.type === "standalone") return <div className="breaker-prompt"><span className="breaker-hanzi-big">{q.hanzi}</span><span className="breaker-sub">meaning: {q.meaning}</span></div>;
    if (q.type === "partial")    return <div className="breaker-prompt"><span className="breaker-hanzi-big">{q.partial}</span><span className="breaker-sub">complete the word ({q.meaning})</span></div>;
    if (q.type === "pinyin")     return <div className="breaker-prompt"><span className="breaker-pinyin-big">{q.pinyin}</span><span className="breaker-sub">{q.meaning}</span></div>;
  };

  const renderFeedback = () => {
    if (q.type === "standalone") return <p className="pinyin-reveal">{selected === q.answer ? `✓ ${q.answer} (${q.pinyin})` : `✗ Answer: ${q.answer} · ${q.pinyin}`}</p>;
    if (q.type === "partial")    return <p className="pinyin-reveal">{selected === q.answer ? `✓ ${q.fullWord} (${q.pinyin})` : `✗ Answer: ${q.answer} → ${q.fullWord} · ${q.pinyin}`}</p>;
    if (q.type === "pinyin")     return <p className="pinyin-reveal">{selected === q.answer ? `✓ ${q.answer} · ${q.pinyin}` : `✗ Answer: ${q.answer} · ${q.pinyin}`}</p>;
  };

  const isLargeChoice = q.type === "standalone";

  return (
    <div className="screen game-screen">
      <div className="game-header">
        <button className="btn-back-sm" onClick={onBack}>←</button>
        <div className="q-counter">#{qCount} <span className="level-tag level-breaker">{typeBadge[q.type]}</span></div>
        <div className="score-display">
          <span className="score-label">分</span>
          <span className="score-value">{score}</span>
          {streakPopped && <span className="streak-pop">+50🔥</span>}
        </div>
      </div>
      <div className="progress-bar"><div className="progress-fill breaker-fill" style={{ width: `${(qCount % 50) * 2}%` }} /></div>
      {streak >= 3 && <div className="streak-badge">🔥 {streak}-streak!</div>}

      <div className={`question-card ${shakeWrong ? "shake" : ""}`}>
        <p className="question-label">{typeLabel[q.type]}</p>
        {renderPrompt()}
        {phase === "feedback" && renderFeedback()}
      </div>

      <div className={`choices-grid ${isLargeChoice ? "choices-grid-words" : ""}`}>
        {choices.current.map((choice) => {
          let cls = "choice-btn";
          if (phase === "feedback") {
            if (choice === q.answer) cls += " correct";
            else if (choice === selected) cls += " wrong";
            else cls += " dimmed";
          }
          return (
            <button key={choice} className={cls} onClick={() => handleChoice(choice)} disabled={phase === "feedback"}>
              <span className={isLargeChoice ? "choice-word" : "choice-hanzi"}>{choice}</span>
            </button>
          );
        })}
      </div>
      {phase === "feedback" && <button className="btn-next" onClick={handleNext}>Next →</button>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// 语法 ARENA — adaptive grammar
// ══════════════════════════════════════════════════════════════════════════
function ArenaLogin({ onStart, onBack }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleStart = async () => {
    if (!username.trim()) { setError("Enter a username to track your progress"); return; }
    setLoading(true); setError("");
    try {
      const perf = await loadGrammarPerformance(username.trim());
      onStart(username.trim(), perf);
    } catch {
      // Still let them play — just with empty performance data
      onStart(username.trim(), {});
    }
    setLoading(false);
  };

  return (
    <div className="screen start-screen">
      <button className="btn-back" onClick={onBack}>← Back</button>
      <div className="mode-badge mode-badge-arena">⚔️ 语法 Arena</div>
      <div className="how-to">
        <div className="rule"><span className="rule-icon">🧠</span><span>Pick the grammatically correct sentence, or fill in the blank</span></div>
        <div className="rule"><span className="rule-icon">📈</span><span>Patterns you get wrong appear more often over time</span></div>
        <div className="rule"><span className="rule-icon">💾</span><span>Progress is saved by username — pick up where you left off</span></div>
        <div className="rule"><span className="rule-icon">⚔️</span><span>HSK 2 structures are weighted heavier — no avoiding them</span></div>
      </div>
      <div className="submit-section">
        <input
          className="username-input"
          placeholder="Enter your username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleStart()}
          maxLength={20}
        />
        {error && <p className="error-msg">{error}</p>}
        <button className="btn-primary" onClick={handleStart} disabled={loading}>
          {loading ? "Loading…" : "开始 · START"}
        </button>
      </div>
    </div>
  );
}

function ArenaGame({ username, initialPerf, onBack }) {
  const perfRef    = useRef({ ...initialPerf });
  const [pool, setPool]         = useState(() => buildWeightedPool(initialPerf));
  const [q, setQ]               = useState(() => pickQuestion(pool[Math.floor(Math.random() * pool.length)]));
  const [selected, setSelected] = useState(null);
  const [phase, setPhase]       = useState("question");
  const [score, setScore]       = useState(0);
  const [streak, setStreak]     = useState(0);
  const [qCount, setQCount]     = useState(1);
  const [streakPopped, setStreakPopped] = useState(false);
  const [shakeWrong, setShakeWrong]     = useState(false);
  const [saving, setSaving]     = useState(false);

  const handleChoice = async (choice) => {
    if (phase !== "question") return;
    setSelected(choice);
    setPhase("feedback");
    const isCorrect = choice === q.correct;

    if (isCorrect) {
      const ns = streak + 1; setStreak(ns);
      const bonus = ns >= STREAK_BONUS_THRESHOLD ? STREAK_BONUS : 0;
      setScore(s => s + BASE_POINTS + bonus);
      if (bonus > 0) { setStreakPopped(true); setTimeout(() => setStreakPopped(false), 900); }
    } else {
      setStreak(0);
      setShakeWrong(true);
      setTimeout(() => setShakeWrong(false), 500);
    }

    // Update performance in Supabase and locally
    const pid = q.patternId;
    const prev = perfRef.current[pid] || { correct: 0, incorrect: 0 };
    perfRef.current[pid] = {
      correct:   prev.correct   + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    };
    setSaving(true);
    try { await updateGrammarPerformance(username, pid, isCorrect); } catch {}
    setSaving(false);

    // Rebuild pool with updated performance
    setPool(buildWeightedPool(perfRef.current));
  };

  const handleNext = () => {
    const newPool = buildWeightedPool(perfRef.current);
    const nextQ = pickQuestion(newPool[Math.floor(Math.random() * newPool.length)]);
    setQ(nextQ); setSelected(null); setPhase("question");
    setQCount(c => c + 1);
  };

  const isWrongAnswer = phase === "feedback" && selected !== q.correct;

  return (
    <div className="screen game-screen arena-game">
      <div className="game-header">
        <button className="btn-back-sm" onClick={onBack}>←</button>
        <div className="q-counter">
          #{qCount}
          <span className={`level-tag level-${q.patternLevel}`}>HSK {q.patternLevel}</span>
        </div>
        <div className="score-display">
          <span className="score-label">分</span>
          <span className="score-value">{score}</span>
          {streakPopped && <span className="streak-pop">+50🔥</span>}
        </div>
      </div>

      <div className="progress-bar"><div className="progress-fill arena-fill" style={{ width: `${(qCount % 30) / 30 * 100}%` }} /></div>
      {streak >= 3 && <div className="streak-badge">🔥 {streak}-streak!</div>}

      {/* Pattern label */}
      <div className="pattern-label">
        <span className="pattern-name">{q.patternName}</span>
        <span className={`q-type-badge ${q.type}`}>{q.type === "pick" ? "pick correct" : "fill blank"}</span>
      </div>

      {/* Question */}
      <div className={`question-card arena-card ${shakeWrong ? "shake" : ""}`}>
        <p className="question-label">{q.type === "pick" ? "Which sentence is correct?" : "Fill in the blank"}</p>
        <h2 className="arena-prompt">{q.prompt}</h2>
        {phase === "feedback" && (
          <div className="arena-explanation">
            <span className="explanation-icon">{selected === q.correct ? "✓" : "✗"}</span>
            <p>{q.explanation}</p>
          </div>
        )}
      </div>

      {/* Choices */}
      <div className="choices-grid choices-grid-grammar">
        {q.choices.map((choice) => {
          let cls = "choice-btn grammar-choice";
          if (phase === "feedback") {
            if (choice === q.correct) cls += " correct";
            else if (choice === selected) cls += " wrong";
            else cls += " dimmed";
          }
          return (
            <button key={choice} className={cls} onClick={() => handleChoice(choice)} disabled={phase === "feedback"}>
              <span className="grammar-choice-text">{choice}</span>
            </button>
          );
        })}
      </div>

      {phase === "feedback" && (
        <button className="btn-next" onClick={handleNext}>
          {saving ? "Saving…" : "Next →"}
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SHARED: Result, Leaderboard
// ══════════════════════════════════════════════════════════════════════════
function ResultScreen({ score, questionsAnswered, onRestart, onLeaderboard }) {
  const [username, setUsername]     = useState("");
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  const grade = score >= 2000 ? "S" : score >= 1200 ? "A" : score >= 700 ? "B" : score >= 300 ? "C" : "D";
  const gradeMsg = { S: "Legendary!", A: "Excellent!", B: "Good job!", C: "Keep at it!", D: "Don't give up!" };

  const handleSubmit = async () => {
    if (!username.trim()) { setError("Enter a name first"); return; }
    setSubmitting(true); setError("");
    try { await submitScore(username.trim(), score); setSubmitted(true); }
    catch { setError("Couldn't save score. Try again."); }
    setSubmitting(false);
  };

  return (
    <div className="screen result-screen">
      <div className="grade-circle"><span className="grade-letter">{grade}</span></div>
      <h2 className="result-title">{gradeMsg[grade]}</h2>
      <div className="result-stats">
        <div className="stat"><span className="stat-val">{score}</span><span className="stat-lbl">Score</span></div>
        <div className="stat"><span className="stat-val">{questionsAnswered}</span><span className="stat-lbl">Survived</span></div>
      </div>
      {!submitted ? (
        <div className="submit-section">
          <p className="submit-prompt">Add to the leaderboard?</p>
          <input className="username-input" placeholder="Your name / nickname" value={username} onChange={e => setUsername(e.target.value)} maxLength={20} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          {error && <p className="error-msg">{error}</p>}
          <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? "Saving…" : "Submit Score"}</button>
        </div>
      ) : <p className="submitted-msg">✓ Score saved!</p>}
      <div className="result-actions">
        <button className="btn-secondary" onClick={onLeaderboard}>🏆 Leaderboard</button>
        <button className="btn-primary" onClick={onRestart}>Play Again</button>
      </div>
    </div>
  );
}

function LeaderboardScreen({ onBack }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const medals = ["🥇", "🥈", "🥉"];
  useEffect(() => {
    getLeaderboard(20).then(setEntries).catch(() => setError("Couldn't load.")).finally(() => setLoading(false));
  }, []);
  return (
    <div className="screen leaderboard-screen">
      <button className="btn-back" onClick={onBack}>← Back</button>
      <h2 className="lb-title">🏆 Top Hunters</h2>
      {loading && <p className="loading-msg">Loading…</p>}
      {error   && <p className="error-msg">{error}</p>}
      {!loading && !error && (
        <div className="lb-list">
          {entries.length === 0 && <p className="empty-msg">No scores yet!</p>}
          {entries.map((entry, i) => (
            <div key={i} className={`lb-row ${i < 3 ? "top-three" : ""}`}>
              <span className="lb-rank">{medals[i] || `#${i + 1}`}</span>
              <span className="lb-name">{entry.username}</span>
              <span className="lb-score">{entry.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen]             = useState("home");
  const [activeMode, setActiveMode]     = useState(null);
  const [finalScore, setFinalScore]     = useState(0);
  const [finalQs, setFinalQs]           = useState(0);
  const [hunterSettings, setHunterSettings] = useState({ progressive: false, fiftyFifty: false });
  const [arenaUser, setArenaUser]       = useState(null);
  const [arenaPerf, setArenaPerf]       = useState({});

  const handleSelectMode = (mode) => { setActiveMode(mode); setScreen(`${mode}_start`); };
  const handleHunterGameOver = (score, qs) => { setFinalScore(score); setFinalQs(qs); setScreen("result"); };
  const handleArenaStart = (username, perf) => { setArenaUser(username); setArenaPerf(perf); setScreen("arena_game"); };

  return (
    <div className="app-root">
      <div className="bg-glow" />
      {screen === "home"         && <HomeScreen onSelectMode={handleSelectMode} onLeaderboard={() => setScreen("leaderboard")} />}

      {/* 汉字 Hunter */}
      {screen === "hunter_start" && <HunterStart onStart={(s) => { setHunterSettings(s); setScreen("hunter_game"); }} onBack={() => setScreen("home")} />}
      {screen === "hunter_game"  && <HunterGame onGameOver={handleHunterGameOver} settings={hunterSettings} />}

      {/* 字形 Breaker */}
      {screen === "breaker_start" && <BreakerGame onBack={() => setScreen("home")} />}

      {/* 语法 Arena */}
      {screen === "arena_start"  && <ArenaLogin onStart={handleArenaStart} onBack={() => setScreen("home")} />}
      {screen === "arena_game"   && <ArenaGame username={arenaUser} initialPerf={arenaPerf} onBack={() => setScreen("arena_start")} />}

      {/* Shared */}
      {screen === "result"       && <ResultScreen score={finalScore} questionsAnswered={finalQs} onRestart={() => setScreen("home")} onLeaderboard={() => setScreen("leaderboard")} />}
      {screen === "leaderboard"  && <LeaderboardScreen onBack={() => setScreen("home")} />}
    </div>
  );
}
