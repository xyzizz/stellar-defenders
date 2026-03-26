// pickup.js - Experience orb pickup
import { CANVAS_WIDTH, CANVAS_HEIGHT, PICKUP, COLORS } from '../config/constants.js';
import { distance } from '../utils/helpers.js';

export class Pickup {
    constructor(x, y, exp = 5) {
        this.x = x;
        this.y = y;
        this.size = PICKUP.SIZE;
        this.exp = exp;
        this.color = COLORS.EXP_ORB;
        this.alive = true;
        this.pulseTimer = Math.random() * Math.PI * 2; // offset so orbs pulse at different times
    }

    update(dt, playerX, playerY, magnetRange) {
        if (!this.alive) return;

        this.pulseTimer += dt * 4;

        const dist = distance(this.x, this.y, playerX, playerY);

        if (dist < magnetRange) {
            // Move toward player (magnet)
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const len = dist || 1;
            const speed = PICKUP.MAGNET_SPEED;
            this.x += (dx / len) * speed * dt;
            this.y += (dy / len) * speed * dt;
        } else {
            // Drift downward
            this.y += PICKUP.SPEED * dt;
        }
    }

    isOffScreen() {
        return this.y > CANVAS_HEIGHT + this.size;
    }

    isCollectedBy(player) {
        const px = player.getCenterX();
        const py = player.getCenterY();
        const dist = distance(this.x, this.y, px, py);
        // Collection radius: player half-size + pickup size
        const collectRadius = Math.max(player.width, player.height) / 2 + this.size;
        return dist < collectRadius;
    }

    render(renderer) {
        const ctx = renderer.ctx || renderer;
        ctx.save();

        const pulse = 1 + 0.25 * Math.sin(this.pulseTimer);
        const r = this.size * pulse;

        // Outer glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, r + 4, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.15;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;
        ctx.fill();

        // Mid glow
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r + 1, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Inner color dot
        ctx.beginPath();
        ctx.arc(this.x, this.y, r * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();
    }
}
