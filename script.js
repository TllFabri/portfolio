// ===== Tema claro/escuro (lembra a escolha do visitante) =====
const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");

function getSavedTheme() {
  try {
    return localStorage.getItem("theme");
  } catch {
    return null;
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // sem armazenamento disponível: só não lembra a escolha
  }
}

const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
root.dataset.theme = getSavedTheme() || (prefersLight ? "light" : "dark");

themeToggle.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  saveTheme(next);
});

// ===== Abertura com quadradinhos =====
function playIntro() {
  // quem prefere menos animação vê a página direto
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.classList.remove("intro-loading");
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const size = width < 600 ? 50 : 80; // tamanho aproximado de cada quadradinho
  const cols = Math.ceil(width / size);
  const rows = Math.ceil(height / size);
  const tileW = width / cols;
  const tileH = height / rows;

  const intro = document.createElement("div");
  intro.className = "intro";
  intro.setAttribute("aria-hidden", "true");

  // canvas na resolução real da tela (fica nítido em celular e em zoom de 125%/150%)
  const canvas = document.createElement("canvas");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.ceil(width * dpr);
  canvas.height = Math.ceil(height * dpr);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  intro.appendChild(canvas);

  const logo = document.createElement("div");
  logo.className = "intro__logo";
  logo.innerHTML = "&lt;tfabri<span>.dev</span>/&gt;";
  intro.appendChild(logo);

  // cores vêm do tema atual (claro ou escuro)
  const styles = getComputedStyle(root);
  const colors = {
    tile: styles.getPropertyValue("--bg-alt").trim(),
    line: styles.getPropertyValue("--border").trim(),
    accent: styles.getPropertyValue("--accent").trim(),
  };

  // cada quadradinho começa a sumir depois de um atraso: do centro para as bordas
  const centerX = (cols - 1) / 2;
  const centerY = (rows - 1) / 2;
  const maxDist = Math.hypot(centerX, centerY) || 1;
  const tiles = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      tiles.push({
        x: col * tileW + tileW / 2,
        y: row * tileH + tileH / 2,
        delay: 0.6 + (Math.hypot(col - centerX, row - centerY) / maxDist) * 0.6,
        accent: Math.random() < 0.07,
      });
    }
  }

  const DURATION = 0.5; // segundos que cada quadradinho leva para sumir
  const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

  // desenha todos os quadradinhos no instante t (em segundos); devolve false quando acabou
  function draw(t) {
    ctx.clearRect(0, 0, width, height);
    let alive = false;

    for (const tile of tiles) {
      const p = Math.min(Math.max((t - tile.delay) / DURATION, 0), 1);
      if (p === 1) continue;
      alive = true;

      const e = easeInOut(p);
      const w = tileW * (1 - e);
      const h = tileH * (1 - e);

      ctx.save();
      ctx.globalAlpha = 1 - e;
      ctx.translate(tile.x, tile.y);
      ctx.rotate((e * Math.PI) / 4);

      // +1px de sobra em quadradinho parado: cobre qualquer fresta entre vizinhos
      const pad = p === 0 ? 0.5 : 0;
      ctx.fillStyle = tile.accent ? colors.accent : colors.tile;
      ctx.fillRect(-w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2);

      // linha da grade (direita e embaixo) só nos quadradinhos escuros
      if (!tile.accent) {
        ctx.fillStyle = colors.line;
        ctx.fillRect(w / 2 - 1, -h / 2, 1, h);
        ctx.fillRect(-w / 2, h / 2 - 1, w, 1);
      }
      ctx.restore();
    }
    return alive;
  }

  draw(0); // tela coberta antes de mostrar a página
  document.body.prepend(intro);
  root.classList.remove("intro-loading");

  // espera a fonte do logo carregar (no máximo 0,5s) para o texto não "pular" no meio da animação
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const timeout = new Promise((resolve) => setTimeout(resolve, 500));

  Promise.race([fontsReady, timeout]).then(() => {
    intro.classList.add("play");
    const start = performance.now();

    function frame(now) {
      if (draw((now - start) / 1000)) {
        requestAnimationFrame(frame);
      } else {
        intro.remove();
      }
    }
    requestAnimationFrame(frame);
  });
}

playIntro();

// ===== Menu mobile =====
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");

function setMenu(open) {
  navMenu.classList.toggle("open", open);
  navToggle.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", open);
}

navToggle.addEventListener("click", () => setMenu(!navMenu.classList.contains("open")));
navMenu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));

// ===== Idioma (PT/EN) =====
// O texto em português fica no próprio HTML; aqui só ficam as traduções para inglês.
const translations = {
  en: {
    "nav.about": "About",
    "nav.projects": "Projects",
    "nav.experience": "Experience",
    "nav.skills": "Skills",
    "nav.education": "Education",
    "nav.contact": "Contact",

    "hero.tag": "Hello, world! I'm",
    "hero.desc":
      "Systems Analysis and Development student focused on <strong>backend with Java and Spring Boot</strong>. I build REST APIs with relational databases and enjoy turning data into useful solutions.",
    "hero.btnProjects": "See projects",
    "hero.btnContact": "Get in touch",
    "hero.btnCv": "📄 Download résumé",
    "hero.location": "📍 Juiz de Fora, Brazil · open to on-site or remote internships",

    "about.title": "About me",
    "about.p1":
      "I'm a <strong>4th-semester Systems Analysis and Development student at Universidade Estácio de Sá</strong>, specializing in backend development. I build layered REST APIs with relational database persistence, and I've built a credit risk analysis system using public data from Brazil's Federal Revenue Service.",
    "about.p2":
      "I currently work in the credit industry, which has given me a good understanding of how the business works and how clear communication makes a difference when solving problems.",
    "about.p3":
      "I'm looking for a <strong>backend internship</strong>, on-site in Juiz de Fora or remote, to keep learning and contribute to a real team.",
    "about.stat1": "semester of college",
    "about.stat2": "published projects",
    "about.stat3": "languages studied",
    "about.stat4": "expected graduation",

    "projects.title": "Projects",
    "projects.all": "All",
    "projects.more": "See all my repositories at",
    "p1.title": "Credit Risk Analysis",
    "p1.sub": "CNPJ Lookup",
    "p1.li1":
      "Company lookup by CNPJ (Brazilian company ID), view of the partners and managers board (QSA) and identification of corporate links.",
    "p1.li2":
      "Processing of Federal Revenue public data with Python and persistence in PostgreSQL, consumed by a web interface.",
    "p1.li3": "Documented with scope, functional requirements and task tracking on Trello.",
    "p2.sub": "Forum REST API · in progress",
    "p2.li1": "API with users, posts and comments, organized in layers (controller, service, repository) and DTOs.",
    "p2.li2": "User registration with Spring Security and persistence with Spring Data JPA.",
    "p3.sub": "Handmade Products Catalog",
    "p3.li1": "Digital catalog to create, edit and view products, promoting the work of local artisans.",
    "p4.sub": "Business Website",
    "p4.li1": "Responsive website for an artisan coffee shop with brand presentation, full menu and location.",

    "exp.title": "Experience",
    "exp0.date": "project-based",
    "exp0.role": "Freelance Web Developer",
    "exp0.org": "Local businesses",
    "exp0.desc":
      "Freelance projects for local businesses: building responsive websites, understanding each client's needs and delivering a published, ready-to-use solution.",
    "exp1.date": "Jun 2026 – present",
    "exp1.role": "Telemarketing Agent",
    "exp1.desc":
      "Customer service at a credit company, answering questions and logging requests in a structured way in the system, focusing on clear communication and problem solving.",
    "exp2.date": "Oct 2025 – Jun 2026",
    "exp2.role": "Baker Assistant",
    "exp2.desc":
      "Supported production, kept the workspace organized and controlled ingredients, developing discipline, punctuality and teamwork.",

    "skills.title": "Skills",
    "skills.lang": "Languages",
    "skills.frameworks": "Frameworks & libraries",
    "skills.backend": "Backend & data",
    "skills.fundamentals": "Fundamentals",
    "skills.oop": "OOP",
    "skills.ds": "Data Structures",
    "skills.logic": "Programming Logic",
    "skills.tools": "Tools",
    "skills.languages": "Spoken languages",
    "skills.pt": "Portuguese · native",
    "skills.en": "English · basic (technical documentation)",

    "edu.title": "Education & courses",
    "edu.course": "Systems Analysis and Development",
    "edu.desc": "Undergraduate, in progress (4th semester) · Evening classes · Expected graduation: December 2027",

    "contact.title": "Contact",
    "contact.btnCv": "📄 Résumé (PDF)",
    "contact.text": "I'm open to backend internship opportunities. Feel free to send me a message!",

    "footer.rights": "All rights reserved.",
    "footer.top": "↑ top",
  },
};

const typedPhrases = {
  pt: ["Desenvolvedor Backend Java", "Spring Boot & APIs REST", "Estudante de ADS", "Buscando estágio 🚀"],
  en: ["Backend Java Developer", "Spring Boot & REST APIs", "Systems Development Student", "Looking for an internship 🚀"],
};

const uiTexts = {
  pt: {
    title: "Thiago Fabri | Desenvolvedor Backend Java",
    copied: "E-mail copiado! ✔",
    langLabel: "Switch to English",
    themeLabel: "Alternar tema claro/escuro",
    menuLabel: "Abrir menu",
    topLabel: "Voltar ao topo",
  },
  en: {
    title: "Thiago Fabri | Backend Java Developer",
    copied: "Email copied! ✔",
    langLabel: "Mudar para português",
    themeLabel: "Toggle light/dark theme",
    menuLabel: "Open menu",
    topLabel: "Back to top",
  },
};

// guarda o português original de cada elemento para poder voltar
const i18nElements = document.querySelectorAll("[data-i18n]");
i18nElements.forEach((el) => (el.dataset.pt = el.innerHTML));

let currentLang = "pt";

function setLanguage(lang) {
  currentLang = lang;
  root.lang = lang === "pt" ? "pt-BR" : "en";

  i18nElements.forEach((el) => {
    el.innerHTML = lang === "pt" ? el.dataset.pt : translations.en[el.dataset.i18n] ?? el.dataset.pt;
  });

  const ui = uiTexts[lang];
  document.title = ui.title;
  langToggle.setAttribute("aria-label", ui.langLabel);
  themeToggle.setAttribute("aria-label", ui.themeLabel);
  navToggle.setAttribute("aria-label", ui.menuLabel);
  document.querySelector(".footer__top").setAttribute("aria-label", ui.topLabel);

  restartTyping();
}

function getSavedLang() {
  try {
    return localStorage.getItem("lang");
  } catch {
    return null;
  }
}

function saveLang(lang) {
  try {
    localStorage.setItem("lang", lang);
  } catch {
    // sem armazenamento disponível: só não lembra a escolha
  }
}

const langToggle = document.getElementById("langToggle");
langToggle.addEventListener("click", () => {
  const next = currentLang === "pt" ? "en" : "pt";
  setLanguage(next);
  saveLang(next);
});

// ===== Efeito de digitação no subtítulo =====
const typedEl = document.getElementById("typed");
let typingTimer = null;
let phraseIndex = 0;
let charIndex = 0;
let deleting = false;

function type() {
  const phrases = typedPhrases[currentLang];
  const current = phrases[phraseIndex];
  charIndex += deleting ? -1 : 1;
  typedEl.textContent = current.slice(0, charIndex);

  let delay = deleting ? 40 : 90;

  if (!deleting && charIndex === current.length) {
    deleting = true;
    delay = 1800; // pausa com a frase completa
  } else if (deleting && charIndex === 0) {
    deleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length;
    delay = 400;
  }

  typingTimer = setTimeout(type, delay);
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function restartTyping() {
  clearTimeout(typingTimer);
  phraseIndex = 0;
  charIndex = 0;
  deleting = false;

  if (reduceMotion) {
    typedEl.textContent = typedPhrases[currentLang][0];
  } else {
    type();
  }
}

setLanguage(getSavedLang() === "en" ? "en" : "pt");

// ===== Cabeçalho com borda ao rolar =====
const header = document.getElementById("header");
window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 20);
});

// ===== Animação de entrada dos elementos =====
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// ===== Link ativo no menu conforme a seção visível =====
const navLinks = document.querySelectorAll(".nav__link");
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);

document.querySelectorAll("main section[id]").forEach((section) => sectionObserver.observe(section));

// ===== Filtro de projetos =====
const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".card");

filters.forEach((button) => {
  button.addEventListener("click", () => {
    filters.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");

    const category = button.dataset.filter;
    cards.forEach((card) => {
      const show = category === "todos" || card.dataset.category === category;
      card.classList.toggle("hidden", !show);
    });
  });
});

// ===== Copiar e-mail =====
const copyBtn = document.getElementById("copyEmail");
const toast = document.getElementById("toast");

copyBtn.addEventListener("click", async () => {
  const email = copyBtn.dataset.email;
  try {
    await navigator.clipboard.writeText(email);
    toast.textContent = uiTexts[currentLang].copied;
  } catch {
    window.location.href = `mailto:${email}`;
    return;
  }
  setTimeout(() => (toast.textContent = ""), 2500);
});

// ===== Ano no rodapé =====
document.getElementById("year").textContent = new Date().getFullYear();
