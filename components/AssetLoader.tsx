import React, { useEffect, useState } from 'react';

interface AssetLoaderProps {
  assets: string[];
  onProgress: (progress: number) => void;
  onComplete: () => void;
}

export const AssetLoader: React.FC<AssetLoaderProps> = ({ assets, onProgress, onComplete }) => {
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let count = 0;

    const loadImage = (src: string) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn(`Failed to load asset: ${src}`);
          resolve(); // Resolve anyway to not block the game
        };
      });
    };

    Promise.all(assets.map(async (src) => {
      await loadImage(src);
      if (isMounted) {
        count++;
        setLoadedCount(count);
        onProgress(Math.round((count / assets.length) * 100));
      }
    })).then(() => {
      if (isMounted) {
        // Add a small delay for aesthetic purposes
        setTimeout(onComplete, 500);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [assets, onProgress, onComplete]);

  const percentage = Math.round((loadedCount / assets.length) * 100);

  return (
    <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white">
      <div className="mb-4 text-2xl font-serif tracking-widest text-yellow-500 animate-pulse">
        加载中
      </div>
      <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden border border-yellow-900">
        <div 
          className="h-full bg-yellow-600 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-2 text-sm text-gray-500 font-mono">
        {percentage}%
      </div>
    </div>
  );
};