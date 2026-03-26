export function loadSprite(url) {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    return image;
}

export function isSpriteReady(sprite) {
    return Boolean(sprite && sprite.complete && sprite.naturalWidth);
}

export function drawPixelSprite(ctx, sprite, x, y, width, height, options = {}) {
    if (!isSpriteReady(sprite)) return false;

    const {
        glowColor = null,
        glowBlur = 8,
        flashAlpha = 0,
        alpha = 1
    } = options;

    const drawX = Math.round(x);
    const drawY = Math.round(y);
    const drawWidth = Math.round(width);
    const drawHeight = Math.round(height);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = alpha;

    if (glowColor) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glowBlur;
    }

    ctx.drawImage(sprite, drawX, drawY, drawWidth, drawHeight);

    if (flashAlpha > 0) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
        ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
        ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();
    return true;
}
