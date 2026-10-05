/**
 * KRUSHNA BAGUL — 4 AM MOUNTAIN CODER & MORNING DAWN VFX ENGINE
 * 
 * Functions:
 * 1. 3D Mouse parallax on the full-screen mountain picture (#bg-mountain-img)
 * 2. Twinkling starfield overlay over the 4 AM night sky portion
 * 3. Meteors / shooting stars streaking near the crescent moon
 * 4. Active glowing screen reflection & typing flicker on the boy's laptop
 * 5. Floating code glyphs & binary sparks rising continuously from the laptop
 * 6. Dynamic morning dawn sunrise bloom & crepuscular rays over the mountain horizon
 * 7. Drifting low-altitude valley mist
 * 8. Live atmospheric time badge synchronization
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
  let dawnProgress = 0; // 0 = 4:00 AM Night, 1 = Morning Dawn Sunrise
  let dawnTriggered = false;
  let dawnStartTime = 0;
  const dawnTransitionDuration = 3200; // 3.2s sunrise bloom

  // Mouse Parallax with smooth lerp
  let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  // Starfield in upper sky portion
  const STAR_COUNT = 90;
  const stars = [];

  // Shooting Stars (Meteors)
  const meteors = [];
  let lastMeteorTime = 0;

  // Floating Code Glyphs from the Boy's Laptop
  const codeGlyphs = [];
  const GLYPH_POOL = ['{ }', '</>', '01', 'const', '=>', 'fn()', 'async', '[ ]', ';', '++', '0101', 'λ'];
  let lastGlyphTime = 0;

  // Valley Mist drifting
  let mistOffset = 0;

  // Initialize Stars in the sky quadrant
  function initStars() {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        // Mostly in the upper 44% of screen (sky area of the photo)
        relX: Math.random() * 0.85, // Left-to-center-right sky
        relY: Math.random() * 0.42,
        size: Math.random() * 1.5 + 0.6,
        baseAlpha: Math.random() * 0.65 + 0.35,
        twinkleSpeed: Math.random() * 0.003 + 0.0015,
        seed: Math.random() * Math.PI * 2,
        color: Math.random() > 0.75 ? '#93c5fd' : (Math.random() > 0.8 ? '#fde68a' : '#ffffff')
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

  // Mouse Tracking for 3D Parallax
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / width - 0.5) * 2; // -1 to +1
    mouse.targetY = (e.clientY / height - 0.5) * 2;
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      mouse.targetX = (e.touches[0].clientX / width - 0.5) * 2;
      mouse.targetY = (e.touches[0].clientY / height - 0.5) * 2;
    }
  }, { passive: true });

  // Trigger dawn programmatically from particles.js
  window.triggerMountainDawn = function () {
    if (!dawnTriggered) {
      dawnTriggered = true;
      dawnStartTime = performance.now();
    }
  };

  // Spawn Shooting Star
  function maybeSpawnMeteor(now) {
    if (now - lastMeteorTime > 4000 && Math.random() < 0.03) {
      meteors.push({
        x: Math.random() * (width * 0.55) + width * 0.05,
        y: Math.random() * (height * 0.22) + 20,
        length: Math.random() * 70 + 45,
        speed: Math.random() * 9 + 11,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.25,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 32 + 22
      });
      lastMeteorTime = now;
    }
  }

  // Calculate laptop screen position on mountain cliff in the image
  function getLaptopCoordinates() {
    // In the image (4:3 ratio centered/right), the boy sits on the right cliff
    // and his glowing laptop is located at approx 61% X and 50.5% Y on desktop
    let lx = width * 0.61;
    let ly = height * 0.51;

    // Small responsive adjustments for narrow screens
    if (width < 768) {
      lx = width * 0.72;
      ly = height * 0.53;
    } else if (width < 1100) {
      lx = width * 0.65;
      ly = height * 0.52;
    }

    // Apply parallax offset
    lx += mouse.x * 12;
    ly += mouse.y * 8;

    return { x: lx, y: ly };
  }

  // Spawn Code Glyph from the laptop screen
  function spawnCodeGlyph(lx, ly) {
    const text = GLYPH_POOL[Math.floor(Math.random() * GLYPH_POOL.length)];
    codeGlyphs.push({
      text: text,
      x: lx + (Math.random() - 0.5) * 16,
      y: ly - 4,
      vx: (Math.random() - 0.45) * 0.55,
      vy: -(Math.random() * 0.85 + 0.65),
      alpha: 1,
      size: Math.random() * 2.5 + 9.5,
      color: Math.random() > 0.4 ? '#38bdf8' : (Math.random() > 0.5 ? '#67e8f9' : '#fef08a'),
      life: 0,
      maxLife: Math.random() * 55 + 65
    });
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // 1. Draw Starfield
  function drawStars(progress, time) {
    const starFade = 1 - progress * 0.6; // stars dim gently at dawn
    if (starFade <= 0.05) return;

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const sx = s.relX * width + mouse.x * 6;
      const sy = s.relY * height + mouse.y * 4;

      const twinkle = Math.sin(time * s.twinkleSpeed + s.seed);
      const alpha = s.baseAlpha * starFade * (0.65 + twinkle * 0.35);

      if (alpha <= 0.02) continue;

      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.min(1, Math.max(0, alpha));
      ctx.beginPath();
      ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
      ctx.fill();

      // Soft glow for prominent stars
      if (s.size > 1.4) {
        ctx.fillStyle = s.color;
        ctx.globalAlpha = alpha * 0.3;
        ctx.beginPath();
        ctx.arc(sx, sy, s.size * 2.2, 0, Math.PI * 2);
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
      grad.addColorStop(0.7, `rgba(186, 230, 253, ${(0.6 * m.alpha).toFixed(3)})`);
      grad.addColorStop(1, `rgba(255, 255, 255, ${(0.95 * m.alpha).toFixed(3)})`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 255, 255, ${(0.95 * m.alpha).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 3. Draw Morning Dawn Sunrise Bloom over the Horizon
  function drawSunriseBloom(progress, time) {
    if (progress <= 0.02) return;

    // Sun sits at roughly 88% X and 37% Y on the horizon
    const sunX = width * 0.88 + mouse.x * 18;
    const sunY = height * 0.37 + mouse.y * 10;
    const maxRadius = Math.max(width, height) * 0.55;

    ctx.save();
    // Warm radial sunrise flare
    const bloomGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, maxRadius);
    const intensity = progress * (0.85 + Math.sin(time * 0.002) * 0.15);

    bloomGrad.addColorStop(0, `rgba(255, 245, 210, ${(0.65 * intensity).toFixed(3)})`);
    bloomGrad.addColorStop(0.15, `rgba(255, 175, 80, ${(0.42 * intensity).toFixed(3)})`);
    bloomGrad.addColorStop(0.38, `rgba(240, 105, 55, ${(0.22 * intensity).toFixed(3)})`);
    bloomGrad.addColorStop(0.7, `rgba(120, 50, 80, ${(0.08 * intensity).toFixed(3)})`);
    bloomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = bloomGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, maxRadius, 0, Math.PI * 2);
    ctx.fill();

    // Soft morning crepuscular rays radiating from sunrise
    const rayCount = 7;
    ctx.strokeStyle = `rgba(255, 230, 160, ${(0.12 * intensity).toFixed(3)})`;
    ctx.lineWidth = 2.5;
    for (let r = 0; r < rayCount; r++) {
      const angle = Math.PI * 0.95 + (r / (rayCount - 1)) * Math.PI * 0.55;
      const length = maxRadius * 0.9;
      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(sunX + Math.cos(angle) * length, sunY + Math.sin(angle) * length);
      ctx.stroke();
    }

    ctx.restore();
  }

  // 4. Draw Glowing Laptop Screen Light & Cast
  function drawLaptopScreenGlow(lx, ly, time) {
    ctx.save();

    // Typing activity micro-flicker
    const flicker = 0.88 + Math.sin(time * 0.016) * 0.12;

    // Cyan-white screen radiance
    const glowRadius = Math.min(width, height) * 0.08;
    const screenGlow = ctx.createRadialGradient(lx, ly, 0, lx, ly, glowRadius);
    screenGlow.addColorStop(0, `rgba(224, 242, 254, ${(0.92 * flicker).toFixed(3)})`);
    screenGlow.addColorStop(0.3, `rgba(56, 189, 248, ${(0.55 * flicker).toFixed(3)})`);
    screenGlow.addColorStop(0.7, `rgba(56, 189, 248, ${(0.18 * flicker).toFixed(3)})`);
    screenGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');

    ctx.fillStyle = screenGlow;
    ctx.beginPath();
    ctx.arc(lx, ly, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Focused bright core at screen
    ctx.fillStyle = `rgba(255, 255, 255, ${(0.8 * flicker).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 5. Draw Floating Code Glyphs
  function drawCodeGlyphs(time) {
    ctx.save();
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';

    for (let i = codeGlyphs.length - 1; i >= 0; i--) {
      const g = codeGlyphs[i];
      g.x += g.vx + Math.sin(time * 0.003 + i) * 0.22;
      g.y += g.vy;
      g.life++;
      g.alpha = Math.max(0, 1 - g.life / g.maxLife);

      if (g.alpha <= 0) {
        codeGlyphs.splice(i, 1);
        continue;
      }

      ctx.fillStyle = g.color;
      ctx.globalAlpha = g.alpha * (0.85 + Math.sin(time * 0.01 + i) * 0.15);
      ctx.shadowColor = g.color;
      ctx.shadowBlur = 8;
      ctx.fillText(g.text, g.x, g.y);
    }
    ctx.restore();
  }

  // 6. Draw Low-Altitude Drifting Valley Mist
  function drawValleyMist(progress, time) {
    ctx.save();
    mistOffset += 0.22;

    const mistY = height * 0.65 + mouse.y * 14;
    const mistAlpha = 0.14 + progress * 0.1;

    const grad = ctx.createLinearGradient(0, mistY - 50, 0, mistY + 50);
    grad.addColorStop(0, 'rgba(255, 220, 190, 0)');
    grad.addColorStop(0.5, `rgba(240, 230, 255, ${mistAlpha.toFixed(3)})`);
    grad.addColorStop(1, 'rgba(30, 40, 65, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, mistY);
    for (let x = 0; x <= width; x += 50) {
      const y = mistY + Math.sin((x + mistOffset) * 0.008) * 12 + Math.cos((x - mistOffset * 0.7) * 0.012) * 8;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 7. Update Live Atmospheric Time Badge
  function updateTimeBadge(progress) {
    const badge = document.getElementById('mountain-time-badge');
    if (!badge) return;

    if (progress < 0.35) {
      badge.innerHTML = `<span class="time-dot"></span> 04:00 AM // SUMMIT DAWN SESSIONS · ALT 3,200M`;
    } else if (progress < 0.85) {
      badge.innerHTML = `<span class="time-dot dawn"></span> 04:30 AM // FIRST LIGHT ON MOUNTAIN HORIZON`;
    } else {
      badge.innerHTML = `<span class="time-dot active"></span> 05:00 AM // DAWN BROKEN · CODING CONTINUES`;
    }
  }

  // Main Animation Render Loop
  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;

    // Smooth mouse lerp for parallax
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Apply smooth 3D parallax to the whole background mountain picture
    if (bgImg) {
      const px = (-mouse.x * 14).toFixed(2);
      const py = (-mouse.y * 10).toFixed(2);
      bgImg.style.transform = `translate3d(${px}px, ${py}px, 0) scale(1.035)`;
    }

    // Auto-trigger dawn if not triggered by particles.js
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

    // Clear canvas frame
    ctx.clearRect(0, 0, width, height);

    // 1. Twinkling Stars in 4 AM Night Sky
    drawStars(dawnProgress, timestamp);

    // 2. Shooting Stars (Meteors)
    maybeSpawnMeteor(timestamp);
    drawMeteors();

    // 3. Morning Dawn Sunrise Bloom over the Horizon
    drawSunriseBloom(dawnProgress, timestamp);

    // 4. Laptop Screen Light & Coding Effects
    const laptop = getLaptopCoordinates();
    drawLaptopScreenGlow(laptop.x, laptop.y, timestamp);

    // Spawn Code Glyphs from Laptop
    if (timestamp - lastGlyphTime > 360) {
      spawnCodeGlyph(laptop.x, laptop.y);
      lastGlyphTime = timestamp;
    }

    // Render Floating Code Glyphs
    drawCodeGlyphs(timestamp);

    // 5. Drifting Valley Mist
    drawValleyMist(dawnProgress, timestamp);

    // 6. Update Time Badge
    updateTimeBadge(dawnProgress);

    requestAnimationFrame(animate);
  }

  // Setup & Listeners
  window.addEventListener('resize', () => {
    resize();
    initStars();
  });

  resize();
  initStars();
  requestAnimationFrame(animate);

})();
