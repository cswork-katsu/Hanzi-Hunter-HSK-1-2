import { useState, useEffect, useCallback } from "react";
import { vocabulary, generateChoices } from "./data/vocabulary";
import { submitScore, getLeaderboard } from "./supabase";
import "./index.css";

const QUESTIONS_PER_GAME = 10;
const MAX_LIVES = 3;
const STREAK_BONUS_THRESHOLD = 3;
const BASE_POINTS = 100;
const STREAK_BONUS = 50;

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildQuestions() {
  const pool = shuffle(vocabulary).slice(0, QUESTIONS_PER_GAME);
  return pool.map((word) => ({
    correct: word,
    choices: generateChoices(word, vocabulary),
  }));
}

// ── Screens ────────────────────────────────────────────────────────────────

function StartScreen({ onStart }) {
  return (
    <div className="screen start-screen">
      <div className="logo-wrap">
        <span className="logo-hanzi">汉</span>
        <div className="logo-text">
          <h1>HANZI<br />HUNTER</h1>
          <p className="tagline">HSK 1–2 Character Challenge</p>
        </div>
      </div>
      <div className="how-to">
        <div className="rule"><span className="rule-icon">🎯</span><span>Match the English meaning to the correct hanzi</span></div>
        <div className="rule"><span className="rule-icon">❤️</span><span>3 lives · 10 questions per round</span></div>
        <div className="rule"><span className="rule-icon">🔥</span><span>3-in-a-row streak = +50 bonus points</span></div>
        <div className="rule"><span className="rule-icon">📖</span><span>Wrong answers reveal pinyin tips</span></div>
      </div>
      <button className="btn-primary" onClick={onStart}>开始 · START</button>
    </div>
  );
}

function GameScreen({ onGameOver }) {
  const [questions] = useState(buildQuestions);
  const [qIndex, setQIndex] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selected, setSelected] = useState(null);
  const [phase, setPhase] = useState("question"); // question | feedback
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const [streakPopped, setStreakPopped] = useState(false);
  const [shakeWrong, setShakeWrong] = useState(false);

  const current = questions[qIndex];

  const handleChoice = useCallback((choice) => {
    if (phase !== "question") return;
    const isCorrect = choice.hanzi === current.correct.hanzi;
    setSelected(choice.hanzi);
    setFeedbackCorrect(isCorrect);
    setPhase("feedback");

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const bonus = newStreak >= STREAK_BONUS_THRESHOLD ? STREAK_BONUS : 0;
      setScore((s) => s + BASE_POINTS + bonus);
      if (bonus > 0) {
        setStreakPopped(true);
        setTimeout(() => setStreakPopped(false), 1000);
      }
    } else {
      setStreak(0);
      setLives((l) => l - 1);
      setShakeWrong(true);
      setTimeout(() => setShakeWrong(false), 500);
    }
  }, [phase, current, streak]);

  const handleNext = useCallback(() => {
    const newLives = feedbackCorrect ? lives : lives;
    if (!feedbackCorrect && lives - 1 <= 0) {
      onGameOver(score, qIndex + 1);
      return;
    }
    if (qIndex + 1 >= QUESTIONS_PER_GAME) {
      onGameOver(score + (feedbackCorrect ? 0 : 0), QUESTIONS_PER_GAME);
      return;
    }
    setQIndex((i) => i + 1);
    setSelected(null);
    setPhase("question");
    setFeedbackCorrect(false);
  }, [feedbackCorrect, lives, qIndex, score, onGameOver]);

  // After wrong → if lives run out, end immediately
  useEffect(() => {
    if (phase === "feedback" && !feedbackCorrect && lives <= 0) {
      setTimeout(() => onGameOver(score, qIndex + 1), 1400);
    }
  }, [phase, feedbackCorrect, lives, score, qIndex, onGameOver]);

  const progress = ((qIndex) / QUESTIONS_PER_GAME) * 100;

  return (
    <div className="screen game-screen">
      {/* Header */}
      <div className="game-header">
        <div className="lives">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <span key={i} className={`heart ${i < lives ? "alive" : "dead"}`}>♥</span>
          ))}
        </div>
        <div className="q-counter">{qIndex + 1} / {QUESTIONS_PER_GAME}</div>
        <div className="score-display">
          <span className="score-label">分</span>
          <span className="score-value">{score}</span>
          {streakPopped && <span className="streak-pop">+50🔥</span>}
        </div>
      </div>

      {/* Progress */}
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

      {/* Streak badge */}
      {streak >= 3 && (
        <div className="streak-badge">🔥 {streak} streak!</div>
      )}

      {/* Question */}
      <div className={`question-card ${shakeWrong ? "shake" : ""}`}>
        <p className="question-label">What is the hanzi for…</p>
        <h2 className="english-word">{current.correct.english}</h2>
        {phase === "feedback" && (
          <p className="pinyin-reveal">
            {feedbackCorrect
              ? `✓ ${current.correct.hanzi} · ${current.correct.pinyin}`
              : `✗ Correct: ${current.correct.hanzi} · ${current.correct.pinyin}`}
          </p>
        )}
      </div>

      {/* Choices */}
      <div className="choices-grid">
        {current.choices.map((choice) => {
          let cls = "choice-btn";
          if (phase === "feedback") {
            if (choice.hanzi === current.correct.hanzi) cls += " correct";
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

      {/* Next button */}
      {phase === "feedback" && lives > 0 && (
        <button className="btn-next" onClick={handleNext}>
          {qIndex + 1 >= QUESTIONS_PER_GAME ? "See Results →" : "Next →"}
        </button>
      )}
    </div>
  );
}

function ResultScreen({ score, questionsAnswered, onRestart, onLeaderboard }) {
  const [username, setUsername] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const accuracy = Math.round((score / (questionsAnswered * BASE_POINTS)) * 100);
  const grade = score >= 900 ? "S" : score >= 700 ? "A" : score >= 500 ? "B" : score >= 300 ? "C" : "D";
  const gradeMsg = { S: "Master!", A: "Excellent!", B: "Good job!", C: "Keep practicing!", D: "Don't give up!" };

  const handleSubmit = async () => {
    if (!username.trim()) { setError("Enter a username first"); return; }
    setSubmitting(true);
    setError("");
    try {
      await submitScore(username.trim(), score);
      setSubmitted(true);
    } catch {
      setError("Couldn't save score. Check your connection.");
    }
    setSubmitting(false);
  };

  return (
    <div className="screen result-screen">
      <div className="grade-circle grade-{grade.toLowerCase()}">
        <span className="grade-letter">{grade}</span>
      </div>
      <h2 className="result-title">{gradeMsg[grade]}</h2>
      <div className="result-stats">
        <div className="stat"><span className="stat-val">{score}</span><span className="stat-lbl">Score</span></div>
        <div className="stat"><span className="stat-val">{questionsAnswered}</span><span className="stat-lbl">Questions</span></div>
      </div>

      {!submitted ? (
        <div className="submit-section">
          <p className="submit-prompt">Submit your score to the leaderboard?</p>
          <input
            className="username-input"
            placeholder="Your name / nickname"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          {error && <p className="error-msg">{error}</p>}
          <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : "Submit Score"}
          </button>
        </div>
      ) : (
        <p className="submitted-msg">✓ Score submitted!</p>
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

  useEffect(() => {
    getLeaderboard(20)
      .then(setEntries)
      .catch(() => setError("Couldn't load leaderboard."))
      .finally(() => setLoading(false));
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

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
  const [screen, setScreen] = useState("start"); // start | game | result | leaderboard
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
      {screen === "start" && <StartScreen onStart={() => setScreen("game")} />}
      {screen === "game" && <GameScreen onGameOver={handleGameOver} />}
      {screen === "result" && (
        <ResultScreen
          score={finalScore}
          questionsAnswered={finalQs}
          onRestart={() => setScreen("game")}
          onLeaderboard={() => setScreen("leaderboard")}
        />
      )}
      {screen === "leaderboard" && <LeaderboardScreen onBack={() => setScreen("result")} />}
    </div>
  );
}
