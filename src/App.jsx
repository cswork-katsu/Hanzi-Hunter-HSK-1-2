import { useState, useEffect, useCallback, useRef } from "react";
import { vocabulary, generateChoices } from "./data/vocabulary";
import { submitScore, getLeaderboard } from "./supabase";
import "./index.css";

const BASE_POINTS = 100;
const STREAK_BONUS = 50;
const STREAK_BONUS_THRESHOLD = 3;

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Endless shuffled queue — refills when exhausted
function makeQueue() {
  return shuffle([...vocabulary]);
}

function buildQuestion(word) {
  return { correct: word, choices: generateChoices(word, vocabulary) };
}

// ── Screens ────────────────────────────────────────────────────────────────

function StartScreen({ onStart, onLeaderboard }) {
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

      <button className="btn-primary" onClick={onStart}>开始 · START</button>
      <button className="btn-secondary" onClick={onLeaderboard}>🏆 Leaderboard</button>
    </div>
  );
}

function GameScreen({ onGameOver }) {
  const queueRef = useRef(makeQueue());
  const usedRef = useRef(new Set());
  const [question, setQuestion] = useState(() => {
    const q = queueRef.current.shift();
    usedRef.current.add(q.hanzi);
    return buildQuestion(q);
  });

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [qCount, setQCount] = useState(1);
  const [selected, setSelected] = useState(null);
  const [phase, setPhase] = useState("question"); // question | feedback
  const [correct, setCorrect] = useState(false);
  const [streakPopped, setStreakPopped] = useState(false);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [dying, setDying] = useState(false);

  const nextWord = useCallback(() => {
    if (queueRef.current.length === 0) {
      queueRef.current = makeQueue().filter(w => !usedRef.current.has(w.hanzi));
      if (queueRef.current.length === 0) {
        // All words used — full reset
        usedRef.current.clear();
        queueRef.current = makeQueue();
      }
    }
    const word = queueRef.current.shift();
    usedRef.current.add(word.hanzi);
    return buildQuestion(word);
  }, []);

  const handleChoice = useCallback((choice) => {
    if (phase !== "question") return;
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
      // Delay game-over so player sees the correct answer
      setTimeout(() => onGameOver(score, qCount), 1800);
    }
  }, [phase, question, streak, score, qCount, onGameOver]);

  const handleNext = useCallback(() => {
    setQuestion(nextWord());
    setSelected(null);
    setPhase("question");
    setCorrect(false);
    setQCount(c => c + 1);
  }, [nextWord]);

  // Progress indicator — cycles through 150 questions visually
  const progressPct = ((qCount - 1) % vocabulary.length) / vocabulary.length * 100;

  return (
    <div className="screen game-screen">
      {/* Header */}
      <div className="game-header">
        <div className="lives">
          <span className={`heart ${dying ? "dead" : "alive"}`}>♥</span>
        </div>
        <div className="q-counter">#{qCount}</div>
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
          let cls = "choice-btn";
          if (phase === "feedback") {
            if (choice.hanzi === question.correct.hanzi) cls += " correct";
            else if (choice.hanzi === selected) cls += " wrong";
            else cls += " dimmed";
          }
          return (
            <button
              key={choice.hanzi}
              className={cls}
              onClick={() => handleChoice(choice)}
              disabled={phase === "feedback"}
            >
              <span className="choice-hanzi">{choice.hanzi}</span>
              {phase === "feedback" && (
                <span className="choice-pinyin">{choice.pinyin}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Next / Game Over */}
      {phase === "feedback" && !dying && (
        <button className="btn-next" onClick={handleNext}>
          Next →
        </button>
      )}
      {dying && (
        <div className="game-over-banner">
          ☠️ Game over — loading your result…
        </div>
      )}
    </div>
  );
}

function ResultScreen({ score, questionsAnswered, onRestart, onLeaderboard }) {
  const [username, setUsername] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

function LeaderboardScreen({ onBack }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
      {error && <p className="error-msg">{error}</p>}
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
  const [screen, setScreen] = useState("start");
  const [finalScore, setFinalScore] = useState(0);
  const [finalQs, setFinalQs] = useState(0);

  const handleGameOver = (score, qs) => {
    setFinalScore(score);
    setFinalQs(qs);
    setScreen("result");
  };

  return (
    <div className="app-root">
      <div className="bg-glow" />
      {screen === "start"       && <StartScreen onStart={() => setScreen("game")} onLeaderboard={() => setScreen("leaderboard")} />}
      {screen === "game"        && <GameScreen onGameOver={handleGameOver} />}
      {screen === "result"      && <ResultScreen score={finalScore} questionsAnswered={finalQs} onRestart={() => setScreen("game")} onLeaderboard={() => setScreen("leaderboard")} />}
      {screen === "leaderboard" && <LeaderboardScreen onBack={() => setScreen(finalScore > 0 ? "result" : "start")} />}
    </div>
  );
}
