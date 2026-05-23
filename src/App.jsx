import { useState, useEffect, useCallback, useRef } from "react";
import { vocabulary, generateChoices } from "./data/vocabulary";
import { submitScore, getLeaderboard } from "./supabase";
import "./index.css";

const BASE_POINTS = 100;
const STREAK_BONUS = 50;
const STREAK_BONUS_THRESHOLD = 3;

// HSK1 first (easier), then HSK2 — each group shuffled internally
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

// ── Start Screen ───────────────────────────────────────────────────────────

function StartScreen({ onStart, onLeaderboard }) {
  const [progressive, setProgressive] = useState(false);
  const [fiftyFifty, setFiftyFifty] = useState(false);

  return (
    <div className="screen start-screen">
      <div className="logo-wrap">
        <div className="logo-top">
          <span className="logo-hanzi">汉</span>
          <div className="logo-text">
            <h1>HANZI<br />HUNTER</h1>
          </div>
        </div>
        <p className="tagline">HSK 1–2 Character Challenge</p>
        <div className="survival-badge">☠️ One-Strike Survival Mode</div>
      </div>

      <div className="how-to">
        <div className="rule"><span className="rule-icon">🎯</span><span>Match the English meaning to the correct hanzi</span></div>
        <div className="rule"><span className="rule-icon">☠️</span><span>One wrong answer — game over. No second chances.</span></div>
        <div className="rule"><span className="rule-icon">🔥</span><span>3-in-a-row streak = +50 bonus points per question</span></div>
        <div className="rule"><span className="rule-icon">♾️</span><span>Endless questions — survive as long as you can!</span></div>
      </div>

      {/* Helper options */}
      <div className="helpers-section">
        <p className="helpers-title">Training helpers</p>
        <label className="checkbox-row" onClick={() => setProgressive(v => !v)}>
          <span className={`checkbox ${progressive ? "checked" : ""}`}>
            {progressive && <span className="checkmark">✓</span>}
          </span>
          <div className="checkbox-text">
            <span className="checkbox-label">Progressive difficulty</span>
            <span className="checkbox-desc">Start with HSK 1 words before moving to HSK 2</span>
          </div>
        </label>
        <label className="checkbox-row" onClick={() => setFiftyFifty(v => !v)}>
          <span className={`checkbox ${fiftyFifty ? "checked" : ""}`}>
            {fiftyFifty && <span className="checkmark">✓</span>}
          </span>
          <div className="checkbox-text">
            <span className="checkbox-label">50:50 lifeline</span>
            <span className="checkbox-desc">One-time button to remove 2 wrong options per question</span>
          </div>
        </label>
      </div>

      <button className="btn-primary" onClick={() => onStart({ progressive, fiftyFifty })}>
        开始 · START
      </button>
      <button className="btn-secondary" onClick={onLeaderboard}>🏆 Leaderboard</button>
    </div>
  );
}

// ── Game Screen ────────────────────────────────────────────────────────────

function GameScreen({ onGameOver, settings }) {
  const { progressive, fiftyFifty: hasFiftyFifty } = settings;

  const queueRef = useRef(progressive ? makeProgressiveQueue() : makeRandomQueue());
  const usedRef  = useRef(new Set());

  const firstWord = queueRef.current.shift();
  usedRef.current.add(firstWord.hanzi);
  const [question, setQuestion]     = useState(() => buildQuestion(firstWord));
  const [score, setScore]           = useState(0);
  const [streak, setStreak]         = useState(0);
  const [qCount, setQCount]         = useState(1);
  const [selected, setSelected]     = useState(null);
  const [phase, setPhase]           = useState("question");
  const [correct, setCorrect]       = useState(false);
  const [streakPopped, setStreakPopped] = useState(false);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [dying, setDying]           = useState(false);

  // 50:50 state — one use per question
  const [fiftyUsed, setFiftyUsed]       = useState(false);       // used on THIS question
  const [fiftyStock, setFiftyStock]     = useState(hasFiftyFifty ? 1 : 0); // remaining uses
  const [eliminated, setEliminated]     = useState(new Set());   // which choices are hidden

  const nextWord = useCallback(() => {
    if (queueRef.current.length === 0) {
      const refill = (progressive ? makeProgressiveQueue() : makeRandomQueue())
        .filter(w => !usedRef.current.has(w.hanzi));
      queueRef.current = refill.length > 0 ? refill : (progressive ? makeProgressiveQueue() : makeRandomQueue());
      usedRef.current.clear();
    }
    const word = queueRef.current.shift();
    usedRef.current.add(word.hanzi);
    return buildQuestion(word);
  }, [progressive]);

  const handleFiftyFifty = useCallback(() => {
    if (fiftyUsed || fiftyStock <= 0 || phase !== "question") return;

    // Pick 2 wrong choices to eliminate
    const wrong = question.choices.filter(c => c.hanzi !== question.correct.hanzi);
    const toEliminate = wrong.sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminated(new Set(toEliminate.map(c => c.hanzi)));
    setFiftyUsed(true);
    setFiftyStock(s => s - 1);
  }, [fiftyUsed, fiftyStock, phase, question]);

  const handleChoice = useCallback((choice) => {
    if (phase !== "question") return;
    if (eliminated.has(choice.hanzi)) return;

    const isCorrect = choice.hanzi === question.correct.hanzi;
    setSelected(choice.hanzi);
    setCorrect(isCorrect);
    setPhase("feedback");

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const bonus = newStreak >= STREAK_BONUS_THRESHOLD ? STREAK_BONUS : 0;
      setScore(s => s + BASE_POINTS + bonus);
      if (bonus > 0) {
        setStreakPopped(true);
        setTimeout(() => setStreakPopped(false), 900);
      }
    } else {
      setShakeWrong(true);
      setDying(true);
      setTimeout(() => setShakeWrong(false), 500);
      setTimeout(() => onGameOver(score, qCount), 1800);
    }
  }, [phase, eliminated, question, streak, score, qCount, onGameOver]);

  const handleNext = useCallback(() => {
    setQuestion(nextWord());
    setSelected(null);
    setPhase("question");
    setCorrect(false);
    setFiftyUsed(false);
    setEliminated(new Set());
    setQCount(c => c + 1);
    // Refill stock: one new use per question if option is on
    if (hasFiftyFifty) setFiftyStock(1);
  }, [nextWord, hasFiftyFifty]);

  const progressPct = ((qCount - 1) % vocabulary.length) / vocabulary.length * 100;

  // Level label for progressive mode
  const levelTag = progressive
    ? (question.correct.level === 1 ? "HSK 1" : "HSK 2")
    : null;

  return (
    <div className="screen game-screen">
      {/* Header */}
      <div className="game-header">
        <div className="lives">
          <span className={`heart ${dying ? "dead" : "alive"}`}>♥</span>
        </div>
        <div className="q-counter">
          #{qCount}
          {levelTag && <span className={`level-tag level-${question.correct.level}`}>{levelTag}</span>}
        </div>
        <div className="score-display">
          <span className="score-label">分</span>
          <span className="score-value">{score}</span>
          {streakPopped && <span className="streak-pop">+50🔥</span>}
        </div>
      </div>

      {/* Progress */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Streak badge */}
      {streak >= 3 && !dying && (
        <div className="streak-badge">🔥 {streak}-streak!</div>
      )}

      {/* Question */}
      <div className={`question-card ${shakeWrong ? "shake" : ""}`}>
        <p className="question-label">What is the hanzi for…</p>
        <h2 className="english-word">{question.correct.english}</h2>
        {phase === "feedback" && (
          <p className="pinyin-reveal">
            {correct
              ? `✓ ${question.correct.hanzi} · ${question.correct.pinyin}`
              : `✗ Answer: ${question.correct.hanzi} · ${question.correct.pinyin}`}
          </p>
        )}
      </div>

      {/* Choices */}
      <div className="choices-grid">
        {question.choices.map((choice) => {
          const isEliminated = eliminated.has(choice.hanzi);
          let cls = "choice-btn";
          if (isEliminated) cls += " eliminated";
          else if (phase === "feedback") {
            if (choice.hanzi === question.correct.hanzi) cls += " correct";
            else if (choice.hanzi === selected) cls += " wrong";
            else cls += " dimmed";
          }
          return (
            <button
              key={choice.hanzi}
              className={cls}
              onClick={() => handleChoice(choice)}
              disabled={phase === "feedback" || isEliminated}
            >
              {isEliminated
                ? <span className="choice-hanzi eliminated-x">✕</span>
                : <>
                    <span className="choice-hanzi">{choice.hanzi}</span>
                    {phase === "feedback" && (
                      <span className="choice-pinyin">{choice.pinyin}</span>
                    )}
                  </>
              }
            </button>
          );
        })}
      </div>

      {/* 50:50 button — only shown if option is on */}
      {hasFiftyFifty && phase === "question" && (
        <button
          className={`btn-fifty ${fiftyUsed || fiftyStock <= 0 ? "used" : ""}`}
          onClick={handleFiftyFifty}
          disabled={fiftyUsed || fiftyStock <= 0}
        >
          {fiftyUsed ? "50:50 used" : "⚡ 50:50 — Remove 2 options"}
        </button>
      )}

      {/* Next / dying */}
      {phase === "feedback" && !dying && (
        <button className="btn-next" onClick={handleNext}>Next →</button>
      )}
      {dying && (
        <div className="game-over-banner">☠️ Game over — loading your result…</div>
      )}
    </div>
  );
}

// ── Result Screen ──────────────────────────────────────────────────────────

function ResultScreen({ score, questionsAnswered, onRestart, onLeaderboard }) {
  const [username, setUsername]   = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");

  const grade =
    score >= 2000 ? "S" :
    score >= 1200 ? "A" :
    score >= 700  ? "B" :
    score >= 300  ? "C" : "D";
  const gradeMsg = { S: "Legendary!", A: "Excellent!", B: "Good job!", C: "Keep at it!", D: "Don't give up!" };

  const handleSubmit = async () => {
    if (!username.trim()) { setError("Enter a name first"); return; }
    setSubmitting(true); setError("");
    try {
      await submitScore(username.trim(), score);
      setSubmitted(true);
    } catch {
      setError("Couldn't save score. Try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="screen result-screen">
      <div className="grade-circle">
        <span className="grade-letter">{grade}</span>
      </div>
      <h2 className="result-title">{gradeMsg[grade]}</h2>
      <div className="result-stats">
        <div className="stat">
          <span className="stat-val">{score}</span>
          <span className="stat-lbl">Score</span>
        </div>
        <div className="stat">
          <span className="stat-val">{questionsAnswered}</span>
          <span className="stat-lbl">Survived</span>
        </div>
      </div>

      {!submitted ? (
        <div className="submit-section">
          <p className="submit-prompt">Add your score to the leaderboard?</p>
          <input
            className="username-input"
            placeholder="Your name / nickname"
            value={username}
            onChange={e => setUsername(e.target.value)}
            maxLength={20}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
          />
          {error && <p className="error-msg">{error}</p>}
          <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : "Submit Score"}
          </button>
        </div>
      ) : (
        <p className="submitted-msg">✓ Score saved!</p>
      )}

      <div className="result-actions">
        <button className="btn-secondary" onClick={onLeaderboard}>🏆 Leaderboard</button>
        <button className="btn-primary" onClick={onRestart}>Play Again</button>
      </div>
    </div>
  );
}

// ── Leaderboard Screen ─────────────────────────────────────────────────────

function LeaderboardScreen({ onBack }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const medals = ["🥇", "🥈", "🥉"];

  useEffect(() => {
    getLeaderboard(20)
      .then(setEntries)
      .catch(() => setError("Couldn't load leaderboard."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="screen leaderboard-screen">
      <button className="btn-back" onClick={onBack}>← Back</button>
      <h2 className="lb-title">🏆 Top Hunters</h2>
      {loading && <p className="loading-msg">Loading…</p>}
      {error   && <p className="error-msg">{error}</p>}
      {!loading && !error && (
        <div className="lb-list">
          {entries.length === 0 && <p className="empty-msg">No scores yet — be the first!</p>}
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

// ── Root ───────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen]       = useState("start");
  const [finalScore, setFinalScore] = useState(0);
  const [finalQs, setFinalQs]     = useState(0);
  const [gameSettings, setGameSettings] = useState({ progressive: false, fiftyFifty: false });

  const handleGameOver = (score, qs) => {
    setFinalScore(score);
    setFinalQs(qs);
    setScreen("result");
  };

  const handleStart = (settings) => {
    setGameSettings(settings);
    setScreen("game");
  };

  return (
    <div className="app-root">
      <div className="bg-glow" />
      {screen === "start"       && <StartScreen onStart={handleStart} onLeaderboard={() => setScreen("leaderboard")} />}
      {screen === "game"        && <GameScreen onGameOver={handleGameOver} settings={gameSettings} />}
      {screen === "result"      && <ResultScreen score={finalScore} questionsAnswered={finalQs} onRestart={() => setScreen("start")} onLeaderboard={() => setScreen("leaderboard")} />}
      {screen === "leaderboard" && <LeaderboardScreen onBack={() => setScreen(finalScore > 0 ? "result" : "start")} />}
    </div>
  );
}
