
export enum CharacterName {
  ME = "我",
  LYX = "赖泳心",
  WSN = "王思凝",
  CJN = "池晋南",
  NARRATOR = "",
  UNKNOWN = "???"
}

export interface GameAssetMap {
  BG: Record<string, string>;
  LH: Record<string, string>;
  CG: Record<string, string>;
}

export interface SpriteState {
  image: string;
  position: 'left' | 'center' | 'right' | 'center-close';
  opacity: number; // 0 to 1
  filter?: string; // CSS filter like 'grayscale(100%)'
}

export interface ScriptNode {
  id: string;
  text: string;
  speaker?: string; // If undefined, it's narration
  bg?: string; // URL of background
  cg?: string; // URL of CG (Overlays everything)
  
  // Character Management
  sprites?: SpriteState[]; // Characters visible in this frame
  
  // Navigation
  nextId?: string; // Linear progression
  choices?: Choice[];
  
  // Effects
  effect?: 'shake' | 'flash' | 'fade-to-black';
}

export interface Choice {
  text: string;
  targetId: string;
  style?: 'normal' | 'danger' | 'special';
}

export interface GameState {
  currentId: string;
  history: string[];
  flags: Record<string, boolean>;
}
