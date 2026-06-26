// === Phased Array Radar Simulator ===

interface RadarConfig {
    canvasId: string;
    elementCount: number;
    steeringAngle: number;
    frequency: number;
}

class PhasedArraySimulator {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    
    public elementCount: number;
    public steeringAngle: number;
    public frequency: number;
    
    private time: number = 0;
    private animationFrameId: number | null = null;

    private readonly elementSpacing: number = 12;
    private readonly waveSpeed: number = 4.0;

    constructor(config: RadarConfig) {
        this.canvas = document.getElementById(config.canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        
        this.elementCount = config.elementCount;
        this.steeringAngle = config.steeringAngle;
        this.frequency = config.frequency;
    }

    public start(): void {
        const renderLoop = () => {
            this.time += 0.15;
            this.draw();
            this.animationFrameId = requestAnimationFrame(renderLoop);
        };
        renderLoop();
    }

    public stop(): void {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    }

    private draw(): void {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        this.ctx.fillStyle = '#0a0f1d';
        this.ctx.fillRect(0, 0, width, height);

        const wavelength = 50 / this.frequency; 
        const k = (2 * Math.PI) / wavelength;
        const thetaRad = (this.steeringAngle * Math.PI) / 180;

        const elementsX: number[] = [];
        const arrayWidth = (this.elementCount - 1) * this.elementSpacing;
        const startX = (width - arrayWidth) / 2;
        const arrayY = height - 40;

        for (let i = 0; i < this.elementCount; i++) {
            elementsX.push(startX + i * this.elementSpacing);
        }

        const phaseShifts = elementsX.map((x) => {
            const relativeX = x - width / 2;
            return k * relativeX * Math.sin(thetaRad);
        });

        const step = 2;
        for (let y = 0; y < arrayY; y += step) {
            for (let x = 0; x < width; x += step) {
                let totalAmplitude = 0;

                for (let i = 0; i < this.elementCount; i++) {
                    const dx = x - elementsX[i];
                    const dy = y - arrayY;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance === 0) continue;
                    const attenuation = 1 / Math.sqrt(distance + 10);
                    const phase = this.time * this.waveSpeed - k * distance + phaseShifts[i];
                    totalAmplitude += Math.sin(phase) * attenuation;
                }

                const normalizedAmp = (totalAmplitude / this.elementCount) * 12;
                
                if (normalizedAmp > 0) {
                    const alpha = Math.min(normalizedAmp, 1);
                    this.ctx.fillStyle = `rgba(0, 255, 242, ${alpha})`;
                    this.ctx.fillRect(x, y, step, step);
                } else {
                    const alpha = Math.min(Math.abs(normalizedAmp), 1);
                    this.ctx.fillStyle = `rgba(255, 0, 150, ${alpha * 0.3})`;
                    this.ctx.fillRect(x, y, step, step);
                }
            }
        }

        for (let i = 0; i < this.elementCount; i++) {
            this.ctx.beginPath();
            this.ctx.arc(elementsX[i], arrayY, 4, 0, 2 * Math.PI);
            this.ctx.fillStyle = '#00ff66';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#00ff66';
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px sans-serif';
        this.ctx.fillText(`ビーム操舵角: ${this.steeringAngle}°`, 20, 30);
        this.ctx.fillText(`アンテナ素子数: ${this.elementCount}`, 20, 50);
    }
}

// --- DOMの初期化と連携 ---
window.addEventListener('DOMContentLoaded', () => {
    const sim = new PhasedArraySimulator({
        canvasId: 'radarCanvas',
        elementCount: 16,
        steeringAngle: 30,
        frequency: 2
    });
    
    sim.start();

    // UI要素の取得
    const angleSlider = document.getElementById('angleSlider') as HTMLInputElement;
    const elementSlider = document.getElementById('elementSlider') as HTMLInputElement;
    const angleVal = document.getElementById('angleVal')!;
    const elementVal = document.getElementById('elementVal')!;

    // スライダーイベント
    angleSlider.addEventListener('input', (e) => {
        const val = (e.target as HTMLInputElement).value;
        sim.steeringAngle = parseInt(val);
        angleVal.textContent = val;
    });

    elementSlider.addEventListener('input', (e) => {
        const val = (e.target as HTMLInputElement).value;
        sim.elementCount = parseInt(val);
        elementVal.textContent = val;
    });
});