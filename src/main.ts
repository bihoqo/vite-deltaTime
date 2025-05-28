import './style.css' // Import styling for the page

// Inject HTML structure into the page
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <h1>Ball Physics Simulation</h1>

  <!-- Two canvases with controls for FPS and deltaTime usage -->
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

  <!-- Button to reset both balls -->
  <button id="resetBtn">Reset</button>
`

// Ball class simulates physics and drawing logic
class Ball {
    private static readonly RADIUS: number = 20; // Ball size
    private static readonly GRAVITY: number = 9.8 * 50; // Simulated gravity (scaled for better visual effect)

    private x: number = 0; // X position
    private y: number = 0; // Y position
    private velocity: number = 0; // Vertical speed
    private stopped: boolean = false; // Whether the ball has hit the ground
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.reset(); // Set initial values
    }

    // Reset ball to initial state
    reset(): void {
        this.x = this.canvas.width / 2;
        this.y = Ball.RADIUS;
        this.velocity = 0;
        this.stopped = false;
    }

    // Update position and velocity based on deltaTime
    update(deltaTime: number): void {
        if (this.stopped) return;

        // Apply gravity to vertical velocity
        this.velocity += Ball.GRAVITY * deltaTime;

        // Update vertical position based on velocity
        this.y += this.velocity * deltaTime;

        // Stop if ball hits the bottom
        if (this.y + Ball.RADIUS >= this.canvas.height) {
            this.y = this.canvas.height - Ball.RADIUS;
            this.stopped = true;
        }
    }

    // Draw the ball and ground
    render(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw ground line
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height);
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = '#333';
        this.ctx.stroke();

        // Draw ball with color based on state
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, Ball.RADIUS, 0, Math.PI * 2);
        this.ctx.fillStyle = this.stopped ? '#ff6b6b' : '#4CAF50';
        this.ctx.fill();
        this.ctx.strokeStyle = '#333';
        this.ctx.stroke();
    }
}

// Handles animation and controls for each canvas
class AnimationController {
    private ball: Ball;
    private fpsInput: HTMLInputElement;
    private deltaTimeCheckbox: HTMLInputElement;
    private animationFrameId: number | null = null; // Used to cancel animation
    private lastTime: number = 0; // Last frame timestamp
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

        // Update FPS dynamically on user change
        this.fpsInput.addEventListener('change', () => {
            this.fps = parseInt(this.fpsInput.value);
            this.frameInterval = 1000 / this.fps;
        });

        this.start(); // Start animation loop
    }

    // Starts the animation loop
    start(): void {
        this.lastTime = performance.now();
        this.animate(this.lastTime);
    }

    // Stop the animation loop
    stop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    // Reset the ball and restart animation
    reset(): void {
        this.ball.reset();
        this.start();
    }

    // Animation loop
    animate(currentTime: number): void {
        // Schedule next frame
        this.animationFrameId = requestAnimationFrame((time) => this.animate(time));

        const elapsed = currentTime - this.lastTime;

        // If not using delta time, only update when enough time has passed
        if (!this.deltaTimeCheckbox.checked && elapsed < this.frameInterval) {
            return;
        }

        // Calculate deltaTime (in seconds)
        const deltaTime = this.deltaTimeCheckbox.checked
            ? elapsed / 1000
            : this.frameInterval / 1000;

        this.lastTime = currentTime;

        // Update physics and draw
        this.ball.update(deltaTime);
        this.ball.render();
    }
}

// Create controllers for both canvases
const controller1 = new AnimationController('canvas1', 'fps1', 'deltatime1');
const controller2 = new AnimationController('canvas2', 'fps2', 'deltatime2');

// Reset button handler - resets both simulations
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
resetBtn.addEventListener('click', () => {
    controller1.reset();
    controller2.reset();
});
