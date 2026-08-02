document.addEventListener("DOMContentLoaded", () => {

  /* =======================
     BLOG SHARE BUTTON
  ==========================*/
  const shareButtons = document.querySelectorAll(".share-button");
  if (shareButtons.length > 0) {
    async function copyToClipboard(text) {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return false;
    }

    shareButtons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const url = window.location.href;
        const title = document.title || "Learn N' Lunch";

        try {
          if (navigator.share) {
            await navigator.share({ title, url });
            return;
          }
        } catch (err) {
          // fall through to clipboard fallback
        }

        try {
          const ok = await copyToClipboard(url);
          if (ok) {
            const original = btn.textContent;
            btn.textContent = "Link copied";
            setTimeout(() => {
              btn.textContent = original;
            }, 1500);
            return;
          }
        } catch (err) {
          // fall through to prompt fallback
        }

        window.prompt("Copy this link:", url);
      });
    });
  }

    
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


  /* =======================
     STORIES HERO SECTION
  ==========================*/
  // const mmTrack = document.getElementById("mm-track");
  // const mmPrev = document.getElementById("mm-prev");
  // const mmNext = document.getElementById("mm-next");

  // if (mmTrack && mmPrev && mmNext) {
  //   const mmCards = Array.from(mmTrack.querySelectorAll(".mm-card"));
  //   const mmGap = 28;
  //   let mmIndex = 0;
  //   let mmPerView = 3;
  //   let mmCardWidth = 0;

  //   function mmComputeLayout() {
  //     const w = window.innerWidth;
  //     mmPerView = w <= 680 ? 1 : w <= 1080 ? 2 : 3;
  //     mmCardWidth = mmCards[0].offsetWidth;
  //     const maxIndex = Math.max(0, mmCards.length - mmPerView);
  //     if (mmIndex > maxIndex) mmIndex = maxIndex;
  //     mmUpdate();
  //   }

  //   function mmUpdate() {
  //     const offset = mmIndex * (mmCardWidth + mmGap);
  //     mmTrack.style.transform = `translateX(-${offset}px)`;
  //     mmPrev.disabled = mmIndex === 0;
  //     mmNext.disabled = mmIndex >= mmCards.length - mmPerView;
  //   }

  //   mmNext.onclick = () => {
  //     if (mmIndex < mmCards.length - mmPerView) {
  //       mmIndex++;
  //       mmUpdate();
  //     }
  //   };

  //   mmPrev.onclick = () => {
  //     if (mmIndex > 0) {
  //       mmIndex--;
  //       mmUpdate();
  //     }
  //   };

  //   window.addEventListener("resize", mmComputeLayout);
  //   window.addEventListener("load", mmComputeLayout);
  // }




  (function () {
  const carousel = document.querySelector('.hero-image-container');
  if (!carousel) return;

  const images = carousel.querySelectorAll('.carousel-image');
  const prevBtn = carousel.querySelector('.carousel-btn.prev');
  const nextBtn = carousel.querySelector('.carousel-btn.next');

  let currentIndex = 0;

  function showSlide(index) {
    images.forEach((img, i) => {
      img.classList.toggle('active', i === index);
    });
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % images.length;
    showSlide(currentIndex);
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    showSlide(currentIndex);
  }

  // Attach events safely
  nextBtn?.addEventListener('click', nextSlide);
  prevBtn?.addEventListener('click', prevSlide);

  // Init
  showSlide(currentIndex);
})();





  // Find all carousel sections (class-based controls, no duplicate IDs)
  const mmSections = document.querySelectorAll(".mm-section, [data-carousel-id]");
  const MOBILE_SCROLL_BREAKPOINT = 768;

  mmSections.forEach((section) => {
    const carouselId = section.dataset.carouselId;
    const mmTrack = carouselId
      ? section.querySelector(`[data-carousel-track="${carouselId}"]`)
      : section.querySelector(".mm-carousel-track");
    const mmPrev = carouselId
      ? section.querySelector(`[data-carousel="${carouselId}"].mm-prev-btn`)
      : section.querySelector(".mm-prev-btn");
    const mmNext = carouselId
      ? section.querySelector(`[data-carousel="${carouselId}"].mm-next-btn`)
      : section.querySelector(".mm-next-btn");
    const mmViewport = section.querySelector(".mm-carousel-viewport");
    const isTouchCarousel = section.classList.contains("mm-touch-carousel");

    if (mmTrack && mmPrev && mmNext) {
      let mmIndex = 0;
      let mmPerView = 3;
      let mmCardWidth = 0;
      const mmGap = 28;

      function isScrollMode() {
        return isTouchCarousel && window.innerWidth <= MOBILE_SCROLL_BREAKPOINT;
      }

      function enableScrollMode() {
        mmTrack.style.transform = "";
        mmTrack.style.transition = "none";
        if (mmViewport) mmViewport.scrollLeft = 0;
        mmPrev.disabled = true;
        mmNext.disabled = true;
      }

      function getVisibleCards() {
        return Array.from(mmTrack.querySelectorAll(".mm-card")).filter(
          (card) => card.style.display !== "none"
        );
      }

      function mmComputeLayout() {
        if (isScrollMode()) {
          enableScrollMode();
          return;
        }

        mmTrack.style.transition = "";

        const mmCards = getVisibleCards();
        if (mmCards.length === 0) {
          mmTrack.style.transform = "translateX(0)";
          mmPrev.disabled = true;
          mmNext.disabled = true;
          return;
        }

        const w = window.innerWidth;
        mmPerView = w <= 680 ? 1 : w <= 1080 ? 2 : 3;
        mmCardWidth = mmCards[0].offsetWidth;
        const maxIndex = Math.max(0, mmCards.length - mmPerView);
        if (mmIndex > maxIndex) mmIndex = maxIndex;
        mmUpdate(mmCards, maxIndex);
      }

      function mmUpdate(mmCards, maxIndex) {
        const offset = mmIndex * (mmCardWidth + mmGap);
        mmTrack.style.transform = `translateX(-${offset}px)`;
        mmPrev.disabled = mmIndex === 0;
        mmNext.disabled = mmIndex >= maxIndex;
      }

      mmNext.onclick = () => {
        if (isScrollMode()) return;

        const mmCards = getVisibleCards();
        const maxIndex = Math.max(0, mmCards.length - mmPerView);
        if (mmIndex < maxIndex) {
          mmIndex++;
          mmUpdate(mmCards, maxIndex);
        }
      };

      mmPrev.onclick = () => {
        if (isScrollMode()) return;

        const mmCards = getVisibleCards();
        const maxIndex = Math.max(0, mmCards.length - mmPerView);
        if (mmIndex > 0) {
          mmIndex--;
          mmUpdate(mmCards, maxIndex);
        }
      };

      window.addEventListener("resize", () => {
        mmIndex = 0;
        mmComputeLayout();
      });
      window.addEventListener("load", mmComputeLayout);
      mmComputeLayout();
    }
  });



  /* =======================
     TESTIMONIAL SECTION
  ==========================*/
  const mtmTestimonials = document.querySelectorAll(".mtm-testimonial-container");
  if (mtmTestimonials.length > 0) {
    let mtmCurrentIndex = 0;
    const mtmTotal = mtmTestimonials.length;

    function mtmShowTestimonial(index) {
      mtmTestimonials.forEach((t, i) => {
        t.classList.toggle("mtm-hidden", i !== index);
      });
    }

    function mtmNextTestimonial() {
      mtmCurrentIndex = (mtmCurrentIndex + 1) % mtmTotal;
      mtmShowTestimonial(mtmCurrentIndex);
    }

    function mtmPrevTestimonial() {
      mtmCurrentIndex = (mtmCurrentIndex - 1 + mtmTotal) % mtmTotal;
      mtmShowTestimonial(mtmCurrentIndex);
    }

    document.querySelectorAll(".mtm-prev-button").forEach(btn => {
      btn.addEventListener("click", mtmPrevTestimonial);
    });
    document.querySelectorAll(".mtm-next-button").forEach(btn => {
      btn.addEventListener("click", mtmNextTestimonial);
    });
  }


  /* =======================
     MOMENTS CARD DECK STACK
     Pins a 70vh stage (title + cards + banner) in the viewport.
     (CSS sticky fails under body { overflow-x: hidden }.)
  ==========================*/
  (function initMomentsStack() {
    const section = document.querySelector(".moments-section");
    const stack = section ? section.querySelector(".moments-stack") : null;
    const stage = stack ? stack.querySelector(".moments-stack-stage") : null;
    const cards = stage ? stage.querySelector(".moments-stack-cards") : null;
    const photos = cards
      ? Array.from(cards.querySelectorAll(".photo"))
      : stage
        ? Array.from(stage.querySelectorAll(".photo"))
        : [];
    if (!section || !stack || !stage || photos.length === 0) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      photos.forEach((photo, index) => {
        photo.classList.add("moments-photo--in-deck");
        photo.style.opacity = "1";
        photo.style.zIndex = String(index + 1);
        photo.style.transform = `translate3d(-50%, -50%, 0) rotate(var(--moments-rotate, 0deg))`;
      });
      return;
    }

    let ticking = false;
    const count = photos.length;
    const FRAME_RATIO = 0.7;
    const FRAME_TOP_RATIO = 0.15;

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function updateMomentsStack() {
      const rect = stack.getBoundingClientRect();
      const viewH = window.innerHeight;
      const frameH = viewH * FRAME_RATIO;
      const frameTop = viewH * FRAME_TOP_RATIO;
      const scrollable = Math.max(1, stack.offsetHeight - viewH);
      const rawProgress = (-rect.top) / scrollable;
      const progress = clamp(rawProgress, 0, 1);

      stage.style.height = `${frameH}px`;
      stage.classList.remove("is-fixed", "is-bottom");

      if (rect.top <= frameTop && rect.bottom > frameTop + frameH) {
        stage.classList.add("is-fixed");
        stage.style.top = `${frameTop}px`;
      } else if (rect.bottom <= frameTop + frameH) {
        stage.classList.add("is-bottom");
        stage.style.top = "";
      } else {
        stage.style.top = "";
      }

      const cardProgress = progress * count;
      let activeIndex = 0;

      // Grow while arriving, peak on top, then shrink as newer cards stack above.
      const SCALE_START = 0.78;
      const SCALE_PEAK = 1.14;
      const SCALE_SETTLED = 0.88;

      photos.forEach((photo, index) => {
        const local = cardProgress - index;
        let yOffset = 120;
        let opacity = 0;
        let scale = SCALE_START;

        if (local >= 1) {
          // Fully stacked — gradually shrink as more cards pile on top
          const buried = local - 1;
          const shrinkT = clamp(buried / 1.75, 0, 1);
          yOffset = 0;
          opacity = 1;
          scale = SCALE_PEAK + (SCALE_SETTLED - SCALE_PEAK) * shrinkT;
          activeIndex = index;
        } else if (local > 0) {
          // Flying in — gradually grow toward peak size
          const t = local;
          yOffset = (1 - t) * 120;
          opacity = Math.min(1, t * 1.25);
          scale = SCALE_START + (SCALE_PEAK - SCALE_START) * t;
          activeIndex = index;
        }

        photo.style.opacity = String(clamp(opacity, 0, 1));
        photo.style.zIndex = String(index + 1);
        photo.style.setProperty("--moments-scale", scale.toFixed(3));
        photo.style.transform =
          `translate3d(` +
          `calc(-50% + var(--moments-ox, 0px)), ` +
          `calc(-50% + ${yOffset.toFixed(2)}% + var(--moments-oy, 0px)), 0)` +
          ` scale(var(--moments-scale, 1))` +
          ` rotate(var(--moments-rotate, 0deg))`;
        photo.classList.toggle("moments-photo--in-deck", local > 0);
        photo.classList.toggle("moments-photo--active", false);
      });

      const activePhoto = photos[activeIndex];
      if (activePhoto && cardProgress > 0) {
        activePhoto.classList.add("moments-photo--active");
        activePhoto.style.zIndex = String(count + 1);
      }

      ticking = false;
    }

    function onScrollOrResize() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateMomentsStack);
      }
    }

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    updateMomentsStack();
  })();


  /* =======================
     STORIES SEARCH & FILTER
  ==========================*/
  const storiesSearchInput = document.getElementById("storiesSearchInput");
  const storiesSearchBtn = document.getElementById("storiesSearchBtn");
  const storiesFilterBtns = document.querySelectorAll(".stories-filter-btn");
  const storiesSections = document.querySelectorAll(".stories-category-section");
  const storiesEmptyState = document.getElementById("storiesEmptyState");

  if (storiesSearchInput && storiesSections.length > 0) {
    function getActiveCategory() {
      const activeBtn = document.querySelector(".stories-filter-btn.active");
      return activeBtn?.dataset.category || "all";
    }

    function applyStoriesFilter() {
      const category = getActiveCategory();
      const term = storiesSearchInput.value.trim().toLowerCase();
      let visibleCount = 0;

      storiesSections.forEach((section) => {
        const sectionCategory = section.dataset.category || "all";
        const sectionMatchesFilter =
          category === "all" ? true : sectionCategory === category;

        let visibleInSection = 0;
        section.querySelectorAll(".stories-item").forEach((item) => {
          const searchText = (item.dataset.search || item.textContent || "").toLowerCase();
          const searchMatch = !term || searchText.includes(term);
          const visible = sectionMatchesFilter && searchMatch;

          item.style.display = visible ? "" : "none";
          if (visible) visibleInSection += 1;
        });

        const sectionVisible = sectionMatchesFilter && visibleInSection > 0;
        section.style.display = sectionVisible ? "" : "none";
        if (sectionVisible) visibleCount += visibleInSection;
      });

      if (storiesEmptyState) {
        storiesEmptyState.hidden = visibleCount > 0;
      }

      window.dispatchEvent(new Event("resize"));
    }

    storiesFilterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        storiesFilterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        applyStoriesFilter();
      });
    });

    if (storiesSearchBtn) {
      storiesSearchBtn.addEventListener("click", applyStoriesFilter);
    }

    storiesSearchInput.addEventListener("input", applyStoriesFilter);
    storiesSearchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") applyStoriesFilter();
    });

    applyStoriesFilter();
  }

  /* =======================
     HOW IT WORKS — flow label tap to CTA
  ==========================*/
  const FLOW_MOBILE_BREAKPOINT = 768;
  const flowRows = document.querySelectorAll(".how-it-works-flows .flow-row");

  flowRows.forEach((row) => {
    const label = row.querySelector(".flow-label");
    const cta = row.querySelector(".flow-cta");
    if (!label || !cta) return;

    label.setAttribute("role", "button");
    label.setAttribute("tabindex", "0");
    label.setAttribute("aria-label", `Scroll to ${cta.textContent.trim()}`);

    function scrollRowToCta() {
      if (window.innerWidth > FLOW_MOBILE_BREAKPOINT) return;

      const maxScroll = row.scrollWidth - row.clientWidth;
      if (maxScroll <= 0) return;

      const ctaEnd = cta.offsetLeft + cta.offsetWidth;
      const target = Math.min(maxScroll, Math.max(0, ctaEnd - row.clientWidth + 16));
      row.scrollTo({ left: target, behavior: "smooth" });
    }

    label.addEventListener("click", scrollRowToCta);
    label.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        scrollRowToCta();
      }
    });
  });

});






// DONATE_PAGE



const buttons = document.querySelectorAll(".amount-option");
const customInput = document.getElementById("custom-amount-input");

buttons.forEach((button) => {
  const defaultLabel = button.dataset.default;

  button.addEventListener("click", () => {
    const isCustom = button.dataset.amount === "custom";

    // Toggle if already selected
    if (button.classList.contains("selected")) {
      button.classList.remove("selected");
      button.innerHTML = defaultLabel;

      if (isCustom) {
        customInput.style.display = "none";
      }

      return;
    }

    // Unselect others
    buttons.forEach((b) => {
      b.classList.remove("selected");
      b.innerHTML = b.dataset.default;
    });

    // Select this one
    button.classList.add("selected");
    button.innerHTML = `
      <svg class="checkmark-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;

    if (isCustom) {
      customInput.style.display = "block";
      customInput.focus();
    } else {
      customInput.style.display = "none";
    }
  });
});
  
  customInput.addEventListener("input", () => {
  if (customInput.value < 0) {
    customInput.value = 0;
  }
});


customInput.addEventListener("input", () => {
  // Remove non-numeric characters (including negative signs and decimals)
  customInput.value = customInput.value.replace(/[^0-9]/g, "");

  // Prevent zero or empty
  if (customInput.value === "" || Number(customInput.value) < 1) {
    customInput.value = "";
  }

  // Prevent numbers above six figures
  if (Number(customInput.value) > 999999) {
    customInput.value = customInput.value.slice(0, 6);
  }

});



// DONATION FREQUENCY

const freqButtons = document.querySelectorAll(".frequency-btn");

freqButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    freqButtons.forEach(b => b.classList.remove("active-frequency"));
    btn.classList.add("active-frequency");
  });
});







// STATS-IMPACT-PAGE


// function animateCounter(element, target, duration = 2000) {
//     const start = 0;
//     const increment = target / (duration / 16);
//     let current = start;
    
//     const timer = setInterval(() => {
//       current += increment;
//       if (current >= target) {
//         element.textContent = target.toLocaleString() + '+';
//         clearInterval(timer);
//       } else {
//         element.textContent = Math.floor(current).toLocaleString() + '+';
//       }
//     }, 16);
//   }
  
//   function initCounterAnimation() {
//     const counterBox = document.querySelector('.stats-number-box');
//     const target = parseInt(counterBox.getAttribute('data-target'));
    
//     const observer = new IntersectionObserver((entries) => {
//       entries.forEach(entry => {
//         if (entry.isIntersecting) {
//           animateCounter(counterBox, target);
//           observer.unobserve(entry.target);
//         }
//       });
//     }, { threshold: 0.5 });
    
//     observer.observe(counterBox);
//   }
  
//   // Initialize when DOM is ready
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', initCounterAnimation);
//   } else {
//     initCounterAnimation();
//   }



