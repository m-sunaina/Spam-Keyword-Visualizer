'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const spamPatterns = [
  { pattern: 'free', weight: 2 },
  { pattern: 'win', weight: 1.5 },
  { pattern: 'lottery', weight: 3 },
  { pattern: 'click here', weight: 2.5 },
  { pattern: 'congrats', weight: 1.8 },
  { pattern: 'luxury watches', weight: 2 },
  { pattern: 'special discount', weight: 2 },
  { pattern: 'offer', weight: 1.5 },
  { pattern: 'no risk', weight: 1.8 },
  { pattern: 'double your income', weight: 2.5 },
  { pattern: 'cash bonus', weight: 2.2 },
  { pattern: 'get paid', weight: 2 },
  { pattern: 'risk-free', weight: 1.9 },
  { pattern: 'work from home', weight: 2.7 },
  { pattern: 'credit card required', weight: 2.4 },
  { pattern: 'act immediately', weight: 2.3 },
  { pattern: 'limited time', weight: 2.1 },
  { pattern: 'winner', weight: 1.7 },
  { pattern: 'exclusive deal', weight: 2 },
  { pattern: 'urgent response needed', weight: 2.5 },
  { pattern: 'pre-approved', weight: 2 },
  { pattern: 'guaranteed', weight: 1.9 },
  { pattern: 'earn extra cash', weight: 2.4 },
  { pattern: '100% free', weight: 2.6 },

];


type Algorithm = 'brute' | 'horspool';

export default function Home() {
  const [text, setText] = useState('Hello, I am offering you a special discount on luxury watches.');
  const [algo, setAlgo] = useState<Algorithm>('brute');
  const [speed, setSpeed] = useState(1);
  const [stopOnFirstMatch, setStopOnFirstMatch] = useState(true);
  const [steps, setSteps] = useState<any[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [finalStats, setFinalStats] = useState<{ score: number; comparisons: number } | null>(null);
  const [shiftTable, setShiftTable] = useState<Record<string, Record<string, number>>>({});
  const scrollRef = useRef<HTMLSpanElement | null>(null);

  const getMatchingPatterns = () =>
    spamPatterns.filter(({ pattern }) => text.toLowerCase().includes(pattern.toLowerCase()));

  const generateHorspoolShiftTable = (pattern: string) => {
    const table: Record<string, number> = {};
    const m = pattern.length;
    for (let i = 0; i < m - 1; i++) {
      table[pattern[i]] = m - 1 - i;
    }
    return table;
  };

  const runBruteForce = () => {
    const matches = getMatchingPatterns();
    const allSteps: any[] = [];
    let score = 0,
      comps = 0;

    for (const { pattern, weight } of matches) {
      const m = pattern.length;
      for (let i = 0; i <= text.length - m; i++) {
        let j = 0;
        for (; j < m; j++) {
          const match = text[i + j]?.toLowerCase() === pattern[j].toLowerCase();
          comps++;
          allSteps.push({ i, j, pattern, match, algo: 'brute' });
          if (!match) break;
        }
        if (j === m) {
          score += weight;
          if (stopOnFirstMatch) break;
        }
      }
    }

    setSteps(allSteps);
    setFinalStats({ score, comparisons: comps });
    setStepIndex(0);
    setIsRunning(true);
  };

  const runHorspool = () => {
    const matches = getMatchingPatterns();
    const allSteps: any[] = [];
    let score = 0,
      comps = 0;
    const fullTable: Record<string, Record<string, number>> = {};

    for (const { pattern, weight } of matches) {
      const m = pattern.length;
      const table = generateHorspoolShiftTable(pattern);
      fullTable[pattern] = table;
      let i = 0;
      while (i <= text.length - m) {
        let j = m - 1;
        while (j >= 0) {
          const match = text[i + j]?.toLowerCase() === pattern[j].toLowerCase();
          comps++;
          allSteps.push({ i, j, pattern, match, algo: 'horspool' });
          if (!match) break;
          j--;
        }
        if (j < 0) {
          score += weight;
          if (stopOnFirstMatch) break;
          i += 1;
        } else {
          const c = text[i + m - 1];
          i += table[c] ?? m;
        }
      }
    }

    setShiftTable(fullTable);
    setSteps(allSteps);
    setFinalStats({ score, comparisons: comps });
    setStepIndex(0);
    setIsRunning(true);
  };

  const run = () => {
    setSteps([]);
    setFinalStats(null);
    setShiftTable({});
    if (algo === 'brute') runBruteForce();
    else runHorspool();
  };

  useEffect(() => {
    if (!isRunning || stepIndex >= steps.length) {
      setIsRunning(false);
      return;
    }
    const timer = setTimeout(() => setStepIndex((prev) => prev + 1), 1000 / speed);
    return () => clearTimeout(timer);
  }, [stepIndex, isRunning, speed]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [stepIndex]);

  const currentStep = steps[stepIndex];

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white p-6 space-y-6">
      <h1 className="text-4xl font-extrabold text-yellow-300 drop-shadow-lg">Spam Keyword Detection Visualizer</h1>

      <textarea
        className="w-full border border-gray-400 rounded p-3 bg-gray-900 text-white"
        rows={4}
        placeholder="Enter email content..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex flex-wrap items-center gap-4">
        <label className="text-white font-semibold">Algorithm:</label>
        <button
          onClick={() => setAlgo('brute')}
          className={`px-4 py-2 rounded ${algo === 'brute' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-black'}`}
        >
          Brute Force
        </button>
        <button
          onClick={() => setAlgo('horspool')}
          className={`px-4 py-2 rounded ${algo === 'horspool' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-black'}`}
        >
          Horspool
        </button>

        <button onClick={run} className="px-4 py-2 bg-green-600 text-white rounded font-bold">
          Run
        </button>

        {steps.length > 0 && (
          <>
            <button
              onClick={() => setIsRunning((prev) => !prev)}
              className={`px-4 py-2 rounded font-bold ${
                isRunning ? 'bg-yellow-500 text-black' : 'bg-purple-500 text-white'
              }`}
            >
              {isRunning ? 'Pause' : 'Resume'}
            </button>

            <button
              onClick={() => {
                setSteps([]);
                setStepIndex(0);
                setIsRunning(false);
                setFinalStats(null);
                setShiftTable({});
              }}
              className="px-4 py-2 bg-red-600 text-white rounded font-bold"
            >
              Reset
            </button>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div>
          <label className="text-white font-semibold">Animation Speed:</label>
          <input
            type="range"
            min={0.25}
            max={5}
            step={0.25}
            defaultValue={1}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-white font-semibold">Stop on first match:</label>
          <input
            type="checkbox"
            checked={stopOnFirstMatch}
            onChange={(e) => setStopOnFirstMatch(e.target.checked)}
          />
        </div>
      </div>

      <div className="bg-gray-900 p-4 rounded border border-gray-700 text-white">
        <h3 className="text-lg font-bold mb-2">ℹ️ How is the Spam Score Calculated?</h3>
        <p>
          The spam score is calculated by scanning the input text for known spam patterns. Each pattern has a
          specific weight. When a match is found, its weight is added to the total spam score. If "Stop on first
          match" is enabled, only the first match per pattern contributes to the score.
        </p>
      </div>

      {currentStep && (
        <motion.div
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 rounded text-white shadow-md"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-lg font-semibold">
            Comparing "<code className="bg-white text-black px-1 rounded">{currentStep.pattern}</code>" at position{' '}
            <span className="font-bold">{currentStep.i + currentStep.j}</span> —{' '}
            <span className={currentStep.match ? 'text-lime-200 font-bold' : 'text-red-200 font-bold'}>
              {currentStep.match ? 'Match ✅' : 'Mismatch ❌'}
            </span>
          </p>
        </motion.div>
      )}

      {!isRunning && finalStats && stepIndex >= steps.length && (
        <motion.div
          className="bg-gradient-to-br from-green-700 via-emerald-600 to-lime-600 text-white p-4 rounded shadow-lg border border-green-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-xl font-bold mb-2">📊 Final Stats</h2>
          <p>
            <strong>Total Comparisons:</strong> {finalStats.comparisons}
          </p>
          <p>
            <strong>Spam Score:</strong> <span className="text-yellow-200">{finalStats.score.toFixed(2)}</span>
          </p>
        </motion.div>
      )}

      {algo === 'horspool' && Object.keys(shiftTable).length > 0 && (
        <div className="bg-white text-black p-4 rounded border">
          <h3 className="font-bold mb-2">Horspool Shift Tables:</h3>
          {Object.entries(shiftTable).map(([pattern, table]) => (
            <div key={pattern} className="mb-2">
              <strong>{pattern}:</strong>{' '}
              {Object.entries(table).map(([char, val]) => (
                <span key={char} className="inline-block mr-2">
                  {char} → {val}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="font-mono whitespace-pre bg-gray-950 text-white p-4 rounded-xl border border-gray-700 overflow-x-auto relative shadow-lg space-y-2">
        <div className="flex w-fit text-xl">
          {text.split('').map((char, idx) => {
            const highlight = currentStep && idx === currentStep.i + currentStep.j;
            return (
              <motion.span
                key={idx}
                ref={highlight ? scrollRef : null}
                className={`inline-block px-2 py-1 rounded ${
                  highlight ? (currentStep.match ? 'bg-green-500 text-black' : 'bg-red-500 text-white') : ''
                }`}
              >
                {char}
              </motion.span>
            );
          })}
        </div>

        {currentStep && (
          <div className="flex w-fit mt-1 text-xl">
            {Array.from({ length: currentStep.i }).map((_, k) => (
              <span key={k} className="inline-block px-2 py-1 text-transparent">.</span>
            ))}
            {currentStep.pattern.split('').map((char: string, j: number) => {
              const isCurrent = j === currentStep.j;
              return (
                <motion.span
                  key={j}
                  className={`inline-block px-2 py-1 rounded ${
                    isCurrent
                      ? currentStep.match
                        ? 'bg-green-500 text-black'
                        : 'bg-red-500 text-white'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  {char}
                </motion.span>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
