// renderer.js - Canvas 渲染器
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, SCREEN } from '../config/constants.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        // 屏幕震动
        this.shakeAmount = 0;
        this.shakeDecay = 8;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    shake(amount) {
        this.shakeAmount = Math.max(this.shakeAmount, amount);
    }

    clear() {
        this.ctx.save();

        // 更新震动
        if (this.shakeAmount > 0.5) {
            this.offsetX = (Math.random() - 0.5) * this.shakeAmount * 2;
            this.offsetY = (Math.random() - 0.5) * this.shakeAmount * 2;
            this.ctx.translate(this.offsetX, this.offsetY);
        } else {
            this.offsetX = 0;
            this.offsetY = 0;
        }

        // 清背景
        this.ctx.fillStyle = COLORS.BG;
        this.ctx.fillRect(-10, -10, CANVAS_WIDTH + 20, CANVAS_HEIGHT + 20);
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = COLORS.GRID_LINE;
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < CANVAS_WIDTH; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CANVAS_HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_WIDTH, y);
            ctx.stroke();
        }
    }

    endFrame(dt) {
        // 衰减震动
        if (this.shakeAmount > 0) {
            this.shakeAmount -= this.shakeDecay * dt;
            if (this.shakeAmount < 0) this.shakeAmount = 0;
        }
        this.ctx.restore();
    }

    // ---- 基础绘制方法 ----

    drawRect(x, y, w, h, color, alpha = 1) {
        const ctx = this.ctx;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        ctx.globalAlpha = 1;
    }

    drawCircle(x, y, r, color, alpha = 1) {
        const ctx = this.ctx;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    drawLine(x1, y1, x2, y2, color, width = 1, alpha = 1) {
        const ctx = this.ctx;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    drawText(text, x, y, color = COLORS.UI_TEXT, size = 14, align = 'left', font = 'monospace') {
        const ctx = this.ctx;
        ctx.fillStyle = color;
        ctx.font = `${size}px ${font}`;
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
    }

    drawBar(x, y, w, h, ratio, fgColor, bgColor = 'rgba(255,255,255,0.2)') {
        const ctx = this.ctx;
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = fgColor;
        ctx.fillRect(x, y, w * Math.max(0, Math.min(1, ratio)), h);
    }

    // 绘制基地线
    drawBaseLine(y, durability, maxDurability) {
        const ratio = durability / maxDurability;
        const color = ratio > 0.5 ? COLORS.UI_SUCCESS : ratio > 0.25 ? '#ffaa00' : COLORS.UI_DANGER;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(SCREEN.RIGHT_MIN, y);
        this.ctx.lineTo(SCREEN.RIGHT_MAX, y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    // 闪光效果
    flash(x, y, radius, color = '#ffffff') {
        const ctx = this.ctx;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}
