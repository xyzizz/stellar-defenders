// upgrades.js - 砖墙掉落奖励配置
// 奖励按品质分级，对应砖墙深度

export const REWARD_RARITY = {
    COMMON: { name: '普通', color: '#aaaaaa', glowColor: '#666666' },
    RARE: { name: '稀有', color: '#00ccff', glowColor: '#0088ff' },
    EPIC: { name: '史诗', color: '#aa00ff', glowColor: '#cc44ff' },
    LEGENDARY: { name: '传说', color: '#ff8800', glowColor: '#ffaa00' }
};

// 掉落奖励池
export const REWARD_POOL = {
    // ---- 普通（浅层砖墙 row 0-3）----
    COMMON: [
        {
            id: 'damage_up',
            name: '强化弹头',
            description: '伤害 +15%',
            icon: '⚡',
            maxStack: 8,
            apply(stats) {
                stats.damageMultiplier = (stats.damageMultiplier || 1) + 0.15;
            }
        },
        {
            id: 'fire_rate_up',
            name: '超频射击',
            description: '攻速 +12%',
            icon: '🔥',
            maxStack: 6,
            apply(stats) {
                stats.fireRateMultiplier = (stats.fireRateMultiplier || 1) * 0.88;
            }
        },
        {
            id: 'max_hp_up',
            name: '强化装甲',
            description: '最大HP +20',
            icon: '🛡️',
            maxStack: 5,
            apply(stats) {
                stats.maxHp = (stats.maxHp || 100) + 20;
                stats.healOnUpgrade = 20;
            }
        },
        {
            id: 'move_speed',
            name: '推进器',
            description: '移速 +15%',
            icon: '👟',
            maxStack: 4,
            apply(stats) {
                stats.moveSpeed = (stats.moveSpeed || 320) * 1.15;
            }
        },
        {
            id: 'spread_shot',
            name: '扇形弹幕',
            description: '散射角度增加',
            icon: '🌊',
            maxStack: 3,
            apply(stats) {
                stats.spread = (stats.spread || 0) + 10;
            }
        }
    ],

    // ---- 稀有（中层砖墙 row 4-7）----
    RARE: [
        {
            id: 'bullet_count',
            name: '多管齐发',
            description: '子弹数 +1',
            icon: '🔫',
            maxStack: 4,
            apply(stats) {
                stats.bulletCount = (stats.bulletCount || 1) + 1;
            }
        },
        {
            id: 'pierce',
            name: '穿甲弹',
            description: '穿透 +1',
            icon: '🎯',
            maxStack: 3,
            apply(stats) {
                stats.pierce = (stats.pierce || 0) + 1;
            }
        },
        {
            id: 'crit_chance',
            name: '精准芯片',
            description: '暴击率 +12%',
            icon: '💎',
            maxStack: 5,
            apply(stats) {
                stats.critChance = (stats.critChance || 0) + 0.12;
            }
        },
        {
            id: 'regen',
            name: '纳米修复',
            description: '每秒回复 2 HP',
            icon: '💚',
            maxStack: 3,
            apply(stats) {
                stats.regen = (stats.regen || 0) + 2;
            }
        },
        {
            id: 'damage_reduce',
            name: '能量护盾',
            description: '受伤减少 12%',
            icon: '🔋',
            maxStack: 4,
            apply(stats) {
                stats.damageReduction = 1 - (1 - (stats.damageReduction || 0)) * 0.88;
            }
        },
        {
            id: 'base_repair',
            name: '基地修复',
            description: '基地耐久 +3',
            icon: '🔧',
            maxStack: 5,
            apply(stats) {
                stats.baseRepair = 3;
            }
        }
    ],

    // ---- 史诗（深层砖墙 row 8-11）----
    EPIC: [
        {
            id: 'explosive_rounds',
            name: '爆裂弹',
            description: '子弹爆炸，范围伤害',
            icon: '💥',
            maxStack: 3,
            apply(stats) {
                stats.explosive = true;
                stats.explosiveRadius = (stats.explosiveRadius || 0) + 35;
                stats.explosiveDamage = (stats.explosiveDamage || 0) + 10;
            }
        },
        {
            id: 'missile_unlock',
            name: '追踪导弹',
            description: '自动发射追踪导弹',
            icon: '🚀',
            maxStack: 3,
            apply(stats) {
                stats.missileLevel = (stats.missileLevel || 0) + 1;
            }
        },
        {
            id: 'laser_unlock',
            name: '激光瞄准仪',
            description: '发射穿透激光',
            icon: '🔴',
            maxStack: 3,
            apply(stats) {
                stats.laserLevel = (stats.laserLevel || 0) + 1;
            }
        },
        {
            id: 'crit_damage',
            name: '致命强化',
            description: '暴击伤害 +50%',
            icon: '💀',
            maxStack: 3,
            apply(stats) {
                stats.critMultiplier = (stats.critMultiplier || 2.0) + 0.5;
            }
        }
    ],

    // ---- 传说（最深层，特殊）----
    LEGENDARY: [
        {
            id: 'arc_unlock',
            name: '电弧发生器',
            description: '链式闪电弹跳攻击',
            icon: '🌩',
            maxStack: 3,
            apply(stats) {
                stats.arcLevel = (stats.arcLevel || 0) + 1;
            }
        },
        {
            id: 'overcharge',
            name: '超载核心',
            description: '全属性 +25%',
            icon: '☢️',
            maxStack: 1,
            apply(stats) {
                stats.damageMultiplier = (stats.damageMultiplier || 1) * 1.25;
                stats.fireRateMultiplier = (stats.fireRateMultiplier || 1) * 0.8;
                stats.moveSpeed = (stats.moveSpeed || 320) * 1.25;
            }
        },
        {
            id: 'dual_shot',
            name: '双管炮台',
            description: '子弹数量翻倍',
            icon: '⚔️',
            maxStack: 1,
            apply(stats) {
                stats.bulletCount = (stats.bulletCount || 1) * 2;
            }
        }
    ]
};

// 根据品质随机选一个奖励
export function getRandomReward(rarity, currentStacks) {
    const pool = REWARD_POOL[rarity];
    if (!pool || pool.length === 0) return null;

    // 过滤已满的
    const available = pool.filter(r => {
        const count = currentStacks.get(r.id) || 0;
        return count < r.maxStack;
    });

    if (available.length === 0) {
        // 全满了，给下一档品质的
        const fallbackOrder = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];
        const idx = fallbackOrder.indexOf(rarity);
        for (let i = idx + 1; i < fallbackOrder.length; i++) {
            const fb = REWARD_POOL[fallbackOrder[i]];
            const fbAvail = fb.filter(r => (currentStacks.get(r.id) || 0) < r.maxStack);
            if (fbAvail.length > 0) {
                return fbAvail[Math.floor(Math.random() * fbAvail.length)];
            }
        }
        // 真的全满了，给个直接加伤害的效果
        return {
            id: '_bonus_damage',
            name: '能量充盈',
            description: '伤害 +10%',
            icon: '✨',
            maxStack: 999,
            apply(stats) { stats.damageMultiplier = (stats.damageMultiplier || 1) + 0.1; }
        };
    }

    return available[Math.floor(Math.random() * available.length)];
}
