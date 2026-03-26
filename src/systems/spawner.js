// spawner.js - Enemy spawner system
import { ENEMY_CONFIG, ENEMY_TYPES } from '../config/enemies.js';
import { CANVAS_WIDTH } from '../config/constants.js';
import { weightedRandom, randInt } from '../utils/helpers.js';

export class SpawnerSystem {
    /**
     * @param {object} gameState - Reference to game state; must have an `enemies` array.
     */
    constructor(gameState) {
        this.gameState = gameState;
        this.spawnTimer = 0;
    }

    /**
     * Attempt to spawn enemies based on the current wave configuration.
     * Called every frame; uses internal timer to control spawn rate.
     * @param {object} waveConfig - Current wave config from WAVE_CONFIG
     * @param {number} dt - Delta time in seconds
     * @param {number} currentAlive - Number of enemies currently alive on screen
     * @returns {Array} newly spawned enemy objects (also pushed to gameState.enemies)
     */
    spawnWaveEnemies(waveConfig, dt, currentAlive) {
        const spawned = [];
        this.spawnTimer += dt;

        if (this.spawnTimer < waveConfig.spawnInterval) {
            return spawned;
        }

        // Reset timer
        this.spawnTimer -= waveConfig.spawnInterval;

        // Respect maxAlive limit
        if (currentAlive >= waveConfig.maxAlive) {
            return spawned;
        }

        // Pick a spawn group using weighted random
        const group = weightedRandom(waveConfig.spawnGroups, 'weight');

        // Determine how many enemies to spawn this event
        const count = randInt(group.minCount, group.maxCount);

        // Clamp to not exceed maxAlive
        const toSpawn = Math.min(count, waveConfig.maxAlive - currentAlive);

        for (let i = 0; i < toSpawn; i++) {
            const enemy = this._createEnemy(group.type);
            spawned.push(enemy);
            this.gameState.enemies.push(enemy);
        }

        return spawned;
    }

    /**
     * Spawn a boss enemy at a specific position.
     * @param {number} x - X position
     * @param {number} y - Y position
     * @returns {object} the boss enemy object
     */
    spawnBoss(x, y) {
        const config = ENEMY_CONFIG[ENEMY_TYPES.BOSS];
        const boss = {
            type: ENEMY_TYPES.BOSS,
            x: x - config.width / 2,
            y: y,
            width: config.width,
            height: config.height,
            hp: config.hp,
            maxHp: config.hp,
            speed: config.speed,
            damage: config.damage,
            exp: config.exp,
            color: config.color,
            behavior: config.behavior,
            score: config.score,
            phases: config.phases,
            currentPhase: 0,
            attackTimer: 0,
            summonTimer: 0,
            laserTimer: 0,
            dead: false,
            isBoss: true
        };
        this.gameState.enemies.push(boss);
        return boss;
    }

    /**
     * Create a single enemy of the given type at a random X position at the top.
     * @param {string} type - One of ENEMY_TYPES
     * @returns {object} enemy object
     */
    _createEnemy(type) {
        const config = ENEMY_CONFIG[type];
        const x = randInt(0, CANVAS_WIDTH - config.width);
        const y = -config.height;

        return {
            type: type,
            x: x,
            y: y,
            width: config.width,
            height: config.height,
            hp: config.hp,
            maxHp: config.hp,
            speed: config.speed,
            damage: config.damage,
            exp: config.exp,
            color: config.color,
            behavior: config.behavior,
            score: config.score,
            trackingStrength: config.trackingStrength || 0,
            explodeRange: config.explodeRange || 0,
            explodeDamage: config.explodeDamage || 0,
            dead: false,
            isBoss: false
        };
    }

    /**
     * Reset the spawn timer (e.g. on wave change).
     */
    resetTimer() {
        this.spawnTimer = 0;
    }
}
