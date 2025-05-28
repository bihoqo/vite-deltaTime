import './style.css'

// HTML structure
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <h1>Ball Physics Simulation</h1>

  <div class="canvas-container">
    <div class="canvas-wrapper">
      <h2>Canvas 1</h2>
      <canvas id="canvas1" width="300" height="400"></canvas>
      <div class="controls">
        <div class="control-row">
          <label for="fps1">FPS:</label>
          <input type="number" id="fps1" min="1" max="120" value="60">
        </div>
        <div class="control-row">
          <label for="deltatime1">Use Delta Time:</label>
          <input type="checkbox" id="deltatime1" checked>
        </div>
      </div>
    </div>

    <div class="canvas-wrapper">
      <h2>Canvas 2</h2>
      <canvas id="canvas2" width="300" height="400"></canvas>
      <div class="controls">
        <div class="control-row">
          <label for="fps2">FPS:</label>
          <input type="number" id="fps2" min="1" max="120" value="30">
        </div>
        <div class="control-row">
          <label for="deltatime2">Use Delta Time:</label>
          <input type="checkbox" id="deltatime2" checked>
        </div>
      </div>
    </div>
  </div>

  <button id="resetBtn">Reset</button>
`

// Ball class to handle physics and rendering
class Ball {
    private x: number;
    private y: number;
    private radius: number;
    private velocity: number;
    private gravity: number;
    private stopped: boolean;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.radius = 20;
        this.reset();
    }

    reset(): void {
        this.x = this.canvas.width / 2;
        this.y = this.radius;
        this.velocity = 0;
        this.gravity = 9.8 * 50; // Scaled gravity for better visualization
        this.stopped = false;
    }

    update(deltaTime: number): void {
        if (this.stopped) return;

        // Apply gravity to velocity
        this.velocity += this.gravity * deltaTime;

        // Update position
        this.y += this.velocity * deltaTime;

        // Check if ball hit the ground
        if (this.y + this.radius >= this.canvas.height) {
            this.y = this.canvas.height - this.radius;
            this.stopped = true;
        }
    }

    render(): void {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw ground line
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height);
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = '#333';
        this.ctx.stroke();

        // Draw ball
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.stopped ? '#ff6b6b' : '#4CAF50';
        this.ctx.fill();
        this.ctx.strokeStyle = '#333';
        this.ctx.stroke();
    }
}

// Animation controller
class AnimationController {
    private ball: Ball;
    private fpsInput: HTMLInputElement;
    private deltaTimeCheckbox: HTMLInputElement;
    private animationFrameId: number | null = null;
    private lastTime: number = 0;
    private fps: number;
    private frameInterval: number;

    constructor(
        canvasId: string,
        fpsInputId: string,
        deltaTimeCheckboxId: string
    ) {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ball = new Ball(canvas);

        this.fpsInput = document.getElementById(fpsInputId) as HTMLInputElement;
        this.deltaTimeCheckbox = document.getElementById(deltaTimeCheckboxId) as HTMLInputElement;

        this.fps = parseInt(this.fpsInput.value);
        this.frameInterval = 1000 / this.fps;

        // Event listeners for controls
        this.fpsInput.addEventListener('change', () => {
            this.fps = parseInt(this.fpsInput.value);
            this.frameInterval = 1000 / this.fps;
        });

        this.start();
    }

    start(): void {
        this.lastTime = performance.now();
        this.animate(this.lastTime);
    }

    stop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    reset(): void {
        this.ball.reset();
        this.start();
    }

    animate(currentTime: number): void {
        this.animationFrameId = requestAnimationFrame((time) => this.animate(time));

        const elapsed = currentTime - this.lastTime;

        // If using fixed FPS (not deltaTime)
        if (!this.deltaTimeCheckbox.checked && elapsed < this.frameInterval) {
            return;
        }

        // Calculate delta time in seconds
        const deltaTime = this.deltaTimeCheckbox.checked
            ? elapsed / 1000
            : this.frameInterval / 1000;

        this.lastTime = currentTime;

        // Update and render
        this.ball.update(deltaTime);
        this.ball.render();
    }
}

// Initialize animation controllers
const controller1 = new AnimationController('canvas1', 'fps1', 'deltatime1');
const controller2 = new AnimationController('canvas2', 'fps2', 'deltatime2');

// Reset button
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
resetBtn.addEventListener('click', () => {
    controller1.reset();
    controller2.reset();
});
