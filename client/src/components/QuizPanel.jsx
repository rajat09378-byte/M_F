import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '../context/SessionContext';
import { HelpCircle, CheckCircle, XCircle, ChevronRight, RotateCcw, Trophy, Zap } from 'lucide-react';

export default function QuizPanel() {
  const { sessionData } = useSession();
  const questions = sessionData?.quiz?.questions || [];

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);

  if (questions.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <HelpCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/50">No quiz questions available for this session.</p>
      </div>
    );
  }

  const q = questions[current];
  const score = Object.values(answers).filter((a) => a.correct).length;

  const handleSelect = (idx) => {
    if (revealed) return;
    setSelected(idx);
  };

  const handleReveal = () => {
    if (selected === null) return;
    const correct = selected === q.answer;
    setAnswers((prev) => ({ ...prev, [current]: { selected, correct } }));
    setRevealed(true);
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      setFinished(true);
    }
  };

  const handleReset = () => {
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setAnswers({});
    setFinished(false);
  };

  const pct = Math.round((score / questions.length) * 100);
  const getGrade = () => {
    if (pct >= 90) return { label: 'Outstanding!', color: '#22c55e', emoji: '🏆' };
    if (pct >= 70) return { label: 'Well Done!', color: '#22d3ee', emoji: '🎯' };
    if (pct >= 50) return { label: 'Good Try!', color: '#f59e0b', emoji: '💪' };
    return { label: 'Keep Practicing!', color: '#ef4444', emoji: '📚' };
  };

  // Finished screen
  if (finished) {
    const grade = getGrade();
    return (
      <div className="relative z-10">
        <motion.div
          className="glass-card p-12 text-center max-w-xl mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-6xl mb-4">{grade.emoji}</div>
          <h2 className="text-3xl font-black text-white mb-2" style={{ color: grade.color }}>
            {grade.label}
          </h2>
          <div className="text-6xl font-black my-6" style={{ color: grade.color }}>{pct}%</div>
          <p className="text-white/60 mb-6">
            You got <span className="text-white font-bold">{score}</span> out of{' '}
            <span className="text-white font-bold">{questions.length}</span> questions correct.
          </p>

          {/* Score breakdown */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: 'Correct', value: score, color: '#22c55e' },
              { label: 'Wrong', value: questions.length - score, color: '#ef4444' },
              { label: 'Total', value: questions.length, color: '#5a5fff' },
            ].map((s) => (
              <div key={s.label} className="stat-card text-center">
                <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-white/40 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Question review */}
          <div className="text-left space-y-2 mb-8">
            {questions.map((qq, i) => {
              const ans = answers[i];
              const isCorrect = ans?.correct;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' }}
                >
                  {isCorrect
                    ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                  <span className="text-sm text-white/70 truncate">{qq.question}</span>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleReset}
            className="btn-glow w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative z-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-pink-400" />
            Knowledge Quiz
          </h2>
          <p className="text-white/50 text-sm mt-1">{sessionData?.subject} · {questions.length} questions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 glass-card rounded-xl">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold text-yellow-400">{score}/{questions.length}</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-white/40 mb-2">
          <span>Question {current + 1} of {questions.length}</span>
          <span>{Math.round(((current) / questions.length) * 100)}% complete</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden flex gap-1">
          {questions.map((_, i) => {
            const ans = answers[i];
            return (
              <div
                key={i}
                className="flex-1 h-full rounded-full transition-all"
                style={{
                  background: ans
                    ? ans.correct ? '#22c55e' : '#ef4444'
                    : i === current ? '#5a5fff' : 'rgba(255,255,255,0.07)',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
        >
          <div className="glass-card p-8 mb-6">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                {current + 1}
              </div>
              <p className="text-lg text-white leading-relaxed font-medium">{q.question}</p>
            </div>

            <div className="space-y-3">
              {q.options.map((opt, idx) => {
                let optClass = 'quiz-option';
                let icon = null;

                if (revealed) {
                  if (idx === q.answer) {
                    optClass += ' correct';
                    icon = <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />;
                  } else if (idx === selected && idx !== q.answer) {
                    optClass += ' incorrect';
                    icon = <XCircle className="w-5 h-5 text-red-400 shrink-0" />;
                  }
                } else if (idx === selected) {
                  optClass += ' !border-forge-500/70 !bg-forge-600/15';
                }

                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    className={`${optClass} w-full text-left flex items-center gap-4`}
                    whileHover={!revealed ? { x: 6 } : {}}
                    whileTap={!revealed ? { scale: 0.99 } : {}}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                        idx === selected && !revealed
                          ? 'bg-forge-600 text-white'
                          : 'bg-white/5 text-white/50'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-white/80 flex-1">{opt}</span>
                    {icon}
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-semibold text-cyan-400">Explanation</span>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed">{q.explanation}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {!revealed ? (
              <motion.button
                onClick={handleReveal}
                disabled={selected === null}
                className={`btn-glow flex-1 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 ${
                  selected === null ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                whileHover={selected !== null ? { scale: 1.02 } : {}}
                whileTap={selected !== null ? { scale: 0.98 } : {}}
              >
                Check Answer
              </motion.button>
            ) : (
              <motion.button
                onClick={handleNext}
                className="btn-glow flex-1 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {current < questions.length - 1 ? (
                  <>Next Question <ChevronRight className="w-4 h-4" /></>
                ) : (
                  <>View Results <Trophy className="w-4 h-4" /></>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
