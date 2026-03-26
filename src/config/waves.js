// waves.js - 波次配置（加强压力版）
import { ENEMY_TYPES } from './enemies.js';

export const WAVE_CONFIG = [
    {
        id: 1,
        name: '侦察波',
        duration: 30,
        spawnGroups: [
            { type: ENEMY_TYPES.DRONE, weight: 10, minCount: 1, maxCount: 1 }
        ],
        spawnInterval: 1.6,
        maxAlive: 6,
        message: '敌方侦察单位接近！'
    },
    {
        id: 2,
        name: '突袭波',
        duration: 30,
        spawnGroups: [
            { type: ENEMY_TYPES.DRONE, weight: 6, minCount: 1, maxCount: 2 },
            { type: ENEMY_TYPES.RUSHER, weight: 4, minCount: 1, maxCount: 1 }
        ],
        spawnInterval: 1.2,
        maxAlive: 9,
        message: '快速单位出现！'
    },
    {
        id: 3,
        name: '重装波',
        duration: 30,
        spawnGroups: [
            { type: ENEMY_TYPES.DRONE, weight: 4, minCount: 1, maxCount: 2 },
            { type: ENEMY_TYPES.RUSHER, weight: 3, minCount: 1, maxCount: 1 },
            { type: ENEMY_TYPES.TANK, weight: 3, minCount: 1, maxCount: 1 }
        ],
        spawnInterval: 1.0,
        maxAlive: 12,
        message: '重装机甲来袭！'
    },
    {
        id: 4,
        name: '混合波',
        duration: 30,
        spawnGroups: [
            { type: ENEMY_TYPES.DRONE, weight: 3, minCount: 1, maxCount: 2 },
            { type: ENEMY_TYPES.RUSHER, weight: 3, minCount: 1, maxCount: 1 },
            { type: ENEMY_TYPES.TANK, weight: 2, minCount: 1, maxCount: 1 },
            { type: ENEMY_TYPES.BOMBER, weight: 2, minCount: 1, maxCount: 1 }
        ],
        spawnInterval: 0.88,
        maxAlive: 14,
        message: '警告：自爆单位！'
    },
    {
        id: 5,
        name: '决战波',
        duration: 30,
        spawnGroups: [
            { type: ENEMY_TYPES.DRONE, weight: 2, minCount: 1, maxCount: 3 },
            { type: ENEMY_TYPES.RUSHER, weight: 3, minCount: 1, maxCount: 2 },
            { type: ENEMY_TYPES.TANK, weight: 2, minCount: 1, maxCount: 1 },
            { type: ENEMY_TYPES.BOMBER, weight: 3, minCount: 1, maxCount: 1 }
        ],
        spawnInterval: 0.68,
        maxAlive: 17,
        message: '最终波次！坚持住！'
    }
];

export const BOSS_WAVE = {
    name: 'Boss战',
    duration: 40,
    message: '⚠ 歼灭母舰接近 ⚠',
};
