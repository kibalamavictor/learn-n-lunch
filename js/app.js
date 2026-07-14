  /* =======================
     NAV BAR
  ==========================*/
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const navbar = document.querySelector(".navbar"); // 🔹 added this line!

  if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener("click", () => {
      mobileMenuToggle.classList.toggle("active");
      navMenu.classList.toggle("active");
    });

    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
      link.addEventListener("click", () => {
        mobileMenuToggle.classList.remove("active");
        navMenu.classList.remove("active");
      });
    });

    // Hide menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!navMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
        mobileMenuToggle.classList.remove("active");
        navMenu.classList.remove("active");
      }
    });

    // Hide on scroll
    window.addEventListener("scroll", () => {
      if (navMenu.classList.contains("active")) {
        mobileMenuToggle.classList.remove("active");
        navMenu.classList.remove("active");
      }
    });
  }

  // Scroll show/hide logic
  if (navbar) {
    let lastScrollY = window.pageYOffset || 0;
    const tolerance = 10;
    const visibleAfter = 10;

    window.addEventListener("scroll", () => {
      const currentY = window.pageYOffset || 0;
      if (Math.abs(currentY - lastScrollY) <= tolerance) return;

      if (navMenu && navMenu.classList.contains("active")) {
        navbar.classList.remove("hide");
        navbar.classList.add("visible-shadow");
        lastScrollY = currentY;
        return;
      }

      if (currentY <= 0) {
        navbar.classList.remove("hide");
        navbar.classList.remove("visible-shadow");
        lastScrollY = currentY;
        return;
      }

      if (currentY > lastScrollY && currentY > visibleAfter) {
        navbar.classList.add("hide");
        navbar.classList.remove("visible-shadow");
      } else {
        navbar.classList.remove("hide");
        if (currentY > 30) navbar.classList.add("visible-shadow");
        else navbar.classList.remove("visible-shadow");
      }

      lastScrollY = currentY;
    }, { passive: true });
  }














// STATS-IMPACT-PAGE

function animateCounter(element, target, duration = 2000, isMoney = false) {
  const start = 0;
  const increment = target / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      clearInterval(timer);
      element.textContent = isMoney
        ? '$' + target.toLocaleString()
        : target.toLocaleString() + '+';
    } else {
      element.textContent = isMoney
        ? '$' + Math.floor(current).toLocaleString()
        : Math.floor(current).toLocaleString() + '+';
    }
  }, 16);
}

function initCounterAnimation() {
  const counters = document.querySelectorAll('.stats-number-box');

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const target = parseInt(element.getAttribute('data-target'));
          const isMoney = element.closest('.stats-showcase-section')?.classList.contains('money');

          animateCounter(element, target, 2000, isMoney);
          obs.unobserve(element); // stop re-triggering
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(counter => observer.observe(counter));
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCounterAnimation);
} else {
  initCounterAnimation();
}

// IMPACT PAGE — Faces Behind the Numbers fan carousel
(function initImpactFacesCarousel() {
  const carousel = document.getElementById("impactFacesCarousel");
  if (!carousel) return;

  const cards = [...carousel.querySelectorAll(".impact-faces-card")];
  const prevBtn = carousel.querySelector(".impact-faces-prev");
  const nextBtn = carousel.querySelector(".impact-faces-next");
  if (!cards.length || !prevBtn || !nextBtn) return;

  let active = 0;
  let startX = 0;
  const total = cards.length;

  cards.forEach((card, index) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest(".mm-cta")) return;
      active = index;
      render();
    });

    const cta = card.querySelector(".mm-cta");
    if (cta) {
      cta.addEventListener("click", (event) => event.stopPropagation());
    }
  });

  function render() {
    cards.forEach((card, index) => {
      let offset = index - active;

      if (offset > total / 2) offset -= total;
      if (offset < -total / 2) offset += total;

      if (Math.abs(offset) > 1) {
        card.style.opacity = "0";
        card.style.pointerEvents = "none";
        card.style.zIndex = "0";
        card.style.transform = "translate(-50%, -50%) scale(0.8)";
        return;
      }

      card.style.pointerEvents = "auto";
      card.style.opacity = "1";

      const mobile = window.innerWidth < 768;
      let x = 0;
      let rotate = 0;
      let scale = 1;
      let z = 3;

      if (offset === -1) {
        x = mobile ? -73 : -192;
        rotate = mobile ? -6 : -12;
        scale = 0.88;
        z = 2;
      } else if (offset === 0) {
        x = 0;
        rotate = 0;
        scale = 1;
        z = 3;
      } else if (offset === 1) {
        x = mobile ? 73 : 192;
        rotate = mobile ? 6 : 12;
        scale = 0.88;
        z = 2;
      }

      card.style.zIndex = String(z);
      card.style.transform = `translate(-50%, -50%) translateX(${x}px) rotate(${rotate}deg) scale(${scale})`;
    });
  }

  function next() {
    active = (active + 1) % total;
    render();
  }

  function prev() {
    active = (active - 1 + total) % total;
    render();
  }

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") next();
    if (event.key === "ArrowLeft") prev();
  });

  carousel.addEventListener("touchstart", (event) => {
    startX = event.touches[0].clientX;
  }, { passive: true });

  carousel.addEventListener("touchend", (event) => {
    const delta = event.changedTouches[0].clientX - startX;
    if (Math.abs(delta) > 40) {
      if (delta < 0) next();
      else prev();
    }
  }, { passive: true });

  window.addEventListener("resize", render, { passive: true });
  render();
})();

// IMPACT PAGE — More Than Meals / What's Next card reveal
(function initImpactMoreNextCards() {
  const cards = document.querySelectorAll("#lnl-more-next .lnl-mn-card");
  if (!cards.length) return;

  if (!("IntersectionObserver" in window)) {
    cards.forEach((card) => card.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.25 }
  );

  cards.forEach((card) => observer.observe(card));
})();