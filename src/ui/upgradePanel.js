// upgradePanel.js - Reward popup for 540x960 portrait split-screen
import { CANVAS_WIDTH, COLORS } from '../config/constants.js';

// Rarity colors
const RARITY_COLORS = {
    COMMON: '#aaaaaa',
    RARE: '#4488ff',
    EPIC: '#aa44ff',
    LEGENDARY: '#ff8800'
};

export class RewardPopup {
    constructor(renderer) {
        this.renderer = renderer;
        this.queue = [];
        this.current = null;
        this.timer = 0;
        this.displayDuration = 2.0;
        this.fadeTime = 0.3;
    }

    /**
     * Add a reward to the display queue.
     * @param {Object} reward - { name, icon, rarity: 'COMMON'|'RARE'|'EPIC'|'LEGENDARY' }
     */
    show(reward) {
        this.queue.push(reward);
        if (!this.current) {
            this._next();
        }
    }

    _next() {
        if (this.queue.length > 0) {
            this.current = this.queue.shift();
            this.timer = this.displayDuration;
        } else {
            this.current = null;
            this.timer = 0;
        }
    }

    clear() {
        this.queue = [];
        this.current = null;
        this.timer = 0;
    }

    update(dt) {
        if (!this.current) return;

        this.timer -= dt;
        if (this.timer <= 0) {
            this._next();
        }
    }

    render(ctx) {
        if (!this.current) return;

        const r = this.renderer;
        const reward = this.current;

        // Fade in/out alpha
        const elapsed = this.displayDuration - this.timer;
        let alpha = 1;
        if (elapsed < this.fadeTime) {
            alpha = elapsed / this.fadeTime;
        } else if (this.timer < this.fadeTime) {
            alpha = this.timer / this.fadeTime;
        }
        alpha = Math.max(0, Math.min(1, alpha));

        // Popup size and position (centered at top, ~240px wide)
        const popW = 240;
        const popH = 38;
        const popX = (CANVAS_WIDTH - popW) / 2;
        const popY = 52; // Just below the top bar area

        // Slide-in offset
        const slideOffset = (1 - alpha) * -10;

        ctx.globalAlpha = alpha;

        // Background
        ctx.fillStyle = 'rgba(10, 10, 30, 0.92)';
        ctx.fillRect(popX, popY + slideOffset, popW, popH);

        // Rarity color border
        const rarityColor = RARITY_COLORS[reward.rarity] || RARITY_COLORS.COMMON;
        ctx.strokeStyle = rarityColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(popX, popY + slideOffset, popW, popH);

        // Top rarity color accent bar
        ctx.fillStyle = rarityColor;
        ctx.fillRect(popX, popY + slideOffset, popW, 3);

        // Icon
        const iconX = popX + 24;
        const textY = popY + slideOffset + popH / 2;
        r.drawText(reward.icon || '?', iconX, textY, COLORS.UI_TEXT, 18, 'center');

        // "获得:" label
        r.drawText('获得:', iconX + 20, textY, COLORS.UI_SECONDARY, 11, 'left');

        // Reward name
        r.drawText(reward.name || '未知', iconX + 48, textY, COLORS.UI_TEXT, 13, 'left');

        // Queue count indicator
        if (this.queue.length > 0) {
            r.drawText(
                `+${this.queue.length}`,
                popX + popW - 10, textY,
                COLORS.UI_SECONDARY, 9, 'right'
            );
        }

        ctx.globalAlpha = 1;
    }
}
