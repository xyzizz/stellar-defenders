// wave.js - Wave progression manager
import { eventBus, EVENTS } from '../core/eventBus.js';

/**
 * Manages the progression of enemy waves throughout the game.
 */
export class WaveManager {
    /**
     * @param {Array} waveConfig - Array of wave configuration objects (WAVE_CONFIG)
     * @param {object} bossWave - Boss wave configuration (BOSS_WAVE)
     */
    constructor(waveConfig, bossWave) {
        this.waveConfig = waveConfig;
        this.bossWave = bossWave;
        this.waveIndex = 0;
        this.timeInWave = 0;
        this.totalElapsed = 0;
        this.waveStarted = false;
        this.waveComplete = false;
        this.bossSpawned = false;
    }

    /**
     * Update the wave timer. Checks for wave transitions.
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        this.totalElapsed += dt;
        this.timeInWave += dt;

        // Emit WAVE_START on first update of a new wave
        if (!this.waveStarted) {
            this.waveStarted = true;
            const current = this.getCurrentWave();
            eventBus.emit(EVENTS.WAVE_START, {
                waveIndex: this.waveIndex,
                waveConfig: current,
                message: current ? current.message : this.bossWave.message
            });
        }

        // Check if current wave duration has expired
        const current = this.getCurrentWave();
        if (current && this.timeInWave >= current.duration) {
            this.waveComplete = true;
        }

        // If in boss wave and boss hasn't been spawned yet
        if (this.isBossWave() && !this.bossSpawned) {
            this.bossSpawned = true;
            eventBus.emit(EVENTS.BOSS_SPAWN, {
                waveIndex: this.waveIndex,
                bossConfig: this.bossWave
            });
        }
    }

    /**
     * Get the current wave configuration.
     * Returns null if all normal waves are done (boss wave).
     * @returns {object|null}
     */
    getCurrentWave() {
        if (this.waveIndex < this.waveConfig.length) {
            return this.waveConfig[this.waveIndex];
        }
        return null;
    }

    /**
     * Check if the current wave's timer has expired.
     * @returns {boolean}
     */
    isWaveComplete() {
        return this.waveComplete;
    }

    /**
     * Advance to the next wave. Emits WAVE_CLEAR for the completed wave,
     * then resets timers for the new wave.
     */
    advanceWave() {
        // Emit wave clear for the wave that just ended
        eventBus.emit(EVENTS.WAVE_CLEAR, {
            waveIndex: this.waveIndex,
            waveConfig: this.getCurrentWave()
        });

        this.waveIndex++;
        this.timeInWave = 0;
        this.waveStarted = false;
        this.waveComplete = false;
    }

    /**
     * Check if all normal waves are done and we're in (or entering) the boss wave.
     * @returns {boolean}
     */
    isBossWave() {
        return this.waveIndex >= this.waveConfig.length;
    }

    /**
     * Get current progress information.
     * @returns {{ currentWave: number, totalWaves: number, timeInWave: number, totalTime: number }}
     */
    getProgress() {
        return {
            currentWave: this.waveIndex + 1,
            totalWaves: this.waveConfig.length,
            timeInWave: this.timeInWave,
            totalTime: this.totalElapsed
        };
    }

    /**
     * Get total elapsed game time in seconds.
     * @returns {number}
     */
    getTotalElapsed() {
        return this.totalElapsed;
    }

    /**
     * Reset the wave manager to initial state (e.g. new game).
     */
    reset() {
        this.waveIndex = 0;
        this.timeInWave = 0;
        this.totalElapsed = 0;
        this.waveStarted = false;
        this.waveComplete = false;
        this.bossSpawned = false;
    }
}
