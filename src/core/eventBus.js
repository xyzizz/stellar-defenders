// eventBus.js - 简单事件总线，用于系统间解耦通信
export class EventBus {
    constructor() {
        this._listeners = {};
    }

    on(event, callback) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    }

    emit(event, data) {
        if (!this._listeners[event]) return;
        for (const cb of this._listeners[event]) {
            cb(data);
        }
    }

    clear() {
        this._listeners = {};
    }
}

// 全局事件总线单例
export const eventBus = new EventBus();

// 事件名常量
export const EVENTS = {
    ENEMY_KILLED: 'enemy_killed',
    PLAYER_HIT: 'player_hit',
    PLAYER_DEAD: 'player_dead',
    BASE_HIT: 'base_hit',
    BASE_DESTROYED: 'base_destroyed',
    EXP_GAINED: 'exp_gained',
    LEVEL_UP: 'level_up',
    UPGRADE_CHOSEN: 'upgrade_chosen',
    WAVE_START: 'wave_start',
    WAVE_CLEAR: 'wave_clear',
    BOSS_SPAWN: 'boss_spawn',
    BOSS_PHASE: 'boss_phase',
    BOSS_DEAD: 'boss_dead',
    GAME_OVER: 'game_over',
    GAME_WIN: 'game_win',
    SCREEN_SHAKE: 'screen_shake',
    SOUND_PLAY: 'sound_play'
};
