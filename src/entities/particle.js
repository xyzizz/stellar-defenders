// particle.js - Particle and ParticleSystem
import { PARTICLE, COLORS } from '../config/constants.js';
import { randFloat } from '../utils/helpers.js';

export class Particle {
    constructor(x, y, vx, vy, life, color, size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = size;
        this.alive = true;
    }

    update(dt) {
        if (!this.alive) return;

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;

        // Slight drag
        this.vx *= 0.98;
        this.vy *= 0.98;

        if (this.life <= 0) {
            this.alive = false;
        }
    }

    render(renderer) {
        if (!this.alive) return;

        const ctx = renderer.ctx || renderer;
        const alpha = Math.max(0, this.life / this.maxLife);
        const currentSize = this.size * alpha;

        if (currentSize < 0.5) return;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 4;

        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (!this.particles[i].alive) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(renderer) {
        for (const p of this.particles) {
            p.render(renderer);
        }
    }

    /**
     * Emit particles at position with config.
     * config: { color, speed, life, size, spread }
     * spread: angle range in radians (2*PI = full circle)
     */
    emit(x, y, count, config = {}) {
        const {
            color = '#ffffff',
            speed = 100,
            life = PARTICLE.DEFAULT_LIFETIME,
            size = 3,
            spread = Math.PI * 2,
            baseAngle = 0
        } = config;

        const available = PARTICLE.MAX_COUNT - this.particles.length;
        const toSpawn = Math.min(count, available);

        for (let i = 0; i < toSpawn; i++) {
            const angle = baseAngle + randFloat(-spread / 2, spread / 2);
            const spd = randFloat(speed * 0.4, speed);
            const vx = Math.cos(angle) * spd;
            const vy = Math.sin(angle) * spd;
            const pLife = randFloat(life * 0.5, life);
            const pSize = randFloat(size * 0.5, size);

            this.particles.push(new Particle(x, y, vx, vy, pLife, color, pSize));
        }
    }

    /**
     * Preset: explosion effect - full circle burst
     */
    emitExplosion(x, y, color = COLORS.PARTICLE_EXPLODE) {
        this.emit(x, y, 20, {
            color: color,
            speed: 180,
            life: 0.6,
            size: 5,
            spread: Math.PI * 2
        });
        // Inner bright core
        this.emit(x, y, 8, {
            color: '#ffffff',
            speed: 80,
            life: 0.3,
            size: 3,
            spread: Math.PI * 2
        });
    }

    /**
     * Preset: small hit spark
     */
    emitHit(x, y, color = COLORS.PARTICLE_HIT) {
        this.emit(x, y, 5, {
            color: color,
            speed: 100,
            life: 0.25,
            size: 2,
            spread: Math.PI * 2
        });
    }

    clear() {
        this.particles.length = 0;
    }
}
