/* 9to5Wrapped — GlobalSpotlight (vanilla port of src/components/CardEffects.jsx)
   Drives the .glow-card border glow + a cursor-following spotlight.
   No gsap dependency; uses a light rAF lerp. Honors reduced-motion + touch. */
(function () {
  function initSpotlight(opts) {
    opts = opts || {};
    var glowColor = opts.glowColor || '132, 0, 255';
    var spotlightRadius = opts.spotlightRadius || 320;

    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isTouch = window.innerWidth <= 768 || (window.matchMedia && window.matchMedia('(hover: none)').matches);
    if (prefersReduced || isTouch) return;

    var spot = document.createElement('div');
    spot.className = 'global-spotlight';
    spot.style.cssText = [
      'position:fixed', 'width:800px', 'height:800px', 'border-radius:50%',
      'pointer-events:none', 'z-index:5', 'opacity:0', 'left:0', 'top:0',
      'transform:translate(-50%,-50%)', 'mix-blend-mode:screen',
      'transition:opacity .3s ease',
      'background:radial-gradient(circle,rgba(' + glowColor + ',0.12) 0%,rgba(' + glowColor + ',0.06) 15%,rgba(' + glowColor + ',0.03) 25%,rgba(' + glowColor + ',0.015) 40%,transparent 70%)'
    ].join(';');
    document.body.appendChild(spot);

    var proximity = spotlightRadius * 0.5;
    var fadeDistance = spotlightRadius * 0.75;
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

    function tick() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      spot.style.left = cx + 'px';
      spot.style.top = cy + 'px';
      if (Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5) raf = requestAnimationFrame(tick);
      else raf = null;
    }

    document.addEventListener('mousemove', function (e) {
      var cards = document.querySelectorAll('.glow-card');
      if (!cards.length) return;
      var minDistance = Infinity;
      cards.forEach(function (card) {
        var rect = card.getBoundingClientRect();
        var ccx = rect.left + rect.width / 2;
        var ccy = rect.top + rect.height / 2;
        var distance = Math.hypot(e.clientX - ccx, e.clientY - ccy) - Math.max(rect.width, rect.height) / 2;
        var eff = Math.max(0, distance);
        minDistance = Math.min(minDistance, eff);
        var gi = 0;
        if (eff <= proximity) gi = 1;
        else if (eff <= fadeDistance) gi = (fadeDistance - eff) / (fadeDistance - proximity);
        card.style.setProperty('--glow-x', ((e.clientX - rect.left) / rect.width) * 100 + '%');
        card.style.setProperty('--glow-y', ((e.clientY - rect.top) / rect.height) * 100 + '%');
        card.style.setProperty('--glow-intensity', gi.toString());
        card.style.setProperty('--glow-radius', spotlightRadius + 'px');
      });
      tx = e.clientX; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
      var op = minDistance <= proximity ? 0.8
        : minDistance <= fadeDistance ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8 : 0;
      spot.style.opacity = op;
    });

    document.addEventListener('mouseleave', function () {
      document.querySelectorAll('.glow-card').forEach(function (c) { c.style.setProperty('--glow-intensity', '0'); });
      spot.style.opacity = 0;
    });
  }

  window.AutoPilotSpotlight = initSpotlight;
})();
