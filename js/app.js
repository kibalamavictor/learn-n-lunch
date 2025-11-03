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
    const visibleAfter = 50;

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