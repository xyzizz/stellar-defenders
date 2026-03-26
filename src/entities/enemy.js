// enemy.js - Enemy and Boss entities
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, SCREEN } from '../config/constants.js';
import { ENEMY_TYPES, ENEMY_CONFIG } from '../config/enemies.js';
import { clamp } from '../utils/helpers.js';

const ENEMY_SPRITE_URLS = {
    [ENEMY_TYPES.DRONE]: new URL('../../assets/enemies/drone-pixel-mech.svg', import.meta.url).href,
    [ENEMY_TYPES.RUSHER]: new URL('../../assets/enemies/rusher-pixel-mech.svg', import.meta.url).href,
    [ENEMY_TYPES.TANK]: new URL('../../assets/enemies/tank-pixel-mech.svg', import.meta.url).href,
    [ENEMY_TYPES.BOMBER]: new URL('../../assets/enemies/bomber-pixel-mech.svg', import.meta.url).href,
    [ENEMY_TYPES.BOSS]: new URL('../../assets/enemies/boss-pixel-mech.svg', import.meta.url).href
};

const ENEMY_SPRITES = Object.fromEntries(
    Object.entries(ENEMY_SPRITE_URLS).map(([type, url]) => [type, createSprite(url)])
);

function createSprite(url) {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    return image;
}

function getEnemySprite(type) {
    return ENEMY_SPRITES[type] || null;
}

function drawEnemySprite(ctx, sprite, x, y, width, height, glowColor, flashAlpha = 0) {
    if (!sprite || !sprite.complete || !sprite.naturalWidth) return false;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;
    ctx.drawImage(sprite, Math.round(x), Math.round(y), Math.round(width), Math.round(height));

    if (flashAlpha > 0) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
        ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();
    return true;
}

function renderFallbackEnemy(ctx, enemy, drawColor) {
    const cx = enemy.getCenterX();
    const cy = enemy.getCenterY();
    const hw = enemy.width / 2;
    const hh = enemy.height / 2;

    ctx.fillStyle = drawColor;
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = enemy.color;
    ctx.shadowBlur = 6;

    switch (enemy.type) {
        case ENEMY_TYPES.DRONE:
            ctx.beginPath();
            ctx.moveTo(cx, cy - hh);
            ctx.lineTo(cx + hw, cy);
            ctx.lineTo(cx, cy + hh);
            ctx.lineTo(cx - hw, cy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;

        case ENEMY_TYPES.RUSHER:
            ctx.beginPath();
            ctx.moveTo(cx - hw, cy - hh);
            ctx.lineTo(cx + hw, cy - hh);
            ctx.lineTo(cx, cy + hh);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;

        case ENEMY_TYPES.TANK:
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI / 3) * i - Math.PI / 6;
                const px = cx + hw * Math.cos(a);
                const py = cy + hh * Math.sin(a);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI / 3) * i - Math.PI / 6;
                const px = cx + hw * 0.5 * Math.cos(a);
                const py = cy + hh * 0.5 * Math.sin(a);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.strokeStyle = drawColor;
            ctx.globalAlpha = 0.4;
            ctx.stroke();
            ctx.globalAlpha = 1;
            break;

        case ENEMY_TYPES.BOMBER:
            ctx.beginPath();
            ctx.arc(cx, cy, hw, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(cx, cy, hw + 3 + Math.sin(Date.now() * 0.01) * 2, 0, Math.PI * 2);
            ctx.strokeStyle = enemy.color;
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.globalAlpha = 1;
            break;

        default:
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            break;
    }

    ctx.shadowBlur = 0;
}

function renderFallbackBoss(ctx, boss, drawColor) {
    const cx = boss.getCenterX();
    const hw = boss.width / 2;
    const hh = boss.height / 2;

    ctx.beginPath();
    ctx.moveTo(cx, boss.y);
    ctx.lineTo(cx + hw * 0.4, boss.y + hh * 0.3);
    ctx.lineTo(cx + hw, boss.y + hh * 0.6);
    ctx.lineTo(cx + hw * 0.7, boss.y + boss.height);
    ctx.lineTo(cx + hw * 0.15, boss.y + boss.height * 0.85);
    ctx.lineTo(cx, boss.y + boss.height);
    ctx.lineTo(cx - hw * 0.15, boss.y + boss.height * 0.85);
    ctx.lineTo(cx - hw * 0.7, boss.y + boss.height);
    ctx.lineTo(cx - hw, boss.y + hh * 0.6);
    ctx.lineTo(cx - hw * 0.4, boss.y + hh * 0.3);
    ctx.closePath();

    const grad = ctx.createLinearGradient(cx, boss.y, cx, boss.y + boss.height);
    grad.addColorStop(0, drawColor);
    grad.addColorStop(1, '#440022');
    ctx.fillStyle = grad;
    ctx.shadowColor = boss.color;
    ctx.shadowBlur = 12;
    ctx.fill();

    ctx.strokeStyle = boss.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(cx, boss.getCenterY(), 10, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4488';
    ctx.shadowColor = '#ff4488';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
}

function getScaledHpBarHeight(totalElapsed, baseHeight, maxHeight) {
    const progress = Math.max(0, Math.min(1, totalElapsed / 180));
    return baseHeight + (maxHeight - baseHeight) * progress;
}

function getHpBarColor(hpRatio) {
    if (hpRatio > 0.5) return '#00ff88';
    if (hpRatio > 0.25) return '#ffaa00';
    return '#ff4444';
}

export class Enemy {
    constructor(type, x, y, waveMultiplier = 1) {
        const config = ENEMY_CONFIG[type];
        if (!config) throw new Error(`Unknown enemy type: ${type}`);

        this.type = type;
        this.x = x;
        this.y = y;
        this.width = config.width;
        this.height = config.height;
        this.hp = Math.floor(config.hp * waveMultiplier);
        this.maxHp = this.hp;
        this.speed = config.speed;
        this.damage = config.damage;
        this.exp = config.exp;
        this.color = config.color;
        this.behavior = config.behavior;
        this.score = config.score;

        // Behavior-specific
        this.trackingStrength = config.trackingStrength || 0;
        this.explodeRange = config.explodeRange || 0;
        this.explodeDamage = config.explodeDamage || 0;

        // Visual feedback
        this.hitFlashTimer = 0;
        this.alive = true;
    }

    update(dt, playerX) {
        if (!this.alive) return;

        // Hit flash countdown
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= dt;
        }

        const cx = this.x + this.width / 2;

        switch (this.behavior) {
            case 'linear':
                // Straight down
                this.y += this.speed * dt;
                break;

            case 'tracking': {
                // Move down and steer toward player x (stay in right side)
                this.y += this.speed * dt;
                const dx = playerX - cx;
                this.x += dx * this.trackingStrength * dt * 10;
                this.x = clamp(this.x, SCREEN.RIGHT_MIN, SCREEN.RIGHT_MAX - this.width);
                break;
            }

            case 'kamikaze': {
                // Rush toward the player's X position, accelerating
                const targetDx = playerX - cx;
                const moveX = targetDx * 2 * dt;
                this.x += moveX;
                this.y += this.speed * dt * 1.2;
                this.x = clamp(this.x, SCREEN.RIGHT_MIN, SCREEN.RIGHT_MAX - this.width);
                break;
            }

            default:
                this.y += this.speed * dt;
                break;
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.hitFlashTimer = 0.1;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            return true; // killed
        }
        return false; // still alive
    }

    getCenterX() {
        return this.x + this.width / 2;
    }

    getCenterY() {
        return this.y + this.height / 2;
    }

    isOffScreen() {
        return this.y > CANVAS_HEIGHT + this.height;
    }

    render(renderer, totalElapsed = 0) {
        const ctx = renderer.ctx || renderer;
        ctx.save();
        const drawColor = this.hitFlashTimer > 0 ? '#ffffff' : this.color;
        const sprite = getEnemySprite(this.type);
        const drewSprite = drawEnemySprite(
            ctx,
            sprite,
            this.x,
            this.y,
            this.width,
            this.height,
            this.color,
            this.hitFlashTimer > 0 ? 0.82 : 0
        );

        if (!drewSprite) {
            renderFallbackEnemy(ctx, this, drawColor);
        }

        const hpRatio = this.hp / this.maxHp;
        const barHeight = getScaledHpBarHeight(totalElapsed, 2.5, 6);
        const barY = this.y - barHeight - 4;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(this.x, barY, this.width, barHeight);

        ctx.fillStyle = getHpBarColor(hpRatio);
        ctx.fillRect(this.x, barY, this.width * hpRatio, barHeight);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, barY, this.width, barHeight);

        ctx.restore();
    }
}

/**
 * Boss - special enemy that moves horizontally, has phases and HP bar
 */
export class Boss {
    constructor(waveMultiplier = 1) {
        const config = ENEMY_CONFIG[ENEMY_TYPES.BOSS];

        this.type = ENEMY_TYPES.BOSS;
        this.width = config.width;
        this.height = config.height;
        this.x = (CANVAS_WIDTH - this.width) / 2;
        this.y = -this.height; // start offscreen, enter from top
        this.hp = Math.floor(config.hp * waveMultiplier);
        this.maxHp = this.hp;
        this.speed = config.speed;
        this.damage = config.damage;
        this.exp = config.exp;
        this.color = config.color;
        this.behavior = config.behavior;
        this.score = config.score;
        this.phases = config.phases;
        this.alive = true;

        this.hitFlashTimer = 0;
        this.direction = 1; // horizontal movement direction
        this.targetY = 60;  // where boss settles vertically
        this.entered = false; // has boss reached targetY

        // Attack timers
        this.attackTimer = 0;
        this.summonTimer = 0;
        this.laserTimer = 0;
        this.laserActive = false;
        this.laserDuration = 0;
    }

    getCurrentPhase() {
        const hpRatio = this.hp / this.maxHp;
        for (const phase of this.phases) {
            if (hpRatio > phase.hpThreshold) {
                return phase;
            }
        }
        // Return last phase if below all thresholds
        return this.phases[this.phases.length - 1];
    }

    update(dt, playerX) {
        if (!this.alive) return;

        // Hit flash countdown
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= dt;
        }

        // Enter from top
        if (!this.entered) {
            this.y += 80 * dt;
            if (this.y >= this.targetY) {
                this.y = this.targetY;
                this.entered = true;
            }
            return;
        }

        // Horizontal patrol movement (right side only)
        this.x += this.speed * this.direction * dt;
        if (this.x <= SCREEN.RIGHT_MIN + 10) {
            this.x = SCREEN.RIGHT_MIN + 10;
            this.direction = 1;
        } else if (this.x + this.width >= SCREEN.RIGHT_MAX - 10) {
            this.x = SCREEN.RIGHT_MAX - 10 - this.width;
            this.direction = -1;
        }

        // Update attack timers
        const phase = this.getCurrentPhase();
        this.attackTimer += dt;
        this.summonTimer += dt;

        if (phase.laserInterval) {
            this.laserTimer += dt;
        }
    }

    /**
     * Check and reset attack timer. Returns true if boss should fire.
     */
    shouldAttack() {
        const phase = this.getCurrentPhase();
        if (this.attackTimer >= phase.attackInterval) {
            this.attackTimer = 0;
            return true;
        }
        return false;
    }

    /**
     * Check and reset summon timer. Returns true if boss should summon minions.
     */
    shouldSummon() {
        const phase = this.getCurrentPhase();
        if (this.summonTimer >= phase.summonInterval) {
            this.summonTimer = 0;
            return true;
        }
        return false;
    }

    /**
     * Check if boss should fire laser (phase 2 only).
     */
    shouldLaser() {
        const phase = this.getCurrentPhase();
        if (!phase.laserInterval) return false;
        if (this.laserTimer >= phase.laserInterval) {
            this.laserTimer = 0;
            this.laserActive = true;
            this.laserDuration = phase.laserDuration;
            return true;
        }
        return false;
    }

    updateLaser(dt) {
        if (this.laserActive) {
            this.laserDuration -= dt;
            if (this.laserDuration <= 0) {
                this.laserActive = false;
                this.laserDuration = 0;
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.hitFlashTimer = 0.08;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            return true;
        }
        return false;
    }

    getCenterX() {
        return this.x + this.width / 2;
    }

    getCenterY() {
        return this.y + this.height / 2;
    }

    isOffScreen() {
        return false; // Boss never goes offscreen on its own
    }

    render(renderer, totalElapsed = 0) {
        const ctx = renderer.ctx || renderer;
        ctx.save();

        const cx = this.getCenterX();
        const drawColor = this.hitFlashTimer > 0 ? '#ffffff' : this.color;
        const sprite = getEnemySprite(this.type);
        const drewSprite = drawEnemySprite(
            ctx,
            sprite,
            this.x,
            this.y,
            this.width,
            this.height,
            this.color,
            this.hitFlashTimer > 0 ? 0.78 : 0
        );

        if (!drewSprite) {
            renderFallbackBoss(ctx, this, drawColor);
        }

        // Laser beam rendering
        if (this.laserActive) {
            ctx.beginPath();
            ctx.moveTo(cx - 3, this.y + this.height);
            ctx.lineTo(cx + 3, this.y + this.height);
            ctx.lineTo(cx + 8, CANVAS_HEIGHT);
            ctx.lineTo(cx - 8, CANVAS_HEIGHT);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 0, 100, 0.6)';
            ctx.shadowColor = '#ff0066';
            ctx.shadowBlur = 20;
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // HP bar above boss
        const barWidth = this.width + 20;
        const barHeight = getScaledHpBarHeight(totalElapsed, 6, 12);
        const barX = cx - barWidth / 2;
        const barY = this.y - 16;
        const hpRatio = this.hp / this.maxHp;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // HP fill
        ctx.fillStyle = getHpBarColor(hpRatio);
        ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

        // Border
        ctx.strokeStyle = '#ff0066';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Phase indicator text
        const phase = this.getCurrentPhase();
        ctx.fillStyle = COLORS.UI_TEXT;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(phase.name, cx, barY - 4);

        ctx.restore();
    }
}
