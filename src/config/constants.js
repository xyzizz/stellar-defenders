// constants.js - 全局常量（540×960 竖屏分屏版）
export const CANVAS_WIDTH = 540;
export const CANVAS_HEIGHT = 960;

// 屏幕分区（左右等分）
export const SCREEN = {
    SPLIT_X: 270,
    LEFT_MIN: 0,
    LEFT_MAX: 270,
    RIGHT_MIN: 270,
    RIGHT_MAX: 540,
    DIVIDER_WIDTH: 2
};

// 游戏状态
export const GAME_STATES = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    BOSS_WARNING: 'BOSS_WARNING',
    BOSS: 'BOSS',
    VICTORY: 'VICTORY',
    DEFEAT: 'DEFEAT',
    PAUSED: 'PAUSED'
};

// 玩家（增强基础属性，提升爽感）
export const PLAYER = {
    WIDTH: 32,
    HEIGHT: 40,
    SPEED: 360,
    MAX_HP: 120,
    FIRE_RATE: 0.18,       // 更快的射击频率
    INVINCIBLE_TIME: 0.6,
    Y_OFFSET: 50
};

// 基地（右侧底线，提升耐久）
export const BASE = {
    MAX_DURABILITY: 20,
    Y_LINE: CANVAS_HEIGHT - 10
};

// 子弹（加速加大）
export const BULLET = {
    SPEED: 700,
    WIDTH: 4,
    HEIGHT: 14,
    COLOR: '#00ffff'
};

// 粒子（更多粒子 = 更爽）
export const PARTICLE = {
    MAX_COUNT: 400,
    DEFAULT_LIFETIME: 0.5
};

// 掉落物
export const PICKUP = {
    SIZE: 14,
    SPEED: 150,
    MAGNET_RANGE: 80,
    MAGNET_SPEED: 350
};

// 宝箱模块配置
export const CHEST = {
    // 每个宝箱模块的砖块布局
    BRICK_COLS: 7,           // 每模块砖块列数
    BRICK_ROWS_PER_MODULE: 5, // 每模块砖块行数（包含空心中间）
    BRICK_WIDTH: 32,
    BRICK_HEIGHT: 18,
    BRICK_GAP: 2,
    MODULE_GAP: 20,          // 模块之间的间距
    OFFSET_X: 12,            // 左侧边距
    OFFSET_Y: 50,            // 顶部边距
    MODULE_COUNT: 4,          // 总共4个宝箱模块
    // 宝箱本身
    BOX_WIDTH: 40,
    BOX_HEIGHT: 30,
    BOX_HP: 8,               // 宝箱血量
    // 砖块血量（较低，好打）
    BRICK_HP_BASE: 2,
    BRICK_HP_PER_TIER: 1,
    // 品质（从上到下）
    TIERS: ['COMMON', 'RARE', 'EPIC', 'LEGENDARY']
};

// 经验（击杀被动成长）
export const LEVEL = {
    BASE_EXP: 20,
    EXP_GROWTH: 1.25,
    MAX_LEVEL: 20
};

// 颜色方案
export const COLORS = {
    BG: '#0a0a1a',
    BG_LEFT: '#080818',
    BG_RIGHT: '#0a0a1e',
    DIVIDER: '#00ccff',
    PLAYER: '#00ccff',
    PLAYER_SHIELD: '#0088aa',
    BULLET: '#00ffff',
    ENEMY_DRONE: '#ff4444',
    ENEMY_RUSHER: '#ff8800',
    ENEMY_TANK: '#aa00ff',
    ENEMY_BOMBER: '#ffff00',
    BOSS: '#ff0066',
    EXP_ORB: '#00ff88',
    PARTICLE_HIT: '#ffffff',
    PARTICLE_EXPLODE: '#ff6600',
    // 砖墙颜色（按品质）
    BRICK_COMMON: '#556677',
    BRICK_RARE: '#3377bb',
    BRICK_EPIC: '#9944dd',
    BRICK_LEGENDARY: '#dd7700',
    // 宝箱颜色
    CHEST_COMMON: '#bbaa66',
    CHEST_RARE: '#44aaff',
    CHEST_EPIC: '#cc55ff',
    CHEST_LEGENDARY: '#ffaa00',
    CHEST_GLOW: '#ffdd44',
    // UI
    UI_PRIMARY: '#00ccff',
    UI_SECONDARY: '#0088aa',
    UI_DANGER: '#ff4444',
    UI_SUCCESS: '#00ff88',
    UI_TEXT: '#ffffff',
    UI_BG: 'rgba(10, 10, 26, 0.85)',
    GRID_LINE: 'rgba(0, 204, 255, 0.05)'
};
