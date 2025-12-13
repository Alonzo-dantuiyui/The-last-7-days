import React, { useState, useEffect } from 'react';
import VisualNovel from './components/VisualNovel';
import { AssetLoader } from './components/AssetLoader';
import { GAME_ASSETS } from './constants';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Extract all URLs to preload
  const assetsToLoad = [
    ...Object.values(GAME_ASSETS.BG),
    ...Object.values(GAME_ASSETS.LH),
    ...Object.values(GAME_ASSETS.CG),
  ];

  if (isLoading) {
    return (
      <AssetLoader 
        assets={assetsToLoad} 
        onProgress={setLoadingProgress} 
        onComplete={() => setIsLoading(false)} 
      />
    );
  }

  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden relative">
      <VisualNovel />
    </div>
  );
};

export default App;