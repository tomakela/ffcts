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
        const aspectRatio = canvas.height / canvas.width;

        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * maxSpeed;
            particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * speed * aspectRatio,
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
        const aspectRatio = canvas.height / canvas.width;

        for (let i = 0; i < numParticles; i++) {
            const speed = Math.random() * maxSpeed;
            particles.push({
                x: x, y: y,
                vx: Math.cos(trailDirection) * speed * aspectRatio,
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
        const aspectRatio = canvas.height / canvas.width;

        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * maxInitialSpeed;
            particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * speed * aspectRatio,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color: [1.0, 0.0, 0.0], // Pure Red
                size: 3, // Very small particles
                fadeSpeed: 0.005 // Fast fade for quick explosion
            });
        }
    }

    function createLeaves() {
        const numParticles = 10;
        const minX = -0.1; // Narrow base at the bottom center
        const maxX = 0.1;
        const startY = -1.0; // Bottom of the WebGL canvas
        const maxUpwardSpeed = 0.006; // Upward velocity range
        const wobbleAmplitude = 0.0002; // Side-to-side wobble
        const aspectRatio = canvas.height / canvas.width;

        for (let i = 0; i < numParticles; i++) {
            // Randomly select a warm color (red, orange, yellow)
            const colorChoice = Math.random();
            const color = colorChoice < 0.33 ? [1.0, 0.0, 0.0] : // Red
                         colorChoice < 0.66 ? [1.0, 0.65, 0.0] : // Orange
                                             [1.0, 1.0, 0.0]; // Yellow
            particles.push({
                x: minX + Math.random() * (maxX - minX), // Random X within base
                y: startY,
                vx: (Math.random() - 0.5) * 0.002 * aspectRatio, // Slight horizontal drift
                vy: 0.002 + Math.random() * maxUpwardSpeed, // Upward velocity
                life: 1.0,
                color: color,
                size: 2 + Math.random() * 3, // Varied size for flickering effect
                fadeSpeed: 0.004, // Moderate fade for flame-like decay
                update: function(p) { // Custom update for fire
                    // Add slight side-to-side wobble
                    p.vx += Math.sin(Date.now() * 0.02 + p.x) * wobbleAmplitude * aspectRatio;
                    p.x += p.vx;
                    p.y += p.vy;
                }
            });
        }
    }

function createVolcanoSpray() {
    const numParticles = 150;
    const minX = -0.05; // Narrow eruption base
    const maxX = 0.05;
    const startY = 0; // Bottom of WebGL canvas
    const maxUpwardSpeed = -0.03;
    const aspectRatio = canvas.height / canvas.width;
    const gravity = 0.0004;

    for (let i = 0; i < numParticles; i++) {
        // Slight cone spread
        const angle = (Math.random() - 0.5) * (Math.PI / 4) + Math.PI / 2; // Spray upward ±22.5°
        const speed = 0.005 + Math.random() * maxUpwardSpeed;
        const vx = Math.cos(angle) * speed * aspectRatio;
        const vy = Math.sin(angle) * speed;

        // Color: glowing lava tones (red-orange-yellow)
        const colorChoice = Math.random();
        const color = colorChoice < 0.4 ? [1.0, 0.2, 0.0] :
                      colorChoice < 0.8 ? [1.0, 0.5, 0.0] :
                                          [1.0, 1.0, 0.0];

        particles.push({
            x: minX + Math.random() * (maxX - minX),
            y: startY,
            vx: vx,
            vy: vy,
            life: 1.0,
            color: color,
            size: 2 + Math.random() * 2,
            fadeSpeed: 0.003 + Math.random() * 0.002,
            update: function (p) {
                p.vy += gravity; // Apply gravity to pull down
                p.x += p.vx;
                p.y += p.vy;
            }
        });
    }
}

function createSmoke() {
    const numParticles = 100;
    const ox = 0.3;
    const minX = -0.02-ox;
    const maxX = 0.02-ox;
    const startY = 0.8;
    const aspectRatio = canvas.height / canvas.width;

    const gravity = 0.00005; // Slight upward lift (negative gravity)

    for (let i = 0; i < numParticles; i++) {
        const angle = (Math.random() - 0.5) * Math.PI / 6; // ±15° horizontal spread
        const speed = 0.001 + Math.random() * 0.002;
        const vx = Math.cos(angle) * speed * aspectRatio;
        const vy = Math.sin(angle) * speed + 0.002; // Gentle upward drift

        // Color: soft grayish tones for smoke
        const gray = 0.3 + Math.random() * 0.4;
        const alpha = 0.4 + Math.random() * 0.2;

        particles.push({
            x: minX + Math.random() * (maxX - minX),
            y: startY,
            vx: vx,
            vy: vy,
            life: 1.0,
            color: [gray, gray, gray, alpha],
            size: 5 + Math.random() * 5,
            fadeSpeed: 0.001 + Math.random() * 0.001,
            update: function (p) {
                p.vy -= gravity; // Simulate lift
                p.x += p.vx;
                p.y += p.vy;
            }
        });
    }
}

function createSnow() {
    const numParticles = 120;
    const minX = -1.0;
    const maxX = 1.0;
    const startY = -1.0;
    const aspectRatio = canvas.height / canvas.width;

    for (let i = 0; i < numParticles; i++) {
        const baseX = minX + Math.random() * (maxX - minX);
        const driftAmplitude = 0.01 + Math.random() * 0.02; // how far it sways
        const driftFrequency = 0.5 + Math.random(); // how fast it sways
        const fallSpeed = -0.0005 - Math.random() * 0.001;

        particles.push({
            x: baseX,
            y: startY + Math.random() * 0.1,
            baseX: baseX,
            driftAmplitude: driftAmplitude,
            driftFrequency: driftFrequency,
            fallSpeed: fallSpeed,
            time: Math.random() * 100, // phase offset
            life: 1.0,
            color: [1.0, 1.0, 1.0, 0.9],
            size: 2 + Math.random() * 2,
            fadeSpeed: 0.0003 + Math.random() * 0.0003,
            update: function (p) {
                p.time += 0.01;
                p.y -= p.fallSpeed;
                p.x = p.baseX + Math.sin(p.time * p.driftFrequency) * p.driftAmplitude * aspectRatio;
            }
        });
    }
}

let currentSparkleCenterX = 0.0;
let currentSparkleCenterY = 0.0;

function createSparkle() {
    const numParticles = 80;
    // Use the global center coordinates
    const centerX = currentSparkleCenterX;
    const centerY = currentSparkleCenterY;
    const spawnRadius = 0.15;
    const aspectRatio = canvas.height / canvas.width;

    for (let i = 0; i < numParticles; i++) {
        const r = Math.sqrt(Math.random()) * spawnRadius;
        const theta = Math.random() * 2 * Math.PI;
        const spawnX = centerX + Math.cos(theta) * r * aspectRatio;
        const spawnY = centerY + Math.sin(theta) * r;

        // Random outward velocity
        const angle = Math.random() * 2 * Math.PI;
        const speed = 0.002 + Math.random() * 0.003;
        const vx = Math.cos(angle) * speed * aspectRatio;
        const vy = Math.sin(angle) * speed;

        // Color: white, gold, or soft blue
        const colorChoice = Math.random();
        const color = colorChoice < 0.4 ? [1.0, 1.0, 1.0, 1.0] :
                      colorChoice < 0.7 ? [1.0, 0.9, 0.5, 1.0] :
                                          [0.8, 0.9, 1.0, 1.0];

        particles.push({
            x: spawnX,
            y: spawnY,
            vx: vx,
            vy: vy,
            life: 1.0,
            color: color,
            size: 1.5 + Math.random() * 1.5,
            fadeSpeed: 0.01 + Math.random() * 0.01,
            update: function (p) {
                p.x += p.vx;
                p.y += p.vy;
            }
        });
    }
}

// Function to update the sparkle origin
function updateSparkleOrigin() {
    // Define the bounds for random positioning (adjust as needed)
    // These values (-0.8 to 0.8) ensure the sparkle isn't right at the very edge
    const minX = -0.8;
    const maxX = 0.8;
    const minY = -0.8;
    const maxY = 0.8;

    currentSparkleCenterX = minX + Math.random() * (maxX - minX);
    currentSparkleCenterY = minY + Math.random() * (maxY - minY);

    // console.log(`Sparkle origin moved to: (${currentSparkleCenterX.toFixed(2)}, ${currentSparkleCenterY.toFixed(2)})`);
}

// Call this once to set an initial position
updateSparkleOrigin();

// Set an interval to update the origin every few seconds
// For example, every 3 seconds (3000 milliseconds)
setInterval(updateSparkleOrigin, 2000);


function createLightning() {
    const numParticles = 100;
    const startX = 0.0;
    const startY = -1.0;  // top of canvas (correct)
    const endY = 1.0;   // bottom of canvas
    const segmentLength = 0.05;
    const maxOffset = 0.09;
    const aspectRatio = canvas.height / canvas.width;

    const lightningPoints = [];
    let currentX = startX;
    let currentY = startY;

    // Generate jagged lightning path downward (y decreases)
    while (currentY < endY) {
        lightningPoints.push({ x: currentX, y: currentY });
        currentY += segmentLength;
        currentX += (Math.random() * 2 - 1) * maxOffset * aspectRatio;
    }
    lightningPoints.push({ x: currentX, y: endY });

    for (let i = 0; i < lightningPoints.length - 1; i++) {
        const p1 = lightningPoints[i];
        const p2 = lightningPoints[i + 1];

        for (let j = 0; j < 5; j++) {
            const t = j / 5;
            const x = p1.x + (p2.x - p1.x) * t;
            const y = p1.y + (p2.y - p1.y) * t;

            particles.push({
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                life: .5 + Math.random()*0.5,           // longer life (~1.5 to 2.5)
                color: [1.0, 1.0, 0.5, 0.8],        // yellowish tint
                size: 2 + Math.random() * 2,
                fadeSpeed: 0.005 + Math.random() * 0.005, // slower fade
                update: function (p) {
                    p.color[3] = 0.6 + Math.random() * 0.4; // flicker alpha
                }
            });
        }
    }
}


function createStarfield() {
    const numParticles = 200;
    const aspectRatio =  canvas.height / canvas.width;

    for (let i = 0; i < numParticles; i++) {
        // Start near center with random offset and speed
        const angle = Math.random() * 2 * Math.PI;
        const radius = 0.005+Math.random() * 0.02; // small start radius
        const speed = 0.002 + Math.random() * 0.004;

        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);

        particles.push({
            x: radius * dirX * aspectRatio,
            y: radius * dirY,
            vx: dirX * speed * aspectRatio,
            vy: dirY * speed,
            life: 1.0,
            color: [1.0, 1.0, 1.0, 1.0], // white stars
            size: 0.8 + Math.random() * 1.5,
            fadeSpeed: 0.001, // barely fades, stars persist
            update: function (p) {
                p.x += p.vx;
                p.y += p.vy;
                // Optional: scale up size for pseudo depth
                p.size += 0.02;
                // Kill particle if it flies off-screen
                if (Math.abs(p.x) > 1.5 || Math.abs(p.y) > 1.5) {
                    p.life = 0;
                }
            }
        });
    }
}

function createEnergyBall() {
    const numParticles = 150;
    const aspectRatio = canvas.height / canvas.width ;

    for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const radius = 0.4 + Math.random() * 0.4;
        const speed = 0.01 + Math.random() * 0.005;
        const clockwise = Math.random() < 0.5 ? 1 : -1;

        particles.push({
            angle: angle,
            radius: radius,
            x: Math.cos(angle) * radius * aspectRatio,
            y: Math.sin(angle) * radius,
            vx: 0,
            vy: 0,
            life: 1.0,
            color: [0.3 + Math.random() * 0.7, 0.3, 1.0, 0.8], // bluish-purple glow
            size: 1.5 + Math.random() * 2.5,
            fadeSpeed: 0.002 + Math.random() * 0.002,
            update: function (p) {
                // Spin in circle
                p.angle += clockwise * speed;
                p.x = Math.cos(p.angle) * p.radius * aspectRatio;
                p.y = Math.sin(p.angle) * p.radius;

                // Pulse radius slightly
                p.radius += Math.sin(performance.now() * 0.005 + i) * 0.0002;
            }
        });
    }
}

function createSonicBoom() {
    const numParticles = 120;
    const aspectRatio =  canvas.height / canvas.width;

    for (let i = 0; i < numParticles; i++) {
        const angle = (i / numParticles) * 2 * Math.PI;
        const speed = 0.02 + Math.random() * 0.005;

        const vx = Math.cos(angle) * speed * aspectRatio;
        const vy = Math.sin(angle) * speed;

        particles.push({
            x: 0,
            y: 0,
            vx: vx,
            vy: vy,
            life: 1.0,
            color: [0.8, 0.9, 1.0, 0.9], // light blue-white shock
            size: 3 + Math.random() * 3,
            fadeSpeed: 0.01 + Math.random() * 0.005,
            update: function (p) {
                p.x += p.vx;
                p.y += p.vy;
                // Optional trailing effect:
                p.size *= 1.02; // expand slightly
                p.color[3] *= 0.98; // fade alpha
            }
        });
    }
}

function createFountain() {
    const numParticles = 120;
    const aspectRatio = canvas.height / canvas.width;
    const gravity = -0.0005;  // gentle downward pull (y axis inverted)

    for (let i = 0; i < numParticles; i++) {
        // More clustered angles for splash shape:
        let angle = (Math.random() - 0.5) * Math.PI * 1.5; // spread roughly in an arc
        if (Math.random() < 0.3) angle += Math.PI; // some backwards splash particles

        const speed = 0.003 + Math.random() * 0.001;

        let vx = Math.cos(angle) * speed * aspectRatio;
        let vy = Math.sin(angle) * speed;

        // Add slight wobble in velocity to mimic droplets
        vx += (Math.random() - 0.5) * 0.008;
        vy += (Math.random() - 0.5) * 0.005 - 0.01;

        particles.push({
            x: 0,
            y: 0,
            vx: vx,
            vy: vy,
            life: 1.0,
            color: [0.95, 0.95, 0.95, 0.9], // bright white ink
            size: 6 + Math.random() * 3,
            fadeSpeed: 0.006 + Math.random() * 0.004,
            update: function(p) {
                p.vy -= gravity; // gravity pulls droplets down
                p.x += p.vx;
                p.y += p.vy;
                p.color[3] -= p.fadeSpeed; // fade out gradually
                p.size *= 0.97; // shrink slower for more visible droplets
            }
        });
    }
}

function createDrippingGoo() {
    const numParticles = 80;
    const aspectRatio = canvas.height / canvas.width;
    const gravity = 0.0001; // Positive value for downward pull
    const startXRange = 0.01; // Tighter horizontal spread for a "drip" source

    for (let i = 0; i < numParticles; i++) {
        // Start closer to the center top, with a slight random spread
        const x = (Math.random() * 0.5) * startXRange;
        const y = -1.1 + Math.random() * 0.1; // Start just above the top, less "floating"

        // Initial velocity: mostly downward, with a very slight horizontal wobble
        const vxBase = (Math.random() - 0.5) * 0.005 * aspectRatio; // Even slower horizontal base
        const vy = 0.001 + Math.random() * 0.0005; // Initial downward speed (positive!)

        particles.push({
            x: x,
            y: y,
            vx: vxBase,
            vy: vy,
            life: 1.0, // Could be used for more complex fading, but color alpha is used here
            color: [0.3, 0.7, 0.2, 0.85], // Gooey green with slight opacity
            size: 10 + Math.random() * 6, // Larger initial size for better visual impact
            fadeSpeed: 0.004 + Math.random() * 0.0002, // Adjust fade speed for longer life
            update: function(p, time) {
                // Apply gravity: pulls particles down, increasing their downward velocity
                p.vy += gravity;

                // Add a subtle, organic side-to-side wobble
                // The time component makes it continuously fluctuate
                // The p.x * 10 part creates slight variations based on particle position
                p.vx = vxBase + Math.sin(time * 0.005 + p.x * 1) * 0.00008;

                //p.x =0;
                p.y += p.vy;

                // Fade out and shrink, but less aggressively for a stretchier look
                p.color[3] -= p.fadeSpeed; // Gradually reduce alpha
                p.size *= 0.99; // Shrink more slowly to give a "stretching" impression
            }
        });
    }
}

function createConfetti() {
    const numParticles = 120;
    const aspectRatio = canvas.height / canvas.width;
    const gravity = -0.0001;

    for (let i = 0; i < numParticles; i++) {
        const angle = (Math.random() * 2 * Math.PI);
        const speed = 0.005 + Math.random() * 0.002;

        const vx = Math.cos(angle) * speed * aspectRatio;
        const vy = -Math.abs(Math.sin(angle) * speed) * 0.5 - 0.002;

        const colorOptions = [
            [1.0, 0.2, 0.2], // red
            [0.2, 1.0, 0.2], // green
            [0.2, 0.6, 1.0], // blue
            [1.0, 0.8, 0.2], // yellow
            [0.8, 0.2, 1.0], // purple
            [0.2, 1.0, 1.0], // cyan
        ];

        const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];

        particles.push({
            x: (Math.random() * 2 - 1),
            y: -1.0 + Math.random() * 0.2,
            vx: vx,
            vy: vy,
            life: 1.0,
            color: [...color, 1.0],
            size: 3 + Math.random() * 3,
            angle: Math.random() * 2 * Math.PI,
            spin: (Math.random() - 0.5) * 0.2,
            fadeSpeed: 0.001 + Math.random() * 0.001,
            update: function(p) {
                p.vy -= gravity;
                p.x += p.vx;
                p.y += p.vy;
                p.angle += p.spin; // optional: for rotating visuals
                p.color[3] -= p.fadeSpeed;
            }
        });
    }
}

function createBeeSwarm() {
    const numParticles = 80;
    const centerX = 0;
    const centerY = 0;
    const aspectRatio = canvas.height / canvas.width ;

    for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const radius = 0.1 + Math.random() * 0.2;
        const speed = 0.02 + Math.random() * 0.01;

        const orbitSpeed = (Math.random() < 0.5 ? -1 : 1) * (0.02 + Math.random() * 0.01);

        particles.push({
            angle: angle,
            radius: radius,
            orbitSpeed: orbitSpeed,
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            vx: 0,
            vy: 0,
            life: 1.0,
            color: [1.0, 0.85, 0.0, 1.0], // bee-yellow
            size: 3 + Math.random() * 1.5,
            jitter: 0.002 + Math.random() * 0.003,
            update: function(p) {
                p.angle += p.orbitSpeed;
                const jitterX = (Math.random() - 0.5) * p.jitter * aspectRatio;
                const jitterY = (Math.random() - 0.5) * p.jitter;
                p.x = centerX + Math.cos(p.angle) * p.radius + jitterX;
                p.y = centerY + Math.sin(p.angle) * p.radius + jitterY;
            }
        });
    }
}

function createFlyBurst() {
    const numParticles = 150;
    const aspectRatio = canvas.height / canvas.width;

    for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = 0.003 + Math.random() * 0.002;

        const vx = Math.cos(angle) * speed * aspectRatio;
        const vy = Math.sin(angle) * speed;

        particles.push({
            x: -1 + Math.random() * 2,   // Random X in [-1, 1]
            y: -1 + Math.random() * 2,   // Random Y in [-1, 1]
            vx: vx,
            vy: vy,
            life: 2,  // effectively infinite
            color: [1.0, 1.0, 1.0, 0.8], // white flies (visible on black bg)
            size: 1.8 + Math.random() * 1.2,
            directionChange: 0.1 + Math.random() * 0.1,
            update: function(p) {
                const angle = Math.atan2(p.vy, p.vx);
                const newAngle = angle + (Math.random() - 0.5) * p.directionChange;
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);

                p.vx = Math.cos(newAngle) * speed;
                p.vy = Math.sin(newAngle) * speed;

                p.x += p.vx;
                p.y += p.vy;

                // Optional wrap around
                if (p.x < -1) p.x = 1;
                if (p.x > 1) p.x = -1;
                if (p.y < -1) p.y = 1;
                if (p.y > 1) p.y = -1;
            }
        });
    }
}

function createPlasmaBurst() {
    const numParticles = 180;
    const aspectRatio = canvas.height / canvas.width;

    for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = 0.01 + Math.random() * 0.015;

        const vx = Math.cos(angle) * speed * aspectRatio;
        const vy = Math.sin(angle) * speed;

        // Plasma-like neon hues: purples, cyans, pinks, electric blues
        const palette = [
            [1.0, 0.2, 1.0, 1.0], // Magenta
            [0.4, 0.8, 1.0, 1.0], // Electric blue
            [0.8, 0.1, 0.8, 1.0], // Purple
            [0.6, 1.0, 0.9, 1.0], // Aqua
            [1.0, 0.5, 1.0, 1.0]  // Hot pink
        ];
        const color = palette[Math.floor(Math.random() * palette.length)];

        particles.push({
            x: 0,
            y: 0,
            vx: vx,
            vy: vy,
            life: 1.0,
            color: color,
            size: 3 + Math.random() * 4,
            fadeSpeed: 0.01 + Math.random() * 0.01,
            update: function (p) {
                p.x += p.vx;
                p.y += p.vy;
                p.color[3] -= p.fadeSpeed; // fade alpha
                p.size *= 1.02; // slowly grow
            }
        });
    }
}

function createMagneticRays() {
    const numParticles = 120;
    const aspectRatio = canvas.height / canvas.width;
    const frequency = 3 + Math.random() * 2; // affects wave density
    const amplitude = 0.15 + Math.random() * 0.1;

    for (let i = 0; i < numParticles; i++) {
        const direction = Math.random() < 0.5 ? -1 : 1; // left or right
        const baseX = direction * (0.4 + Math.random() * 0.1); // spawn near poles
        const y = -0.9 + Math.random() * 1.8; // full vertical range

        const speed = 0.004 + Math.random() * 0.004;
        const phase = Math.random() * 2 * Math.PI;

        const palette = [
            [0.4, 1.0, 1.0, 1.0], // Cyan
            [0.2, 0.9, 0.8, 1.0], // Aqua
            [0.5, 0.8, 1.0, 1.0], // Electric Blue
            [0.6, 1.0, 0.6, 1.0], // Light green
        ];
        const color = palette[Math.floor(Math.random() * palette.length)];

        particles.push({
            x: baseX,
            y: y,
            vx: 0,
            vy: 0,
            baseX: baseX,
            phase: phase,
            direction: direction,
            frequency: frequency,
            amplitude: amplitude,
            speed: speed,
            color: color,
            size: 2.5 + Math.random() * 2,
            life: 1.0,
            fadeSpeed: 0.005 + Math.random() * 0.005,
            update: function (p) {
                p.y += p.speed;
                p.x = p.baseX + Math.sin(p.y * p.frequency + p.phase) * p.amplitude;
                p.color[3] -= p.fadeSpeed; // alpha fade
            }
        });
    }
}

function createCherryBloom() {
    const numParticles = 100;
    const aspectRatio = canvas.height / canvas.width;

    for (let i = 0; i < numParticles; i++) {
        // Parametric heart shape for initial velocity direction
        const t = Math.random() * 2 * Math.PI;
        // Heart shape parametric equations
        const heartScale = 0.02; // Adjust scale for heart size of the bloom
        const x = heartScale * 16 * Math.pow(Math.sin(t), 3);
        const y = -heartScale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

        // Random speed for outward explosion
        const speed = 0.004 + Math.random() * 0.006;
        // Normalize direction based on heart shape
        const magnitude = Math.sqrt(x * x + y * y);
        const vx = (x / magnitude) * speed * aspectRatio;
        const vy = (y / magnitude) * speed;

        const palette = [
            [1.0, 0.4, 0.6, 1.0], // Rose red
            [1.0, 0.6, 0.8, 1.0], // Pink
            [1.0, 0.75, 0.8, 1.0], // Soft blush
            [0.95, 0.3, 0.4, 1.0], // Deep red
            [1.0, 0.5, 0.5, 1.0], // Coral
        ];
        const color = palette[Math.floor(Math.random() * palette.length)];

        particles.push({
            x: 0,
            y: 0,
            vx: vx,
            vy: vy,
            life: 1.0,
            size: 4 + Math.random() * 4,
            maxSize: 10 + Math.random() * 8,
            fadeSpeed: 0.007 + Math.random() * 0.005,
            color: color,
            rotation: Math.random() * 2 * Math.PI,
            update: function (p) {
                p.x += p.vx;
                p.y += p.vy;
                p.color[3] -= p.fadeSpeed;
                if (p.size < p.maxSize) p.size *= 1.02;
                p.rotation += 0.05;
            },
            shape: 'heart' // Key addition: explicitly set shape to 'heart'
        });
    }
}

function createLavaSpurt() {
    const numParticles = 80;
    for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI - Math.PI / 2; // upward arc
        const speed = 0.005 + Math.random() * 0.015;

        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        const palette = [
            [1.0, 0.5, 0.0, 1.0], // Orange
            [1.0, 0.2, 0.0, 1.0], // Red-orange
            [1.0, 0.8, 0.2, 1.0], // Yellow-orange
        ];
        const color = palette[Math.floor(Math.random() * palette.length)];

        particles.push({
            x: -1,
            y: -.25,
            vx: vx,
            vy: vy,
            gravity: 0.0005,
            color: color,
            size: 4 + Math.random() * 3,
            life: 1.0,
            fadeSpeed: 0.01 + Math.random() * 0.01,
            update: function (p) {
                p.vy += p.gravity;
                p.x += p.vx;
                p.y += p.vy;
                p.color[3] -= p.fadeSpeed;
            }
        });
    }
}

function createElectricPulse() {
    const numParticles = 120;
    for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = 0.005 + Math.random() * 0.01;

        const jitter = () => (Math.random() - 0.5) * 0.01;

        const palette = [
            [0.6, 1.0, 1.0, 1.0], // Cyan
            [0.9, 0.9, 1.0, 1.0], // Light violet
            [0.2, 0.8, 1.0, 1.0], // Neon blue
        ];
        const color = palette[Math.floor(Math.random() * palette.length)];

        particles.push({
            x: 0,
            y: 0,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: color,
            size: 2 + Math.random() * 2,
            life: 1.0,
            fadeSpeed: 0.005 + Math.random() * 0.001,
            update: function (p) {
                p.x += p.vx + jitter();
                p.y += p.vy + jitter();
                p.color[3] -= p.fadeSpeed;
            }
        });
    }
}

function createFrostCrystals() {
    const aspectRatio =  canvas.height / canvas.width;
    const numParticles = 90;
    for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = 0.002 + Math.random() * 0.004;

        const vx = Math.cos(angle) * speed*aspectRatio;
        const vy = Math.sin(angle) * speed;

        const palette = [
            [0.9, 0.9, 1.0, 1.0], // Frost white
            [0.6, 0.8, 1.0, 1.0], // Ice blue
            [0.5, 0.9, 1.0, 1.0], // Crystal blue
        ];
        const color = palette[Math.floor(Math.random() * palette.length)];

        particles.push({
            x: 0,
            y: 0,
            vx: vx,
            vy: vy,
            color: color,
            size: 3 + Math.random() * 3,
            fadeSpeed: 0.0005 + Math.random() * 0.0005,
            life: 1.0,
            update: function (p) {
                p.x += p.vx;
                p.y += p.vy;
                p.size *= 0.98; // shrink
                p.color[3] -= p.fadeSpeed;
            }
        });
    }
}

function createNebulaCloud() {
    const numParticles = 150;
    const aspectRatio =  canvas.height / canvas.width;
    const centerX = 0;
    const centerY = 0;
    const R = 0.2

    for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = 0.001 + Math.random() * 0.003;

        const palette = [
            [1.0, 0.4, 0.7, 0.5], // Pink
            [0.5, 0.7, 1.0, 0.5], // Purple-blue
            [0.7, 1.0, 0.8, 0.5], // Mint
            [0.9, 0.6, 1.0, 0.5], // Violet
        ];
        const color = palette[Math.floor(Math.random() * palette.length)];

        const r = R * Math.sqrt(Math.random())
        theta = Math.random() * 2 * Math.PI

        const x = centerX + r * Math.cos(theta) * aspectRatio
        const y = centerY + r * Math.sin(theta)

        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed * aspectRatio,
            vy: Math.sin(angle) * speed,
            color: color,
            size: 2 + Math.random() * 2,
            fadeSpeed: 0.001 + Math.random() * 0.001,
            life: 1.0,
            update: function (p) {
                p.x += p.vx;
                p.y += p.vy;
                p.size *= 1.005; // slow expansion
                p.color[3] -= p.fadeSpeed;
            }
        });
    }
}

function createMist() {
    const numParticles = 120;
    for (let i = 0; i < numParticles; i++) {
        const speed = 0.0005 + Math.random() * 0.001;
        const xStart = (Math.random() - 0.5) * .2;

        const palette = [
            [1.0, 1.0, 1.0, 0.2],
            [0.8, 0.9, 1.0, 0.15],
            [0.9, 0.9, 0.95, 0.18],
        ];
        const color = palette[Math.floor(Math.random() * palette.length)];

        particles.push({
            x: xStart,
            y: 1.0,
            vx: (Math.random() - 0.5) * 0.002,
            vy: -speed,
            color: color,
            size: 2 + Math.random() * 3,
            fadeSpeed: 0.0005 + Math.random() * 0.0005,
            life: 1.0,
            update: function (p) {
                p.x += p.vx;
                p.y += p.vy;
                p.color[3] -= p.fadeSpeed;
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
        createLeaves,
        createVolcanoSpray,
        createSmoke,
        createSnow,
        createSparkle,
        createLightning,
        createStarfield,
        createEnergyBall,
        createSonicBoom,
        createFountain,
        createDrippingGoo,
        createConfetti,
        createBeeSwarm,
        createFlyBurst,
        createPlasmaBurst,
        createMagneticRays,
        createCherryBloom,
        createLavaSpurt,
        createElectricPulse,
        createFrostCrystals,
        createNebulaCloud,
        createMist
    };
})(); // End of the IIFE (Immediately Invoked Function Expression)