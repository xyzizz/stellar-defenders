// helpers.js - 通用工具函数

// 两个矩形是否碰撞（AABB）
export function rectCollide(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// 两点之间距离
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

// 随机整数 [min, max]
export function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 随机浮点 [min, max)
export function randFloat(min, max) {
    return Math.random() * (max - min) + min;
}

// 限制在范围内
export function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

// 角度转弧度
export function degToRad(deg) {
    return deg * Math.PI / 180;
}

// 按权重随机选择
export function weightedRandom(items, weightKey = 'weight') {
    const totalWeight = items.reduce((sum, item) => sum + item[weightKey], 0);
    let random = Math.random() * totalWeight;
    for (const item of items) {
        random -= item[weightKey];
        if (random <= 0) return item;
    }
    return items[items.length - 1];
}

// 从数组中随机不重复取n个
export function sampleArray(arr, n) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(n, arr.length));
}

// 线性插值
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

// 格式化时间 (秒 -> M:SS)
export function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// 音效占位接口
export const SoundManager = {
    _sounds: {},
    _enabled: true,

    load(name, src) {
        // 预留：加载音频文件
        // this._sounds[name] = new Audio(src);
    },

    play(name) {
        if (!this._enabled) return;
        // 预留：播放音效
        // const sound = this._sounds[name];
        // if (sound) { sound.currentTime = 0; sound.play(); }
    },

    toggle() {
        this._enabled = !this._enabled;
        return this._enabled;
    }
};
