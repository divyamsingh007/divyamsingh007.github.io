
// ===== TYPEWRITER EFFECT =====
window.addEventListener("loaderComplete", function () {
  const el = document.getElementById("typewriter-text");
  if (!el) return;

  const phrases = ["MERN Stack", "Frontend Developer", "UI/UX Designer"];
  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let isPaused = false;

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function type() {
    if (isPaused) return;

    const current = phrases[phraseIndex];

    if (isDeleting) {
      charIndex--;
      el.textContent = current.substring(0, charIndex);
    } else {
      charIndex++;
      el.textContent = current.substring(0, charIndex);
    }

    // Human-like random variance in timing
    let delay = isDeleting
      ? rand(28, 48)   // Delete: fast but varies
      : rand(70, 110); // Type: natural rhythm

    if (!isDeleting && charIndex === current.length) {
      // Finished typing — pause so user can read it
      isPaused = true;
      setTimeout(() => {
        isPaused = false;
        isDeleting = true;
        type();
      }, 2000);
      return;
    }

    if (isDeleting && charIndex === 0) {
      // Finished deleting — short breath before next phrase
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      delay = 500;
    }

    setTimeout(type, delay);
  }

  // Start slightly after content fades in
  setTimeout(type, 500);
});

// ===== MAGNETIC HOVER EFFECT =====
window.addEventListener("loaderComplete", function () {
  // Elements with data-magnetic attr + all footer social icons
  const dataTargets = document.querySelectorAll("[data-magnetic]");
  const socialLinks = document.querySelectorAll(".social-media a");

  function applyMagnetic(el, strength) {
    // Use CSS 'translate' property (individual transform) so it composes
    // cleanly with any existing Tailwind scale/hover transforms
    el.addEventListener("mousemove", function (e) {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;

      // Quick follow — feels responsive and alive
      el.style.transition = "translate 0.08s ease-out";
      el.style.translate = `${dx}px ${dy}px`;
    });

    el.addEventListener("mouseleave", function () {
      // Spring back with slight overshoot feel
      el.style.transition =
        "translate 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      el.style.translate = "0px 0px";
    });
  }

  dataTargets.forEach(function (el) {
    const strength = parseFloat(el.dataset.magneticStrength) || 0.25;
    applyMagnetic(el, strength);
  });

  // Social icons — a little stronger pull since they're small targets
  socialLinks.forEach(function (el) {
    applyMagnetic(el, 0.38);
  });
});

// ===== ANIMATED NUMBER COUNTERS =====
(function () {
  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function animateCounter(el, target, duration) {
    const suffix = el.dataset.suffix || "";
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);
      const current = Math.floor(eased * target);

      el.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target + suffix; // Snap to exact value
      }
    }

    requestAnimationFrame(tick);
  }

  function initCounters() {
    const strip = document.getElementById("stats-strip");
    if (!strip) return;

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            // Reveal the strip (triggers CSS stagger)
            strip.classList.add("is-visible");

            // Start each counter with its own staggered delay
            const counters = strip.querySelectorAll(".stat-number");
            counters.forEach(function (el, i) {
              const target = parseInt(el.dataset.target, 10);
              const delay = i * 120; // 120ms stagger between each number
              setTimeout(function () {
                animateCounter(el, target, 1600);
              }, delay);
            });

            observer.disconnect(); // Only animate once
          }
        });
      },
      { threshold: 0.4 } // Trigger when 40% of strip is visible
    );

    observer.observe(strip);
  }

  // Run after DOM is ready (doesn't need loaderComplete)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCounters);
  } else {
    initCounters();
  }
})();

// ===== SMOOTH SECTION WIPE TRANSITIONS =====
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // tone: 'dark' = #2B1F39 bar, 'light' = #E0F0EA bar
  // dir: 'ltr' = enters from left, 'rtl' = enters from right
  const WIPE_TARGETS = [
    { id: "about-me-section-id", tone: "dark",  dir: "ltr" },
    { id: "skills-section-id",   tone: "light", dir: "rtl" },
    { id: "project-section-id",  tone: "dark",  dir: "ltr" },
    { id: "footer-section-id",   tone: "light", dir: "rtl" },
  ];

  function initWipes() {
    WIPE_TARGETS.forEach(function ({ id, tone, dir }) {
      const section = document.getElementById(id);
      if (!section) return;

      if (getComputedStyle(section).position === "static")
        section.style.position = "relative";

      const curtain = document.createElement("div");
      curtain.className = `section-wipe-curtain wipe-${tone} wipe-${dir}`;
      section.appendChild(curtain);

      // Remove from DOM after animation so nothing lingers
      curtain.addEventListener("animationend", function () {
        curtain.remove();
      });

      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              setTimeout(function () {
                curtain.classList.add("sweep");
              }, 60);
              observer.disconnect();
            }
          });
        },
        { threshold: 0.04 }
      );

      observer.observe(section);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWipes);
  } else {
    initWipes();
  }
})();

// ===== CURSOR TRAIL =====
(function () {
  // Skip on touch devices and reduced-motion preference
  if ("ontouchstart" in window) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const N = 10;
  const SIZES   = [10, 9.2, 8.4, 7.4, 6.4, 5.6, 4.8, 4, 3.4, 3];
  const OPACITY = [0.85, 0.72, 0.60, 0.50, 0.40, 0.32, 0.24, 0.16, 0.10, 0.06];

  // Even dots = mint green, odd dots = dark purple — mirrors the site palette
  function dotColor(i) {
    return i % 2 === 0
      ? `rgba(224, 240, 234, ${OPACITY[i]})`
      : `rgba(43, 31, 57, ${OPACITY[i]})`;
  }

  function initTrail() {
    // Guard: only initialize once
    if (document.querySelector(".cursor-trail-dot")) return;

    // Start off-screen so dots are invisible until the first mousemove
    const OFFSCREEN = -200;
    const dots = [];
    const mouse = { x: OFFSCREEN, y: OFFSCREEN };
    let rafActive = false;

    for (let i = 0; i < N; i++) {
      const el = document.createElement("div");
      el.className = "cursor-trail-dot";
      el.style.cssText = `
        width:${SIZES[i]}px;
        height:${SIZES[i]}px;
        background:${dotColor(i)};
        box-shadow: 0 0 ${SIZES[i] * 0.5}px ${dotColor(i)};
      `;
      document.body.appendChild(el);
      const dot = { el, x: OFFSCREEN, y: OFFSCREEN, size: SIZES[i] };
      // Apply initial transform immediately — never let the dot sit at (0,0)
      el.style.transform = `translate(${OFFSCREEN - SIZES[i] / 2}px, ${OFFSCREEN - SIZES[i] / 2}px)`;
      dots.push(dot);
    }

    window.addEventListener("mousemove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!rafActive) {
        rafActive = true;
        requestAnimationFrame(tick);
      }
    });

    function tick() {
      rafActive = false;
      dots.forEach(function (dot, i) {
        const target = i === 0 ? mouse : dots[i - 1];
        // Each successive dot has a slightly slower follow speed → comet tail pull
        const speed = Math.max(0.06, 0.18 - i * 0.016);
        dot.x += (target.x - dot.x) * speed;
        dot.y += (target.y - dot.y) * speed;
        dot.el.style.transform =
          `translate(${dot.x - dot.size / 2}px, ${dot.y - dot.size / 2}px)`;
      });

      // Only keep the RAF alive while mouse is moving (idle = no battery waste)
      const lead = dots[0];
      const dx = mouse.x - lead.x;
      const dy = mouse.y - lead.y;
      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
        rafActive = true;
        requestAnimationFrame(tick);
      }
    }
  }

  // Fire after loader finishes so the trail doesn't appear over the counter
  window.addEventListener("loaderComplete", initTrail);
  // Safety fallback: if loaderComplete never fires, init on load
  window.addEventListener("load", function () {
    setTimeout(initTrail, 2500);
  });
})();

window.addEventListener("load", function () {


  document.body.classList.add("loading");

  const loader = document.getElementById("page-loader");
  const counter = document.getElementById("loader-counter");

  let progress = 0;
  const targetProgress = 100;
  const duration = 1000 + Math.random() * 1000;
  const startTime = performance.now();

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function animateCounter(currentTime) {
    const elapsed = currentTime - startTime;
    const rawProgress = Math.min(elapsed / duration, 1);

    const easedProgress = easeInOutCubic(rawProgress);
    progress = Math.floor(easedProgress * targetProgress);

    counter.textContent = progress + "%";

    if (rawProgress < 1) {
      requestAnimationFrame(animateCounter);
    } else {
      setTimeout(() => {
        loader.classList.add("loader-hidden");
        document.body.classList.remove("loading");
        document.body.classList.add("loaded");

        window.dispatchEvent(new Event("loaderComplete"));

        setTimeout(() => {
          loader.remove();
        }, 600);
      }, 200); 
    }
  }

  requestAnimationFrame(animateCounter);
});

document.addEventListener("DOMContentLoaded", function () {
  const carouselContainer = document.querySelector(
    ".projects-carousel-container"
  );
  const prevArrow = document.querySelector(".carousel-arrow-prev");
  const nextArrow = document.querySelector(".carousel-arrow-next");
  const counterCurrent = document.querySelector(".counter-current");
  const counterTotal = document.querySelector(".counter-total");

  if (!carouselContainer) return;

  const projectCards = Array.from(
    document.querySelectorAll(".project-container")
  );
  let currentIndex = 0;

  if (counterTotal) {
    counterTotal.textContent = projectCards.length;
  }

  function updateActiveCard() {
    const containerRect = carouselContainer.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;

    let closestCard = null;
    let closestDistance = Infinity;

    projectCards.forEach((card, index) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const distance = Math.abs(centerX - cardCenterX);

      card.classList.remove("active-card");

      if (distance < closestDistance) {
        closestDistance = distance;
        closestCard = card;
        currentIndex = index;
      }
    });

    if (closestCard) {
      closestCard.classList.add("active-card");
    }

    updateArrowStates();
    updateCounter();
  }

  function updateArrowStates() {
    if (prevArrow && nextArrow) {
      prevArrow.disabled = currentIndex === 0;
      nextArrow.disabled = currentIndex === projectCards.length - 1;
    }
  }

  function updateCounter() {
    if (counterCurrent) {
      counterCurrent.textContent = currentIndex + 1;
    }
  }

  function scrollToCard(index) {
    if (index < 0 || index >= projectCards.length) return;

    const card = projectCards[index];
    const containerRect = carouselContainer.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const scrollLeft =
      carouselContainer.scrollLeft +
      cardRect.left -
      containerRect.left -
      (containerRect.width - cardRect.width) / 2;

    carouselContainer.scrollTo({
      left: scrollLeft,
      behavior: "smooth",
    });
  }

  if (prevArrow) {
    prevArrow.addEventListener("click", function () {
      if (currentIndex > 0) {
        scrollToCard(currentIndex - 1);
      }
    });
  }

  if (nextArrow) {
    nextArrow.addEventListener("click", function () {
      if (currentIndex < projectCards.length - 1) {
        scrollToCard(currentIndex + 1);
      }
    });
  }

  carouselContainer.addEventListener("scroll", updateActiveCard);

  updateActiveCard();

  carouselContainer.addEventListener(
    "wheel",
    function (e) {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (Math.abs(e.deltaY) > 0) {
        e.preventDefault();

        if (prefersReducedMotion) {
          carouselContainer.scrollLeft += e.deltaY;
        } else {
          carouselContainer.scrollBy({
            left: e.deltaY,
            behavior: "smooth",
          });
        }
      }
    },
    { passive: false }
  );

  carouselContainer.setAttribute("tabindex", "0");

  carouselContainer.addEventListener("keydown", function (e) {
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        if (currentIndex > 0) {
          scrollToCard(currentIndex - 1);
        }
        break;
      case "ArrowRight":
        e.preventDefault();
        if (currentIndex < projectCards.length - 1) {
          scrollToCard(currentIndex + 1);
        }
        break;
      case "Home":
        e.preventDefault();
        scrollToCard(0);
        break;
      case "End":
        e.preventDefault();
        scrollToCard(projectCards.length - 1);
        break;
    }
  });

  let isScrolling = false;
  let startX;
  let scrollLeft;

  carouselContainer.addEventListener("mousedown", function (e) {
    isScrolling = true;
    startX = e.pageX - carouselContainer.offsetLeft;
    scrollLeft = carouselContainer.scrollLeft;
    carouselContainer.style.cursor = "grabbing";
  });

  carouselContainer.addEventListener("mouseleave", function () {
    isScrolling = false;
    carouselContainer.style.cursor = "grab";
  });

  carouselContainer.addEventListener("mouseup", function () {
    isScrolling = false;
    carouselContainer.style.cursor = "grab";
  });

  carouselContainer.addEventListener("mousemove", function (e) {
    if (!isScrolling) return;
    e.preventDefault();
    const x = e.pageX - carouselContainer.offsetLeft;
    const walk = (x - startX) * 2;
    carouselContainer.scrollLeft = scrollLeft - walk;
  });

  carouselContainer.style.cursor = "grab";
});
