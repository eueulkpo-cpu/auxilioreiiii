class SmoothingOnly {
    constructor(element, onMove, smoothingFactor = 0.25) {
        this.element = element;
        this.onMove = onMove;
        this.smoothingFactor = smoothingFactor;
        this.current = null;
        this.enabled = false; // começa desativado

        element.addEventListener('touchstart', e => {
            const p = this.getPoint(e);
            this.current = p;
            this.onMove(p);
        }, { passive: true });

        element.addEventListener('touchmove', e => {
            if (!this.current) return;
            const raw = this.getPoint(e);

            if (this.enabled) {
                // aplica o smoothing
                this.current = {
                    x: this.current.x + (raw.x - this.current.x) * this.smoothingFactor,
                    y: this.current.y + (raw.y - this.current.y) * this.smoothingFactor
                };
            } else {
                // segue o dedo direto, sem suavização
                this.current = raw;
            }

            this.onMove(this.current);
        }, { passive: true });

        element.addEventListener('touchend', () => this.current = null);
    }

    getPoint(e) {
        const t = e.touches[0];
        const rect = this.element.getBoundingClientRect();
        return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }

    toggle(state) {
        this.enabled = state ?? !this.enabled;
    }
}

// Instancia apenas se os elementos existirem
const gameContainer = document.getElementById('game-container');
const crosshair = document.getElementById('crosshair');
const toggleBtn = document.getElementById('toggle-btn');

if (gameContainer && crosshair && toggleBtn) {
    const controller = new SmoothingOnly(gameContainer, (point) => {
        crosshair.style.left = `${point.x}px`;
        crosshair.style.top = `${point.y}px`;
    }, 0.25);

    toggleBtn.addEventListener('click', () => {
        controller.toggle();
        toggleBtn.textContent = controller.enabled ? 'Smoothing: ON' : 'Smoothing: OFF';
    });
}
