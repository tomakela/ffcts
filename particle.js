// A self-executing anonymous function to create a module pattern
const particleModule = (() => {
    const canvas = document.getElementById("glcanvas");
    const gl = canvas.getContext("webgl");

    // Function to resize the canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (gl) {
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        }
    }

    // Initial setup and resize listener
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Check for WebGL support
    if (!gl) {
        const messageBox = document.createElement('div');
        messageBox.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px;
            border: 1px solid #f5c6cb; z-index: 1000; font-family: sans-serif;
        `;
        messageBox.textContent = "WebGL not supported by your browser.";
        document.body.appendChild(messageBox);
        console.error("WebGL not supported");
        return {}; // Return an empty object if WebGL isn't supported
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let particles = [];
    const fadeSpeed = 0.003; // Base fade speed for particles

    /**
     * Draws a filled rectangle using gl.scissor and gl.clear.
     * @param {number} x - X coordinate of the rectangle (pixel).
     * @param {number} y - Y coordinate of the rectangle (pixel).
     * @param {number} w - Width of the rectangle (pixel).
     * @param {number} h - Height of the rectangle (pixel).
     * @param {number[]} color - RGBA color array [r, g, b, a].
     */
    function drawRect(x, y, w, h, color) {
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(x, y, w, h);
        gl.clearColor(...color);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.SCISSOR_TEST);
    }

    /**
     * Updates particle positions and draws them.
     */
    function drawParticles() {
        const nextParticles = [];

        for (const p of particles) {
            // Apply custom updates based on particle type
            if (p.update) {
                p.update(p);
            } else { // Default update for simple particles
                p.x += p.vx;
                p.y += p.vy;
            }

            p.life -= p.fadeSpeed || fadeSpeed; // Use custom fadeSpeed or default

            if (p.life > -fadeSpeed) { // Keep particle if still visible
                nextParticles.push(p);
            }

            const size = p.size || 4; // Use custom size or default
            const xPixel = (p.x + 1) / 2 * canvas.width;
            const yPixel = (1 - (p.y + 1) / 2) * canvas.height;

            const currentAlpha = Math.max(0, p.life);
            const color = [
                p.color[0] * currentAlpha,
                p.color[1] * currentAlpha,
                p.color[2] * currentAlpha,
                currentAlpha
            ];

            drawRect(xPixel, yPixel, size, size, color);
        }
        particles = nextParticles;
    }

    /**
     * The main rendering loop.
     */
    function render() {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        drawParticles();
        requestAnimationFrame(render);
    }

    // Start the rendering loop
    render();

    // --- Different Particle Effects ---

    /**
     * Effect 1: Orange Burst - Particles explode outwards from a random point.
     */
    function createOrangeBurst() {
        const numParticles = 80;
        const x = (Math.random() * 2 - 1);
        const y = (Math.random() * 2 - 1);
        const maxSpeed = 0.01;
        const aspectRatio = canvas.width / canvas.height;

        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * maxSpeed;
            particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * speed / aspectRatio,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color: [1.0, 0.6, 0.2], // Warm Orange
                size: 3 + Math.random() * 2, // Slightly varied size
                fadeSpeed: 0.005 // Faster fade
            });
        }
    }

    /**
     * Effect 2: Green Trail - Particles leave a short, fading trail behind a mouse click.
     * (We'll simulate a random "click" for simplicity here, or you could add mouse listener)
     */
    function createGreenTrail() {
        const numParticles = 30;
        const x = (Math.random() * 2 - 1); // Random start X
        const y = (Math.random() * 2 - 1); // Random start Y
        const maxSpeed = 0.005;
        const trailDirection = Math.random() * Math.PI * 2; // Simulate a trail direction
        const aspectRatio = canvas.width / canvas.height;

        for (let i = 0; i < numParticles; i++) {
            const speed = Math.random() * maxSpeed;
            particles.push({
                x: x, y: y,
                vx: Math.cos(trailDirection) * speed / aspectRatio,
                vy: Math.sin(trailDirection) * speed,
                life: 1.0,
                color: [0.2, 1.0, 0.6], // Cool Green
                size: 3,
                fadeSpeed: 0.005 // Very fast fade for trail effect
            });
        }
    }

    /**
     * Effect 3: Blue Rain - Particles fall downwards like rain.
     */
    function createBlueRain() {
        const numParticles = 100;
        const minX = -1.0;
        const maxX = 1.0;
        const startY = -1.0; // Particles start at the top of the WebGL canvas (y = 1.0)
        const gravity = 0.00005; // Negative Y acceleration to pull particles downwards

        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: minX + Math.random() * (maxX - minX), // Random X across the screen
                y: startY,
                vx: (Math.random() - 0.5) * 0.001, // Slight horizontal drift
                vy: -0.002 - Math.random() * 0.002, // **Downward initial velocity** (negative value)
                life: 1.0,
                color: [0.3, 0.4, 1.0], // Bright Blue
                size: 4,
                fadeSpeed: 0.0025, // Slower fade for longer rain trails
                update: function(p) { // Custom update function for rain
                    p.vy += gravity; // Apply gravity, making downward velocity increase
                    p.x += p.vx;
                    p.y += p.vy;
                }
            });
        }
    }

    /**
     * Effect 4: Red Explode - A single, large explosion with many small, fast red particles.
     */
    function createRedExplode() {
        const numParticles = 150;
        const x = (Math.random() * 2 - 1);
        const y = (Math.random() * 2 - 1);
        const maxInitialSpeed = 0.01; // Very fast initial speed
        const aspectRatio = canvas.width / canvas.height;

        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * maxInitialSpeed;
            particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * speed / aspectRatio,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color: [1.0, 0.0, 0.0], // Pure Red
                size: 3, // Very small particles
                fadeSpeed: 0.005 // Fast fade for quick explosion
            });
        }
    }

    function createFire() {
        const numParticles = 10;
        const minX = -0.1; // Narrow base at the bottom center
        const maxX = 0.1;
        const startY = -1.0; // Bottom of the WebGL canvas
        const maxUpwardSpeed = 0.006; // Upward velocity range
        const wobbleAmplitude = 0.0002; // Side-to-side wobble
        const aspectRatio = canvas.width / canvas.height;

        for (let i = 0; i < numParticles; i++) {
            // Randomly select a warm color (red, orange, yellow)
            const colorChoice = Math.random();
            const color = colorChoice < 0.33 ? [1.0, 0.0, 0.0] : // Red
                         colorChoice < 0.66 ? [1.0, 0.65, 0.0] : // Orange
                                             [1.0, 1.0, 0.0]; // Yellow
            particles.push({
                x: minX + Math.random() * (maxX - minX), // Random X within base
                y: startY,
                vx: (Math.random() - 0.5) * 0.002 / aspectRatio, // Slight horizontal drift
                vy: 0.002 + Math.random() * maxUpwardSpeed, // Upward velocity
                life: 1.0,
                color: color,
                size: 2 + Math.random() * 3, // Varied size for flickering effect
                fadeSpeed: 0.004, // Moderate fade for flame-like decay
                update: function(p) { // Custom update for fire
                    // Add slight side-to-side wobble
                    p.vx += Math.sin(Date.now() * 0.02 + p.x) * wobbleAmplitude / aspectRatio;
                    p.x += p.vx;
                    p.y += p.vy;
                }
            });
        }
    }

    // Expose public functions
    return {
        createOrangeBurst,
        createGreenTrail,
        createBlueRain,
        createRedExplode,
        createFire
    };
})(); // End of the IIFE (Immediately Invoked Function Expression)