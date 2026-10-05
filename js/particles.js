/**
 * KRUSHNA BAGUL — CINEMATIC PARTICLE ENGINE
 * 
 * Choreography:
 * 1. 0.0s - 0.5s: White dots appear scattered across the COMPLETE SCREEN
 * 2. 0.5s - 3.0s: Dots fly in from all directions across the whole screen and crisply form "KRUSHNA"
 * 3. 3.0s - 4.0s: Calm appreciation pause with ambient breathing
 * 4. 4.0s - 5.0s: Electric energy & lightning crackles through typography
 * 5. 5.0s - 7.5s: 4 AM SUNLIGHT DAWN TRANSITION:
 *    - Soft morning golden-dawn sunflare & horizon beam blooms across screen
 *    - THE EXACT SAME particles glide smoothly to the lower-left identity position
 *    - Hero visual & role content emerge bathed in morning light
 * 6. 7.5s+: Settled with continuous ambient particle shimmer
 */

(function () {
  'use strict';

  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const flashOverlay = document.getElementById('flash-overlay');

  // Animation States: 'black' -> 'forming' -> 'formed' -> 'energy' -> 'dawn' -> 'settled'
  let state = 'black';
  let startTime = null;
  let particles = [];
  let lightningArcs = [];
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  let viewportWidth = window.innerWidth;
  let viewportHeight = window.innerHeight;

  // Kinetic transition coordinates and timing
  let dawnStartTime = 0;
  const dawnDuration = 2400; // 2.4s morning dawn sunlight transition & glide
  let finalScale = 0.38;
  let finalCenterX = 0;
  let finalCenterY = 0;
  let uiRevealed = false;

  // Cubic easing function for silky acceleration and deceleration
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // Responsive font size for initial central title
  function getCenterFontSize() {
    if (viewportWidth < 500) return 60;
    if (viewportWidth < 768) return 86;
    if (viewportWidth < 1200) return 125;
    return 150;
  }

  // Particle Class
  class Particle {
    constructor(startX, startY, midX, midY, centerTargetX, centerTargetY, relX, relY, delay) {
      this.startX = startX;
      this.startY = startY;
      this.midX = midX;
      this.midY = midY;
      
      this.x = startX;
      this.y = startY;

      // Position when formed in center
      this.centerTargetX = centerTargetX;
      this.centerTargetY = centerTargetY;

      // Relative offset from text center
      this.relX = relX;
      this.relY = relY;

      // Glide coordinates
      this.fromX = startX;
      this.fromY = startY;
      this.toX = centerTargetX;
      this.toY = centerTargetY;

      // Visual attributes
      this.baseSize = Math.random() * 1.4 + 1.25;
      this.size = this.baseSize;
      this.baseAlpha = Math.random() * 0.3 + 0.7;
      this.alpha = 0;
      this.delay = delay;
      this.seed = Math.random() * 1000;
    }

    draw(ctx) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Sample Typography Target Points using Offscreen Canvas
  function sampleTextCoordinates(fontSize, text) {
    const off = document.createElement('canvas');
    const offCtx = off.getContext('2d');
    
    const fontSpec = `900 ${fontSize}px "Inter", "Cabinet Grotesk", sans-serif`;
    offCtx.font = fontSpec;
    const metrics = offCtx.measureText(text);
    const textWidth = Math.ceil(metrics.width);
    const textHeight = Math.ceil(fontSize * 1.2);

    off.width = textWidth + 60;
    off.height = textHeight + 60;

    offCtx.font = fontSpec;
    offCtx.fillStyle = '#ffffff';
    offCtx.textBaseline = 'middle';
    offCtx.textAlign = 'center';
    offCtx.fillText(text, off.width / 2, off.height / 2);

    const imgData = offCtx.getImageData(0, 0, off.width, off.height);
    const pixels = imgData.data;
    const points = [];

    // Step spacing for high-density particle typography
    const step = viewportWidth < 768 ? 4 : 5;

    for (let y = 0; y < off.height; y += step) {
      for (let x = 0; x < off.width; x += step) {
        const index = (y * off.width + x) * 4;
        if (pixels[index + 3] > 140) {
          points.push({
            relX: x - off.width / 2,
            relY: y - off.height / 2
          });
        }
      }
    }

    return { points, textWidth, textHeight };
  }

  // Canvas Setup
  function setupCanvas() {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = viewportWidth * dpr;
    canvas.height = viewportHeight * dpr;
    canvas.style.width = viewportWidth + 'px';
    canvas.style.height = viewportHeight + 'px';

    ctx.scale(dpr, dpr);
  }

  // Calculate Header Target Alignment with hero-name-anchor slot
  function computeHeaderAnchor() {
    finalScale = viewportWidth < 768 ? 0.34 : 0.38;
    const halfWidth = (textPointsData.textWidth * finalScale) / 2;

    const anchor = document.querySelector('.hero-name-anchor');
    const heroContent = document.querySelector('.hero-content');

    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      finalCenterX = rect.left + halfWidth;
      finalCenterY = rect.top + rect.height / 2;
    } else if (heroContent) {
      const contentRect = heroContent.getBoundingClientRect();
      finalCenterX = contentRect.left + halfWidth;
      finalCenterY = contentRect.top + 45;
    } else {
      const targetLeft = Math.max(30, viewportWidth * 0.075);
      finalCenterX = targetLeft + halfWidth;
      finalCenterY = viewportWidth < 768 ? 160 : 190;
    }
  }

  // Initialize Particles Scattered across the WHOLE COMPLETE SCREEN
  let textPointsData = null;
  function initParticles() {
    const centerFontSize = getCenterFontSize();
    textPointsData = sampleTextCoordinates(centerFontSize, 'KRUSHNA');

    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;

    particles = textPointsData.points.map(pt => {
      // Scatter randomly across the ENTIRE viewport (including corners and edges)
      const startX = Math.random() * (viewportWidth + 80) - 40;
      const startY = Math.random() * (viewportHeight + 80) - 40;

      const centerTargetX = centerX + pt.relX;
      const centerTargetY = centerY + pt.relY;

      // Organic curved waypoint for graceful flight paths
      const midX = (startX + centerTargetX) / 2 + (Math.random() - 0.5) * Math.min(viewportWidth, viewportHeight) * 0.35;
      const midY = (startY + centerTargetY) / 2 + (Math.random() - 0.5) * Math.min(viewportWidth, viewportHeight) * 0.35;

      const delay = Math.random() * 0.2; // subtle staggered start

      return new Particle(startX, startY, midX, midY, centerTargetX, centerTargetY, pt.relX, pt.relY, delay);
    });
  }

  // Electric Lightning Energy Arcs across typography
  function generateLightning() {
    lightningArcs = [];
    if (particles.length < 2) return;

    const arcCount = Math.floor(Math.random() * 3) + 3;
    for (let a = 0; a < arcCount; a++) {
      const p1 = particles[Math.floor(Math.random() * particles.length)];
      const p2 = particles[Math.floor(Math.random() * particles.length)];
      
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (dist > 30 && dist < 260) {
        const segments = 4;
        const pts = [{ x: p1.x, y: p1.y }];
        for (let s = 1; s < segments; s++) {
          const t = s / segments;
          const nx = p1.x + (p2.x - p1.x) * t + (Math.random() - 0.5) * 16;
          const ny = p1.y + (p2.y - p1.y) * t + (Math.random() - 0.5) * 16;
          pts.push({ x: nx, y: ny });
        }
        pts.push({ x: p2.x, y: p2.y });
        lightningArcs.push(pts);
      }
    }
  }

  function drawLightning() {
    if (lightningArcs.length === 0) return;

    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.shadowColor = 'rgba(52, 211, 153, 0.85)'; // Subtle emerald energy aura
    ctx.shadowBlur = 10;

    for (const arc of lightningArcs) {
      ctx.beginPath();
      ctx.moveTo(arc[0].x, arc[0].y);
      for (let i = 1; i < arc.length; i++) {
        ctx.lineTo(arc[i].x, arc[i].y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4 AM Dawn Sunlight Bloom Effect
  function draw4AMSunlight(progress) {
    if (progress <= 0 || progress >= 1) return;

    // Intensity curve: rises gently to peak at progress ~0.3, then softly dissolves
    const intensity = progress < 0.32
      ? Math.sin((progress / 0.32) * Math.PI / 2)
      : Math.pow(Math.cos(((progress - 0.32) / 0.68) * Math.PI / 2), 1.5);

    if (intensity <= 0.01) return;

    ctx.save();
    const cx = viewportWidth / 2;
    const cy = viewportHeight / 2;

    // 1. Warm radial sunrise bloom (Golden Dawn Light)
    const maxRadius = Math.max(viewportWidth, viewportHeight) * 0.9;
    const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
    radGrad.addColorStop(0, `rgba(255, 240, 205, ${(0.82 * intensity).toFixed(3)})`);
    radGrad.addColorStop(0.2, `rgba(255, 190, 110, ${(0.6 * intensity).toFixed(3)})`);
    radGrad.addColorStop(0.45, `rgba(240, 140, 60, ${(0.32 * intensity).toFixed(3)})`);
    radGrad.addColorStop(0.7, `rgba(70, 110, 180, ${(0.16 * intensity).toFixed(3)})`);
    radGrad.addColorStop(1, 'rgba(5, 5, 10, 0)');

    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    // 2. Horizontal 4 AM Dawn Horizon Light Beam
    const beamHeight = 90 * (1 + intensity * 1.5);
    const beamGrad = ctx.createLinearGradient(0, cy - beamHeight, 0, cy + beamHeight);
    beamGrad.addColorStop(0, 'rgba(255, 200, 120, 0)');
    beamGrad.addColorStop(0.5, `rgba(255, 245, 220, ${(0.65 * intensity).toFixed(3)})`);
    beamGrad.addColorStop(1, 'rgba(255, 200, 120, 0)');

    ctx.fillStyle = beamGrad;
    ctx.fillRect(0, cy - beamHeight, viewportWidth, beamHeight * 2);

    // 3. Soft golden dawn rays
    const rayCount = 8;
    ctx.strokeStyle = `rgba(255, 230, 180, ${(0.22 * intensity).toFixed(3)})`;
    ctx.lineWidth = 2.5;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + (progress * 0.18);
      const length = maxRadius * 0.7;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * length, cy + Math.sin(angle) * length);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Trigger 4 AM Sunlight Dawn Transition and Begin Silky Glide
  function triggerDawnTransition() {
    state = 'dawn';
    dawnStartTime = performance.now();
    computeHeaderAnchor();

    // Trigger mountain canvas morning dawn sunrise bloom
    if (typeof window.triggerMountainDawn === 'function') {
      window.triggerMountainDawn();
    }

    // Trigger soft morning sunlight overlay
    if (flashOverlay) {
      flashOverlay.style.transition = 'opacity 0.25s ease-out';
      flashOverlay.style.opacity = '0.85';

      setTimeout(() => {
        flashOverlay.style.transition = 'opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1)';
        flashOverlay.style.opacity = '0';
      }, 250);
    }

    // Capture particle departure coordinates for mathematical cubic interpolation
    particles.forEach(p => {
      p.fromX = p.x;
      p.fromY = p.y;
      p.toX = finalCenterX + p.relX * finalScale;
      p.toY = finalCenterY + p.relY * finalScale;
    });
  }

  // Smooth UI Reveal
  function revealHeroUI() {
    if (uiRevealed) return;
    uiRevealed = true;

    document.body.classList.remove('intro-active');

    const heroContent = document.querySelector('.hero-content');
    const heroVisual = document.querySelector('.hero-visual-wrapper');
    const navHeader = document.querySelector('.nav-header');

    if (heroContent) heroContent.classList.add('revealed');
    if (heroVisual) heroVisual.classList.add('revealed');
    if (navHeader) navHeader.classList.add('visible');
  }

  // Main Render Loop
  let lastLightningTime = 0;
  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;

    // Clear frame
    ctx.clearRect(0, 0, viewportWidth, viewportHeight);

    // 1. Initial State (0s -> 0.5s): Dots twinkle across the WHOLE SCREEN
    if (state === 'black') {
      const introFade = Math.min(1, elapsed / 450);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.alpha = p.baseAlpha * introFade * (0.8 + Math.sin(timestamp * 0.003 + p.seed) * 0.2);
        // Slight ambient float in starting scattered positions
        p.x = p.startX + Math.sin(timestamp * 0.0015 + p.seed) * 3;
        p.y = p.startY + Math.cos(timestamp * 0.0018 + p.seed) * 3;
      }

      if (elapsed > 500) {
        state = 'forming';
      }
    }

    // 2. Swarm Convergence Phase (0.5s -> 3.0s): Dots sweep in from whole screen into "KRUSHNA"
    if (state === 'forming') {
      const rawProgress = Math.min(1, (elapsed - 500) / 2500);

      let allDone = true;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // Account for individual particle delay for natural organic flight
        const pProgress = Math.min(1, Math.max(0, (rawProgress - p.delay) / (1 - p.delay)));
        const ease = easeOutCubic(pProgress);

        // Quadratic Bezier curve from whole screen to central target
        const inv = 1 - ease;
        p.x = inv * inv * p.startX + 2 * inv * ease * p.midX + ease * ease * p.centerTargetX;
        p.y = inv * inv * p.startY + 2 * inv * ease * p.midY + ease * ease * p.centerTargetY;
        p.alpha = Math.min(p.baseAlpha, 0.2 + ease * 0.85);

        if (pProgress < 1) allDone = false;
      }

      if (rawProgress >= 1 && allDone) {
        state = 'formed';
      }
    }

    // 3. Formed pause (3.0s -> 4.0s): Stationary appreciation with subtle breathing shimmer
    if (state === 'formed') {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const shimmerX = Math.sin(timestamp * 0.002 + p.seed) * 0.5;
        const shimmerY = Math.cos(timestamp * 0.0025 + p.seed) * 0.5;
        p.x = p.centerTargetX + shimmerX;
        p.y = p.centerTargetY + shimmerY;
        p.alpha = p.baseAlpha;
      }

      if (elapsed > 4000) {
        state = 'energy';
      }
    }

    // 4. Energy / Lightning charging phase (4.0s -> 5.0s)
    if (state === 'energy') {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const shimmerX = Math.sin(timestamp * 0.004 + p.seed) * 0.8;
        const shimmerY = Math.cos(timestamp * 0.0045 + p.seed) * 0.8;
        p.x = p.centerTargetX + shimmerX;
        p.y = p.centerTargetY + shimmerY;
      }

      if (timestamp - lastLightningTime > 90) {
        generateLightning();
        lastLightningTime = timestamp;
      }

      if (elapsed > 5000) {
        triggerDawnTransition();
      }
    } else {
      lightningArcs = [];
    }

    // 5. 4 AM Sunlight Dawn Transition & Silky Glide (5.0s -> 7.4s)
    let dawnProgress = 0;
    if (state === 'dawn') {
      dawnProgress = Math.min(1, (timestamp - dawnStartTime) / dawnDuration);
      const eased = easeInOutCubic(dawnProgress);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x = p.fromX + (p.toX - p.fromX) * eased;
        p.y = p.fromY + (p.toY - p.fromY) * eased;
        p.size = p.baseSize * (1.0 - (1.0 - 0.84) * eased);
      }

      // Smoothly orchestrate UI fade-in midway through the dawn sunlight
      if (dawnProgress >= 0.55) {
        revealHeroUI();
      }

      // Settled in final position
      if (dawnProgress >= 1.0) {
        state = 'settled';
      }
    }

    // 6. Settled State: Continuous subtle living ambient shimmer
    if (state === 'settled') {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const shimmerX = Math.sin(timestamp * 0.002 + p.seed) * 0.5;
        const shimmerY = Math.cos(timestamp * 0.0025 + p.seed) * 0.5;
        p.x = p.toX + shimmerX;
        p.y = p.toY + shimmerY;
      }
    }

    // Draw 4 AM Sunlight Dawn Bloom (behind particles)
    if (state === 'dawn') {
      draw4AMSunlight(dawnProgress);
    }

    // Render all particles
    for (let i = 0; i < particles.length; i++) {
      particles[i].draw(ctx);
    }

    // Render Lightning arcs if charging
    if (state === 'energy') {
      drawLightning();
    }

    requestAnimationFrame(animate);
  }

  // Handle Window Resize dynamically
  window.addEventListener('resize', () => {
    setupCanvas();
    if (state === 'settled') {
      computeHeaderAnchor();
      particles.forEach(p => {
        p.toX = finalCenterX + p.relX * finalScale;
        p.toY = finalCenterY + p.relY * finalScale;
      });
    }
  });

  // Start Intro Sequence
  document.body.classList.add('intro-active');
  setupCanvas();
  initParticles();
  requestAnimationFrame(animate);

})();
