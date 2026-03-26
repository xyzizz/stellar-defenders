// game.js - 游戏主循环、状态机、核心逻辑（分屏版）
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_STATES, PLAYER, BASE, LEVEL, SCREEN, COLORS } from '../config/constants.js';
import { WEAPON_CONFIG, SPECIAL_WEAPONS } from '../config/weapons.js';
import { ENEMY_TYPES } from '../config/enemies.js';
import { WAVE_CONFIG, BOSS_WAVE } from '../config/waves.js';
import { REWARD_RARITY, getRandomReward } from '../config/upgrades.js';
import { eventBus, EVENTS } from './eventBus.js';
import { Renderer } from './renderer.js';
import { Player } from '../entities/player.js';
import { Enemy, Boss } from '../entities/enemy.js';
import { Bullet, BossBullet } from '../entities/bullet.js';
import { ParticleSystem } from '../entities/particle.js';
import { Pickup } from '../entities/pickup.js';
import { WallSystem } from '../entities/wall.js';
import { InputSystem } from '../systems/input.js';
import { WaveManager } from '../systems/wave.js';
import { HUD } from '../ui/hud.js';
import { MenuUI } from '../ui/menu.js';
import { RewardPopup } from '../ui/upgradePanel.js';
import { rectCollide, distance, randInt, randFloat, degToRad, weightedRandom } from '../utils/helpers.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.ctx = this.renderer.ctx;

        // Systems
        this.input = new InputSystem();
        this.waveManager = new WaveManager(WAVE_CONFIG, BOSS_WAVE);
        this.particles = new ParticleSystem();

        // UI
        this.hud = new HUD(this.renderer);
        this.menu = new MenuUI(this.renderer);
        this.rewardPopup = new RewardPopup(this.renderer);

        // Game state
        this.state = GAME_STATES.MENU;
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.bossBullets = [];
        this.pickups = [];
        this.boss = null;
        this.wall = null;
        this.combatEffects = [];

        // Stats
        this.score = 0;
        this.kills = 0;
        this.level = 1;
        this.exp = 0;
        this.expToNext = LEVEL.BASE_EXP;
        this.baseDurability = BASE.MAX_DURABILITY;
        this.acquiredUpgrades = [];
        this.rewardStacks = new Map(); // 奖励叠加计数

        // Timers
        this.fireTimer = 0;
        this.missileTimer = 0;
        this.laserTimer = 0;
        this.arcTimer = 0;
        this.spawnTimer = 0;
        this.bossWarningTimer = 0;

        // Pause
        this.pauseKeyWasDown = false;

        // Frame timing
        this.lastTime = 0;
        this.running = false;

        // Mouse for UI
        this.mouseX = 0;
        this.mouseY = 0;
        this._bindMouseEvents();
    }

    _bindMouseEvents() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = CANVAS_WIDTH / rect.width;
            const scaleY = CANVAS_HEIGHT / rect.height;
            this.mouseX = (e.clientX - rect.left) * scaleX;
            this.mouseY = (e.clientY - rect.top) * scaleY;
            if (this.state === GAME_STATES.MENU || this.state === GAME_STATES.VICTORY || this.state === GAME_STATES.DEFEAT) {
                this.menu.handleMouseMove(this.mouseX, this.mouseY);
            }
        });

        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = CANVAS_WIDTH / rect.width;
            const scaleY = CANVAS_HEIGHT / rect.height;
            const mx = (e.clientX - rect.left) * scaleX;
            const my = (e.clientY - rect.top) * scaleY;
            this._handleClick(mx, my);
        });

        // Touch tap for menu buttons
        this.canvas.addEventListener('touchend', (e) => {
            if (this.state === GAME_STATES.MENU || this.state === GAME_STATES.VICTORY || this.state === GAME_STATES.DEFEAT) {
                if (e.changedTouches.length > 0) {
                    const t = e.changedTouches[0];
                    const rect = this.canvas.getBoundingClientRect();
                    const scaleX = CANVAS_WIDTH / rect.width;
                    const scaleY = CANVAS_HEIGHT / rect.height;
                    const mx = (t.clientX - rect.left) * scaleX;
                    const my = (t.clientY - rect.top) * scaleY;
                    this._handleClick(mx, my);
                }
            }
        }, { passive: true });
    }

    _handleClick(mx, my) {
        if (this.state === GAME_STATES.MENU) {
            const action = this.menu.handleClick(mx, my);
            if (action === 'start') this.startGame();
        } else if (this.state === GAME_STATES.VICTORY || this.state === GAME_STATES.DEFEAT) {
            const action = this.menu.handleClick(mx, my);
            if (action === 'restart') this.startGame();
        }
    }

    startGame() {
        this.player = new Player();
        this.enemies = [];
        this.bullets = [];
        this.bossBullets = [];
        this.pickups = [];
        this.boss = null;
        this.wall = new WallSystem();
        this.combatEffects = [];
        this.score = 0;
        this.kills = 0;
        this.level = 1;
        this.exp = 0;
        this.expToNext = LEVEL.BASE_EXP;
        this.baseDurability = BASE.MAX_DURABILITY;
        this.acquiredUpgrades = [];
        this.rewardStacks = new Map();
        this.fireTimer = 0;
        this.missileTimer = 0;
        this.laserTimer = 0;
        this.arcTimer = 0;
        this.spawnTimer = 0;
        this.bossWarningTimer = 0;

        this.waveManager.reset();
        this.particles.clear();
        this.hud.damageNumbers = [];
        this.rewardPopup.clear();

        eventBus.clear();
        this._setupEvents();

        this.state = GAME_STATES.PLAYING;
        this.input.reset();
        this.input.bindEvents();
        this.input.bindTouchEvents(this.canvas, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    _setupEvents() {
        eventBus.on(EVENTS.WAVE_START, (data) => {
            this.hud.showWaveMessage(data.message);
        });
        eventBus.on(EVENTS.BOSS_SPAWN, () => {
            this.bossWarningTimer = 3.0;
            this.hud.showBossWarning();
        });
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this._loop(this.lastTime);
    }

    _loop(timestamp) {
        if (!this.running) return;
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
        this.lastTime = timestamp;
        this.update(dt);
        this.render();
        requestAnimationFrame((t) => this._loop(t));
    }

    // ======== UPDATE ========
    update(dt) {
        switch (this.state) {
            case GAME_STATES.MENU:
                break;
            case GAME_STATES.PLAYING:
            case GAME_STATES.BOSS:
                this._updatePlaying(dt);
                break;
            case GAME_STATES.BOSS_WARNING:
                this._updateBossWarning(dt);
                break;
            case GAME_STATES.PAUSED:
                this._checkPauseToggle();
                break;
            case GAME_STATES.VICTORY:
            case GAME_STATES.DEFEAT:
                this.particles.update(dt);
                this._updateCombatEffects(dt);
                this.rewardPopup.update(dt);
                break;
        }
    }

    _updatePlaying(dt) {
        if (this._checkPauseToggle()) return;

        // Wave progression
        this.waveManager.update(dt);
        if (!this.waveManager.isBossWave() && this.waveManager.isWaveComplete()) {
            this.waveManager.advanceWave();
            this.spawnTimer = 0;
            if (this.waveManager.isBossWave()) {
                this.state = GAME_STATES.BOSS_WARNING;
                this.bossWarningTimer = 3.0;
                this.hud.showBossWarning();
                return;
            }
        }

        // Player input (keyboard + touch)
        this._movePlayer(dt);
        this.player.update(dt);

        // Auto-fire
        this._updatePrimaryFire(dt);
        this._updateSpecialWeapons(dt);

        // Spawn enemies (right side only)
        if (!this.waveManager.isBossWave() && this.state === GAME_STATES.PLAYING) {
            this._spawnEnemies(dt);
        }

        // Update entities
        this._updateEntities(dt);

        // Collisions
        this._processCollisions();

        // Wall
        this.wall.update(dt);

        // Particles, HUD, reward popup
        this.particles.update(dt);
        this._updateCombatEffects(dt);
        this.hud.update(dt);
        this.rewardPopup.update(dt);

        // Level up from exp (passive, small bonuses)
        this._checkLevelUp();

        // Defeat checks
        if (this.player.hp <= 0) { this.state = GAME_STATES.DEFEAT; return; }
        if (this.baseDurability <= 0) { this.baseDurability = 0; this.state = GAME_STATES.DEFEAT; return; }
    }

    _updateBossWarning(dt) {
        this.bossWarningTimer -= dt;
        this.hud.update(dt);
        this.particles.update(dt);
        this._updateCombatEffects(dt);
        this.rewardPopup.update(dt);

        this._movePlayer(dt);
        this.player.update(dt);
        this._updateBullets(dt);

        if (this.bossWarningTimer <= 0) {
            this.boss = new Boss(1);
            // Boss 在右侧区域居中
            this.boss.x = SCREEN.RIGHT_MIN + (SCREEN.RIGHT_MAX - SCREEN.RIGHT_MIN - this.boss.width) / 2;
            this.enemies.push(this.boss);
            this.state = GAME_STATES.BOSS;
        }
    }

    _checkPauseToggle() {
        const pauseDown = this.input.isPause();
        if (pauseDown && !this.pauseKeyWasDown) {
            if (this.state === GAME_STATES.PAUSED) {
                this.state = (this.boss && this.boss.alive) ? GAME_STATES.BOSS : GAME_STATES.PLAYING;
            } else if (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.BOSS) {
                this.state = GAME_STATES.PAUSED;
                this.pauseKeyWasDown = true;
                return true;
            }
        }
        this.pauseKeyWasDown = pauseDown;
        return false;
    }

    // ---- Player movement (keyboard + touch) ----
    _movePlayer(dt) {
        // Touch input takes priority
        if (this.input.touchActive && this.input.touchTargetX >= 0) {
            const targetX = this.input.touchTargetX - this.player.width / 2;
            const dx = targetX - this.player.x;
            if (Math.abs(dx) > 3) { // deadZone 避免抖动
                const moveAmount = Math.min(Math.abs(dx), this.player.stats.moveSpeed * dt * 1.5);
                this.player.x += Math.sign(dx) * moveAmount;
                if (this.player.x < 0) this.player.x = 0;
                if (this.player.x > CANVAS_WIDTH - this.player.width) this.player.x = CANVAS_WIDTH - this.player.width;
            }
        } else {
            let moveDir = 0;
            if (this.input.isLeft()) moveDir -= 1;
            if (this.input.isRight()) moveDir += 1;
            this.player.move(moveDir, dt);
        }
    }

    // ---- Primary fire ----
    _updatePrimaryFire(dt) {
        this.fireTimer += dt;
        const fireRate = this.player.getFireRate();
        if (this.fireTimer >= fireRate) {
            this.fireTimer -= fireRate;
            this._firePrimary();
        }
    }

    _firePrimary() {
        const p = this.player;
        const stats = p.stats;
        const baseDmg = WEAPON_CONFIG.primary.damage * stats.damageMultiplier;
        const count = stats.bulletCount;
        const spread = stats.spread;
        const cx = p.getCenterX();
        const topY = p.y;

        const isCrit = Math.random() < stats.critChance;
        const damage = isCrit ? baseDmg * stats.critMultiplier : baseDmg;

        for (let i = 0; i < count; i++) {
            let angle = -Math.PI / 2; // straight up
            if (count > 1) {
                const totalSpread = degToRad(spread > 0 ? spread : 8);
                const step = totalSpread / (count - 1);
                angle = -Math.PI / 2 - totalSpread / 2 + step * i;
            }

            const bullet = new Bullet({
                x: cx - 2,
                y: topY,
                speed: WEAPON_CONFIG.primary.bulletSpeed,
                damage: damage,
                pierce: stats.pierce,
                color: isCrit ? '#ffff00' : WEAPON_CONFIG.primary.bulletColor,
                angle: angle,
                explosive: stats.explosive,
                explosiveRadius: stats.explosiveRadius,
                explosiveDamage: stats.explosiveDamage
            });
            this.bullets.push(bullet);
        }
    }

    // ---- Special weapons ----
    _updateSpecialWeapons(dt) {
        const stats = this.player.stats;

        if (stats.missileLevel > 0) {
            this.missileTimer += dt;
            const interval = SPECIAL_WEAPONS.missile.fireRate / stats.missileLevel;
            if (this.missileTimer >= interval) {
                this.missileTimer -= interval;
                this._fireMissile();
            }
        }

        if (stats.laserLevel > 0) {
            this.laserTimer += dt;
            const interval = SPECIAL_WEAPONS.laser.cooldown / stats.laserLevel;
            if (this.laserTimer >= interval) {
                this.laserTimer -= interval;
                this._fireLaser();
            }
        }

        if (stats.arcLevel > 0) {
            this.arcTimer += dt;
            const interval = SPECIAL_WEAPONS.arc.fireRate / stats.arcLevel;
            if (this.arcTimer >= interval) {
                this.arcTimer -= interval;
                this._fireArc();
            }
        }
    }

    _fireMissile() {
        const target = this._findClosestEnemy();
        if (!target) return;
        const cx = this.player.getCenterX();
        const stats = this.player.stats;
        const missile = new Bullet({
            x: cx - 4, y: this.player.y,
            width: SPECIAL_WEAPONS.missile.bulletWidth,
            height: SPECIAL_WEAPONS.missile.bulletHeight,
            speed: SPECIAL_WEAPONS.missile.bulletSpeed,
            damage: SPECIAL_WEAPONS.missile.damage * stats.damageMultiplier,
            color: SPECIAL_WEAPONS.missile.bulletColor,
            angle: -Math.PI / 2,
            tracking: true,
            trackingStrength: SPECIAL_WEAPONS.missile.trackingStrength,
            targetEnemy: target,
            explosive: true,
            explosiveRadius: SPECIAL_WEAPONS.missile.explosiveRadius,
            explosiveDamage: SPECIAL_WEAPONS.missile.explosiveDamage * stats.damageMultiplier
        });
        this.bullets.push(missile);
    }

    _fireLaser() {
        const cx = this.player.getCenterX();
        const stats = this.player.stats;
        const laserDmg = SPECIAL_WEAPONS.laser.damage * stats.laserLevel * stats.damageMultiplier;
        const laserWidth = SPECIAL_WEAPONS.laser.width * stats.laserLevel;

        // 激光只打右侧的敌人
        for (const enemy of this.enemies) {
            if (!this._isEnemyTargetable(enemy)) continue;
            const ecx = enemy.getCenterX();
            if (Math.abs(ecx - cx) < laserWidth + enemy.width / 2) {
                const killed = enemy.takeDamage(laserDmg);
                this.hud.addDamageNumber(ecx, enemy.getCenterY(), laserDmg, false);
                if (killed) this._onEnemyKilled(enemy);
            }
        }

        // 激光也打左侧砖墙和宝箱
        if (cx < SCREEN.SPLIT_X) {
            for (const mod of this.wall.modules) {
                for (const brick of mod.bricks) {
                    if (!brick.alive) continue;
                    const bcx = brick.x + brick.width / 2;
                    if (Math.abs(bcx - cx) < laserWidth + brick.width / 2) {
                        const destroyed = brick.takeDamage(laserDmg);
                        if (destroyed) this._onBrickDestroyed(brick);
                    }
                }
                // 也打暴露的宝箱
                if (mod.chest.exposed && !mod.chest.opened) {
                    const ccx = mod.chest.x + mod.chest.width / 2;
                    if (Math.abs(ccx - cx) < laserWidth + mod.chest.width / 2) {
                        const opened = mod.chest.takeDamage(laserDmg);
                        if (opened) this._onChestOpened(mod.chest);
                    }
                }
            }
        }

        for (let y = this.player.y; y > 0; y -= 15) {
            this.particles.emit(cx + randFloat(-2, 2), y, 1, {
                color: SPECIAL_WEAPONS.laser.color, speed: 30, life: 0.2, size: 3
            });
        }
    }

    _fireArc() {
        const target = this._findClosestEnemy();
        if (!target) return;
        const stats = this.player.stats;
        const damage = SPECIAL_WEAPONS.arc.damage * stats.arcLevel * stats.damageMultiplier;
        const chainCount = SPECIAL_WEAPONS.arc.chainCount + stats.arcLevel - 1;
        const chainRange = SPECIAL_WEAPONS.arc.chainRange;

        let currentTarget = target;
        const hitTargets = new Set();
        let sourceX = this.player.getCenterX();
        let sourceY = this.player.y + 4;

        for (let i = 0; i < chainCount && currentTarget; i++) {
            if (!currentTarget.alive) break;
            hitTargets.add(currentTarget);
            this._addArcEffect(
                sourceX,
                sourceY,
                currentTarget.getCenterX(),
                currentTarget.getCenterY(),
                SPECIAL_WEAPONS.arc.color
            );
            const killed = currentTarget.takeDamage(damage);
            this.hud.addDamageNumber(currentTarget.getCenterX(), currentTarget.getCenterY(), damage, false);
            this.particles.emit(currentTarget.getCenterX(), currentTarget.getCenterY(), 3, {
                color: SPECIAL_WEAPONS.arc.color, speed: 60, life: 0.2, size: 2
            });
            if (killed) this._onEnemyKilled(currentTarget);

            const px = currentTarget.getCenterX();
            const py = currentTarget.getCenterY();
            sourceX = px;
            sourceY = py;
            currentTarget = this._findClosestEnemyTo(px, py, chainRange, hitTargets);
        }
    }

    _findClosestEnemy() {
        let closest = null, closestDist = Infinity;
        const px = this.player.getCenterX(), py = this.player.getCenterY();
        for (const enemy of this.enemies) {
            if (!this._isEnemyTargetable(enemy)) continue;
            const d = distance(px, py, enemy.getCenterX(), enemy.getCenterY());
            if (d < closestDist) { closestDist = d; closest = enemy; }
        }
        return closest;
    }

    _findClosestEnemyTo(x, y, range, exclude = new Set()) {
        let closest = null, closestDist = range;
        for (const enemy of this.enemies) {
            if (!this._isEnemyTargetable(enemy) || exclude.has(enemy)) continue;
            const d = distance(x, y, enemy.getCenterX(), enemy.getCenterY());
            if (d < closestDist) { closestDist = d; closest = enemy; }
        }
        return closest;
    }

    _isEnemyTargetable(enemy) {
        if (!enemy || !enemy.alive) return false;
        // Ignore enemies that have spawned but have not yet entered the visible playfield.
        return enemy.y + enemy.height > 0 && enemy.y < CANVAS_HEIGHT;
    }

    // ---- Spawning (right side only) ----
    _spawnEnemies(dt) {
        const waveConfig = this.waveManager.getCurrentWave();
        if (!waveConfig) return;

        this.spawnTimer += dt;
        if (this.spawnTimer < waveConfig.spawnInterval) return;
        this.spawnTimer -= waveConfig.spawnInterval;

        const aliveCount = this.enemies.filter(e => e.alive).length;
        if (aliveCount >= waveConfig.maxAlive) return;

        const group = weightedRandom(waveConfig.spawnGroups, 'weight');
        const count = randInt(group.minCount, group.maxCount);
        const toSpawn = Math.min(count, waveConfig.maxAlive - aliveCount);

        const waveIndex = this.waveManager.getProgress().currentWave;
        const hpMultiplier = 1 + (waveIndex - 1) * 0.20;

        const rightWidth = SCREEN.RIGHT_MAX - SCREEN.RIGHT_MIN;
        for (let i = 0; i < toSpawn; i++) {
            // 敌人只在右侧生成
            const x = SCREEN.RIGHT_MIN + randInt(20, rightWidth - 60);
            const enemy = new Enemy(group.type, x, -40, hpMultiplier);
            this.enemies.push(enemy);
        }
    }

    // ---- Entity updates ----
    _updateEntities(dt) {
        const playerX = this.player.getCenterX();

        // Enemies
        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;
            if (enemy instanceof Boss) {
                enemy.update(dt, playerX);
                enemy.updateLaser(dt);
                this._updateBossBehavior(enemy, dt);
            } else {
                enemy.update(dt, playerX);
            }
        }

        this._updateBullets(dt);

        // Boss bullets
        for (let i = this.bossBullets.length - 1; i >= 0; i--) {
            this.bossBullets[i].update(dt);
            if (this.bossBullets[i].isOffScreen()) this.bossBullets.splice(i, 1);
        }

        // Pickups (reward drops from walls)
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            pickup.update(dt, this.player.getCenterX(), this.player.getCenterY(), this.player.stats.magnetRange);
            if (pickup.isOffScreen()) {
                this.pickups.splice(i, 1);
            } else if (pickup.isCollectedBy(this.player)) {
                this._collectPickup(pickup);
                this.pickups.splice(i, 1);
            }
        }

        // Clean dead enemies + base check (right side only)
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (!enemy.alive) { this.enemies.splice(i, 1); continue; }
            if (!(enemy instanceof Boss) && enemy.y + enemy.height >= BASE.Y_LINE) {
                this.baseDurability -= 1;
                enemy.alive = false;
                this.enemies.splice(i, 1);
                this.renderer.shake(4);
            }
        }
    }

    _updateBullets(dt) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update(dt);
            if (this.bullets[i].isOffScreen() || !this.bullets[i].alive) {
                this.bullets.splice(i, 1);
            }
        }
    }

    _updateBossBehavior(boss, dt) {
        if (!boss.entered || !boss.alive) return;

        // Boss 只在右侧区域移动
        if (boss.x <= SCREEN.RIGHT_MIN + 10) {
            boss.x = SCREEN.RIGHT_MIN + 10;
            boss.direction = 1;
        } else if (boss.x + boss.width >= SCREEN.RIGHT_MAX - 10) {
            boss.x = SCREEN.RIGHT_MAX - 10 - boss.width;
            boss.direction = -1;
        }

        if (boss.shouldAttack()) {
            const phase = boss.getCurrentPhase();
            const cx = boss.getCenterX();
            const botY = boss.y + boss.height;
            const count = phase.bulletCount;
            for (let i = 0; i < count; i++) {
                const spread = Math.PI / 6;
                let angle = Math.PI / 2;
                if (count > 1) angle = Math.PI / 2 - spread / 2 + (spread / (count - 1)) * i;
                this.bossBullets.push(new BossBullet({
                    x: cx - 3, y: botY, speed: phase.bulletSpeed,
                    damage: boss.damage, angle, color: '#ff0066'
                }));
            }
        }

        if (boss.shouldSummon()) {
            const phase = boss.getCurrentPhase();
            const summonType = ENEMY_TYPES[phase.summonType] || ENEMY_TYPES.DRONE;
            for (let i = 0; i < phase.summonCount; i++) {
                const x = SCREEN.RIGHT_MIN + randInt(30, SCREEN.RIGHT_MAX - SCREEN.RIGHT_MIN - 60);
                this.enemies.push(new Enemy(summonType, x, boss.y + boss.height));
            }
        }

        if (boss.shouldLaser()) this.renderer.shake(8);

        if (boss.laserActive) {
            const cx = boss.getCenterX();
            const px = this.player.getCenterX();
            if (Math.abs(px - cx) < 15 + this.player.width / 2) {
                const phase = boss.getCurrentPhase();
                this.player.takeDamage(phase.laserDamage || 2);
            }
        }
    }

    // ---- Collisions ----
    _processCollisions() {
        // Player bullets vs enemies (right side)
        for (const bullet of this.bullets) {
            if (!bullet.alive) continue;

            // 子弹打敌人
            for (const enemy of this.enemies) {
                if (!this._isEnemyTargetable(enemy)) continue;
                if (rectCollide(bullet, enemy)) {
                    const killed = enemy.takeDamage(bullet.damage);
                    bullet.onHit();
                    this.hud.addDamageNumber(
                        enemy.getCenterX() + randFloat(-10, 10),
                        enemy.getCenterY() - 10,
                        bullet.damage, bullet.color === '#ffff00'
                    );
                    this.particles.emitHit(enemy.getCenterX(), enemy.getCenterY(), enemy.color);
                    if (bullet.explosive && bullet.explosiveRadius > 0) {
                        this._explode(enemy.getCenterX(), enemy.getCenterY(), bullet.explosiveRadius, bullet.explosiveDamage);
                    }
                    if (killed) this._onEnemyKilled(enemy);
                    if (!bullet.alive) break;
                }
            }
        }

        // Player bullets vs wall bricks & chests (left side)
        const wallResult = this.wall.checkBulletCollisions(this.bullets);
        // Brick hits
        for (const { bullet, brick } of wallResult.brickHits) {
            const destroyed = brick.takeDamage(bullet.damage);
            bullet.onHit();
            this.particles.emitHit(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.getColor());
            if (bullet.explosive && bullet.explosiveRadius > 0) {
                this._explodeBricks(brick.x + brick.width / 2, brick.y + brick.height / 2, bullet.explosiveRadius, bullet.explosiveDamage);
            }
            if (destroyed) this._onBrickDestroyed(brick);
        }
        // Chest hits
        for (const { bullet, chest } of wallResult.chestHits) {
            const opened = chest.takeDamage(bullet.damage);
            bullet.onHit();
            this.hud.addDamageNumber(chest.x + chest.width / 2, chest.y, bullet.damage, false);
            this.particles.emitHit(chest.x + chest.width / 2, chest.y + chest.height / 2, COLORS.CHEST_GLOW);
            if (opened) this._onChestOpened(chest);
        }

        // Boss bullets vs player
        for (let i = this.bossBullets.length - 1; i >= 0; i--) {
            const bb = this.bossBullets[i];
            if (rectCollide(bb, this.player)) {
                const dmg = this.player.takeDamage(bb.damage);
                if (dmg > 0) {
                    this.renderer.shake(3);
                    this.particles.emitHit(this.player.getCenterX(), this.player.getCenterY(), '#ff4444');
                    this.hud.addDamageNumber(this.player.getCenterX(), this.player.y - 10, dmg, false);
                }
                this.bossBullets.splice(i, 1);
            }
        }

        // Enemies vs player (contact)
        for (const enemy of this.enemies) {
            if (!enemy.alive || enemy instanceof Boss) continue;
            if (rectCollide(this.player, enemy)) {
                const dmg = this.player.takeDamage(enemy.damage);
                if (dmg > 0) {
                    this.renderer.shake(5);
                    this.particles.emitHit(this.player.getCenterX(), this.player.getCenterY(), '#ff4444');
                    if (enemy.type === ENEMY_TYPES.BOMBER) {
                        this._explode(enemy.getCenterX(), enemy.getCenterY(), enemy.explodeRange, enemy.explodeDamage);
                        enemy.alive = false;
                    }
                }
            }
        }
    }

    _explode(x, y, radius, damage) {
        this.particles.emitExplosion(x, y);
        this._addExplosionEffect(x, y, radius, '#ffaa00');
        this.renderer.shake(6);
        for (const enemy of this.enemies) {
            if (!this._isEnemyTargetable(enemy)) continue;
            if (distance(x, y, enemy.getCenterX(), enemy.getCenterY()) < radius) {
                const killed = enemy.takeDamage(damage);
                this.hud.addDamageNumber(
                    enemy.getCenterX() + randFloat(-8, 8),
                    enemy.getCenterY() - 6,
                    damage,
                    false
                );
                this.particles.emitHit(enemy.getCenterX(), enemy.getCenterY(), '#ffaa00');
                if (killed) this._onEnemyKilled(enemy);
            }
        }
    }

    _explodeBricks(x, y, radius, damage) {
        // Explode bricks from all modules
        for (const mod of this.wall.modules) {
            for (const brick of mod.bricks) {
                if (!brick.alive) continue;
                const bcx = brick.x + brick.width / 2;
                const bcy = brick.y + brick.height / 2;
                if (distance(x, y, bcx, bcy) < radius) {
                    const destroyed = brick.takeDamage(damage);
                    if (destroyed) this._onBrickDestroyed(brick);
                }
            }
        }
    }

    _onEnemyKilled(enemy) {
        this.kills++;
        this.score += enemy.score;
        this.particles.emitExplosion(enemy.getCenterX(), enemy.getCenterY(), enemy.color);
        this.renderer.shake(enemy instanceof Boss ? 15 : 3);

        // 敌人掉经验（小绿球，被动经验）
        if (enemy.exp > 0) {
            const orbCount = Math.max(1, Math.floor(enemy.exp / 5));
            const expEach = enemy.exp / orbCount;
            for (let i = 0; i < orbCount; i++) {
                const px = enemy.getCenterX() + randFloat(-15, 15);
                const py = enemy.getCenterY() + randFloat(-15, 15);
                const pickup = new Pickup(px, py, expEach);
                pickup.pickupType = 'exp';
                this.pickups.push(pickup);
            }
        }

        if (enemy instanceof Boss) {
            this.boss = null;
            this.state = GAME_STATES.VICTORY;
        }
    }

    _onBrickDestroyed(brick) {
        this.particles.emitExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.getColor());
        this.score += 3;
    }

    _onChestOpened(chest) {
        const cx = chest.x + chest.width / 2;
        const cy = chest.y + chest.height / 2;
        const tier = chest.tier;

        // 大爆发特效
        this.particles.emitExplosion(cx, cy, COLORS.CHEST_GLOW);
        this.particles.emitExplosion(cx, cy, REWARD_RARITY[tier]?.color || '#ffcc00');
        this.renderer.shake(8);
        this.score += 50;

        // 掉落 1-2 个奖励
        const rewardCount = tier === 'LEGENDARY' ? 2 : (tier === 'EPIC' ? 2 : 1);
        for (let i = 0; i < rewardCount; i++) {
            const reward = getRandomReward(tier, this.rewardStacks);
            if (reward) {
                reward.rarity = tier;
                const pickup = new Pickup(cx + randFloat(-20, 20), cy + randFloat(-10, 10), 0);
                pickup.pickupType = 'reward';
                pickup.reward = reward;
                pickup.color = REWARD_RARITY[tier]?.color || '#ffcc00';
                pickup.size = 16;
                this.pickups.push(pickup);
            }
        }
    }

    _collectPickup(pickup) {
        if (pickup.pickupType === 'exp') {
            this.exp += pickup.exp * (this.player.stats.expMultiplier || 1);
        } else if (pickup.pickupType === 'reward') {
            const reward = pickup.reward;
            if (reward) {
                reward.apply(this.player.stats);
                const count = (this.rewardStacks.get(reward.id) || 0) + 1;
                this.rewardStacks.set(reward.id, count);
                this.acquiredUpgrades.push({
                    id: reward.id, name: reward.name, icon: reward.icon,
                    description: reward.description
                });
                this.rewardPopup.show(reward);

                // 特殊效果
                if (this.player.stats.healOnUpgrade) {
                    this.player.hp = Math.min(this.player.hp + this.player.stats.healOnUpgrade, this.player.stats.maxHp || this.player.maxHp);
                    delete this.player.stats.healOnUpgrade;
                }
                if (this.player.stats.maxHp) {
                    this.player.maxHp = this.player.stats.maxHp;
                }
                if (this.player.stats.baseRepair) {
                    this.baseDurability = Math.min(this.baseDurability + this.player.stats.baseRepair, BASE.MAX_DURABILITY);
                    delete this.player.stats.baseRepair;
                }

                this.renderer.shake(3);
            }
        }
    }

    _checkLevelUp() {
        while (this.exp >= this.expToNext && this.level < LEVEL.MAX_LEVEL) {
            this.exp -= this.expToNext;
            this.level++;
            this.expToNext = Math.floor(LEVEL.BASE_EXP * Math.pow(LEVEL.EXP_GROWTH, this.level - 1));
            // 被动成长：每级+4%伤害
            this.player.stats.damageMultiplier = (this.player.stats.damageMultiplier || 1) + 0.04;
        }
    }

    _updateCombatEffects(dt) {
        for (let i = this.combatEffects.length - 1; i >= 0; i--) {
            const effect = this.combatEffects[i];
            effect.life -= dt;
            if (effect.life <= 0) {
                this.combatEffects.splice(i, 1);
            }
        }
    }

    _pushCombatEffect(effect) {
        if (this.combatEffects.length >= 48) {
            this.combatEffects.shift();
        }
        this.combatEffects.push(effect);
    }

    _addArcEffect(x1, y1, x2, y2, color) {
        this._pushCombatEffect({
            type: 'arc',
            x1,
            y1,
            x2,
            y2,
            color,
            life: 0.14,
            maxLife: 0.14,
            jitter: randFloat(-16, 16)
        });
    }

    _addExplosionEffect(x, y, radius, color) {
        this._pushCombatEffect({
            type: 'ring',
            x,
            y,
            color,
            maxRadius: radius,
            life: 0.22,
            maxLife: 0.22
        });
    }

    _renderCombatEffects() {
        const ctx = this.ctx;

        for (const effect of this.combatEffects) {
            const lifeRatio = Math.max(0, effect.life / effect.maxLife);

            if (effect.type === 'arc') {
                const dx = effect.x2 - effect.x1;
                const dy = effect.y2 - effect.y1;
                const len = Math.hypot(dx, dy) || 1;
                const nx = -dy / len;
                const ny = dx / len;
                const kink = effect.jitter * (0.35 + 0.65 * lifeRatio);
                const midX = (effect.x1 + effect.x2) / 2 + nx * kink;
                const midY = (effect.y1 + effect.y2) / 2 + ny * kink;

                ctx.save();
                ctx.globalAlpha = 0.8 * lifeRatio;
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 2 + lifeRatio * 2;
                ctx.shadowColor = effect.color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(effect.x1, effect.y1);
                ctx.lineTo(midX, midY);
                ctx.lineTo(effect.x2, effect.y2);
                ctx.stroke();

                ctx.globalAlpha = 0.9 * lifeRatio;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.2;
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.moveTo(effect.x1, effect.y1);
                ctx.lineTo(midX, midY);
                ctx.lineTo(effect.x2, effect.y2);
                ctx.stroke();
                ctx.restore();
            } else if (effect.type === 'ring') {
                const progress = 1 - lifeRatio;
                const radius = 10 + effect.maxRadius * progress;

                ctx.save();
                ctx.globalAlpha = 0.3 * lifeRatio;
                ctx.fillStyle = effect.color;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, radius * 0.45, 0, Math.PI * 2);
                ctx.fill();

                ctx.globalAlpha = 0.65 * lifeRatio;
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 2.5 - progress;
                ctx.shadowColor = effect.color;
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    // ======== RENDER ========
    render() {
        this.renderer.clear();
        const ctx = this.ctx;

        switch (this.state) {
            case GAME_STATES.MENU:
                this.menu.renderMainMenu(ctx);
                break;
            case GAME_STATES.PLAYING:
            case GAME_STATES.BOSS:
            case GAME_STATES.BOSS_WARNING:
                this._renderGame();
                break;
            case GAME_STATES.PAUSED:
                this._renderGame();
                this.menu.renderPaused(ctx);
                break;
            case GAME_STATES.VICTORY:
                this._renderGame();
                this.menu.renderVictory(ctx, this._getResultStats());
                break;
            case GAME_STATES.DEFEAT:
                this._renderGame();
                this.menu.renderDefeat(ctx, this._getResultStats());
                break;
        }

        this.renderer.endFrame(1 / 60);
    }

    _renderGame() {
        const r = this.renderer;
        const ctx = this.ctx;
        const progress = this.waveManager.getProgress();

        // 左侧：砖墙区
        this.wall.render(r);

        // 分界线
        ctx.save();
        ctx.strokeStyle = COLORS.DIVIDER;
        ctx.lineWidth = SCREEN.DIVIDER_WIDTH;
        ctx.globalAlpha = 0.4;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(SCREEN.SPLIT_X, 0);
        ctx.lineTo(SCREEN.SPLIT_X, CANVAS_HEIGHT);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // 右侧背景网格
        ctx.save();
        ctx.beginPath();
        ctx.rect(SCREEN.RIGHT_MIN, 0, SCREEN.RIGHT_MAX - SCREEN.RIGHT_MIN, CANVAS_HEIGHT);
        ctx.clip();
        const gridSize = 40;
        ctx.strokeStyle = COLORS.GRID_LINE;
        ctx.lineWidth = 1;
        for (let x = SCREEN.RIGHT_MIN; x < SCREEN.RIGHT_MAX; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
        }
        for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(SCREEN.RIGHT_MIN, y); ctx.lineTo(SCREEN.RIGHT_MAX, y); ctx.stroke();
        }
        ctx.restore();

        // 右侧基地线
        r.drawBaseLine(BASE.Y_LINE, this.baseDurability, BASE.MAX_DURABILITY);

        // Pickups
        for (const pickup of this.pickups) pickup.render(r);

        // Enemies
        for (const enemy of this.enemies) {
            if (enemy.alive) enemy.render(r, progress.totalTime);
        }

        // Player
        if (this.player) this.player.render(r);

        // Bullets
        for (const bullet of this.bullets) {
            if (bullet.alive) bullet.render(r);
        }

        // Boss bullets
        for (const bb of this.bossBullets) bb.render(r);

        // Combat effect overlays
        this._renderCombatEffects();

        // Particles
        this.particles.render(r);

        // HUD
        if (this.player) {
            const wallProgress = this.wall.getProgress();
            this.hud.render({
                currentWave: progress.currentWave,
                totalWaves: progress.totalWaves + 1,
                totalTime: progress.totalTime,
                score: this.score,
                playerHp: this.player.hp,
                playerMaxHp: this.player.maxHp,
                baseDurability: this.baseDurability,
                baseMaxDurability: BASE.MAX_DURABILITY,
                level: this.level,
                acquiredUpgrades: this.acquiredUpgrades,
                wallProgress: { ...wallProgress }
            });
        }

        // Reward popup
        this.rewardPopup.render(ctx);
    }

    _getResultStats() {
        const wallProgress = this.wall ? this.wall.getProgress() : { broken: 0, total: 0, chestsOpened: 0, chestsTotal: 0 };
        return {
            totalTime: this.waveManager.getTotalElapsed(),
            level: this.level,
            kills: this.kills,
            score: this.score,
            wavesCleared: Math.min(this.waveManager.getProgress().currentWave, WAVE_CONFIG.length),
            totalWaves: WAVE_CONFIG.length,
            acquiredUpgrades: this.acquiredUpgrades,
            wallsBroken: wallProgress.broken,
            chestsOpened: wallProgress.chestsOpened,
            chestsTotal: wallProgress.chestsTotal,
            upgradesAcquired: this.acquiredUpgrades.length
        };
    }
}
