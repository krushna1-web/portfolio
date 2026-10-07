/**
 * KRUSHNA BAGUL — 4 AM MOUNTAIN CODER & MORNING DAWN ATMOSPHERE
 * 
 * Cinematic, natural atmosphere:
 * 1. 3D Parallax on the full background image (#bg-mountain-img)
 * 2. Subtle, organic twinkling stars across the night sky
 * 3. Occasional celestial shooting stars (meteors)
 * 4. Soft morning sunrise glow blooming gently over the mountain horizon
 * 5. Gentle ambient light reflection from the laptop screen
 */

(function () {
  'use strict';

  const canvas = document.getElementById('dawn-mountain-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const bgImg = document.getElementById('bg-mountain-img');

  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  // Timing and Dawn Transition
  let startTime = null;
  let dawnProgress = 0;
  let dawnTriggered = false;
  let dawnStartTime = 0;
  const dawnTransitionDuration = 3000;

  // Smooth Mouse Parallax
  let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  // Starfield
  const STAR_COUNT = 80;
  const stars = [];

  // Shooting Stars (Meteors)
  const meteors = [];
  let lastMeteorTime = 0;

  // Initialize Stars in the sky area
  function initStars() {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        relX: Math.random() * 0.82,
        relY: Math.random() * 0.38,
        size: Math.random() * 1.4 + 0.6,
        baseAlpha: Math.random() * 0.6 + 0.3,
        twinkleSpeed: Math.random() * 0.0025 + 0.001,
        seed: Math.random() * Math.PI * 2,
        color: Math.random() > 0.8 ? '#93c5fd' : (Math.random() > 0.85 ? '#fde68a' : '#ffffff')
      });
    }
  }

  // Handle Resize
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.scale(dpr, dpr);
  }

  // Mouse move listener
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / width - 0.5) * 2;
    mouse.targetY = (e.clientY / height - 0.5) * 2;
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      mouse.targetX = (e.touches[0].clientX / width - 0.5) * 2;
      mouse.targetY = (e.touches[0].clientY / height - 0.5) * 2;
    }
  }, { passive: true });

  // Dawn trigger from particles.js
  window.triggerMountainDawn = function () {
    if (!dawnTriggered) {
      dawnTriggered = true;
      dawnStartTime = performance.now();
    }
  };

  // Spawn Shooting Star
  function maybeSpawnMeteor(now) {
    if (now - lastMeteorTime > 5500 && Math.random() < 0.02) {
      meteors.push({
        x: Math.random() * (width * 0.5) + width * 0.05,
        y: Math.random() * (height * 0.2) + 20,
        length: Math.random() * 75 + 40,
        speed: Math.random() * 8 + 10,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 30 + 20
      });
      lastMeteorTime = now;
    }
  }

  // Laptop coordinates on the mountain cliff
  function getLaptopCoordinates() {
    let lx = width * 0.61;
    let ly = height * 0.51;

    if (width < 768) {
      lx = width * 0.72;
      ly = height * 0.53;
    } else if (width < 1100) {
      lx = width * 0.65;
      ly = height * 0.52;
    }

    lx += mouse.x * 10;
    ly += mouse.y * 6;

    return { x: lx, y: ly };
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // 1. Draw Starfield
  function drawStars(progress, time) {
    const starFade = 1 - progress * 0.55;
    if (starFade <= 0.05) return;

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const sx = s.relX * width + mouse.x * 5;
      const sy = s.relY * height + mouse.y * 3;

      const twinkle = Math.sin(time * s.twinkleSpeed + s.seed);
      const alpha = s.baseAlpha * starFade * (0.7 + twinkle * 0.3);

      if (alpha <= 0.02) continue;

      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.min(1, Math.max(0, alpha));
      ctx.beginPath();
      ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
      ctx.fill();

      if (s.size > 1.4) {
        ctx.fillStyle = s.color;
        ctx.globalAlpha = alpha * 0.25;
        ctx.beginPath();
        ctx.arc(sx, sy, s.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1.0;
  }

  // 2. Draw Meteors
  function drawMeteors() {
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += Math.cos(m.angle) * m.speed;
      m.y += Math.sin(m.angle) * m.speed;
      m.life++;
      m.alpha = Math.max(0, 1 - m.life / m.maxLife);

      if (m.alpha <= 0) {
        meteors.splice(i, 1);
        continue;
      }

      ctx.save();
      const tailX = m.x - Math.cos(m.angle) * m.length;
      const tailY = m.y - Math.sin(m.angle) * m.length;

      const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(0.7, `rgba(186, 230, 253, ${(0.55 * m.alpha).toFixed(3)})`);
      grad.addColorStop(1, `rgba(255, 255, 255, ${(0.9 * m.alpha).toFixed(3)})`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 255, 255, ${(0.9 * m.alpha).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 3. Draw Gentle Morning Sunrise Bloom
  function drawSunriseBloom(progress, time) {
    if (progress <= 0.02) return;

    const sunX = width * 0.88 + mouse.x * 14;
    const sunY = height * 0.37 + mouse.y * 8;
    const maxRadius = Math.max(width, height) * 0.48;

    ctx.save();
    const bloomGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, maxRadius);
    const intensity = progress * (0.75 + Math.sin(time * 0.0018) * 0.12);

    bloomGrad.addColorStop(0, `rgba(255, 245, 210, ${(0.55 * intensity).toFixed(3)})`);
    bloomGrad.addColorStop(0.2, `rgba(255, 175, 80, ${(0.32 * intensity).toFixed(3)})`);
    bloomGrad.addColorStop(0.45, `rgba(240, 105, 55, ${(0.16 * intensity).toFixed(3)})`);
    bloomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = bloomGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, maxRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 4. Subtle Screen Glow
  function drawLaptopScreenGlow(lx, ly, time) {
    ctx.save();
    const flicker = 0.9 + Math.sin(time * 0.015) * 0.1;
    const glowRadius = Math.min(width, height) * 0.06;

    const screenGlow = ctx.createRadialGradient(lx, ly, 0, lx, ly, glowRadius);
    screenGlow.addColorStop(0, `rgba(224, 242, 254, ${(0.7 * flicker).toFixed(3)})`);
    screenGlow.addColorStop(0.35, `rgba(56, 189, 248, ${(0.35 * flicker).toFixed(3)})`);
    screenGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');

    ctx.fillStyle = screenGlow;
    ctx.beginPath();
    ctx.arc(lx, ly, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Main Loop
  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;

    // Smooth mouse lerp
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Subtle 3D mouse parallax on background image
    if (bgImg) {
      const px = (-mouse.x * 12).toFixed(2);
      const py = (-mouse.y * 8).toFixed(2);
      bgImg.style.transform = `translate3d(${px}px, ${py}px, 0) scale(1.025)`;
    }

    if (!dawnTriggered && elapsed > 4500) {
      dawnTriggered = true;
      dawnStartTime = timestamp;
    }

    if (dawnTriggered) {
      const dawnElapsed = timestamp - dawnStartTime;
      const rawProgress = Math.min(1, Math.max(0, dawnElapsed / dawnTransitionDuration));
      dawnProgress = easeInOutCubic(rawProgress);
    } else {
      dawnProgress = 0;
    }

    ctx.clearRect(0, 0, width, height);

    drawStars(dawnProgress, timestamp);
    maybeSpawnMeteor(timestamp);
    drawMeteors();
    drawSunriseBloom(dawnProgress, timestamp);

    const laptop = getLaptopCoordinates();
    drawLaptopScreenGlow(laptop.x, laptop.y, timestamp);

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => {
    resize();
    initStars();
  });

  resize();
  initStars();
  requestAnimationFrame(animate);

})();
