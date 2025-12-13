
import { ScriptNode, CharacterName } from '../types';
import { GAME_ASSETS } from '../constants';

// Helper to find asset keys (case-insensitive)
const findKey = (obj: Record<string, string>, key: string) => {
  const lowerKey = key.toLowerCase();
  const match = Object.keys(obj).find(k => k.toLowerCase() === lowerKey);
  return match ? obj[match] : undefined;
};

export const parseScript = (rawText: string): Record<string, ScriptNode> => {
  const nodes: Record<string, ScriptNode> = {};
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);
  
  let nextIdCounter = 0;
  let previousNodeId: string | undefined = undefined;
  let nextNodeId: string | undefined = 'start'; // Default entry point ID

  // State buffers
  let currentBg = GAME_ASSETS.BG.Black;
  let currentSprites: any[] = [];
  let currentCg: string | undefined = undefined;
  let currentVideo: string | undefined = undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Tag Handling (Labels) like "# day1"
    if (line.startsWith('#')) {
      const label = line.replace('#', '').trim();
      
      // If the previous node leads naturally into this label, link it.
      // But NOT if the previous node already has a nextId (e.g. set by 【ReturnTitle】 or a Choice)
      if (previousNodeId && nodes[previousNodeId] && !nodes[previousNodeId].nextId && !nodes[previousNodeId].choices) {
        nodes[previousNodeId].nextId = label;
      }
      
      // The next node created will use this label as its ID
      nextNodeId = label;
      continue;
    }

    // 2. Command Handling like 【背景：Library】
    if (line.startsWith('【') && line.endsWith('】')) {
      const content = line.slice(1, -1);
      const [cmd, val] = content.split(/[:：]/).map(s => s.trim());
      
      const validCommands = ['背景', 'BG', '立绘', 'Sprite', 'CG', '特效', 'Effect', '返回标题', 'ReturnTitle', '视频', 'Video'];

      // Only treat it as a command if it is a KNOWN command
      if (validCommands.includes(cmd)) {
        if (cmd === '背景' || cmd === 'BG') {
          const url = findKey(GAME_ASSETS.BG, val);
          if (url) {
              currentBg = url;
              currentCg = undefined; // BG clears CG
              currentVideo = undefined; // BG clears Video? Actually video is transient usually
          }
        } else if (cmd === '立绘' || cmd === 'Sprite') {
          // Format: 立绘：WSN_Daily (center)
          if (val === '清除' || val === 'Clear') {
              currentSprites = [];
          } else {
              const [spriteName, pos] = val.split(' ');
              const url = findKey(GAME_ASSETS.LH, spriteName);
              if (url) {
                  // Simple logic: Replace existing unless sophisticated management needed
                  currentSprites = [{ image: url, position: (pos || 'center') as any, opacity: 1 }];
                  currentCg = undefined;
              }
          }
        } else if (cmd === 'CG') {
          const url = findKey(GAME_ASSETS.CG, val);
          if (url) currentCg = url;
        } else if (cmd === '视频' || cmd === 'Video') {
          const url = findKey(GAME_ASSETS.VIDEO, val);
          if (url) currentVideo = url;
        } else if (cmd === '特效' || cmd === 'Effect') {
           // Effect logic would be stored in state if we wanted it persistent, 
           // but 'shake'/'flash' are transient on the node.
           // We can attach it to the next node created.
           // For now, ignoring complex effect state.
        } else if (cmd === '返回标题' || cmd === 'ReturnTitle') {
             // Explicitly mark the end of a path
             if (previousNodeId && nodes[previousNodeId]) {
                 nodes[previousNodeId].nextId = 'END';
             }
        }
        continue; // Command consumed
      }
      // If NOT a valid command (e.g. 【第一日...】), fall through to text handling
    }

    // 3. Choices Handling
    // A. Go Left >> label_left
    if (line.match(/^[A-Z]\./)) {
        // Must attach to the previously created node
        if (previousNodeId && nodes[previousNodeId]) {
            const prevNode = nodes[previousNodeId];
            const parts = line.split(/>>|》/);
            const choiceText = parts[0].trim();
            const targetLabel = parts[1] ? parts[1].trim() : `auto_choice_${nextIdCounter++}`;

            if (!prevNode.choices) prevNode.choices = [];
            
            let style: 'normal' | 'danger' | 'special' = 'normal';
            if (choiceText.includes('True')) style = 'special';
            if (choiceText.includes('Bad')) style = 'danger';

            prevNode.choices.push({
                text: choiceText,
                targetId: targetLabel,
                style
            });
        }
        continue;
    }

    // 4. Dialogue/Text Handling
    // Determine ID
    let thisId = nextNodeId;
    if (!thisId) {
        thisId = `node_${nextIdCounter++}`;
    }

    // Link from previous node
    if (previousNodeId && nodes[previousNodeId] && !nodes[previousNodeId].nextId && !nodes[previousNodeId].choices) {
        // If previous node already has a nextId (e.g. from a label link), this is redundant but harmless.
        // But if we hit a label, we set previousNode.nextId = label.
        // If nextNodeId is that label, then prevNode.nextId is ALREADY thisId.
        // So checking !nextId prevents overwriting.
        nodes[previousNodeId].nextId = thisId;
    }

    let speaker: string | undefined = undefined;
    let text = line;
    
    // Check for "Name: Text"
    const colonIdx = line.indexOf('：');
    const colonIdxEng = line.indexOf(':');
    const splitIdx = (colonIdx !== -1 && (colonIdxEng === -1 || colonIdx < colonIdxEng)) ? colonIdx : colonIdxEng;

    if (splitIdx !== -1 && splitIdx < 10) { 
        speaker = line.substring(0, splitIdx);
        text = line.substring(splitIdx + 1);
    }

    // Parse transient effects from text if needed, e.g. [shake]
    // (Optional enhancement)

    nodes[thisId] = {
        id: thisId,
        text: text,
        speaker: speaker,
        bg: currentBg,
        cg: currentCg,
        video: currentVideo, // Attach video
        sprites: currentCg ? [] : [...currentSprites], 
        nextId: undefined
    };

    // Video is transient for a single node, usually. Reset it.
    if (currentVideo) currentVideo = undefined;

    previousNodeId = thisId;
    nextNodeId = undefined; // Consumed
  }

  return nodes;
};
