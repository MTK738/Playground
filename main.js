(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Canvas particle network ---------- */

  function initParticles() {
    const canvas = document.getElementById("bg-canvas");
    if (!canvas || prefersReducedMotion) return;
    const ctx = canvas.getContext("2d");
    let width, height, particles;
    const mouse = { x: null, y: null };

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      const count = Math.min(90, Math.floor((width * height) / 18000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
      }));
    }

    function step() {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        if (mouse.x !== null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 140) {
            const force = (140 - dist) / 140;
            p.x += (dx / dist) * force * 1.2;
            p.y += (dy / dist) * force * 1.2;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 240, 255, 0.55)";
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(123, 91, 255, ${(1 - dist / 120) * 0.35})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(step);
    }

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    window.addEventListener("mouseleave", () => {
      mouse.x = null;
      mouse.y = null;
    });

    resize();
    requestAnimationFrame(step);
  }

  /* ---------- Cursor glow ---------- */

  function initCursorGlow() {
    const glow = document.querySelector(".cursor-glow");
    if (!glow || prefersReducedMotion) return;
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let cx = tx, cy = ty;

    window.addEventListener("mousemove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
    });

    function animate() {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      glow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(animate);
    }
    animate();
  }

  /* ---------- Text scramble effect ---------- */

  class TextScramble {
    constructor(el) {
      this.el = el;
      this.chars = "!<>-_\\/[]{}—=+*^?#________";
      this.frame = 0;
      this.queue = [];
      this.resolve = null;
      this.update = this.update.bind(this);
    }
    setText(newText) {
      const oldText = this.el.textContent;
      const length = Math.max(oldText.length, newText.length);
      this.queue = [];
      for (let i = 0; i < length; i++) {
        const from = oldText[i] || "";
        const to = newText[i] || "";
        const start = Math.floor(Math.random() * 20);
        const end = start + Math.floor(Math.random() * 20);
        this.queue.push({ from, to, start, end });
      }
      cancelAnimationFrame(this.frameRequest);
      this.frame = 0;
      this.update();
      return new Promise((resolve) => (this.resolve = resolve));
    }
    update() {
      let output = "";
      let complete = 0;
      for (let i = 0; i < this.queue.length; i++) {
        const { from, to, start, end, char } = this.queue[i];
        if (this.frame >= end) {
          complete++;
          output += to;
        } else if (this.frame >= start) {
          if (!char || Math.random() < 0.28) {
            const newChar = this.chars[Math.floor(Math.random() * this.chars.length)];
            this.queue[i].char = newChar;
          }
          output += `<span class="scramble-char">${this.queue[i].char}</span>`;
        } else {
          output += from;
        }
      }
      this.el.innerHTML = output;
      if (complete === this.queue.length) {
        this.resolve();
      } else {
        this.frameRequest = requestAnimationFrame(this.update);
        this.frame++;
      }
    }
  }

  function initScramble() {
    const els = document.querySelectorAll(".scramble");
    els.forEach((el) => {
      const text = el.dataset.text || el.textContent;
      if (prefersReducedMotion) {
        el.textContent = text;
        return;
      }
      const fx = new TextScramble(el);
      fx.setText(text);
    });
  }

  /* ---------- Terminal boot log ---------- */

  function initTerminal() {
    const body = document.getElementById("terminal-body");
    if (!body) return;

    const lines = [
      { prompt: "$ ", text: "npm init hello-world" },
      { prompt: "> ", text: "Installing dependencies... 0 gefunden." },
      { prompt: "> ", text: "Rendering greeting..." },
      { prompt: "> ", text: "Status: ONLINE ✓", cls: "ok" },
      { prompt: "$ ", text: "echo \"Willkommen auf dieser Seite.\"" },
    ];

    if (prefersReducedMotion) {
      body.innerHTML = lines
        .map((l) => `<div><span class="prompt">${l.prompt}</span>${l.text}</div>`)
        .join("");
      return;
    }

    let started = false;

    async function typeLine(line) {
      const row = document.createElement("div");
      const promptSpan = document.createElement("span");
      promptSpan.className = "prompt";
      promptSpan.textContent = line.prompt;
      row.appendChild(promptSpan);
      const textNode = document.createElement("span");
      if (line.cls) textNode.className = line.cls;
      row.appendChild(textNode);
      const caret = document.createElement("span");
      caret.className = "caret";
      row.appendChild(caret);
      body.appendChild(row);

      for (const ch of line.text) {
        textNode.textContent += ch;
        await new Promise((r) => setTimeout(r, 18 + Math.random() * 30));
      }
      caret.remove();
      await new Promise((r) => setTimeout(r, 250));
    }

    async function run() {
      if (started) return;
      started = true;
      for (const line of lines) {
        await typeLine(line);
      }
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          run();
          observer.disconnect();
        }
      });
    }, { threshold: 0.4 });
    observer.observe(document.getElementById("terminal"));
  }

  /* ---------- Scroll reveal ---------- */

  function initReveal() {
    document.body.classList.add("reveal-ready");
    const items = document.querySelectorAll("[data-reveal]");
    if (prefersReducedMotion) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach((el) => observer.observe(el));
  }

  /* ---------- Card tilt on hover ---------- */

  function initTilt() {
    if (prefersReducedMotion) return;
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(600px) rotateX(${-py * 8}deg) rotateY(${px * 8}deg) translateY(-4px)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }

  /* ---------- Count-up stats ---------- */

  function initCounters() {
    const nums = document.querySelectorAll(".stat-num");
    const animate = (el) => {
      const target = parseInt(el.dataset.count, 10);
      if (prefersReducedMotion) {
        el.textContent = target;
        return;
      }
      const duration = 1400;
      const startTime = performance.now();
      function tick(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target;
      }
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    nums.forEach((el) => observer.observe(el));
  }

  /* ---------- GSAP parallax on hero (progressive enhancement) ---------- */

  function initParallax() {
    if (prefersReducedMotion || typeof gsap === "undefined") return;
    gsap.to(".hero-title", {
      yPercent: 15,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }

  initParticles();
  initCursorGlow();
  initScramble();
  initTerminal();
  initReveal();
  initTilt();
  initCounters();
  initParallax();

  console.log(
    "%cHello, World.%c\nNeugierig, wie diese Seite gebaut ist? → https://github.com/MTK738/Playground",
    "color:#00f0ff;font-size:20px;font-weight:bold;font-family:monospace",
    "color:#9aa0b4;font-family:monospace"
  );
})();
