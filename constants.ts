
import { GameAssetMap } from './types';

// Helper to convert GitHub Blob to Raw
const toRaw = (url: string) => url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');

export const GAME_ASSETS: GameAssetMap = {
  BG: {
    Bedroom: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/bj.ws.jpg'),
    Library: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/bj.tsg.jpg'),
    Swing: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/bj.qq.jpg'),
    Bridge: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/bj.qiao.jpg'),
    Station: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/bj.cz.jpg'),
    Flower: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/bj.hua.jpg'),
    
    // New Assets
    Hall: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/bj.dt.jpg'),
    Street: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/bj.dj.jpg'),
    Christmas: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/bj.sdj.jpg'),
    School: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/bj.xx.jpg'),
    LabBg: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/bj.sys.jpg'),
    
    // Branching & Ending Backgrounds
    Underwater: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/bj.sx.jpg'),
    Beach: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/bj.st.jpg'),
    AbandonedLab: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/bj.fqsys.jpg'),
    CarPile: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/bj.fcd.jpg'),
    ZombieTide: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/bj.sc.jpg'),
    ArkPort: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/bj.fzgk.jpg'),
    RuinsFlower: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/bj.hh.jpg'),

    // Title Screen
    Title: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/bt.jpg'),

    Black: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  },
  LH: {
    // Wang Sining (WSN)
    WSN_Jianjue: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/lh.wsn.jianjue.png'), // Determined
    WSN_Ice: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/lh.wsn.ice.png'),         // Crystalized
    WSN_Haixiu: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/lh.wsn.haixiu.png'),    // Shy
    WSN_Daily: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/lh.wsn.daily.png'),      // Daily
    
    // Lai Yongxin (LYX)
    LYX_Kaixin: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/lh.lyx.kaixin.png'),    // Happy
    LYX_Daily: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/lh.lyx.daily.png'),      // Daily
    LYX_Ice: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/lh.lyx.ice.png'),          // Crystalized
    LYX_Beishang: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/lh.lyx.beishang.png'),// Sad
    
    // Chi Jinnan (CJN)
    CJN_Daily: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/lh.cjn.daily.png'),      // Daily
    CJN_Fengkuang: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/lh.cjn.fengkuang.png'), // Crazy
    CJN_Shihuai: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/lh.cjn.shihuai.png'),  // Relieved
  },
  CG: {
    LYX_Waiting: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/cg.lyx.waiting.jpg'),
    LYX_Bridge: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/cg.lyx.qiao.png'),
    Lab: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/cg.sys.png'),
    WSN_Ice_Statue: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/cg.wsn.xzmm.png'),
    
    // Ending CGs
    BadEnd_Survivor: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/cg.gdxcz.jpg'),
    NormalEnd: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/cg.nrend.png'), // Statues
    NormalEnd_Deck: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/cg.trend.png'), // Deck Sunset (Renamed from TrueEnd)
    TrueEnd_Eden: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/cg.sxydy.png'), // Twin Star Eden (Corrected URL)
    
    // Mappings for script compatibility
    TrueEnd: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/cg.sxydy.png'), 
  },
  VIDEO: {
    ED: toRaw('https://github.com/Alonzo-dantuiyui/assets/blob/main/ed.mp4')
  }
};
