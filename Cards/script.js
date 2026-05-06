(() => {
  const hero = document.getElementById("hero3d");
  const orbit = document.getElementById("orbit");
  const particleLayer = document.getElementById("particleLayer");
  const cards = Array.from(document.querySelectorAll(".orbit-card"));
  if (!hero || !orbit || !particleLayer || cards.length === 0) return;

  let heroRect = hero.getBoundingClientRect();
  let orbitPaused = false;
  let orbitRotationDeg = 0;
  let lastTs = 0;
  const ORBIT_SECONDS_PER_ROTATION = 26;
  const ORBIT_DEG_PER_SECOND = 360 / ORBIT_SECONDS_PER_ROTATION;

  function placeCards() {
    const cardRadius = Math.min(heroRect.width * 0.39, 410);
    const zDepth = -Math.min(heroRect.width * 0.03, 28);

    cards.forEach((card) => {
      const baseAngle = Number(card.style.getPropertyValue("--angle-deg")) || Number(card.dataset.angle || 0);
      const angle = baseAngle + orbitRotationDeg;
      card.style.transform = [
        "translate(-50%, -50%)",
        `rotateZ(${angle}deg)`,
        `translateX(${cardRadius}px)`,
        `rotateZ(${-angle}deg)`,
        "rotateX(-65deg)",
        `translateZ(${zDepth}px)`,
        "scale(0.98)"
      ].join(" ");
    });
  }

  function hydrateAngles() {
    cards.forEach((card, idx) => {
      const angle = idx * 60;
      card.dataset.angle = String(angle);
      card.style.setProperty("--angle-deg", String(angle));
    });
  }

  function createParticles() {
    const count = Math.max(18, Math.floor(heroRect.width / 52));
    particleLayer.innerHTML = "";

    for (let i = 0; i < count; i += 1) {
      const dot = document.createElement("span");
      dot.className = "particle";
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const size = 1.5 + Math.random() * 3.8;
      const dx = -36 + Math.random() * 72;
      const dy = -120 - Math.random() * 180;
      const duration = 7 + Math.random() * 9;
      const delay = -Math.random() * 10;

      dot.style.left = `${left}%`;
      dot.style.top = `${top}%`;
      dot.style.setProperty("--size", `${size}px`);
      dot.style.setProperty("--dx", `${dx}px`);
      dot.style.setProperty("--dy", `${dy}px`);
      dot.style.setProperty("--duration", `${duration}s`);
      dot.style.setProperty("--delay", `${delay}s`);
      particleLayer.appendChild(dot);
    }
  }

  function setOrbitPause(state) {
    orbitPaused = state;
  }

  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      setOrbitPause(true);
      const base = card.style.transform || "";
      card.dataset.baseTransform = base;
      card.style.transform = `${base} scale(1.08)`;
      card.style.zIndex = "20";
    });

    card.addEventListener("mouseleave", () => {
      setOrbitPause(false);
      if (card.dataset.baseTransform) {
        card.style.transform = card.dataset.baseTransform;
      }
      card.style.zIndex = "1";
    });
  });

  function recalc() {
    heroRect = hero.getBoundingClientRect();
    placeCards();
    createParticles();
  }

  function animate(ts) {
    if (!lastTs) lastTs = ts;
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;

    if (!orbitPaused) {
      orbitRotationDeg = (orbitRotationDeg + ORBIT_DEG_PER_SECOND * dt) % 360;
      placeCards();
    }
    requestAnimationFrame(animate);
  }

  hydrateAngles();
  recalc();
  window.addEventListener("resize", recalc);
  requestAnimationFrame(animate);
})();
