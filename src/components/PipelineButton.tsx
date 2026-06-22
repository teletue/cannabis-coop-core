'use client';

import { useState } from 'react';

export default function PipelineButton() {
  const [running, setRunning] = useState(false);

  const handleClick = async () => {
    setRunning(true);
    try {
      await fetch('/api/pipeline/run', { method: 'POST' });
      window.location.reload();
    } finally {
      setRunning(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={running}
      className="text-xs px-3 py-1.5 bg-stone-800 text-white rounded hover:bg-stone-600 transition font-medium disabled:opacity-50"
    >
      {running ? 'Kører…' : 'Kør pipeline'}
    </button>
  );
}
