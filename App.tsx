
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
    // Changed from relative h-screen to fixed inset-0 to prevent browser chrome shifting and scrolling issues
    <div className="fixed inset-0 w-full h-full bg-black text-white overflow-hidden touch-none">
      <VisualNovel />
    </div>
  );
};

export default App;
