import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";

const NAMES_POOL = [
  "Unicorn", "Ninja", "Rainbow", "Pirate", "Dragon", "Banana", "Robot", "Princess",
  "Superstar", "Kitty", "Wizard", "Dino", "Captain", "Pumpkin", "Starfish",
  "Koala", "Rocket", "Zebra", "Panda", "Sparkle", "Gummy Bear", "Jellyfish",
  "Laser Cat", "Choco Chip", "Bubble", "Cupcake", "Tornado", "Pickle", "Giggles",
  "Rainbow Fox", "Mango", "Marshmallow", "Tiger Cub", "Snowball", "Happy Hippo"
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function tieBreak(a: (number|null)[], b: (number|null)[]) {
  const len = Math.max(a.length, b.length);
  for (let i = len - 1; i >= 0; i--) {
    const av = a[i] ?? Infinity;
    const bv = b[i] ?? Infinity;
    if (av !== bv) return av - bv;
  }
  return 0;
}

export default function GameApp() {
  type Step = "setup"|"rules"|"name"|"playing"|"transition"|"leaderboard"|"finished";
  const [step, setStep] = useState<Step>("setup");
  const [rounds, setRounds] = useState(5);
  const [playersCount, setPlayersCount] = useState(3);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundAssignments, setRoundAssignments] = useState<Record<number, number>>({});
  const [history, setHistory] = useState<(number|null)[][]>([]);
  const [startTime, setStartTime] = useState<number|null>(null);
  const [elapsed, setElapsed] = useState(0);

  // timer
  useEffect(() => {
    if (!startTime) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now()-startTime)/1000)), 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const totals = useMemo(() => {
    const t = Array(playersCount).fill(0);
    history.forEach(r => r.forEach((v, i) => { if(typeof v === 'number') t[i]+=v; }));
    return t as number[];
  }, [history, playersCount]);

  const roundsPerPlayer = useMemo(() => {
    const arr: (number|null)[][] = Array.from({length: playersCount}, () => Array(rounds).fill(null));
    history.forEach((r, ri) => r.forEach((v, pi) => (arr[pi][ri] = v)));
    return arr;
  }, [history, playersCount, rounds]);

  const leaderboard = () => playerNames
    .map((name, i) => ({ name, score: totals[i] ?? 0, rounds: roundsPerPlayer[i], idx: i }))
    .sort((a, b) => a.score === b.score ? tieBreak(a.rounds, b.rounds) : a.score - b.score);

  const initNames = (n: number) => shuffle(NAMES_POOL).slice(0, n);
  const goSetup = () => setStep("setup");

  const beginNameEdit = () => {
    const names = initNames(playersCount);
    setPlayerNames(names);
    setRoundAssignments({});
    setHistory([]);
    setCurrentRound(1);
    setStep("name");
  };

  const startGame = () => { setStartTime(Date.now()); setElapsed(0); setStep("playing"); };
  const resetRound = () => setRoundAssignments({});

  const toggleAssign = (playerIndex: number, points: number) => {
    const already = roundAssignments[playerIndex];
    if (already === points) {
      const c={...roundAssignments}; delete c[playerIndex]; setRoundAssignments(c); return;
    }
    const c={...roundAssignments};
    Object.entries(c).forEach(([pi,val])=>{ if(val===points) delete c[Number(pi)]; });
    c[playerIndex]=points;
    setRoundAssignments(c);
  };

  const confirmRound = () => {
    if (Object.keys(roundAssignments).length !== playersCount) return;
    const arr: (number|null)[] = Array(playersCount).fill(null);
    Object.entries(roundAssignments).forEach(([i,v]) => (arr[Number(i)] = v));
    const newHist=[...history,arr];
    setHistory(newHist);
    const isLast=currentRound===rounds;
    if(isLast){
      setStartTime(null); // stop timer
      setStep("finished");
      return;
    }
    const next=currentRound+1;
    setCurrentRound(next);
    setRoundAssignments({});
    if(currentRound%3===0) setStep("leaderboard"); else setStep("transition");
  };

  useEffect(()=>{ if(step==="transition"){ const t=setTimeout(()=>setStep("playing"),1200); return()=>clearTimeout(t);} },[step]);

  const usedScore=(n:number)=>Object.values(roundAssignments).includes(n);
  const formatTime=(s:number)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  return (
    <div className="min-h-screen w-full p-3 flex items-center justify-center bg-gradient-to-br from-pink-200 via-purple-200 to-purple-300">
      <div className="w-full max-w-md sm:max-w-lg">
        {/* SETUP */}
        {step==="setup"&&(
          <div className="rounded-2xl bg-white/90 shadow-xl p-5">
            <h1 className="text-3xl font-extrabold text-center text-purple-700 mb-4">Rock Paper Scissor Go!</h1>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-semibold">Rounds (3–10)</label>
                <div className="flex items-center gap-2">
                  <button className="w-12 h-12 rounded-full bg-purple-200 text-xl font-bold" onClick={()=>setRounds(v=>Math.max(3,v-1))}>−</button>
                  <div className="w-14 text-center text-xl font-bold">{rounds}</div>
                  <button className="w-12 h-12 rounded-full bg-purple-200 text-xl font-bold" onClick={()=>setRounds(v=>Math.min(10,v+1))}>+</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="font-semibold">Players (2–6)</label>
                <div className="flex items-center gap-2">
                  <button className="w-12 h-12 rounded-full bg-purple-200 text-xl font-bold" onClick={()=>setPlayersCount(v=>Math.max(2,v-1))}>−</button>
                  <div className="w-14 text-center text-xl font-bold">{playersCount}</div>
                  <button className="w-12 h-12 rounded-full bg-purple-200 text-xl font-bold" onClick={()=>setPlayersCount(v=>Math.min(6,v+1))}>+</button>
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button className="flex-1 py-4 rounded-xl bg-green-400 hover:bg-green-500 text-white text-xl" onClick={beginNameEdit}>Next</button>
                <button className="flex-1 py-4 rounded-xl border-2 border-purple-300 text-purple-700 text-xl" onClick={()=>setStep("rules")}>Rules</button>
              </div>
            </div>
          </div>
        )}

        {/* RULES */}
        {step==="rules"&&(
          <div className="rounded-2xl bg-white/95 shadow-xl p-6">
            <h2 className="text-2xl font-bold text-center text-pink-600 mb-4">How to Play</h2>
            <ul className="list-disc pl-5 space-y-2 text-lg">
              <li>Choose rounds and number of players.</li>
              <li>Pick player names (we suggest funny ones!).</li>
              <li>Each round: assign ranks 1..N once each (tap to select, tap again to undo).</li>
              <li>Lower total score wins. Ties use the most recent round as a tiebreak.</li>
              <li>Leaderboard appears every 3 rounds; fireworks at the end!</li>
            </ul>
            <button className="mt-6 w-full py-4 rounded-xl bg-purple-400 hover:bg-purple-500 text-xl" onClick={goSetup}>Back to Start</button>
          </div>
        )}

        {/* NAME EDIT */}
        {step==="name"&&(
          <div className="rounded-2xl bg-white/90 shadow-xl p-5">
            <h2 className="text-2xl font-bold text-center text-pink-600 mb-3">Edit Player Names</h2>
            <div className="space-y-3">
              {Array.from({length: playersCount}).map((_,i)=>(
                <div key={i} className="flex items-center gap-2">
                  <input value={playerNames[i]??''}
                    onChange={(e)=>{const nn=[...playerNames]; nn[i]=e.target.value; setPlayerNames(nn);}}
                    placeholder={`Player ${i+1}`}
                    className="flex-1 p-3 rounded-xl border-2 border-purple-200 focus:ring-2 focus:ring-purple-400 text-lg"
                  />
                  <button
                    type="button"
                    className="px-3 py-3 rounded-xl border-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                    onClick={()=>{const nn=[...playerNames]; nn[i]=''; setPlayerNames(nn);}}
                  >Clear</button>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full py-4 rounded-xl bg-purple-400 hover:bg-purple-500 text-white text-xl" onClick={startGame}>Start Game</button>
          </div>
        )}

        {/* TRANSITION */}
        {step==="transition"&&(
          <div className="rounded-2xl bg-white/90 shadow-xl p-6 overflow-hidden">
            <motion.div initial={{backgroundPosition:"0% 50%"}}
              animate={{backgroundPosition:["0% 50%","100% 50%","0% 50%"]}}
              transition={{duration:1.1}}
              className="w-full h-36 rounded-xl flex items-center justify-center text-6xl font-extrabold bg-gradient-to-r from-pink-300 via-purple-300 to-purple-400">
              ✊ ✋ ✌️
            </motion.div>
            <div className="mt-3 text-center text-purple-700 font-semibold">Round {currentRound}</div>
          </div>
        )}

        {/* PLAYING */}
        {step==="playing"&&(
          <div className="rounded-2xl bg-white/90 shadow-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-purple-700">Round {currentRound} / {rounds}</h2>
              <div className="text-sm text-purple-700">⏱ {formatTime(elapsed)}</div>
            </div>
            <div className="flex gap-2 mb-4">
              <button className="flex-1 py-2 rounded-xl border-2 border-gray-300" onClick={resetRound}>Reset Round</button>
            </div>
            <div className="space-y-3">
              {playerNames.map((name,i)=>(
                <div key={i} className="flex items-center gap-3">
                  <span className="flex-1 font-medium text-lg truncate">{name}</span>
                  <div className="flex gap-2">
                    {Array.from({length: playersCount},(_,j)=>{
                      const n=j+1; const sel=roundAssignments[i]===n; const dis=usedScore(n)&&!sel;
                      return (
                        <button key={n} onClick={()=>toggleAssign(i,n)} disabled={dis}
                          className={`w-12 h-12 rounded-full border-2 text-lg font-bold flex items-center justify-center transition ${sel?"bg-pink-400 text-white border-pink-500":dis?"opacity-40 border-gray-300":"bg-purple-100 border-purple-300 hover:bg-purple-200"}`}>{n}</button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={confirmRound}
              disabled={Object.keys(roundAssignments).length!==playersCount}
              className="mt-5 w-full py-5 rounded-xl bg-green-400 hover:bg-green-500 text-white text-xl disabled:opacity-40">
              {currentRound===rounds?"See Final Scores":"Play Next Round"}
            </button>
          </div>
        )}

        {/* MID LEADERBOARD */}
        {step==="leaderboard"&&(
          <div className="rounded-2xl bg-white/90 shadow-xl p-5">
            <h2 className="text-2xl font-bold text-center mb-3 text-purple-700">Leaderboard</h2>
            <ul className="text-lg">{leaderboard().map((p,i)=>(<li key={i} className="flex justify-between py-1"><span>{i+1}. {p.name}</span><span>{p.score} pts</span></li>))}</ul>
            <button className="mt-4 w-full py-4 rounded-xl bg-purple-400 hover:bg-purple-500 text-white text-xl" onClick={()=>setStep("transition")}>Keep Playing</button>
          </div>
        )}

        {/* FINISHED */}
        {step==="finished"&&(
          <div className="relative rounded-2xl bg-white/90 shadow-xl p-5 overflow-hidden">
            <h2 className="text-3xl font-extrabold text-center mb-4 text-green-700">Final Scores 🏆</h2>
            <div className="absolute inset-0 pointer-events-none"><Confetti recycle={false} numberOfPieces={400}/></div>
            {(()=>{const lb=leaderboard(); const[g,s,b]=[lb[0],lb[1],lb[2]]; return(
              <div className="relative z-10 w-full flex items-end justify-center gap-3 mb-6">
                {s&&(<div className="flex-1 max-w-[30%]"><div className="text-center font-semibold mb-1">{s.name}</div><div className="h-28 bg-purple-200 rounded-t-xl border-2 border-purple-300 flex items-end justify-center pb-2 text-2xl">2</div><div className="text-center text-sm mt-1">{s.score} pts</div></div>)}
                {g&&(<div className="flex-1 max-w-[34%]"><div className="text-center font-semibold mb-1">{g.name}</div><div className="h-40 bg-purple-300 rounded-t-xl border-2 border-purple-400 flex items-end justify-center pb-2 text-3xl">1</div><div className="text-center text-sm mt-1">{g.score} pts</div></div>)}
                {b&&(<div className="flex-1 max-w-[30%]"><div className="text-center font-semibold mb-1">{b.name}</div><div className="h-24 bg-purple-100 rounded-t-xl border-2 border-purple-200 flex items-end justify-center pb-2 text-2xl">3</div><div className="text-center text-sm mt-1">{b.score} pts</div></div>)}
              </div>);})()}
            <div className="relative z-10 w-full">{leaderboard().slice(3).map((p,i)=>(<div key={i} className="flex justify-between py-1 text-lg text-gray-700"><span>{i+4}. {p.name}</span><span>{p.score} pts</span></div>))}</div>
            <div className="relative z-10 mt-6 text-center text-purple-700 font-semibold">⏱ Time played: {formatTime(elapsed)}</div>
            <div className="relative z-10 mt-4 grid grid-cols-2 gap-3">
              <button className="py-4 rounded-xl bg-pink-400 hover:bg-pink-500 text-white text-lg" onClick={()=>{setRoundAssignments({});setHistory([]);setCurrentRound(1);setStep("playing");setStartTime(Date.now());}}>Play Again</button>
              <button className="py-4 rounded-xl border-2 border-purple-300 text-purple-700 text-lg" onClick={()=>setStep("setup")}>Start New Game</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}