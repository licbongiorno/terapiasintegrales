/* Terapias Integrales · interacciones y microanimaciones */
(() => {
  "use strict";
  const doc = document.documentElement;
  doc.classList.add("js");

  const WA_NUMBER = "5493515318080";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const waLink = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

  /* ---------- Toast ---------- */
  const toastEl = $(".toast");
  let toastTimer;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2600);
  };

  /* ---------- Header: sombra, ocultar al bajar, barra de progreso ---------- */
  const header = $(".header");
  const progress = $(".scroll-progress");
  let lastY = 0, ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    const max = doc.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    header.classList.toggle("is-scrolled", y > 8);
    const menuOpen = document.body.classList.contains("menu-open");
    header.classList.toggle("is-hidden", !menuOpen && y > 400 && y > lastY + 4);
    if (y < lastY - 4) header.classList.remove("is-hidden");
    lastY = y;
    ticking = false;
  };
  window.addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* ---------- Menú móvil (con gesto de deslizar para cerrar) ---------- */
  const toggle = $(".nav__toggle");
  const menu = $("#nav-menu");
  const backdrop = $(".nav__backdrop");
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    menu.classList.toggle("is-open", open);
    backdrop.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    if (open) $("a", menu).focus({ preventScroll: true });
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  backdrop.addEventListener("click", () => setMenu(false));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
  });
  let startX = null, dx = 0;
  menu.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; dx = 0; menu.style.transition = "none"; }, { passive: true });
  menu.addEventListener("touchmove", (e) => {
    if (startX === null) return;
    dx = Math.max(0, e.touches[0].clientX - startX);
    menu.style.transform = `translateX(${dx}px)`;
  }, { passive: true });
  menu.addEventListener("touchend", () => {
    menu.style.transition = ""; menu.style.transform = "";
    if (dx > 80) setMenu(false);
    startX = null;
  });

  /* ---------- Sección activa en la navegación ---------- */
  const navLinks = $$('.nav__links a[href^="#"]');
  const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => {
        const active = a.getAttribute("href") === `#${en.target.id}`;
        a.classList.toggle("is-active", active);
        active ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => spy.observe(s));

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Contadores ---------- */
  const counters = $$("[data-count]");
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target, end = +el.dataset.count;
      countIO.unobserve(el);
      if (reduceMotion) return;
      const t0 = performance.now(), dur = 1200;
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      el.textContent = "0";
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  counters.forEach((c) => countIO.observe(c));

  /* ---------- Ripple en botones ---------- */
  $$(".btn").forEach((btn) => {
    btn.addEventListener("pointerdown", (e) => {
      if (reduceMotion) return;
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      const span = document.createElement("span");
      span.className = "ripple";
      span.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      btn.appendChild(span);
      span.addEventListener("animationend", () => span.remove());
    });
  });

  if (finePointer && !reduceMotion) {
    /* ---------- Botones magnéticos ---------- */
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18;
        const y = (e.clientY - r.top - r.height / 2) * 0.28;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });

    /* ---------- Tarjetas con inclinación 3D + brillo que sigue al cursor ---------- */
    $$(".tilt").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", `${px * 100}%`);
        card.style.setProperty("--my", `${py * 100}%`);
        card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 8}deg) translateY(-6px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });

    /* ---------- Parallax suave en el hero ---------- */
    const blobs = $$(".blob");
    const hero = $(".hero");
    hero.addEventListener("pointermove", (e) => {
      const x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
      blobs.forEach((b, i) => { b.style.translate = `${x * (i + 1) * 24}px ${y * (i + 1) * 24}px`; });
    });
  }

  /* ---------- Acordeón animado (details/summary) ---------- */
  $$(".acc").forEach((det) => {
    const summary = $("summary", det), body = $(".acc__body", det);
    summary.addEventListener("click", (e) => {
      if (reduceMotion || !body.animate) return;
      e.preventDefault();
      if (det.open) {
        const h = body.offsetHeight;
        body.animate([{ height: `${h}px`, opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 300, easing: "ease" })
          .onfinish = () => { det.open = false; };
      } else {
        // Cerrar los demás (acordeón exclusivo)
        $$(".acc[open]").forEach((o) => { if (o !== det) o.open = false; });
        det.open = true;
        const h = body.offsetHeight;
        body.animate([{ height: "0px", opacity: 0 }, { height: `${h}px`, opacity: 1 }], { duration: 380, easing: "cubic-bezier(.22,1,.36,1)" });
      }
    });
  });

  /* ---------- Estado abierto / cerrado (hora de Argentina) ---------- */
  const status = $(".open-status");
  if (status) {
    try {
      const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Cordoba", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
      const get = (t) => parts.find((p) => p.type === t)?.value;
      const day = get("weekday"), mins = (+get("hour") % 24) * 60 + +get("minute");
      const weekday = !["Sat", "Sun"].includes(day);
      const open = weekday && mins >= 480 && mins < 1200;
      status.textContent = open ? "Abierto ahora" : "Cerrado ahora · escribinos y te respondemos";
      status.classList.add(open ? "is-open" : "is-closed");
    } catch (_) { /* sin estado */ }
  }

  /* ---------- Copiar número ---------- */
  $$("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); toast("Número copiado ✓"); }
    catch (_) { toast("No se pudo copiar. Número: 0351 531-8080"); }
  }));

  /* ---------- "Consultar" desde tarjetas: precarga la especialidad ---------- */
  const espSelect = $("#f-esp");
  const markSelect = () => espSelect.classList.toggle("has-value", !!espSelect.value);
  espSelect.addEventListener("change", markSelect);
  $$(".js-wa-topic").forEach((a) => a.addEventListener("click", () => {
    const topic = a.dataset.topic;
    const opt = [...espSelect.options].find((o) => o.text === topic);
    if (opt) { espSelect.value = opt.text; markSelect(); }
    setTimeout(() => $("#f-name").focus({ preventScroll: true }), 650);
  }));

  /* ---------- Formulario → WhatsApp ---------- */
  const form = $("#contacto");
  const msg = $("#f-msg"), counter = $(".field__count");
  msg.addEventListener("input", () => { counter.textContent = `${msg.value.length}/600`; });
  const setError = (input, text) => {
    const field = input.closest(".field");
    field.classList.toggle("is-invalid", !!text);
    $(".field__error", field).textContent = text || "";
    input.setAttribute("aria-invalid", text ? "true" : "false");
  };
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#f-name"), esp = espSelect, os = $("#f-os");
    let ok = true;
    if (name.value.trim().length < 2) { setError(name, "Contanos tu nombre, por favor."); ok = false; } else setError(name);
    if (!esp.value) { setError(esp, "Elegí una especialidad (o \"No estoy seguro/a\")."); ok = false; } else setError(esp);
    if (!ok) { $(".is-invalid input, .is-invalid select", form)?.focus(); return; }

    const lines = [
      "Hola Terapias Integrales, quisiera hacer una consulta por un turno.",
      `• Nombre: ${name.value.trim()}`,
      `• Especialidad: ${esp.value}`,
      os.value.trim() && `• Obra social: ${os.value.trim()}`,
      msg.value.trim() && `• Mensaje: ${msg.value.trim()}`,
    ].filter(Boolean);
    window.open(waLink(lines.join("\n")), "_blank", "noopener");
    toast("Abriendo WhatsApp…");
  });
  ["#f-name", "#f-esp"].forEach((s) => $(s).addEventListener("input", (e) => {
    if (e.target.closest(".field").classList.contains("is-invalid")) setError(e.target);
  }));

  /* ---------- Burbuja del botón flotante ---------- */
  const wa = $(".wa-float");
  setTimeout(() => {
    wa.classList.add("show-tip");
    setTimeout(() => wa.classList.remove("show-tip"), 5000);
  }, 4000);

  /* ---------- Logo animado: se arma figura por figura ---------- */
  const build = (svg) => { svg.classList.remove("is-built"); void svg.getBoundingClientRect(); svg.classList.add("is-built"); };
  const headerLogo = $(".header .lm"), heroLogo = $(".lm--hero"), footerLogo = $(".lm--footer");
  const buildPage = () => { build(headerLogo); build(heroLogo); };

  const footIO = new IntersectionObserver((en) => {
    if (en[0].isIntersecting) { build(footerLogo); footIO.disconnect(); }
  }, { threshold: 0.5 });
  footIO.observe(footerLogo);

  // Gesto: tocar el logo grande lo vuelve a armar
  heroLogo.addEventListener("click", () => build(heroLogo));

  const splash = $(".splash");
  let seen = false;
  try { seen = sessionStorage.getItem("ti-splash") === "1"; } catch (_) { /* sin storage */ }
  if (!reduceMotion && !seen) {
    try { sessionStorage.setItem("ti-splash", "1"); } catch (_) { /* sin storage */ }
    splash.classList.add("is-on");
    document.body.classList.add("splash-lock");
    let done = false;
    const close = () => {
      if (done) return; done = true;
      splash.classList.add("is-out");
      document.body.classList.remove("splash-lock");
      buildPage();
      setTimeout(() => splash.remove(), 700);
    };
    requestAnimationFrame(() => requestAnimationFrame(() => {
      splash.classList.add("is-play");
      build($(".lm", splash));
    }));
    setTimeout(close, 2600);
    splash.addEventListener("click", close);
    document.addEventListener("keydown", close, { once: true });
  } else {
    splash.remove();
    buildPage();
  }

  /* ---------- Año del footer ---------- */
  $("#year").textContent = new Date().getFullYear();
})();
