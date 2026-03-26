// wall.js - 宝箱模块系统（左侧区域）
import { CHEST, SCREEN, COLORS, CANVAS_HEIGHT } from '../config/constants.js';
import { REWARD_RARITY } from '../config/upgrades.js';
import { loadSprite, drawPixelSprite } from '../utils/sprites.js';

const CHEST_SPRITES = {
    COMMON: loadSprite(new URL('../../assets/chests/chest-common-pixel.svg', import.meta.url).href),
    RARE: loadSprite(new URL('../../assets/chests/chest-rare-pixel.svg', import.meta.url).href),
    EPIC: loadSprite(new URL('../../assets/chests/chest-epic-pixel.svg', import.meta.url).href),
    LEGENDARY: loadSprite(new URL('../../assets/chests/chest-legendary-pixel.svg', import.meta.url).href)
};

function getChestSprite(tier) {
    return CHEST_SPRITES[tier] || null;
}

function drawPixelLock(ctx, cx, cy, color = '#d7dee5') {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(Math.round(cx - 4), Math.round(cy - 1), 8, 6);
    ctx.fillRect(Math.round(cx - 2), Math.round(cy - 5), 4, 4);
    ctx.clearRect(Math.round(cx - 1), Math.round(cy - 3), 2, 2);
    ctx.restore();
}

function renderFallbackChest(chest, renderer, tierColor, hpRatio) {
    const ctx = renderer.ctx;
    const cx = chest.x + chest.width / 2;
    const cy = chest.y + chest.height / 2;

    if (chest.hitFlashTimer > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.9;
        ctx.fillRect(chest.x, chest.y, chest.width, chest.height);
        return;
    }

    if (chest.exposed) {
        const pulse = 0.4 + 0.4 * Math.sin(chest.glowPhase);
        ctx.shadowColor = tierColor;
        ctx.shadowBlur = 10 + pulse * 8;
        ctx.globalAlpha = 0.15 + pulse * 0.15;
        ctx.fillStyle = tierColor;
        ctx.fillRect(chest.x - 4, chest.y - 4, chest.width + 8, chest.height + 8);
    }

    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(chest.x, chest.y, chest.width, chest.height);

    ctx.fillStyle = tierColor;
    ctx.globalAlpha = 0.5 + hpRatio * 0.3;
    const lidHeight = chest.height * 0.35;
    ctx.fillRect(chest.x, chest.y, chest.width, lidHeight);

    ctx.fillStyle = tierColor;
    ctx.globalAlpha = 0.3 + hpRatio * 0.2;
    ctx.fillRect(chest.x, chest.y + lidHeight, chest.width, chest.height - lidHeight);

    ctx.strokeStyle = tierColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    ctx.strokeRect(chest.x + 0.5, chest.y + 0.5, chest.width - 1, chest.height - 1);

    ctx.beginPath();
    ctx.moveTo(chest.x, chest.y + lidHeight);
    ctx.lineTo(chest.x + chest.width, chest.y + lidHeight);
    ctx.globalAlpha = 0.7;
    ctx.stroke();

    ctx.shadowBlur = 0;
    const iconPulse = chest.exposed ? 0.7 + 0.3 * Math.sin(chest.glowPhase * 1.5) : 0.6;
    ctx.globalAlpha = iconPulse;
    ctx.fillStyle = chest.exposed ? '#ffffff' : tierColor;
    ctx.font = chest.exposed ? 'bold 16px monospace' : '14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', cx, cy + 2);

    ctx.globalAlpha = 0.5;
    ctx.fillStyle = tierColor;
    ctx.font = '8px monospace';
    const rarityInfo = REWARD_RARITY[chest.tier];
    ctx.fillText(rarityInfo ? rarityInfo.name : chest.tier, cx, chest.y + chest.height + 9);

    if (chest.exposed && hpRatio < 1) {
        ctx.globalAlpha = 0.7;
        const barW = chest.width - 4;
        const barH = 3;
        const barX = chest.x + 2;
        const barY = chest.y - 6;
        ctx.fillStyle = '#000000';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = hpRatio > 0.5 ? '#00ff88' : hpRatio > 0.25 ? '#ffaa00' : '#ff4444';
        ctx.fillRect(barX, barY, barW * hpRatio, barH);
    }

    if (!chest.exposed) {
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#000000';
        ctx.fillRect(chest.x, chest.y, chest.width, chest.height);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#888888';
        ctx.font = '10px monospace';
        ctx.fillText('🔒', cx, chest.y - 4);
    }
}

// ---------- Brick ----------
class Brick {
    constructor(col, row, x, y, width, height, hp, tierIndex, tier) {
        this.col = col;
        this.row = row;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.hp = hp;
        this.maxHp = hp;
        this.alive = true;
        this.tierIndex = tierIndex;
        this.tier = tier; // 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
        this.hitFlashTimer = 0;
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.hitFlashTimer = 0.1;
        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            return true;
        }
        return false;
    }

    getColor() {
        if (this.hitFlashTimer > 0) return '#ffffff';
        const colorMap = {
            COMMON: COLORS.BRICK_COMMON,
            RARE: COLORS.BRICK_RARE,
            EPIC: COLORS.BRICK_EPIC,
            LEGENDARY: COLORS.BRICK_LEGENDARY
        };
        return colorMap[this.tier] || COLORS.BRICK_COMMON;
    }

    update(dt) {
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= dt;
        }
    }

    render(renderer) {
        if (!this.alive) return;
        const ctx = renderer.ctx;
        ctx.save();

        const color = this.getColor();
        const hpRatio = this.hp / this.maxHp;

        // Brick body
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.4 + hpRatio * 0.6;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Brick border
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.8;
        ctx.strokeRect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1);

        // HP bar at bottom when damaged
        if (hpRatio < 1) {
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#000000';
            ctx.fillRect(this.x + 2, this.y + this.height - 3, this.width - 4, 2);
            ctx.fillStyle = hpRatio > 0.5 ? '#00ff88' : hpRatio > 0.25 ? '#ffaa00' : '#ff4444';
            ctx.fillRect(this.x + 2, this.y + this.height - 3, (this.width - 4) * hpRatio, 2);
        }

        ctx.restore();
    }
}

// ---------- TreasureChest ----------
class TreasureChest {
    constructor(x, y, width, height, hp, tier, tierIndex) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.hp = hp;
        this.maxHp = hp;
        this.tier = tier;
        this.tierIndex = tierIndex;
        this.exposed = false;
        this.opened = false;
        this.hitFlashTimer = 0;
        this.glowPhase = Math.random() * Math.PI * 2;
    }

    takeDamage(amount) {
        if (!this.exposed || this.opened) return false;
        this.hp -= amount;
        this.hitFlashTimer = 0.12;
        if (this.hp <= 0) {
            this.hp = 0;
            this.opened = true;
            return true;
        }
        return false;
    }

    update(dt) {
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= dt;
        }
        this.glowPhase += dt * 3.0;
    }

    _getTierColor() {
        const colorMap = {
            COMMON: COLORS.CHEST_COMMON,
            RARE: COLORS.CHEST_RARE,
            EPIC: COLORS.CHEST_EPIC,
            LEGENDARY: COLORS.CHEST_LEGENDARY
        };
        return colorMap[this.tier] || COLORS.CHEST_COMMON;
    }

    render(renderer) {
        if (this.opened) return;
        const ctx = renderer.ctx;
        ctx.save();

        const cx = this.x + this.width / 2;
        const tierColor = this._getTierColor();
        const hpRatio = this.hp / this.maxHp;
        const sprite = getChestSprite(this.tier);
        const glowBlur = this.exposed ? 12 + (0.4 + 0.4 * Math.sin(this.glowPhase)) * 8 : 0;
        const drewSprite = drawPixelSprite(ctx, sprite, this.x, this.y, this.width, this.height, {
            glowColor: this.exposed ? tierColor : null,
            glowBlur,
            flashAlpha: this.hitFlashTimer > 0 ? 0.82 : 0
        });

        if (!drewSprite) {
            renderFallbackChest(this, renderer, tierColor, hpRatio);
            ctx.restore();
            return;
        }

        if (!this.exposed) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            drawPixelLock(ctx, cx, this.y + this.height / 2 + 1, '#d2dae2');
        } else if (this.hitFlashTimer <= 0) {
            ctx.strokeStyle = tierColor;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.65;
            ctx.strokeRect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1);
        }

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = tierColor;
        ctx.font = '8px monospace';
        const rarityInfo = REWARD_RARITY[this.tier];
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(rarityInfo ? rarityInfo.name : this.tier, cx, this.y + this.height + 9);

        if (this.exposed && hpRatio < 1) {
            ctx.globalAlpha = 0.7;
            const barW = this.width - 4;
            const barH = 3;
            const barX = this.x + 2;
            const barY = this.y - 6;
            ctx.fillStyle = '#000000';
            ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = hpRatio > 0.5 ? '#00ff88' : hpRatio > 0.25 ? '#ffaa00' : '#ff4444';
            ctx.fillRect(barX, barY, barW * hpRatio, barH);
        }

        ctx.restore();
    }
}

// ---------- ChestModule ----------
// One module = bricks shell + treasure chest in center
class ChestModule {
    constructor(tierIndex, offsetX, offsetY) {
        this.tierIndex = tierIndex;
        this.tier = CHEST.TIERS[tierIndex];
        this.bricks = [];
        this.chest = null;
        this._build(offsetX, offsetY);
    }

    _build(offsetX, offsetY) {
        const { BRICK_COLS, BRICK_ROWS_PER_MODULE, BRICK_WIDTH, BRICK_HEIGHT, BRICK_GAP,
                BOX_WIDTH, BOX_HEIGHT, BOX_HP, BRICK_HP_BASE, BRICK_HP_PER_TIER } = CHEST;

        const brickHp = BRICK_HP_BASE + this.tierIndex * BRICK_HP_PER_TIER;

        // Determine hollow center area for the chest (col 2-4, row 1-3)
        const hollowColMin = 2;
        const hollowColMax = 4;
        const hollowRowMin = 1;
        const hollowRowMax = 3;

        // Build bricks, leaving hollow center
        this.bricks = [];
        for (let row = 0; row < BRICK_ROWS_PER_MODULE; row++) {
            for (let col = 0; col < BRICK_COLS; col++) {
                // Skip the hollow center where the chest sits
                if (col >= hollowColMin && col <= hollowColMax &&
                    row >= hollowRowMin && row <= hollowRowMax) {
                    continue;
                }

                const x = offsetX + col * (BRICK_WIDTH + BRICK_GAP);
                const y = offsetY + row * (BRICK_HEIGHT + BRICK_GAP);

                this.bricks.push(new Brick(
                    col, row, x, y,
                    BRICK_WIDTH, BRICK_HEIGHT,
                    brickHp, this.tierIndex, this.tier
                ));
            }
        }

        // Place the chest centered in the hollow area
        const hollowPixelX = offsetX + hollowColMin * (BRICK_WIDTH + BRICK_GAP);
        const hollowPixelW = (hollowColMax - hollowColMin + 1) * (BRICK_WIDTH + BRICK_GAP) - BRICK_GAP;
        const hollowPixelY = offsetY + hollowRowMin * (BRICK_HEIGHT + BRICK_GAP);
        const hollowPixelH = (hollowRowMax - hollowRowMin + 1) * (BRICK_HEIGHT + BRICK_GAP) - BRICK_GAP;

        const chestX = hollowPixelX + (hollowPixelW - BOX_WIDTH) / 2;
        const chestY = hollowPixelY + (hollowPixelH - BOX_HEIGHT) / 2;

        this.chest = new TreasureChest(
            chestX, chestY,
            BOX_WIDTH, BOX_HEIGHT,
            BOX_HP, this.tier, this.tierIndex
        );
    }

    // Only expose the chest after the whole outer shell has been broken.
    updateExposed() {
        if (this.chest.opened) return;
        this.chest.exposed = this.bricks.every((brick) => !brick.alive);
    }

    update(dt) {
        for (const brick of this.bricks) {
            if (brick.alive) {
                brick.update(dt);
            }
        }
        this.updateExposed();
        this.chest.update(dt);
    }

    getAliveBrickCount() {
        return this.bricks.filter(b => b.alive).length;
    }

    getTotalBrickCount() {
        return this.bricks.length;
    }

    render(renderer) {
        for (const brick of this.bricks) {
            brick.render(renderer);
        }
        this.chest.render(renderer);
    }
}

// ---------- WallSystem (exported) ----------
export class WallSystem {
    constructor() {
        this.modules = [];
        this._build();
    }

    _build() {
        this.modules = [];
        const { MODULE_COUNT, OFFSET_X, OFFSET_Y, BRICK_ROWS_PER_MODULE,
                BRICK_HEIGHT, BRICK_GAP, MODULE_GAP } = CHEST;

        const moduleHeight = BRICK_ROWS_PER_MODULE * (BRICK_HEIGHT + BRICK_GAP) - BRICK_GAP;

        for (let i = 0; i < MODULE_COUNT; i++) {
            const modOffsetY = OFFSET_Y + i * (moduleHeight + MODULE_GAP);
            this.modules.push(new ChestModule(i, OFFSET_X, modOffsetY));
        }
    }

    reset() {
        this._build();
    }

    update(dt) {
        for (const mod of this.modules) {
            mod.update(dt);
        }
    }

    // Returns array of hit descriptors: { bullet, brick } or { bullet, chest }
    checkBulletCollisions(bullets) {
        const hits = [];
        for (const bullet of bullets) {
            if (!bullet.alive) continue;
            // Only check bullets in left region
            if (bullet.x + bullet.width < SCREEN.LEFT_MIN || bullet.x > SCREEN.LEFT_MAX) continue;

            let hitSomething = false;

            for (const mod of this.modules) {
                if (hitSomething) break;

                // Try bricks first
                for (const brick of mod.bricks) {
                    if (!brick.alive) continue;
                    if (this._rectOverlap(bullet, brick)) {
                        hits.push({ bullet, brick });
                        hitSomething = true;
                        break;
                    }
                }

                // If no brick hit, try the chest (only if exposed and not opened)
                if (!hitSomething && mod.chest.exposed && !mod.chest.opened) {
                    if (this._rectOverlap(bullet, mod.chest)) {
                        hits.push({ bullet, chest: mod.chest });
                        hitSomething = true;
                    }
                }
            }
        }
        // Separate into brick hits and chest hits
        const brickHits = hits.filter(h => h.brick);
        const chestHits = hits.filter(h => h.chest);
        return { brickHits, chestHits };
    }

    _rectOverlap(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    getProgress() {
        let totalBricks = 0;
        let brokenBricks = 0;
        let chestsOpened = 0;
        let chestsTotal = 0;

        for (const mod of this.modules) {
            const total = mod.getTotalBrickCount();
            const alive = mod.getAliveBrickCount();
            totalBricks += total;
            brokenBricks += total - alive;
            chestsTotal++;
            if (mod.chest.opened) chestsOpened++;
        }

        return { total: totalBricks, broken: brokenBricks, chestsOpened, chestsTotal };
    }

    render(renderer) {
        const ctx = renderer.ctx;

        // Left side background
        ctx.fillStyle = COLORS.BG_LEFT;
        ctx.fillRect(0, 0, SCREEN.SPLIT_X, CANVAS_HEIGHT);

        // Title
        ctx.save();
        ctx.fillStyle = COLORS.UI_SECONDARY;
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.6;
        ctx.fillText('[ 宝箱迷阵 ]', SCREEN.SPLIT_X / 2, 20);

        // Progress
        const progress = this.getProgress();
        ctx.fillText(
            `砖: ${progress.broken}/${progress.total}  箱: ${progress.chestsOpened}/${progress.chestsTotal}`,
            SCREEN.SPLIT_X / 2, 36
        );
        ctx.restore();

        // Render each module
        for (const mod of this.modules) {
            mod.render(renderer);
        }
    }
}
