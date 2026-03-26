// player.js - Player entity
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER, COLORS } from '../config/constants.js';
import { WEAPON_CONFIG } from '../config/weapons.js';
import { clamp } from '../utils/helpers.js';
import { loadSprite, drawPixelSprite } from '../utils/sprites.js';

const PLAYER_SPRITE = loadSprite(
    new URL('../../assets/player/player-pixel-mech.svg', import.meta.url).href
);

function renderFallbackPlayer(ctx, player, isFlashing) {
    if (isFlashing) {
        ctx.globalAlpha = 0.4;
    }

    const cx = player.getCenterX();
    const cy = player.getCenterY();

    ctx.beginPath();
    ctx.moveTo(cx, player.y);
    ctx.lineTo(cx + player.width / 2, player.y + player.height * 0.8);
    ctx.lineTo(cx + player.width * 0.15, player.y + player.height * 0.6);
    ctx.lineTo(cx, player.y + player.height);
    ctx.lineTo(cx - player.width * 0.15, player.y + player.height * 0.6);
    ctx.lineTo(cx - player.width / 2, player.y + player.height * 0.8);
    ctx.closePath();

    const grad = ctx.createLinearGradient(cx, player.y, cx, player.y + player.height);
    grad.addColorStop(0, COLORS.PLAYER);
    grad.addColorStop(1, COLORS.PLAYER_SHIELD);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = COLORS.PLAYER;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = COLORS.PLAYER;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(player.width, player.height) * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = '#d9fbff';
    ctx.fill();
}

export class Player {
    constructor() {
        this.width = PLAYER.WIDTH;
        this.height = PLAYER.HEIGHT;
        this.x = (CANVAS_WIDTH - this.width) / 2;
        this.y = CANVAS_HEIGHT - PLAYER.Y_OFFSET - this.height;
        this.hp = PLAYER.MAX_HP;
        this.maxHp = PLAYER.MAX_HP;

        this.invincibleTimer = 0;
        this.regenTimer = 0;

        // Upgraded stats - all start at base values
        this.stats = {
            damageMultiplier: 1,
            fireRateMultiplier: 1,
            bulletCount: WEAPON_CONFIG.primary.bulletCount,
            pierce: WEAPON_CONFIG.primary.pierce,
            critChance: WEAPON_CONFIG.primary.critChance,
            critMultiplier: WEAPON_CONFIG.primary.critMultiplier,
            explosive: WEAPON_CONFIG.primary.explosive,
            explosiveRadius: WEAPON_CONFIG.primary.explosiveRadius,
            explosiveDamage: WEAPON_CONFIG.primary.explosiveDamage,
            spread: WEAPON_CONFIG.primary.spread,
            moveSpeed: PLAYER.SPEED,
            magnetRange: 80,
            expMultiplier: 1,
            regen: 0,
            damageReduction: 0,
            missileLevel: 0,
            laserLevel: 0,
            arcLevel: 0
        };
    }

    move(direction, dt) {
        const speed = this.stats.moveSpeed;
        this.x += direction * speed * dt;
        this.x = clamp(this.x, 0, CANVAS_WIDTH - this.width);
    }

    update(dt) {
        // Invincibility countdown
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer < 0) this.invincibleTimer = 0;
        }

        // Regen
        if (this.stats.regen > 0) {
            this.regenTimer += dt;
            if (this.regenTimer >= 1) {
                this.regenTimer -= 1;
                this.hp = Math.min(this.hp + this.stats.regen, this.maxHp);
            }
        }
    }

    takeDamage(amount) {
        if (this.invincibleTimer > 0) return 0;

        const reduced = amount * (1 - this.stats.damageReduction);
        const finalDamage = Math.max(1, Math.floor(reduced));
        this.hp -= finalDamage;
        if (this.hp < 0) this.hp = 0;
        this.invincibleTimer = PLAYER.INVINCIBLE_TIME;
        return finalDamage;
    }

    getFireRate() {
        return PLAYER.FIRE_RATE * this.stats.fireRateMultiplier;
    }

    getCenterX() {
        return this.x + this.width / 2;
    }

    getCenterY() {
        return this.y + this.height / 2;
    }

    render(renderer) {
        const ctx = renderer.ctx || renderer;

        // Flash when invincible
        const isFlashing = this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 10) % 2 === 0;

        ctx.save();

        const drewSprite = drawPixelSprite(
            ctx,
            PLAYER_SPRITE,
            this.x,
            this.y,
            this.width,
            this.height,
            {
                glowColor: COLORS.PLAYER,
                glowBlur: 10,
                flashAlpha: isFlashing ? 0.72 : 0
            }
        );

        if (!drewSprite) {
            renderFallbackPlayer(ctx, this, isFlashing);
        }

        const cx = this.getCenterX();
        const cy = this.getCenterY();

        // Engine glow at tail
        ctx.beginPath();
        ctx.arc(cx, this.y + this.height + 2, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Shield indicator when invincible
        if (this.invincibleTimer > 0) {
            ctx.beginPath();
            ctx.arc(cx, cy, Math.max(this.width, this.height) * 0.6, 0, Math.PI * 2);
            ctx.strokeStyle = COLORS.PLAYER_SHIELD;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.3 + 0.2 * Math.sin(this.invincibleTimer * 20);
            ctx.stroke();
        }

        ctx.restore();
    }
}
