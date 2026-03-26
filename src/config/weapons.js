// weapons.js - 武器配置（增强基础伤害）
export const WEAPON_CONFIG = {
    primary: {
        name: '等离子枪',
        damage: 15,          // 提升基础伤害
        fireRate: 0.18,
        bulletSpeed: 500,
        bulletWidth: 4,
        bulletHeight: 14,
        bulletColor: '#00ffff',
        bulletCount: 1,
        spread: 0,
        pierce: 0,
        critChance: 0.05,   // 初始5%暴击
        critMultiplier: 2.0,
        explosive: false,
        explosiveRadius: 0,
        explosiveDamage: 0
    }
};

export const SPECIAL_WEAPONS = {
    missile: {
        name: '追踪导弹',
        damage: 50,
        fireRate: 4.8,
        bulletSpeed: 350,
        bulletWidth: 8,
        bulletHeight: 16,
        bulletColor: '#ff6600',
        tracking: true,
        trackingStrength: 0.1,
        explosive: true,
        explosiveRadius: 55,
        explosiveDamage: 25
    },
    laser: {
        name: '激光束',
        damage: 5,
        fireRate: 0,
        width: 8,
        color: '#ff00ff',
        duration: 0.15,
        cooldown: 1.8,
        pierce: 999
    },
    arc: {
        name: '电弧发生器',
        damage: 4,
        fireRate: 12.0,
        chainCount: 4,
        chainRange: 120,
        color: '#88ffff'
    }
};
