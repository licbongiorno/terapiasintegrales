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
  // Envía eventos a la analítica si está instalada (GA4 / Plausible); si no, no hace nada.
  const track = (name, params = {}) => {
    try {
      if (typeof window.gtag === "function") window.gtag("event", name, params);
      if (typeof window.plausible === "function") window.plausible(name, { props: params });
    } catch (_) { /* sin analítica */ }
  };

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
    if (hero) hero.addEventListener("pointermove", (e) => {
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

  /* ---------- Utilidades de formularios ---------- */
  const markSelect = () => $$(".field select").forEach((sel) => sel.classList.toggle("has-value", !!sel.value));
  $$(".field select").forEach((sel) => sel.addEventListener("change", markSelect));
  const setError = (input, text) => {
    const field = input.closest(".field");
    field.classList.toggle("is-invalid", !!text);
    $(".field__error", field).textContent = text || "";
    input.setAttribute("aria-invalid", text ? "true" : "false");
  };
  const clearOnInput = (...sels) => sels.forEach((s) => $(s)?.addEventListener("input", (e) => {
    if (e.target.closest(".field").classList.contains("is-invalid")) setError(e.target);
  }));

  /* ---------- Formulario de contacto → WhatsApp ---------- */
  const form = $("#contacto");
  const espSelect = $("#f-esp");
  if (form && espSelect) {
    // "Consultar" desde tarjetas: precarga la especialidad
    $$(".js-wa-topic").forEach((a) => a.addEventListener("click", () => {
      const opt = [...espSelect.options].find((o) => o.text === a.dataset.topic);
      if (opt) { espSelect.value = opt.text; markSelect(); }
      setTimeout(() => $("#f-name").focus({ preventScroll: true }), 650);
    }));
    const msg = $("#f-msg"), counter = $(".field__count");
    msg.addEventListener("input", () => { counter.textContent = `${msg.value.length}/600`; });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#f-name"), os = $("#f-os");
      let ok = true;
      if (name.value.trim().length < 2) { setError(name, "Contanos tu nombre, por favor."); ok = false; } else setError(name);
      if (!espSelect.value) { setError(espSelect, "Elegí una especialidad (o \"No estoy seguro/a\")."); ok = false; } else setError(espSelect);
      if (!ok) { $(".is-invalid input, .is-invalid select", form)?.focus(); return; }
      const lines = [
        "Hola Terapias Integrales, quisiera hacer una consulta por un turno.",
        `• Nombre: ${name.value.trim()}`,
        `• Especialidad: ${espSelect.value}`,
        os.value.trim() && `• Obra social: ${os.value.trim()}`,
        msg.value.trim() && `• Mensaje: ${msg.value.trim()}`,
      ].filter(Boolean);
      track("whatsapp_form", { form: "contacto", especialidad: espSelect.value });
      window.open(waLink(lines.join("\n")), "_blank", "noopener");
      toast("Abriendo WhatsApp…");
    });
    clearOnInput("#f-name", "#f-esp");
  }

  /* ---------- Trabajá con nosotros: chips + postulación ---------- */
  const profSelect = $("#j-prof");
  const joinForm = $("#postulacion");
  if (profSelect && joinForm) {
    const chips = $$(".chip");
    const syncChips = () => chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.prof === profSelect.value)));
    syncChips();
    chips.forEach((chip) => chip.addEventListener("click", () => {
      profSelect.value = chip.dataset.prof;
      markSelect(); syncChips();
      if (profSelect.closest(".field").classList.contains("is-invalid")) setError(profSelect);
      if (window.matchMedia("(max-width: 959px)").matches) {
        joinForm.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        setTimeout(() => $("#j-name").focus({ preventScroll: true }), 600);
      }
    }));
    profSelect.addEventListener("change", syncChips);
    joinForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#j-name"), mat = $("#j-mat"), jmsg = $("#j-msg");
      let ok = true;
      if (name.value.trim().length < 2) { setError(name, "Contanos tu nombre, por favor."); ok = false; } else setError(name);
      if (!profSelect.value) { setError(profSelect, "Elegí tu profesión."); ok = false; } else setError(profSelect);
      if (!ok) { $(".is-invalid input, .is-invalid select", joinForm)?.focus(); return; }
      const lines = [
        "Hola Terapias Integrales, me gustaría sumarme al equipo.",
        `• Nombre: ${name.value.trim()}`,
        `• Profesión: ${profSelect.value}`,
        mat.value.trim() && `• Matrícula: ${mat.value.trim()}`,
        jmsg.value.trim() && `• Experiencia / disponibilidad: ${jmsg.value.trim()}`,
        "Les envío mi CV a continuación.",
      ].filter(Boolean);
      track("whatsapp_form", { form: "postulacion", profesion: profSelect.value });
      window.open(waLink(lines.join("\n")), "_blank", "noopener");
      toast("Abriendo WhatsApp… ¡No olvides adjuntar tu CV!");
    });
    clearOnInput("#j-name", "#j-prof");
  }

  /* ---------- Orientador: ¿Qué especialidad necesito? ---------- */
  const quiz = $("#orientador");
  if (quiz) {
    const SPECS = {
      psico: { name: "Psicología", url: "psicologia-alta-gracia/", why: "acompañamiento emocional, conducta y vínculos" },
      fono: { name: "Fonoaudiología", url: "fonoaudiologia-alta-gracia/", why: "habla, lenguaje, comunicación y audición" },
      psp: { name: "Psicopedagogía", url: "psicopedagogia-alta-gracia/", why: "aprendizaje, atención y rendimiento escolar" },
      motor: { name: "Psicomotricidad", url: "psicomotricidad-alta-gracia/", why: "desarrollo motor, juego y coordinación" },
      kine: { name: "Kinesiología", url: "kinesiologia-alta-gracia/", why: "dolor, lesiones, postura y rehabilitación" },
      nutri: { name: "Nutrición", url: "nutricion-alta-gracia/", why: "alimentación, hábitos y peso saludable" },
      integ: { name: "Integración escolar", url: "integracion-escolar-alta-gracia/", why: "apoyo en la escuela y adaptaciones" },
      at: { name: "Acompañamiento terapéutico", url: "acompanamiento-terapeutico-alta-gracia/", why: "autonomía e inclusión en la vida diaria" },
    };
    const state = { age: null, concerns: new Set(), school: null };
    const steps = $$(".quiz__step", quiz);
    const bar = $(".quiz__bar span", quiz);
    const count = $(".quiz__count", quiz);
    const back = $(".quiz__back", quiz);
    const next = $(".quiz__next", quiz);
    let cur = 0;

    const canGo = () => (cur === 0 ? !!state.age : cur === 1 ? state.concerns.size > 0 : cur === 2 ? !!state.school : true);
    const show = (i, dir = 1) => {
      const prev = steps[cur];
      cur = i;
      steps.forEach((st, k) => { st.hidden = k !== i; });
      if (!reduceMotion && steps[i].animate && prev !== steps[i]) {
        steps[i].animate([{ opacity: 0, transform: `translateX(${dir * 40}px)` }, { opacity: 1, transform: "none" }], { duration: 450, easing: "cubic-bezier(.22,1,.36,1)" });
      }
      const total = steps.length - 1;
      bar.style.transform = `scaleX(${Math.min(i, total) / total})`;
      count.textContent = i < total ? `Paso ${i + 1} de ${total}` : "¡Listo!";
      back.hidden = i === 0 || i === total;
      next.hidden = i === total;
      next.disabled = !canGo();
      next.textContent = i === total - 1 ? "Ver recomendación" : "Siguiente";
      const h = $("legend, h3", steps[i]);
      if (h && i > 0) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    };

    $$(".opt", quiz).forEach((opt) => opt.addEventListener("click", () => {
      const group = opt.dataset.group, val = opt.dataset.value;
      if (group === "concerns") {
        state.concerns.has(val) ? state.concerns.delete(val) : state.concerns.add(val);
        opt.setAttribute("aria-pressed", String(state.concerns.has(val)));
      } else {
        state[group] = val;
        $$(`.opt[data-group="${group}"]`, quiz).forEach((o) => o.setAttribute("aria-pressed", String(o === opt)));
        // Avance automático en preguntas de una sola respuesta
        setTimeout(() => { if (steps[cur].contains(opt)) go(1); }, 280);
      }
      next.disabled = !canGo();
    }));

    const recommend = () => {
      const score = {};
      const add = (k, n = 1) => { score[k] = (score[k] || 0) + n; };
      const map = {
        habla: ["fono"], audicion: ["fono"], emociones: ["psico"], conducta: ["psico", "psp"],
        aprendizaje: ["psp"], atencion: ["psp", "psico"], movimiento: ["motor", "kine"], dolor: ["kine"],
        alimentacion: ["nutri"], autonomia: ["at", "motor"], desarrollo: ["motor", "fono"],
      };
      state.concerns.forEach((c) => (map[c] || []).forEach((k, idx) => add(k, idx === 0 ? 3 : 1)));
      if (state.age === "bebe" || state.age === "nino") { add("motor", score.motor ? 1 : 0); }
      if (state.age === "adulto" || state.age === "mayor") { delete score.motor; delete score.integ; }
      if (state.school === "si") add("integ", 3);
      let keys = Object.keys(score).sort((a, b) => score[b] - score[a]).slice(0, 3);
      if (!keys.length) keys = ["psico"];
      return keys;
    };
    const ageText = { bebe: "un bebé (0 a 3 años)", nino: "un niño/a (3 a 12 años)", adolescente: "un/a adolescente", adulto: "una persona adulta", mayor: "un adulto mayor" };
    const concernText = {
      habla: "habla o lenguaje", audicion: "audición", emociones: "emociones o ansiedad", conducta: "conducta o vínculos",
      aprendizaje: "aprendizaje o escuela", atencion: "atención o concentración", movimiento: "movimiento o coordinación",
      dolor: "dolor, lesión o postura", alimentacion: "alimentación o peso", autonomia: "autonomía en la vida diaria", desarrollo: "desarrollo madurativo",
    };
    const result = () => {
      const keys = recommend();
      const list = $(".quiz__result-list", quiz);
      list.innerHTML = keys.map((k, i) => `
        <li class="rec" style="--d:${i}">
          <span class="rec__rank">${i === 0 ? "Recomendado" : "También puede ayudar"}</span>
          <strong>${SPECS[k].name}</strong>
          <span>${SPECS[k].why}</span>
          <a href="${SPECS[k].url}">Conocer más →</a>
        </li>`).join("");
      const text = [
        "Hola Terapias Integrales, usé el orientador de la web.",
        `• Consulta para: ${ageText[state.age]}`,
        `• Me preocupa: ${[...state.concerns].map((c) => concernText[c]).join(", ")}`,
        state.school === "si" ? "• Necesitaría apoyo en la escuela" : null,
        `• Sugerencia: ${keys.map((k) => SPECS[k].name).join(", ")}`,
        "¿Podrían orientarme para pedir un turno?",
      ].filter(Boolean).join("\n");
      $(".quiz__wa", quiz).href = waLink(text);
      track("orientador_resultado", { recomendado: SPECS[keys[0]].name });
    };
    const go = (d) => {
      if (d > 0 && !canGo()) return;
      const n = Math.max(0, Math.min(steps.length - 1, cur + d));
      if (n === steps.length - 1) result();
      show(n, d);
    };
    next.addEventListener("click", () => go(1));
    back.addEventListener("click", () => go(-1));
    $(".quiz__restart", quiz).addEventListener("click", () => {
      state.age = null; state.school = null; state.concerns.clear();
      $$(".opt", quiz).forEach((o) => o.setAttribute("aria-pressed", "false"));
      show(0, -1);
    });
    // Gesto: deslizar a la izquierda / derecha para avanzar o volver
    let sx = null;
    quiz.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    quiz.addEventListener("touchend", (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 70) go(dx < 0 ? 1 : -1);
    });
    show(0);
  }

  /* ---------- Mapa: se carga solo al tocarlo (más liviano y privado) ---------- */
  $$(".map-facade").forEach((btn) => btn.addEventListener("click", () => {
    const iframe = document.createElement("iframe");
    iframe.title = "Mapa: Terapias Integrales, Deán Funes 56, Alta Gracia";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.src = btn.dataset.src;
    iframe.className = "map__iframe";
    btn.parentElement.classList.add("is-loaded");
    btn.replaceWith(iframe);
    track("mapa_abierto");
  }));

  /* ---------- Compartir (Web Share API, con copia de enlace como alternativa) ---------- */
  $$(".js-share").forEach((b) => b.addEventListener("click", async () => {
    const data = { title: document.title, text: "Terapias Integrales · Centro interdisciplinario en Alta Gracia", url: location.href.split("#")[0] };
    try {
      if (navigator.share) { await navigator.share(data); track("compartir"); }
      else { await navigator.clipboard.writeText(data.url); toast("Enlace copiado ✓"); }
    } catch (_) { /* cancelado */ }
  }));

  /* ---------- Medición de clics en WhatsApp / teléfono (si hay analítica) ---------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href*="wa.me/549351531"], a[href^="tel:"]');
    if (a) track(a.href.startsWith("tel:") ? "click_telefono" : "click_whatsapp", { ubicacion: a.className || "link" });
  });

  /* ---------- Burbuja del botón flotante ---------- */
  const wa = $(".wa-float");
  if (wa) setTimeout(() => {
    wa.classList.add("show-tip");
    setTimeout(() => wa.classList.remove("show-tip"), 5000);
  }, 4000);

  /* ---------- Logo animado: se arma figura por figura ---------- */
  const build = (svg) => { if (!svg) return; svg.classList.remove("is-built"); void svg.getBoundingClientRect(); svg.classList.add("is-built"); };
  const headerLogo = $(".header .lm"), heroLogo = $(".lm--hero"), footerLogo = $(".lm--footer");
  const buildPage = () => { build(headerLogo); build(heroLogo); };

  if (footerLogo) {
    const footIO = new IntersectionObserver((en) => {
      if (en[0].isIntersecting) { build(footerLogo); footIO.disconnect(); }
    }, { threshold: 0.5 });
    footIO.observe(footerLogo);
  }
  // Gesto: tocar el logo grande lo vuelve a armar
  heroLogo?.addEventListener("click", () => build(heroLogo));

  const splash = $(".splash");
  let seen = false;
  try { seen = sessionStorage.getItem("ti-splash") === "1"; } catch (_) { /* sin storage */ }
  if (splash && !reduceMotion && !seen) {
    try { sessionStorage.setItem("ti-splash", "1"); } catch (_) { /* sin storage */ }
    splash.classList.add("is-on");
    document.body.classList.add("splash-lock");
    let done = false;
    const close = () => {
      if (done) return; done = true;
      splash.classList.add("is-out");
      document.body.classList.remove("splash-lock");
      buildPage();
      setTimeout(() => splash.remove(), 600);
    };
    requestAnimationFrame(() => requestAnimationFrame(() => {
      splash.classList.add("is-play");
      build($(".lm", splash));
    }));
    setTimeout(close, 1500);
    splash.addEventListener("click", close);
    document.addEventListener("keydown", close, { once: true });
  } else {
    splash?.remove();
    buildPage();
  }

  /* ---------- Año del footer ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();
