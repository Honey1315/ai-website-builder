const { validateContracts } = require('../lib/contractValidation');
const { buildMetadataMap } = require('../lib/fileMetadata');

const manifest = {
  files: ["src/App.jsx", "src/components/GameBoard.jsx", "src/components/AudioEngine.jsx"],
  components: [
    { name: "GameBoard", file: "src/components/GameBoard.jsx", props: ["level", "score", "onGameOver"] },
    { name: "AudioEngine", file: "src/components/AudioEngine.jsx", props: [] }
  ],
  dependencies: {
    App: ["GameBoard"]
  },
  architecture: { framework: "react", language: "javascript", styling: "tailwind" },
  packages: { dependencies: {} }
};

const appCode = `
import React, { useState } from 'react';
import GameBoard from './components/GameBoard';

export default function App() {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const handleGameOver = () => {};

  return (
    <div>
      <GameBoard level={level} score={score} onGameOver={handleGameOver} />
    </div>
  );
}
`;

const gameBoardCode = `
import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Shield, Database, Sparkles, RefreshCw } from 'lucide-react';
import { playSound } from './AudioEngine';

export default function GameBoard({
  level = 1,
  score = 0,
  combo = 0,
  isMuted = false,
  onScoreAdd = () => {},
  onComboChange = () => {},
  onGameOver = () => {},
  targetPattern = [],
  setTargetPattern = () => {},
  timeLeft = 10,
  setTimeLeft = () => {},
  isOverdrive = false,
  setIsOverdrive = () => {}
}) {
  return <div>GameBoard</div>;
}
`;

const audioEngineCode = `
export function playSound(type, isMuted) {}
export default function AudioEngine() { return null; }
`;

const files = [
  { name: "src/App.jsx", content: appCode },
  { name: "src/components/GameBoard.jsx", content: gameBoardCode },
  { name: "src/components/AudioEngine.jsx", content: audioEngineCode }
];

const metadataMap = buildMetadataMap(files);
console.log('App metadata:', metadataMap.get('src/App.jsx'));
console.log('GameBoard metadata:', metadataMap.get('src/components/GameBoard.jsx'));

const mismatches = validateContracts(manifest, metadataMap);
console.log('\nMISMATCHES (count=' + mismatches.length + '):');
console.log(JSON.stringify(mismatches, null, 2));
