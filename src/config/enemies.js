// enemies.js - 敌人配置（降低难度版）
export const ENEMY_TYPES = {
    DRONE: 'DRONE',
    RUSHER: 'RUSHER',
    TANK: 'TANK',
    BOMBER: 'BOMBER',
    BOSS: 'BOSS'
};

export const ENEMY_CONFIG = {
    [ENEMY_TYPES.DRONE]: {
        name: '无人机',
        width: 22,
        height: 22,
        hp: 8,             // 降低血量
        speed: 70,
        damage: 8,
        exp: 5,
        color: '#ff4444',
        behavior: 'linear',
        score: 10
    },
    [ENEMY_TYPES.RUSHER]: {
        name: '突击者',
        width: 18,
        height: 18,
        hp: 5,
        speed: 140,
        damage: 6,
        exp: 8,
        color: '#ff8800',
        behavior: 'tracking',
        trackingStrength: 0.25,
        score: 15
    },
    [ENEMY_TYPES.TANK]: {
        name: '重装机甲',
        width: 30,
        height: 30,
        hp: 50,            // 降低
        speed: 35,
        damage: 15,
        exp: 25,
        color: '#aa00ff',
        behavior: 'linear',
        score: 30
    },
    [ENEMY_TYPES.BOMBER]: {
        name: '自爆虫',
        width: 16,
        height: 16,
        hp: 6,
        speed: 110,
        damage: 20,
        exp: 12,
        color: '#ffff00',
        behavior: 'kamikaze',
        explodeRange: 50,
        explodeDamage: 18,
        score: 20
    },
    [ENEMY_TYPES.BOSS]: {
        name: '歼灭母舰',
        width: 100,
        height: 70,
        hp: 500,           // 降低
        speed: 50,
        damage: 20,
        exp: 0,
        color: '#ff0066',
        behavior: 'boss',
        score: 500,
        phases: [
            {
                name: '阶段一',
                hpThreshold: 0.5,
                attackInterval: 1.8,
                bulletCount: 3,
                bulletSpeed: 180,
                summonInterval: 6,
                summonType: 'DRONE',
                summonCount: 2
            },
            {
                name: '阶段二：狂暴',
                hpThreshold: 0,
                attackInterval: 1.0,
                bulletCount: 5,
                bulletSpeed: 220,
                summonInterval: 4,
                summonType: 'RUSHER',
                summonCount: 2,
                laserInterval: 8,
                laserDuration: 1.2,
                laserDamage: 1.5
            }
        ]
    }
};
