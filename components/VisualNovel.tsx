
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SCENARIO } from '../data/scenario';
import { ScriptNode, Choice } from '../types';
import { GAME_ASSETS } from '../constants';

interface SaveSlot {
  id: number;
  nodeId: string;
  textSnippet: string;
  date: string;
  bg?: string;
}

const SAVE_KEY = 'galgame_saves_v1';

export default function VisualNovel() {
  // Game Flow State
  const [view, setView] = useState<'title' | 'game'>('title');
  const [currentNodeId, setCurrentNodeId] = useState<string>('start');
  const [history, setHistory] = useState<string[]>([]); // Track path taken
  
  // Playback State
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [skipMode, setSkipMode] = useState(false);
  
  // UI State
  const [showMenu, setShowMenu] = useState(false); // Modal for Save/Load
  const [showHistory, setShowHistory] = useState(false); // Modal for Backlog
  const [menuTab, setMenuTab] = useState<'save' | 'load'>('save');
  const [effectClass, setEffectClass] = useState('');
  
  // Interaction Control
  // Ref to hold the typing interval ID so we can clear it manually
  const typingIntervalRef = useRef<any>(null);
  
  const currentNode: ScriptNode = SCENARIO[currentNodeId] || SCENARIO['start'];

  // --- Navigation Helpers ---

  // Unified function to change nodes and record history
  const navigateTo = useCallback((nextId: string) => {
    setHistory(prev => [...prev, currentNodeId]);
    setCurrentNodeId(nextId);
  }, [currentNodeId]);

  // Jump back to a previous point in history
  const handleJumpToHistory = (index: number) => {
    const targetId = history[index];
    // History should retain elements UP TO index (exclusive), so when we arrive at targetId, history matches previous state
    const newHistory = history.slice(0, index);
    
    // Close modal and reset states first
    setShowHistory(false);
    setSkipMode(false);
    setAutoPlay(false);
    
    // Apply navigation
    setHistory(newHistory);
    setCurrentNodeId(targetId);
  };

  // --- Core Game Loop ---

  // Typewriter Effect
  useEffect(() => {
    // Clear any existing interval
    if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
    }

    setDisplayedText('');
    setIsTyping(true);
    let index = 0;
    const fullText = currentNode.text || '';
    
    // Typing speed: Skip = 2ms, Normal = 30ms
    const speed = skipMode ? 2 : 30;

    const id = setInterval(() => {
      index++;
      setDisplayedText(fullText.substring(0, index));
      if (index >= fullText.length) {
        clearInterval(id);
        setIsTyping(false);
        typingIntervalRef.current = null;
      }
    }, speed);

    typingIntervalRef.current = id;

    return () => {
        clearInterval(id);
        if (typingIntervalRef.current === id) {
            typingIntervalRef.current = null;
        }
    };
  }, [currentNodeId, currentNode.text, skipMode]);

  // Effect Handling (Shake/Flash)
  useEffect(() => {
    if (currentNode.effect === 'shake') {
      setEffectClass('animate-shake'); 
      setTimeout(() => setEffectClass(''), 500);
    } else if (currentNode.effect === 'flash') {
      setEffectClass('animate-flash');
      setTimeout(() => setEffectClass(''), 500);
    } else if (currentNode.effect === 'fade-to-black') {
      // Handled by conditional rendering
    }
  }, [currentNodeId, currentNode.effect]);

  // Handle Proceed / Next Node
  const handleProceed = useCallback(() => {
    if (view !== 'game') return;

    // Special Video Logic: Video skip or end always proceeds immediately
    if (currentNode.video) {
        if (currentNode.nextId === 'END') {
             // End of Game Logic
             console.log('End of game reached (Video end).');
             setSkipMode(false);
             setAutoPlay(false);
             setView('title');
             setCurrentNodeId('start'); // Reset for next time
             setHistory([]);
             return;
        }

        if (currentNode.nextId && SCENARIO[currentNode.nextId]) {
             navigateTo(currentNode.nextId);
        }
        return;
    }

    // 1. If typing, finish instantly
    if (isTyping) {
      // CRITICAL FIX: Clear the interval to prevent it from overwriting the full text
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      setDisplayedText(currentNode.text);
      setIsTyping(false);
      return;
    }

    // 2. If choices exist, waiting for user input (Skip/Auto stops here)
    if (currentNode.choices && currentNode.choices.length > 0) {
      if (skipMode) setSkipMode(false);
      if (autoPlay) setAutoPlay(false);
      return;
    }

    // 3. Move to next node
    if (currentNode.nextId && currentNode.nextId === 'END') {
       console.log('End of game reached.');
       setSkipMode(false);
       setAutoPlay(false);
       setTimeout(() => {
         setView('title');
         setCurrentNodeId('start');
         setHistory([]); 
       }, 3000);
       return;
    }

    if (currentNode.nextId && SCENARIO[currentNode.nextId]) {
      navigateTo(currentNode.nextId);
    } else {
      // Fallback end
       console.log('End of game reached (Fallback).');
       setSkipMode(false);
       setAutoPlay(false);
       setTimeout(() => {
         setView('title');
         setCurrentNodeId('start');
         setHistory([]); 
       }, 3000);
    }
  }, [view, isTyping, currentNode, skipMode, autoPlay, navigateTo]);

  // Auto Play & Skip Logic trigger
  useEffect(() => {
    if (view !== 'game') return;
    
    // Disable auto/skip logic if video is playing (video handles its own progression via onEnded)
    if (currentNode.video) return;

    let timer: ReturnType<typeof setTimeout>;

    if (!isTyping && !currentNode.choices) {
      if (skipMode) {
        // Fast forward: tiny delay to allow render
        timer = setTimeout(handleProceed, 100); 
      } else if (autoPlay) {
        // Auto play: delay based on text length, minimum 1s, max 4s
        const readingTime = Math.min(Math.max(currentNode.text.length * 50, 1000), 4000);
        timer = setTimeout(handleProceed, readingTime);
      }
    }

    return () => clearTimeout(timer);
  }, [view, isTyping, currentNode, skipMode, autoPlay, handleProceed]);

  // --- Save / Load System ---

  const getSaves = (): SaveSlot[] => {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  };

  const handleSave = (slotId: number) => {
    const saves = getSaves();
    const newSave: SaveSlot = {
      id: slotId,
      nodeId: currentNodeId,
      textSnippet: currentNode.text.substring(0, 20) + '...',
      date: new Date().toLocaleString(),
      bg: currentNode.bg
    };
    // Replace or add
    const newSaves = saves.filter(s => s.id !== slotId).concat(newSave);
    localStorage.setItem(SAVE_KEY, JSON.stringify(newSaves));
    setShowMenu(false); // Close menu on save
    alert('进度已保存！');
  };

  const handleLoad = (slotId: number) => {
    const saves = getSaves();
    const save = saves.find(s => s.id === slotId);
    if (save) {
      if (SCENARIO[save.nodeId]) {
        setCurrentNodeId(save.nodeId);
        setHistory([]); // Reset history on load usually
        setView('game');
        setShowMenu(false);
        setSkipMode(false);
        setAutoPlay(false);
      } else {
        alert('存档损坏或版本不兼容');
      }
    }
  };

  // --- UI Helpers ---

  const handleStartGame = () => {
    setCurrentNodeId('start');
    setHistory([]);
    setView('game');
    setSkipMode(false);
    setAutoPlay(false);
  };

  // --- RENDERERS ---

  // 1. Title Screen
  if (view === 'title') {
    return (
      <div className="w-full h-full relative overflow-hidden bg-black animate-fadeIn">
        {/* Background */}
        <div className="absolute inset-0">
          <img 
            src={GAME_ASSETS.BG.Title} 
            alt="Title Screen" 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        </div>

        {/* Title Text */}
        <div className="absolute top-[15%] left-10 lg:left-24 z-10">
          <h1 className="text-6xl lg:text-8xl font-serif text-white drop-shadow-[0_4px_4px_rgba(0,0,0,1)] tracking-widest" style={{ textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>
            七日终焉
          </h1>
          <p className="text-xl lg:text-2xl text-gray-300 mt-4 tracking-[0.5em] font-light">
            THE LAST 7 DAYS
          </p>
        </div>

        {/* Menu Buttons */}
        <div className="absolute bottom-[20%] left-10 lg:left-24 z-20 flex flex-col gap-6">
          <button 
            onClick={handleStartGame}
            className="text-left text-2xl lg:text-3xl text-white hover:text-yellow-400 transition-all font-serif tracking-widest hover:pl-4 duration-300 drop-shadow-md"
          >
            开始游戏
          </button>
          <button 
            onClick={() => { setShowMenu(true); setMenuTab('load'); }}
            className="text-left text-2xl lg:text-3xl text-white hover:text-yellow-400 transition-all font-serif tracking-widest hover:pl-4 duration-300 drop-shadow-md"
          >
            读取进度
          </button>
          <button 
            onClick={() => window.open('https://github.com/Alonzo-dantuiyui/assets', '_blank')}
            className="text-left text-xl lg:text-2xl text-gray-400 hover:text-white transition-all font-serif tracking-widest hover:pl-4 duration-300 drop-shadow-md"
          >
            关于
          </button>
        </div>

        {/* Load Modal if Open */}
        {showMenu && (
          <SaveLoadModal 
            mode="load" 
            onClose={() => setShowMenu(false)} 
            onSelect={handleLoad} 
            saves={getSaves()} 
          />
        )}
      </div>
    );
  }

  // 2. Gameplay Screen
  return (
    <div 
      className={`relative w-full h-full select-none overflow-hidden bg-black ${effectClass}`} 
      onClick={handleProceed}
    >
      {/* --- Layers --- */}
      
      {/* 1. Background */}
      {currentNode.bg && !currentNode.video && (
        <div className="absolute inset-0 bg-black">
          <img 
            key={currentNode.bg} 
            src={currentNode.bg} 
            alt="background" 
            className="absolute inset-0 w-full h-full object-cover animate-fadeIn"
          />
        </div>
      )}

      {/* 2. Sprites */}
      {currentNode.sprites && !currentNode.video && currentNode.sprites.map((sprite) => {
        let positionClass = 'left-1/2 -translate-x-1/2'; 
        let scaleClass = 'sm:scale-110 sm:origin-bottom'; 

        if (sprite.position === 'left') positionClass = 'left-[10%] sm:left-[15%] lg:left-[20%]';
        if (sprite.position === 'right') positionClass = 'right-[10%] sm:right-[15%] lg:right-[20%]';
        if (sprite.position === 'center-close') {
             positionClass = 'left-1/2 -translate-x-1/2 origin-bottom';
             scaleClass = 'scale-125 sm:scale-150'; 
        }

        return (
          <img
            key={sprite.image} 
            src={sprite.image}
            alt="character"
            className={`absolute bottom-0 h-[85%] sm:h-[100%] max-h-screen object-contain transition-all duration-700 ease-in-out ${positionClass} ${scaleClass} animate-fadeIn z-10 pointer-events-none`}
            style={{ opacity: sprite.opacity }}
          />
        );
      })}

      {/* 3. CG Overlay */}
      {currentNode.cg && !currentNode.video && (
        <div className="absolute inset-0 z-20 bg-black animate-fadeIn pointer-events-none">
          <img 
            src={currentNode.cg} 
            alt="CG" 
            className="w-full h-full object-contain"
          />
        </div>
      )}
      
      {/* 3.5 Video Overlay - Top Priority */}
      {currentNode.video && (
        <div className="absolute inset-0 z-[100] bg-black">
          <video
            key={currentNode.video}
            src={currentNode.video}
            className="w-full h-full object-contain"
            autoPlay
            onEnded={handleProceed}
            onClick={(e) => { e.stopPropagation(); handleProceed(); }}
          />
        </div>
      )}

      {/* 4. Controls & Menus (Top Right) */}
      {!currentNode.video && (
      <div className="absolute top-4 right-4 z-50 flex flex-wrap justify-end gap-2 pointer-events-auto max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <ControlButton label="保存" onClick={() => { setMenuTab('save'); setShowMenu(true); }} />
        <ControlButton label="读取" onClick={() => { setMenuTab('load'); setShowMenu(true); }} />
        <ControlButton label="回顾" onClick={() => setShowHistory(true)} />
        <div className="w-2" /> {/* Spacer */}
        <ControlButton label="自动" active={autoPlay} onClick={() => { setAutoPlay(!autoPlay); setSkipMode(false); }} />
        <ControlButton label="快进" active={skipMode} onClick={() => { setSkipMode(!skipMode); setAutoPlay(false); }} />
        <ControlButton label="标题" onClick={() => setView('title')} />
      </div>
      )}

      {/* 5. Dialogue UI - Hide if video is playing */}
      {!currentNode.video && (
      <div className="absolute bottom-0 w-full z-30 flex flex-col items-center pb-2 lg:pb-8 px-2 lg:px-16 pointer-events-none">
        
        {/* Choices */}
        {currentNode.choices && !isTyping && (
          <div className="mb-6 flex flex-col gap-3 w-full max-w-xl z-50 pointer-events-auto animate-fadeIn">
            {currentNode.choices.map((choice, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); navigateTo(choice.targetId); }}
                className={`
                  py-3 px-8 text-lg font-bold border-2 rounded shadow-2xl backdrop-blur-md transition-all hover:scale-105
                  ${choice.style === 'danger' 
                    ? 'bg-red-900/90 border-red-500 text-red-100' 
                    : choice.style === 'special' 
                      ? 'bg-yellow-900/90 border-yellow-400 text-yellow-100'
                      : 'bg-black/70 border-white/40 text-white hover:bg-white/10'}
                `}
              >
                {choice.text}
              </button>
            ))}
          </div>
        )}

        {/* Text Box */}
        <div className="w-full max-w-6xl pointer-events-auto">
          {currentNode.speaker && (
            <div className="flex justify-start mb-0">
               <div className="bg-gradient-to-r from-[#D4AF37] to-[#8a6d10] text-white font-bold text-xl lg:text-2xl px-8 py-1 rounded-t-lg shadow-lg border-t border-x border-[#ffdb73]/50 translate-y-[2px] z-10 ml-0 lg:ml-12">
                {currentNode.speaker}
              </div>
            </div>
          )}

          <div className="w-full min-h-[160px] lg:min-h-[200px] bg-black/10 border border-white/5 lg:rounded-xl shadow-2xl p-6 lg:p-8 relative backdrop-blur-[2px] transition-all duration-300">
            <p className="text-xl lg:text-2xl leading-relaxed text-white font-serif whitespace-pre-wrap tracking-wide drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
              {displayedText}
              {!isTyping && !currentNode.choices && (
                <span className="inline-block w-3 h-3 bg-[#D4AF37] ml-2 animate-bounce rounded-full shadow-[0_0_8px_#D4AF37]" />
              )}
            </p>
            {/* Click Prompt */}
            {!autoPlay && !skipMode && !currentNode.choices && !isTyping && (
                <div className="absolute bottom-3 right-5 text-[#D4AF37]/80 text-xs font-sans tracking-widest animate-pulse">
                ▶ CLICK
                </div>
            )}
            {/* Status Indicators */}
            {(autoPlay || skipMode) && (
                <div className="absolute top-2 right-4 text-xs font-bold text-yellow-500 border border-yellow-500 px-2 py-0.5 rounded animate-pulse">
                    {skipMode ? 'FAST FORWARD' : 'AUTO PLAY'}
                </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* 6. Save/Load Modal */}
      {showMenu && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={(e) => e.stopPropagation()}>
           <SaveLoadModal 
             mode={menuTab}
             saves={getSaves()}
             onClose={() => setShowMenu(false)}
             onSelect={menuTab === 'save' ? handleSave : handleLoad}
           />
        </div>
      )}
      
      {/* 7. History Modal - Increased Z-Index to cover everything */}
      {showHistory && (
         <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-[90%] h-[90%] bg-gray-900/95 border border-gray-600 rounded-lg flex flex-col shadow-2xl overflow-hidden relative">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                    <h2 className="text-2xl text-white font-serif">剧情回顾</h2>
                    <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-white px-4 py-2 text-xl">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {history.map((nodeId, idx) => {
                        const node = SCENARIO[nodeId];
                        // Only show nodes with text
                        if (!node || !node.text) return null;
                        return (
                            <div key={idx} className="group flex flex-col border-b border-gray-800 pb-4 last:border-0 hover:bg-white/5 p-2 rounded transition-colors">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="text-[#D4AF37] font-bold text-lg">{node.speaker || ''}</span>
                                    <button 
                                        type="button"
                                        onClick={(e) => { 
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleJumpToHistory(idx); 
                                        }}
                                        className="cursor-pointer text-xs text-yellow-500 hover:text-yellow-300 border border-yellow-600 hover:border-yellow-400 px-3 py-1 rounded transition-colors ml-4 shrink-0 active:bg-yellow-900"
                                    >
                                        跳转至此
                                    </button>
                                </div>
                                <p className="text-gray-300 text-base font-serif leading-relaxed whitespace-pre-wrap">{node.text}</p>
                            </div>
                        )
                    })}
                    {/* Show current node text as well */}
                    <div className="flex flex-col p-2 bg-white/5 rounded">
                        <span className="text-[#D4AF37] font-bold text-lg mb-1">{currentNode.speaker || ''}</span>
                        <p className="text-white text-base font-serif leading-relaxed whitespace-pre-wrap">{currentNode.text}</p>
                         <span className="text-xs text-yellow-500 mt-2">◀ 当前位置</span>
                    </div>
                    {/* Anchor for auto-scroll */}
                    <div ref={(el) => el?.scrollIntoView({ behavior: 'auto' })} />
                </div>
            </div>
         </div>
      )}

      {/* Global Styles */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.8s ease-out forwards; }
        
        @keyframes shake { 
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }

        @keyframes flash {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.9; background-color: white; }
        }
        .animate-flash { animation: flash 0.3s ease-out; position: absolute; inset: 0; z-index: 50; pointer-events: none;}
      `}</style>
    </div>
  );
}

// ... rest of the file (ControlButton and SaveLoadModal remain unchanged)
const ControlButton: React.FC<{ label: string; onClick: () => void; active?: boolean }> = ({ label, onClick, active }) => (
  <button 
    onClick={onClick}
    className={`px-3 py-1 lg:px-4 lg:py-2 text-sm lg:text-base rounded border transition-all ${active ? 'bg-yellow-600 border-yellow-400 text-white' : 'bg-black/50 border-white/30 text-gray-300 hover:bg-white/20 hover:text-white'}`}
  >
    {label}
  </button>
);

const SaveLoadModal: React.FC<{ 
  mode: 'save' | 'load'; 
  saves: SaveSlot[]; 
  onClose: () => void; 
  onSelect: (id: number) => void;
}> = ({ mode, saves, onClose, onSelect }) => {
  return (
    <div className="bg-gray-900 border border-gray-600 rounded-lg p-6 w-[90%] max-w-2xl shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
      <h2 className="text-2xl text-white font-serif mb-6 text-center border-b border-gray-700 pb-2">
        {mode === 'save' ? '保存进度' : '读取进度'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(slotId => {
            const save = saves.find(s => s.id === slotId);
            return (
                <button
                    key={slotId}
                    onClick={() => onSelect(slotId)}
                    className="group relative h-32 border border-gray-700 rounded bg-gray-800 hover:border-yellow-500 hover:bg-gray-700 transition-all text-left overflow-hidden flex flex-col"
                >
                    {save ? (
                        <>
                           {/* Mini BG preview if possible, otherwise gradient */}
                           <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity bg-cover bg-center" style={{ backgroundImage: save.bg ? `url(${save.bg})` : undefined }} />
                           <div className="relative z-10 p-3 h-full flex flex-col justify-between">
                                <div>
                                    <div className="text-yellow-500 font-bold text-sm">NO.0{slotId}</div>
                                    <div className="text-gray-300 text-xs mt-1">{save.date}</div>
                                </div>
                                <div className="text-white text-sm line-clamp-2 opacity-80 font-serif">
                                    {save.textSnippet}
                                </div>
                           </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 group-hover:text-gray-400">
                             {mode === 'save' ? '点击保存' : '空存档'}
                        </div>
                    )}
                </button>
            )
        })}
      </div>
      <button onClick={onClose} className="mt-6 w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded">
        关闭
      </button>
    </div>
  );
};
