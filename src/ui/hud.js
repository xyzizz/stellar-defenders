// hud.js - HUD for 540x960 portrait split-screen
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, SCREEN } from '../config/constants.js';
import { formatTime } from '../utils/helpers.js';

export class HUD {
    constructor(renderer) {
        this.renderer = renderer;
        this.waveMessage = '';
        this.waveMessageTimer = 0;
        this.bossWarning = false;
        this.bossWarningTimer = 0;
        this.damageNumbers = [];
    }

    showWaveMessage(msg) {
        this.waveMessage = msg;
        this.waveMessageTimer = 2.5;
    }

    showBossWarning() {
        this.bossWarning = true;
        this.bossWarningTimer = 3.0;
    }

    addDamageNumber(x, y, damage, isCrit = false) {
        this.damageNumbers.push({
            x, y,
            text: Math.round(damage).toString(),
            color: isCrit ? '#ffff00' : '#ffffff',
            size: isCrit ? 18 : 12,
            life: 0.8,
            vy: -60
        });
    }

    update(dt) {
        if (this.waveMessageTimer > 0) {
            this.waveMessageTimer -= dt;
        }

        if (this.bossWarningTimer > 0) {
            this.bossWarningTimer -= dt;
            if (this.bossWarningTimer <= 0) {
                this.bossWarning = false;
            }
        }

        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const dn = this.damageNumbers[i];
            dn.y += dn.vy * dt;
            dn.life -= dt;
            if (dn.life <= 0) {
                this.damageNumbers.splice(i, 1);
            }
        }
    }

    render(gameState) {
        const r = this.renderer;
        const ctx = r.ctx;

        // ---- Thin top bar (30px) ----
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, 30);

        // Wave number (left) + Level next to it
        r.drawText(
            `W${gameState.currentWave}/${gameState.totalWaves}`,
            8, 16, COLORS.UI_PRIMARY, 13, 'left'
        );
        r.drawText(
            `Lv.${gameState.level}`,
            95, 16, COLORS.UI_SUCCESS, 11, 'left'
        );

        // Time (center)
        r.drawText(
            formatTime(gameState.totalTime),
            CANVAS_WIDTH / 2, 16, COLORS.UI_TEXT, 14, 'center'
        );

        // Score (right)
        r.drawText(
            `${gameState.score}`,
            CANVAS_WIDTH - 8, 16, COLORS.UI_PRIMARY, 13, 'right'
        );

        // ---- Left side: chest progress (below top bar) ----
        this._renderChestProgress(ctx, r, gameState);

        // ---- Right side: base durability (below top bar) ----
        this._renderBaseDurability(ctx, r, gameState);

        // ---- Bottom: player HP bar ----
        this._renderPlayerHP(ctx, r, gameState);

        // ---- Acquired upgrade icons (bottom-right, small) ----
        this._renderUpgradeIcons(ctx, r, gameState);

        // ---- Wave message (centered in right area) ----
        if (this.waveMessageTimer > 0) {
            const alpha = Math.min(1, this.waveMessageTimer / 0.5);
            ctx.globalAlpha = alpha;
            const msgX = (SCREEN.RIGHT_MIN + SCREEN.RIGHT_MAX) / 2;
            r.drawText(
                this.waveMessage,
                msgX, CANVAS_HEIGHT / 2 - 80,
                COLORS.UI_PRIMARY, 20, 'center'
            );
            ctx.globalAlpha = 1;
        }

        // ---- Boss warning (full screen) ----
        if (this.bossWarning) {
            const flash = Math.sin(this.bossWarningTimer * 8) > 0;
            if (flash) {
                ctx.fillStyle = 'rgba(255, 0, 50, 0.15)';
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            }
            const alpha = Math.min(1, this.bossWarningTimer / 0.5);
            ctx.globalAlpha = alpha;
            r.drawText(
                'WARNING',
                CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50,
                '#ff0044', 36, 'center'
            );
            r.drawText(
                'MOTHERSHIP APPROACHING',
                CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10,
                '#ff0044', 16, 'center'
            );
            r.drawText(
                '歼灭母舰正在接近',
                CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20,
                '#ff0044', 14, 'center'
            );
            ctx.globalAlpha = 1;
        }

        // ---- Floating damage numbers ----
        for (const dn of this.damageNumbers) {
            const alpha = Math.max(0, dn.life / 0.8);
            ctx.globalAlpha = alpha;
            r.drawText(dn.text, dn.x, dn.y, dn.color, dn.size, 'center');
            ctx.globalAlpha = 1;
        }
    }

    // ---- Left side: chest progress ----
    _renderChestProgress(ctx, r, gameState) {
        const wp = gameState.wallProgress;
        if (!wp) return;

        const panelX = 6;
        const panelY = 34;

        // Semi-transparent background strip
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 30, SCREEN.SPLIT_X, 18);

        // Chest icon + count
        r.drawText(
            `CHEST ${wp.chestsOpened}/${wp.chestsTotal}`,
            panelX, panelY + 8, COLORS.UI_SECONDARY, 10, 'left'
        );

        // Wall progress bar
        const barW = 80;
        const barH = 6;
        const barX = panelX + 80;
        const barY = panelY + 3;
        const ratio = wp.total > 0 ? wp.broken / wp.total : 0;

        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(barX, barY, barW, barH);

        ctx.fillStyle = '#ffcc44';
        ctx.fillRect(barX, barY, barW * ratio, barH);

        ctx.strokeStyle = 'rgba(255,204,0,0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);

        r.drawText(
            `${wp.broken}/${wp.total}`,
            barX + barW + 4, panelY + 8,
            COLORS.UI_TEXT, 9, 'left'
        );
    }

    // ---- Right side: base durability ----
    _renderBaseDurability(ctx, r, gameState) {
        const baseRatio = gameState.baseDurability / gameState.baseMaxDurability;

        // Semi-transparent background strip
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(SCREEN.RIGHT_MIN, 30, SCREEN.RIGHT_MAX - SCREEN.RIGHT_MIN, 18);

        const barW = 100;
        const barH = 6;
        const barX = SCREEN.RIGHT_MIN + 6;
        const barY = 37;

        r.drawText('BASE', barX, barY + 5, COLORS.UI_SECONDARY, 10, 'left');

        const fillX = barX + 32;

        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(fillX, barY, barW, barH);

        const barColor = baseRatio > 0.5 ? '#00aaff'
            : baseRatio > 0.25 ? '#ff8800'
            : COLORS.UI_DANGER;
        ctx.fillStyle = barColor;
        ctx.fillRect(fillX, barY, barW * baseRatio, barH);

        ctx.strokeStyle = 'rgba(0,170,255,0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(fillX, barY, barW, barH);

        r.drawText(
            `${gameState.baseDurability}/${gameState.baseMaxDurability}`,
            fillX + barW + 4, barY + 5,
            COLORS.UI_TEXT, 9, 'left'
        );
    }

    // ---- Player HP bar (very bottom, above player area) ----
    _renderPlayerHP(ctx, r, gameState) {
        const hpBarW = 180;
        const hpBarH = 8;
        const hpBarX = (CANVAS_WIDTH - hpBarW) / 2;
        const hpBarY = CANVAS_HEIGHT - 16;
        const hpRatio = gameState.playerHp / gameState.playerMaxHp;
        const hpColor = hpRatio > 0.5 ? COLORS.UI_SUCCESS
            : hpRatio > 0.25 ? '#ffaa00'
            : COLORS.UI_DANGER;

        // Background strip
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(hpBarX - 28, CANVAS_HEIGHT - 22, hpBarW + 80, 18);

        r.drawText('HP', hpBarX - 4, hpBarY + 1, COLORS.UI_TEXT, 10, 'right');

        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(hpBarX, hpBarY - 2, hpBarW, hpBarH);

        ctx.fillStyle = hpColor;
        ctx.fillRect(hpBarX, hpBarY - 2, hpBarW * hpRatio, hpBarH);

        ctx.strokeStyle = 'rgba(0,255,136,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(hpBarX, hpBarY - 2, hpBarW, hpBarH);

        r.drawText(
            `${Math.ceil(gameState.playerHp)}/${gameState.playerMaxHp}`,
            hpBarX + hpBarW + 4, hpBarY + 1,
            COLORS.UI_TEXT, 9, 'left'
        );
    }

    // ---- Acquired upgrade icons (bottom-right, small) ----
    _renderUpgradeIcons(ctx, r, gameState) {
        if (!gameState.acquiredUpgrades || gameState.acquiredUpgrades.length === 0) return;

        const iconSize = 14;
        const gap = 2;
        const maxPerRow = 8;
        const maxShow = Math.min(gameState.acquiredUpgrades.length, 16);
        const startX = CANVAS_WIDTH - 8;
        const baseY = CANVAS_HEIGHT - 38;

        // Background
        const rows = Math.ceil(maxShow / maxPerRow);
        const rowW = Math.min(maxShow, maxPerRow) * (iconSize + gap);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(startX - rowW - 2, baseY - 2, rowW + 4, rows * (iconSize + gap) + 4);

        for (let i = 0; i < maxShow; i++) {
            const upg = gameState.acquiredUpgrades[i];
            const row = Math.floor(i / maxPerRow);
            const col = i % maxPerRow;
            const x = startX - (col + 1) * (iconSize + gap) + iconSize / 2;
            const y = baseY + row * (iconSize + gap) + iconSize / 2;
            r.drawText(upg.icon, x, y, COLORS.UI_TEXT, iconSize, 'center');
        }

        if (gameState.acquiredUpgrades.length > maxShow) {
            r.drawText(
                `+${gameState.acquiredUpgrades.length - maxShow}`,
                startX, baseY - 6, COLORS.UI_SECONDARY, 9, 'right'
            );
        }
    }
}
