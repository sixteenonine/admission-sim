import { MODES, PACING_RULES } from './constants';

export const calculateScores = (scores) => {
  let listening = 0, reading = 0, writing = 0;
  const hasInput = Object.keys(scores || {}).some(k => ['s1','s2','s3','s4','s5','s6','s7','s8','s9','part1','part2','part3'].includes(k) && scores[k] !== '');
  
  listening = (parseInt(scores.s1) || 0) + (parseInt(scores.s2) || 0);
  reading = (parseInt(scores.s3) || 0) + (parseInt(scores.s4) || 0) + (parseInt(scores.s5) || 0) + (parseInt(scores.s6) || 0) + (parseInt(scores.s7) || 0);
  writing = (parseInt(scores.s8) || 0) + (parseInt(scores.s9) || 0);
  
  if (listening === 0 && scores.part1) listening = parseInt(scores.part1) || 0;
  if (reading === 0 && scores.part2) reading = parseInt(scores.part2) || 0;
  if (writing === 0 && scores.part3) writing = parseInt(scores.part3) || 0;

  const totalCorrect = listening + reading + writing;
  return { listening, reading, writing, totalCorrect, finalScore: totalCorrect * 1.25, hasInput };
};

export const calculateWinner = (squares) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
  }
  return null;
};

export const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
  const hex = x.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}).join('');

export const getTipColor = (percent) => {
  if (percent <= 40) return '#3b82f6';
  if (percent <= 75) { 
    const p = (percent - 40) / 35;
    return rgbToHex(Math.round(59 + p * (249 - 59)), Math.round(130 + p * (115 - 130)), Math.round(246 + p * (22 - 246)));
  }
  const p = (percent - 75) / 25;
  return rgbToHex(Math.round(249 + p * (239 - 249)), Math.round(115 + p * (68 - 115)), Math.round(22 + p * (68 - 22)));
};

export const getDifficultyColor = (diff) => {
  if (diff === 'easy') return '#34d399'; 
  if (diff === 'hard') return '#f87171';
  return '#60a5fa'; 
};

export const buildExamTimeline = (fullSequence, mode) => {
  const sequence = mode === 'full' 
    ? fullSequence 
    : fullSequence.filter(item => item.part === MODES[mode].partPrefix);
    
  if (sequence.length === 0) return { items: [], totalQ: 0 };

  let cumulativeSeconds = 0;
  let cumulativeQuestions = 0;
  const items = [];

  for (let i = 0; i < sequence.length; i++) {
    const item = sequence[i];
    const rule = PACING_RULES[item.label] || { qCount: 8, mins: 10 };
    const ruleSeconds = rule.mins * 60;
    
    items.push({
      ...item,
      rule,
      startSec: cumulativeSeconds,
      endSec: cumulativeSeconds + ruleSeconds,
      startQ: cumulativeQuestions,
      endQ: cumulativeQuestions + rule.qCount
    });
    
    cumulativeSeconds += ruleSeconds;
    cumulativeQuestions += rule.qCount;
  }

  return { items, totalQ: cumulativeQuestions };
};

export const calculateProgressState = (timeLeft, totalTime, timeline, mode) => {
  const { items, totalQ } = timeline;
  if (!items || items.length === 0) return { part: 'ERROR', subPart: 'No items', qText: '0/0' };
  if (timeLeft === totalTime) return { part: items[0].part, subPart: items[0].label, qText: `0/${totalQ}` };
  if (timeLeft <= 0) return { part: 'EXAM FINISHED', subPart: 'TIME UP', qText: `${totalQ}/${totalQ}` };
  
  const elapsedSeconds = Math.round(totalTime - timeLeft);
  const activeItem = items.find(item => elapsedSeconds >= item.startSec && elapsedSeconds < item.endSec);
  
  if (activeItem) {
    const timeInPartSeconds = elapsedSeconds - activeItem.startSec;
    const ruleSeconds = activeItem.endSec - activeItem.startSec;
    const currentQInPart = Math.floor((timeInPartSeconds * activeItem.rule.qCount) / ruleSeconds);
    const currentGlobalQ = Math.min(totalQ, activeItem.startQ + currentQInPart);
    return { part: activeItem.part, subPart: activeItem.label, qText: `${currentGlobalQ}/${totalQ}` };
  }
  
  return mode === 'full' 
    ? { part: 'IV. REVIEW & CHECK', subPart: 'Review Answers', qText: `${totalQ}/${totalQ}` }
    : { part: 'EXAM FINISHED', subPart: 'TIME UP', qText: `${totalQ}/${totalQ}` };
};

export const generateReflectionPoints = (marks, totalTime, timeline, mode) => {
  return marks.map((percent, index) => {
    const elapsedSeconds = (percent / 100) * totalTime;
    const mins = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(elapsedSeconds % 60).toString().padStart(2, '0');
    
    const simulatedTimeLeft = totalTime - elapsedSeconds;
    const exactState = calculateProgressState(simulatedTimeLeft, totalTime, timeline, mode);

    return {
      id: index,
      timestamp: `${mins}:${secs}`,
      partName: exactState.subPart,
      qText: exactState.qText,
      tags: [],
      note: ""
    };
  });
};