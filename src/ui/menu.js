// menu.js - Main menu and result screens for 540x960 portrait split-screen
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, SCREEN } from '../config/constants.js';

export class MenuUI {
    constructor(renderer) {
        this.renderer = renderer;
        this.selectedButton = -1;
        this.buttons = [];
    }

    // ---- Main Menu ----
    renderMainMenu(ctx) {
        const r = this.renderer;

        // Background
        ctx.fillStyle = COLORS.BG;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Scrolling background lines
        ctx.strokeStyle = 'rgba(0, 204, 255, 0.06)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 24; i++) {
            const y = (Date.now() / 50 + i * 40) % CANVAS_HEIGHT;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_WIDTH, y);
            ctx.stroke();
        }

        // Split-screen concept illustration
        // Left area tint
        ctx.fillStyle = 'rgba(255, 204, 0, 0.04)';
        ctx.fillRect(0, 0, SCREEN.SPLIT_X, CANVAS_HEIGHT);
        // Right area tint
        ctx.fillStyle = 'rgba(0, 204, 255, 0.04)';
        ctx.fillRect(SCREEN.RIGHT_MIN, 0, SCREEN.RIGHT_MAX - SCREEN.RIGHT_MIN, CANVAS_HEIGHT);

        // Dashed divider line
        ctx.strokeStyle = 'rgba(0, 204, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(SCREEN.SPLIT_X, 0);
        ctx.lineTo(SCREEN.SPLIT_X, CANVAS_HEIGHT);
        ctx.stroke();
        ctx.setLineDash([]);

        // Zone labels (near top)
        r.drawText('WALL ZONE', SCREEN.SPLIT_X / 2, 50, 'rgba(255,204,0,0.25)', 11, 'center');
        r.drawText('COMBAT ZONE', (SCREEN.RIGHT_MIN + SCREEN.RIGHT_MAX) / 2, 50, 'rgba(0,204,255,0.25)', 11, 'center');

        // Miniature illustrations in each zone
        this._drawZoneIllustration(ctx, r);

        // Title (centered, vertical layout friendly)
        r.drawText('STELLAR', CANVAS_WIDTH / 2, 200, COLORS.UI_PRIMARY, 48, 'center');
        r.drawText('DEFENDERS', CANVAS_WIDTH / 2, 250, COLORS.UI_PRIMARY, 40, 'center');
        r.drawText('深 空 防 线', CANVAS_WIDTH / 2, 290, COLORS.UI_SECONDARY, 18, 'center');

        // Gameplay description
        const descY = 340;
        const descLineH = 26;
        const descLines = [
            '左侧 - 砖墙区：射击砖墙开启宝箱获取升级',
            '右侧 - 战斗区：消灭入侵敌人保护基地',
            '在两个区域间自由移动，合理分配攻防！'
        ];
        for (let i = 0; i < descLines.length; i++) {
            r.drawText(descLines[i], CANVAS_WIDTH / 2, descY + i * descLineH, COLORS.UI_SECONDARY, 12, 'center');
        }

        // Controls
        const ctrlY = 440;
        const ctrlLineH = 24;
        const ctrlLines = [
            '← → / A D    左右移动',
            '自动向上射击',
            '左侧 = 打砖墙    右侧 = 战斗',
            'ESC    暂停游戏'
        ];
        for (let i = 0; i < ctrlLines.length; i++) {
            r.drawText(ctrlLines[i], CANVAS_WIDTH / 2, ctrlY + i * ctrlLineH, 'rgba(255,255,255,0.45)', 11, 'center');
        }

        // Start button (centered)
        const btnW = 220;
        const btnH = 52;
        const btnX = (CANVAS_WIDTH - btnW) / 2;
        const btnY = 580;

        this.buttons = [{ x: btnX, y: btnY, w: btnW, h: btnH, action: 'start' }];

        const isHover = this.selectedButton === 0;
        ctx.fillStyle = isHover ? COLORS.UI_PRIMARY : 'rgba(0, 204, 255, 0.15)';
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = COLORS.UI_PRIMARY;
        ctx.lineWidth = 2;
        ctx.strokeRect(btnX, btnY, btnW, btnH);

        r.drawText(
            '开 始 战 斗',
            CANVAS_WIDTH / 2, btnY + btnH / 2,
            isHover ? COLORS.BG : COLORS.UI_PRIMARY, 22, 'center'
        );

        // Bottom hint
        r.drawText(
            'Break walls for weapons, fight enemies to survive',
            CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30,
            'rgba(255,255,255,0.2)', 10, 'center'
        );
    }

    // Miniature zone illustrations for main menu
    _drawZoneIllustration(ctx, r) {
        // Left zone: small brick grid + chest icon
        const lx = SCREEN.SPLIT_X / 2;
        const ly = 120;
        ctx.fillStyle = 'rgba(255, 204, 0, 0.15)';
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
                ctx.fillRect(lx - 30 + col * 16, ly + row * 10, 14, 8);
            }
        }
        r.drawText('CHEST', lx, ly + 46, 'rgba(255,204,0,0.3)', 9, 'center');

        // Right zone: small enemy shapes
        const rx = (SCREEN.RIGHT_MIN + SCREEN.RIGHT_MAX) / 2;
        const ry = 120;
        ctx.fillStyle = 'rgba(255, 68, 68, 0.2)';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(rx - 20 + i * 18, ry, 12, 12);
        }
        ctx.fillStyle = 'rgba(255, 68, 68, 0.15)';
        for (let i = 0; i < 2; i++) {
            ctx.fillRect(rx - 10 + i * 18, ry + 18, 12, 12);
        }
        r.drawText('ENEMY', rx, ry + 46, 'rgba(255,68,68,0.3)', 9, 'center');
    }

    // ---- Victory ----
    renderVictory(ctx, stats) {
        this._renderResult(ctx, stats, true);
    }

    // ---- Defeat ----
    renderDefeat(ctx, stats) {
        this._renderResult(ctx, stats, false);
    }

    _renderResult(ctx, stats, isWin) {
        const r = this.renderer;

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Title
        const title = isWin ? '任 务 完 成' : '防 线 失 守';
        const titleColor = isWin ? COLORS.UI_SUCCESS : COLORS.UI_DANGER;
        r.drawText(title, CANVAS_WIDTH / 2, 120, titleColor, 36, 'center');

        const subtitle = isWin ? 'MISSION COMPLETE' : 'MISSION FAILED';
        r.drawText(subtitle, CANVAS_WIDTH / 2, 155, titleColor, 13, 'center');

        // Stats - single column centered (portrait friendly)
        const colX = CANVAS_WIDTH / 2;
        let lineY = 210;
        const lineH = 34;
        const labelOffset = -120;
        const valueOffset = 120;

        const allStats = [
            ['存活时间', formatTimeLocal(stats.totalTime)],
            ['击杀数', `${stats.kills || 0}`],
            ['总分', `${stats.score || 0}`],
            ['波次进度', `${stats.wavesCleared || 0}/${stats.totalWaves || 0}`],
            ['宝箱开启', `${stats.chestsOpened || 0}`],
            ['砖墙击破', `${stats.wallsBroken || 0}`],
            ['升级获取', `${stats.upgradesAcquired || 0}`]
        ];

        r.drawText('-- 战斗报告 --', colX, lineY, COLORS.UI_SECONDARY, 12, 'center');
        lineY += lineH;

        for (const [label, value] of allStats) {
            r.drawText(label, colX + labelOffset, lineY, COLORS.UI_SECONDARY, 14, 'left');
            r.drawText(value, colX + valueOffset, lineY, COLORS.UI_TEXT, 14, 'right');
            lineY += lineH;
        }

        // Acquired upgrades list
        if (stats.acquiredUpgrades && stats.acquiredUpgrades.length > 0) {
            lineY += 10;
            r.drawText('获得强化:', colX + labelOffset, lineY, COLORS.UI_SECONDARY, 13, 'left');
            lineY += 24;
            const maxShow = Math.min(stats.acquiredUpgrades.length, 8);
            for (let i = 0; i < maxShow; i++) {
                const upg = stats.acquiredUpgrades[i];
                r.drawText(
                    `${upg.icon} ${upg.name}`,
                    colX + labelOffset + 10, lineY, COLORS.UI_TEXT, 12, 'left'
                );
                lineY += 22;
            }
            if (stats.acquiredUpgrades.length > maxShow) {
                r.drawText(
                    `... +${stats.acquiredUpgrades.length - maxShow}`,
                    colX + labelOffset + 10, lineY, COLORS.UI_SECONDARY, 11, 'left'
                );
            }
        }

        // Restart button (centered)
        const btnW = 220;
        const btnH = 52;
        const btnX = (CANVAS_WIDTH - btnW) / 2;
        const btnY = CANVAS_HEIGHT - 100;

        this.buttons = [{ x: btnX, y: btnY, w: btnW, h: btnH, action: 'restart' }];

        const isHover = this.selectedButton === 0;
        ctx.fillStyle = isHover ? COLORS.UI_PRIMARY : 'rgba(0, 204, 255, 0.15)';
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = COLORS.UI_PRIMARY;
        ctx.lineWidth = 2;
        ctx.strokeRect(btnX, btnY, btnW, btnH);

        r.drawText(
            '再 来 一 局',
            CANVAS_WIDTH / 2, btnY + btnH / 2,
            isHover ? COLORS.BG : COLORS.UI_PRIMARY, 22, 'center'
        );
    }

    // ---- Paused ----
    renderPaused(ctx) {
        const r = this.renderer;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        r.drawText('暂 停', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20, COLORS.UI_PRIMARY, 36, 'center');
        r.drawText('按 ESC 继续', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30, COLORS.UI_SECONDARY, 16, 'center');
    }

    // ---- Click handling ----
    handleClick(mouseX, mouseY) {
        for (let i = 0; i < this.buttons.length; i++) {
            const btn = this.buttons[i];
            if (mouseX >= btn.x && mouseX <= btn.x + btn.w &&
                mouseY >= btn.y && mouseY <= btn.y + btn.h) {
                return btn.action;
            }
        }
        return null;
    }

    // ---- Mouse hover ----
    handleMouseMove(mouseX, mouseY) {
        this.selectedButton = -1;
        for (let i = 0; i < this.buttons.length; i++) {
            const btn = this.buttons[i];
            if (mouseX >= btn.x && mouseX <= btn.x + btn.w &&
                mouseY >= btn.y && mouseY <= btn.y + btn.h) {
                this.selectedButton = i;
                break;
            }
        }
    }
}

function formatTimeLocal(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}
