import './style.css' // Import global CSS styles

// Inject the HTML UI layout into the #app container
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <h1>Ball Physics Simulation</h1>
  <div class="canvas-container">
    <!-- Canvas 1 with controls -->
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

    <!-- Canvas 2 with different initial FPS -->
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

// Ball class to simulate physics and rendering
class Ball {
    private static readonly RADIUS = 20; // Ball size
    private static readonly GRAVITY = 9.8 * 50; // Scaled gravity for visible motion

    private x = 0; // Horizontal position
    private y = 0; // Vertical position
    private velocity = 0; // Speed downward
    private stopped = false; // True when hitting the ground
    private startTime = 0; // Time when simulation starts
    private stopTime = 0;  // Time when ball hits the ground

    constructor(
        private canvas: HTMLCanvasElement,
        private ctx = canvas.getContext('2d')!
    ) {
        this.reset();
    }

    // Reset the ball state to top position
    reset() {
        this.x = this.canvas.width / 2;
        this.y = Ball.RADIUS;
        this.velocity = 0;
        this.stopped = false;
        this.startTime = performance.now(); // Record start time
        this.stopTime = 0;
    }

    // Update ball's position and physics
    update(deltaTime: number) {
        if (this.stopped) return;

        // Apply gravity and update position
        this.velocity += Ball.GRAVITY * deltaTime;
        this.y += this.velocity * deltaTime;

        // Stop at ground level
        if (this.y + Ball.RADIUS >= this.canvas.height) {
            this.y = this.canvas.height - Ball.RADIUS;
            this.velocity = 0;
            this.stopped = true;
            this.stopTime = performance.now(); // Record stop time
            this.canvas.classList.add('shake'); // Trigger shake animation
            setTimeout(() => this.canvas.classList.remove('shake'), 300);
        }
    }

    // Draw the ball, shadow, ground, and info labels
    render(fps: number, usingDelta: boolean) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw ground line
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height);
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = '#444';
        this.ctx.stroke();

        // Draw shadow under the ball
        this.ctx.beginPath();
        this.ctx.ellipse(this.x, this.canvas.height - 5, 25, 5, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fill();

        // Draw the ball
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, Ball.RADIUS, 0, Math.PI * 2);
        this.ctx.fillStyle = this.stopped ? '#ff6b6b' : '#4CAF50';
        this.ctx.fill();
        this.ctx.strokeStyle = '#333';
        this.ctx.stroke();

        // Draw FPS and deltaTime status
        this.ctx.fillStyle = '#000';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`FPS: ${fps}`, 10, 20);
        this.ctx.fillText(`DeltaTime: ${usingDelta ? 'On' : 'Off'}`, 10, 40);

        // If stopped, show total fall time
        if (this.stopped) {
            const elapsed = ((this.stopTime - this.startTime) / 1000).toFixed(2);
            this.ctx.fillText(`Time: ${elapsed}s`, 10, 60);
        }
    }
}

// AnimationController manages each canvas's animation logic
class AnimationController {
    private ball: Ball;
    private animationFrameId: number | null = null;
    private lastTime = 0;
    private fps: number;
    private frameInterval: number;

    constructor(
        canvasId: string,
        private fpsInputId: string,
        private deltaTimeCheckboxId: string
    ) {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ball = new Ball(canvas);

        const fpsInput = document.getElementById(fpsInputId) as HTMLInputElement;
        const deltaTimeCheckbox = document.getElementById(deltaTimeCheckboxId) as HTMLInputElement;

        this.fps = parseInt(fpsInput.value);           // Read initial FPS
        this.frameInterval = 1000 / this.fps;          // Convert FPS to milliseconds per frame

        // Allow user to change FPS during runtime
        fpsInput.addEventListener('change', () => {
            this.fps = parseInt(fpsInput.value);
            this.frameInterval = 1000 / this.fps;
        });

        this.start(); // Begin animation loop
    }

    // Start the animation
    start() {
        this.lastTime = performance.now();
        this.animate(this.lastTime);
    }

    // Reset the simulation and restart
    reset() {
        this.ball.reset();
        this.start();
    }

    // Main animation loop
    animate(currentTime: number) {
        this.animationFrameId = requestAnimationFrame(time => this.animate(time));

        const fpsInput = document.getElementById(this.fpsInputId) as HTMLInputElement;
        const deltaTimeCheckbox = document.getElementById(this.deltaTimeCheckboxId) as HTMLInputElement;

        const elapsed = currentTime - this.lastTime;

        // If deltaTime is off, skip frames until the interval is met
        if (!deltaTimeCheckbox.checked && elapsed < this.frameInterval) return;

        // Calculate time step in seconds
        const deltaTime = deltaTimeCheckbox.checked ? elapsed / 1000 : this.frameInterval / 1000;

        this.lastTime = currentTime;

        // Update ball position and draw frame
        this.ball.update(deltaTime);
        this.ball.render(this.fps, deltaTimeCheckbox.checked);
    }
}

// Initialize both canvas simulations
const controller1 = new AnimationController('canvas1', 'fps1', 'deltatime1');
const controller2 = new AnimationController('canvas2', 'fps2', 'deltatime2');

// Add event listener to Reset button to reset both simulations
(document.getElementById('resetBtn') as HTMLButtonElement).addEventListener('click', () => {
    controller1.reset();
    controller2.reset();
});
