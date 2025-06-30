'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';


const spamPatterns = [
 /* { pattern: 'free', weight: 2 },
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
  { pattern: 'ababcabab', weight: 2.6 },*/


  { pattern: 'free', weight: 2 },
  { pattern: 'win', weight: 1.5 },
  { pattern: 'offer', weight: 1.5 },
  { pattern: 'click here', weight: 2.5 },
  { pattern: 'credit card required', weight: 2.4 },
  { pattern: 'risk', weight: 1.2 },
  { pattern: 'risk-free', weight: 1.9 },
  { pattern: 'no risk', weight: 1.8 },
  { pattern: 'work from home', weight: 2.7 },
  { pattern: 'luxury watches', weight: 2 },
  { pattern: 'winner', weight: 1.7 },
  { pattern: 'freefreefree', weight: 2.6 },    // Helps KMP
  { pattern: 'clickclickclick here', weight: 2.8 },  // Helps KMP  
  { pattern: 'double your income', weight: 2.5 }


];


type Algorithm = 'brute' | 'horspool' | 'kmp'|'rabin karp';


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
  const [kmpTables, setKmpTables] = useState<Record<string, number[]>>({});
  const [rkHashTable, setRkHashTable] = useState<{ i: number; window: string; hash: number }[]>([]);
  const [useAllPatterns, setUseAllPatterns] = useState(true);
  const [matchedWords, setMatchedWords] = useState<{ pattern: string; position: number }[]>([]);


  const scrollRef = useRef<HTMLSpanElement | null>(null);

  const getMatchingPatterns = () => {
    if (!useAllPatterns) {
      // Quick check using .includes()
      return spamPatterns.filter(({ pattern }) => text.toLowerCase().includes(pattern.toLowerCase()));
    }
    return spamPatterns;
  };

  const generateHorspoolShiftTable = (pattern: string) => {
    const table: Record<string, number> = {};
    const m = pattern.length;
    for (let i = 0; i < m - 1; i++) {
      table[pattern[i]] = m - 1 - i;
    }
    return table;
  };
  const buildKMPPrefixTable = (pattern: string): number[] => {
  const table = Array(pattern.length).fill(0);
  let len = 0;
  let i = 1;
  while (i < pattern.length) {
    if (pattern[i].toLowerCase() === pattern[len].toLowerCase()) {
      len++;
      table[i] = len;
      i++;
    } else if (len !== 0) {
      len = table[len - 1];
    } else {
      table[i] = 0;
      i++;
    }
  }
  return table;
};

  const runBruteForce = () => {
    const matches = getMatchingPatterns();
    const allSteps: any[] = [];
    const matchedWords: { pattern: string; position: number }[] = [];
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
          matchedWords.push({ pattern, position: i });
          if (stopOnFirstMatch) break;
        }
      }
    }

    setSteps(allSteps);
    setFinalStats({ score, comparisons: comps });
    setStepIndex(0);
    setMatchedWords(matchedWords);
    setIsRunning(true);
  };

  const runHorspool = () => {
    const matches = getMatchingPatterns();
    const allSteps: any[] = [];
    const matchedWords: { pattern: string; position: number }[] = [];
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
          matchedWords.push({ pattern, position: i });
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
    setMatchedWords(matchedWords);
    setIsRunning(true);
  };

 const runKMP = () => {
  const matches = getMatchingPatterns();
  const allSteps: any[] = [];
  const matchedWords: { pattern: string; position: number }[] = [];
  let score = 0, comps = 0;
  const allPrefixTables: Record<string, number[]> = {};

  for (const { pattern, weight } of matches) {
  const m = pattern.length;
  const n = text.length;
  const lps = buildKMPPrefixTable(pattern);
  allPrefixTables[pattern] = lps;

  let i = 0, j = 0;

  while (i < n) {
    const match = text[i]?.toLowerCase() === pattern[j]?.toLowerCase();
    comps++;

    allSteps.push({
      i: i - j,      // position in text where pattern is currently aligned
      j,             // index in pattern
      pattern,
      match,
      algo: 'kmp',
      textChar: text[i],
      patternChar: pattern[j],
    });

    if (match) {
      i++;
      j++;

      if (j === m) {
        score += weight;
        matchedWords.push({ pattern, position: i - j });
        if (stopOnFirstMatch) break;
        j = lps[j - 1]; // prepare to continue search
      }
    } else {
      if (j !== 0) {
        j = lps[j - 1]; // shift using prefix table
      } else {
        i++; // move forward in text
      }
    }
      if (n - i < m - j) break;
  }
}

  setKmpTables(allPrefixTables);
  setSteps(allSteps);
  setFinalStats({ score, comparisons: comps });
  setStepIndex(0);
  setMatchedWords(matchedWords);
  setIsRunning(true);
};

 const runRabinKarp = () => {
  const matches = getMatchingPatterns();
  const allSteps: any[] = [];
  const matchedWords: { pattern: string; position: number }[] = [];
  let score = 0, comps = 0;
  const hashTable: { i: number; window: string; hash: number }[] = [];

  const d = 256;
  const q = 101; // Prime number

  // Precompute hashes for all patterns
  const patternData = matches.map(({ pattern, weight }) => {
    const m = pattern.length;
    let pHash = 0;
    let h = 1;

    for (let i = 0; i < m - 1; i++) {
      h = (h * d) % q;
    }

    for (let i = 0; i < m; i++) {
      pHash = (d * pHash + pattern.charCodeAt(i)) % q;
    }

    return { pattern, weight, m, h, pHash, matched: false };
  });

  const n = text.length;

  patternData.forEach((pData) => {
    const { pattern, weight, m, h, pHash } = pData;
    let windowHash = 0;

    // Initial hash of first window
    for (let i = 0; i < m; i++) {
      windowHash = (d * windowHash + text.charCodeAt(i)) % q;
    }

    for (let i = 0; i <= n - m; i++) {
      if (stopOnFirstMatch && pData.matched) break;

      comps++;
      hashTable.push({
        i: i,
        window: text.substring(i, i + m),
        hash: windowHash
      });

      allSteps.push({
        i,
        j: 0,
        pattern,
        match: windowHash === pHash,
        algo: 'rabin karp',
         pHash,
        windowHash
      });

      // If hash matches, do char-by-char check
      if (windowHash === pHash) {
        let matchFound = true;
        for (let j = 0; j < m; j++) {
          comps++;
          allSteps.push({
            i,
            j,
            pattern,
            match: text[i + j]?.toLowerCase() === pattern[j].toLowerCase(),
            algo: 'rabin karp',
             pHash,
            windowHash
          });

          if (text[i + j]?.toLowerCase() !== pattern[j].toLowerCase()) {
            matchFound = false;
            break;
          }
        }

        if (matchFound) {
          score += weight;
          pData.matched = true;
          matchedWords.push({ pattern, position: i });
          if (stopOnFirstMatch) {
            setRkHashTable(hashTable);
            setSteps(allSteps);
            setFinalStats({ score, comparisons: comps });
            setStepIndex(0);
            setMatchedWords(matchedWords);
            setIsRunning(true);
            return;
          }
        }
      }

      // Rolling hash: update windowHash for next window
      if (i < n - m) {
        windowHash = (d * (windowHash - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % q;
        if (windowHash < 0) windowHash += q;
      }
    }
  });

  setRkHashTable(hashTable);
  setSteps(allSteps);
  setFinalStats({ score, comparisons: comps });
  setStepIndex(0);
  setMatchedWords(matchedWords);
  setIsRunning(true);
};



  const run = () => {
    setSteps([]);
    setFinalStats(null);
    setShiftTable({});
    if (algo === 'brute') runBruteForce();
    else if (algo === 'horspool') runHorspool();
    else if (algo === 'kmp') runKMP();
    else runRabinKarp();

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
        <button
        onClick={() => setAlgo('kmp')}
        className={`px-4 py-2 rounded ${algo === 'kmp' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-black'}`}
      >
        KMP
      </button>
      <button
        onClick={() => setAlgo('rabin karp')}
        className={`px-4 py-2 rounded ${algo === 'rabin karp' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-black'}`}
      >
        Rabin-Karp
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
                setKmpTables({});
                setMatchedWords([]);


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

        <div className="flex items-center gap-2">
          <label className="text-white font-semibold">Use all patterns:</label>
          <input
            type="checkbox"
            checked={useAllPatterns}
            onChange={(e) => setUseAllPatterns(e.target.checked)}
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

    {currentStep.algo === 'rabin karp' && (
      <p className="mt-2 text-sm text-yellow-200">
        Pattern Hash: <strong>{currentStep.pHash}</strong> | Window Hash: <strong>{currentStep.windowHash}</strong>
      </p>
    )}
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

    {/* 👇 New: Matched Patterns and Positions */}
    {matchedWords.length > 0 && (
      <div className="mt-4 bg-white text-black p-4 rounded border border-green-900">
        <h3 className="font-bold mb-2 text-green-800">🟢 Matched Patterns and Positions</h3>
        <ul className="list-disc list-inside space-y-1">
          {matchedWords.map((match, idx) => (
            <li key={idx}>
              Pattern "<span className="font-semibold">{match.pattern}</span>" matched at position{' '}
              <span className="text-blue-600 font-bold">{match.position}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
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


      {algo === 'kmp' && Object.keys(kmpTables).length > 0 && (
    <div className="bg-white text-black p-4 rounded border">
    <h3 className="font-bold mb-2">KMP Prefix Tables:</h3>
    {Object.entries(kmpTables).map(([pattern, table]) => (
      <div key={pattern} className="mb-2">
        <strong>{pattern}:</strong>{' '}
        {table.map((val, idx) => (
          <span key={idx} className="inline-block mr-2">
            [{idx}] → {val}
          </span>
        ))}
      </div>
    ))}
  </div>
)}






      <div className="font-mono whitespace-pre bg-gray-950 text-white p-4 rounded-xl border border-gray-700 overflow-x-auto relative shadow-lg space-y-2">
  {/* TEXT ROW */}
  <div className="flex w-fit text-xl">
    {text.split('').map((char, idx) => {
      const isHighlight =
        currentStep && idx === currentStep.i + currentStep.j; // Highlighting current comparison
      return (
        <motion.span
          key={idx}
          ref={isHighlight ? scrollRef : null}
          className={`inline-block px-2 py-1 rounded ${
            isHighlight
              ? currentStep.match
                ? 'bg-green-500 text-black'
                : 'bg-red-500 text-white'
              : ''
          }`}
        >
          {char}
        </motion.span>
      );
    })}
  </div>

  {/* PATTERN ROW */}
  {currentStep && (
    <div className="flex w-fit mt-1 text-xl">
      {/* Padding spaces to align pattern at currentStep.i (== i - j) */}
      {Array.from({ length: currentStep.i }).map((_, k) => (
        <span key={k} className="inline-block px-2 py-1 text-transparent">
          .
        </span>
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
