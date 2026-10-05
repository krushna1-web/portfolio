/**
 * KRUSHNA BAGUL — CINEMATIC PARTICLE ENGINE
 * Silky-Smooth Cinematic Kinetic Transition
 * 
 * Choreography:
 * 1. 0.0s - 0.4s: Pure black screen
 * 2. 0.4s - 2.8s: White particles smoothly converge and form "KRUSHNA"
 * 3. 2.8s - 3.8s: Brief pause to appreciate the formed particle typography
 * 4. 3.8s - 4.8s: Electrical lightning energy charges the particle typography
 * 5. 4.8s - 5.8s: Soft cinematic white bloom flash
 * 6. 5.1s - 7.5s: EXACT SAME particles glide with smooth easeInOutCubic to upper-left
 * 7. 6.4s+: Hero image and role content smoothly fade in
 * 8. 7.5s+: Settled with continuous subtle ambient floating shimmer
 */

(function () {
  'use strict';

  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const flashOverlay = document.getElementById('flash-overlay');

  // Animation States: 'black' -> 'forming' -> 'formed' -> 'energy' -> 'flash' -> 'moving' -> 'settled'
  let state = 'black';
  let startTime = null;
  let particles = [];
  let lightningArcs = [];
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  let viewportWidth = window.innerWidth;
  let viewportHeight = window.innerHeight;

  // Kinetic transition coordinates and timing
  let moveStartTime = 0;
  const moveDuration = 2200; // 2.2s ultra-smooth cinematic glide
  let finalScale = 0.38;
  let finalCenterX = 0;
  let finalCenterY = 0;
  let uiRevealed = false;

  // Cubic easing function for silky acceleration and deceleration
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Smooth ease-out for initial formation
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
    constructor(startX, startY, centerTargetX, centerTargetY, relX, relY) {
      this.startX = startX;
      this.startY = startY;
      
      this.x = startX;
      this.y = startY;

      // Position when formed in center
      this.centerTargetX = centerTargetX;
      this.centerTargetY = centerTargetY;

      // Relative offset from text center
      this.relX = relX;
      this.relY = relY;

      // Transformation capture coordinates
      this.fromX = startX;
      this.fromY = startY;
      this.toX = centerTargetX;
      this.toY = centerTargetY;

      // Visual attributes
      this.baseSize = Math.random() * 1.4 + 1.25;
      this.size = this.baseSize;
      this.baseAlpha = Math.random() * 0.3 + 0.7;
      this.alpha = 0;
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

    // Step spacing for clean, high-density particle typography
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

  // Calculate Header Target Alignment in sync with page container
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

  // Initialize Particles
  let textPointsData = null;
  function initParticles() {
    const centerFontSize = getCenterFontSize();
    textPointsData = sampleTextCoordinates(centerFontSize, 'KRUSHNA');

    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;

    particles = textPointsData.points.map(pt => {
      // Scatter from random points across the screen
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * Math.max(viewportWidth, viewportHeight) * 0.6 + 60;
      const startX = centerX + Math.cos(angle) * distance;
      const startY = centerY + Math.sin(angle) * distance;

      const centerTargetX = centerX + pt.relX;
      const centerTargetY = centerY + pt.relY;

      return new Particle(startX, startY, centerTargetX, centerTargetY, pt.relX, pt.relY);
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

  // Trigger Cinematic Flash and Begin Silky Glide
  function triggerCinematicFlash() {
    state = 'flash';

    if (flashOverlay) {
      flashOverlay.style.transition = 'opacity 0.22s ease-out';
      flashOverlay.style.opacity = '0.88';

      setTimeout(() => {
        flashOverlay.style.transition = 'opacity 1.0s cubic-bezier(0.16, 1, 0.3, 1)';
        flashOverlay.style.opacity = '0';
      }, 220);
    }

    // Capture exact particle departure points for smooth mathematical interpolation
    setTimeout(() => {
      state = 'moving';
      moveStartTime = performance.now();
      computeHeaderAnchor();

      particles.forEach(p => {
        p.fromX = p.x;
        p.fromY = p.y;
        p.toX = finalCenterX + p.relX * finalScale;
        p.toY = finalCenterY + p.relY * finalScale;
      });
    }, 280);
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

    // 1. Initial Black pause (0s -> 0.35s)
    if (state === 'black' && elapsed > 350) {
      state = 'forming';
    }

    // 2. Smooth Formation Phase (0.35s -> 2.6s)
    if (state === 'forming') {
      const formProgress = Math.min(1, (elapsed - 350) / 2250);
      const ease = easeOutCubic(formProgress);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x = p.startX + (p.centerTargetX - p.startX) * ease;
        p.y = p.startY + (p.centerTargetY - p.startY) * ease;
        p.alpha = Math.min(p.baseAlpha, ease * 1.15);
      }

      if (formProgress >= 1) {
        state = 'formed';
      }
    }

    // 3. Formed pause (2.6s -> 3.6s): Clean stationary appreciation with subtle breathing
    if (state === 'formed') {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const shimmerX = Math.sin(timestamp * 0.002 + p.seed) * 0.5;
        const shimmerY = Math.cos(timestamp * 0.0025 + p.seed) * 0.5;
        p.x = p.centerTargetX + shimmerX;
        p.y = p.centerTargetY + shimmerY;
        p.alpha = p.baseAlpha;
      }

      if (elapsed > 3600) {
        state = 'energy';
      }
    }

    // 4. Energy / Lightning charging phase (3.6s -> 4.6s)
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

      if (elapsed > 4600) {
        triggerCinematicFlash();
      }
    } else {
      lightningArcs = [];
    }

    // 5. Smooth Kinetic Glide (Mathematical Cubic Interpolation)
    if (state === 'moving') {
      const progress = Math.min(1, (timestamp - moveStartTime) / moveDuration);
      const eased = easeInOutCubic(progress);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x = p.fromX + (p.toX - p.fromX) * eased;
        p.y = p.fromY + (p.toY - p.fromY) * eased;
        p.size = p.baseSize * (1.0 - (1.0 - 0.84) * eased);
      }

      // Smoothly orchestrate UI fade-in during the glide
      if (progress >= 0.55) {
        revealHeroUI();
      }

      // Settled in final position
      if (progress >= 1.0) {
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
