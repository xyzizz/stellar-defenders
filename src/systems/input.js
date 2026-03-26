// input.js - 输入系统（键盘 + 触屏）
export class InputSystem {
    constructor() {
        this._keys = new Set();
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._bound = false;

        // 触屏状态
        this.touchActive = false;
        this.touchX = 0;       // 当前触点在 canvas 上的 X（逻辑坐标）
        this.touchY = 0;
        this.touchStartX = 0;  // 触点起始 X
        this.touchTargetX = -1; // 玩家应该移动到的目标 X，-1 表示不控制
    }

    _onKeyDown(e) {
        this._keys.add(e.key);
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
            e.preventDefault();
        }
    }

    _onKeyUp(e) {
        this._keys.delete(e.key);
    }

    isDown(key) {
        return this._keys.has(key);
    }

    isLeft() {
        return this._keys.has('ArrowLeft') || this._keys.has('a') || this._keys.has('A');
    }

    isRight() {
        return this._keys.has('ArrowRight') || this._keys.has('d') || this._keys.has('D');
    }

    isPause() {
        return this._keys.has('Escape');
    }

    // 触屏：绑定到 canvas 元素
    bindTouchEvents(canvas, canvasWidth, canvasHeight) {
        this._canvas = canvas;
        this._canvasW = canvasWidth;
        this._canvasH = canvasHeight;

        this._onTouchStart = (e) => {
            e.preventDefault();
            const t = e.touches[0];
            const pos = this._touchToCanvas(t);
            this.touchActive = true;
            this.touchX = pos.x;
            this.touchY = pos.y;
            this.touchStartX = pos.x;
            this.touchTargetX = pos.x;
        };

        this._onTouchMove = (e) => {
            e.preventDefault();
            if (!this.touchActive) return;
            const t = e.touches[0];
            const pos = this._touchToCanvas(t);
            this.touchX = pos.x;
            this.touchY = pos.y;
            this.touchTargetX = pos.x;
        };

        this._onTouchEnd = (e) => {
            e.preventDefault();
            this.touchActive = false;
            this.touchTargetX = -1;
        };

        canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
        canvas.addEventListener('touchend', this._onTouchEnd, { passive: false });
        canvas.addEventListener('touchcancel', this._onTouchEnd, { passive: false });
    }

    // 将触屏像素坐标转换为 canvas 逻辑坐标
    _touchToCanvas(touch) {
        const rect = this._canvas.getBoundingClientRect();
        const scaleX = this._canvasW / rect.width;
        const scaleY = this._canvasH / rect.height;
        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY
        };
    }

    bindEvents() {
        if (this._bound) return;
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
        this._bound = true;
    }

    unbindEvents() {
        if (!this._bound) return;
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
        this._keys.clear();
        this._bound = false;
    }

    reset() {
        this._keys.clear();
        this.touchActive = false;
        this.touchTargetX = -1;
    }
}
