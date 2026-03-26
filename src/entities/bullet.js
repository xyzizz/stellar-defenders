// bullet.js - Bullet entities (player bullets, boss bullets)
import { CANVAS_WIDTH, CANVAS_HEIGHT, BULLET, COLORS } from '../config/constants.js';
import { WEAPON_CONFIG, SPECIAL_WEAPONS } from '../config/weapons.js';
import { degToRad } from '../utils/helpers.js';

export class Bullet {
    constructor({
        x, y, width, height, speed, damage, pierce = 0,
        color, angle = -Math.PI / 2, explosive = false,
        explosiveRadius = 0, explosiveDamage = 0,
        tracking = false, trackingStrength = 0, targetEnemy = null
    }) {
        this.x = x;
        this.y = y;
        this.width = width || BULLET.WIDTH;
        this.height = height || BULLET.HEIGHT;
        this.speed = speed || BULLET.SPEED;
        this.damage = damage || 10;
        this.pierce = pierce;
        this.color = color || BULLET.COLOR;
        this.angle = angle; // -PI/2 = straight up
        this.explosive = explosive;
        this.explosiveRadius = explosiveRadius;
        this.explosiveDamage = explosiveDamage;
        this.tracking = tracking;
        this.trackingStrength = trackingStrength;
        this.targetEnemy = targetEnemy;
        this.hitCount = 0; // track how many enemies pierced
        this.alive = true;
    }

    update(dt) {
        if (!this.alive) return;

        // Tracking (missile) behavior
        if (this.tracking && this.targetEnemy && this.targetEnemy.hp > 0) {
            const tx = this.targetEnemy.x + this.targetEnemy.width / 2;
            const ty = this.targetEnemy.y + this.targetEnemy.height / 2;
            const desiredAngle = Math.atan2(
                ty - (this.y + this.height / 2),
                tx - (this.x + this.width / 2)
            );
            // Smoothly rotate toward target
            let diff = desiredAngle - this.angle;
            // Normalize angle diff to [-PI, PI]
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.angle += diff * this.trackingStrength;
        }

        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;
    }

    isOffScreen() {
        return (
            this.x + this.width < 0 ||
            this.x > CANVAS_WIDTH ||
            this.y + this.height < 0 ||
            this.y > CANVAS_HEIGHT
        );
    }

    onHit() {
        this.hitCount++;
        if (this.hitCount > this.pierce) {
            this.alive = false;
        }
    }

    render(renderer) {
        const ctx = renderer.ctx || renderer;
        ctx.save();

        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        if (this.tracking) {
            // Missile rendering - larger, pointed shape
            ctx.translate(cx, cy);
            ctx.rotate(this.angle + Math.PI / 2);

            // Missile body
            ctx.beginPath();
            ctx.moveTo(0, -this.height / 2);
            ctx.lineTo(this.width / 2, this.height / 2);
            ctx.lineTo(-this.width / 2, this.height / 2);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 6;
            ctx.fill();

            // Exhaust flame
            ctx.beginPath();
            ctx.moveTo(-this.width / 4, this.height / 2);
            ctx.lineTo(0, this.height / 2 + 6 + Math.random() * 4);
            ctx.lineTo(this.width / 4, this.height / 2);
            ctx.fillStyle = '#ffaa00';
            ctx.fill();

            ctx.shadowBlur = 0;
        } else {
            // Normal bullet rendering - glowing line/rect
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 6;

            if (Math.abs(this.angle + Math.PI / 2) < 0.01) {
                // Straight up - simple rect
                ctx.fillRect(this.x, this.y, this.width, this.height);
            } else {
                // Angled bullet
                ctx.translate(cx, cy);
                ctx.rotate(this.angle + Math.PI / 2);
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            }
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }

    /**
     * Factory: create bullet(s) from weapon stats + player stats
     * Returns a single Bullet. Caller handles multi-bullet spread.
     */
    static createFromWeapon(x, y, weaponStats, angle = -Math.PI / 2) {
        return new Bullet({
            x: x - (weaponStats.bulletWidth || BULLET.WIDTH) / 2,
            y: y - (weaponStats.bulletHeight || BULLET.HEIGHT),
            width: weaponStats.bulletWidth || BULLET.WIDTH,
            height: weaponStats.bulletHeight || BULLET.HEIGHT,
            speed: weaponStats.bulletSpeed || BULLET.SPEED,
            damage: weaponStats.damage || 10,
            pierce: weaponStats.pierce || 0,
            color: weaponStats.bulletColor || BULLET.COLOR,
            angle: angle,
            explosive: weaponStats.explosive || false,
            explosiveRadius: weaponStats.explosiveRadius || 0,
            explosiveDamage: weaponStats.explosiveDamage || 0,
            tracking: weaponStats.tracking || false,
            trackingStrength: weaponStats.trackingStrength || 0
        });
    }
}

/**
 * BossBullet - enemy bullets that move downward toward the player
 */
export class BossBullet {
    constructor({ x, y, speed = 200, damage = 10, angle = Math.PI / 2, color = '#ff0066', size = 6 }) {
        this.x = x;
        this.y = y;
        this.width = size;
        this.height = size;
        this.speed = speed;
        this.damage = damage;
        this.angle = angle; // PI/2 = straight down
        this.color = color;
        this.alive = true;
    }

    update(dt) {
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;
    }

    isOffScreen() {
        return (
            this.x + this.width < 0 ||
            this.x > CANVAS_WIDTH ||
            this.y + this.height < 0 ||
            this.y > CANVAS_HEIGHT
        );
    }

    render(renderer) {
        const ctx = renderer.ctx || renderer;
        ctx.save();

        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const r = this.width / 2;

        // Outer glow
        ctx.beginPath();
        ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.globalAlpha = 0.4;
        ctx.fill();

        // Inner core
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    }
}
