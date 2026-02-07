document.addEventListener("DOMContentLoaded", () => {

    
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





  // Find all carousel sections
  const mmSections = document.querySelectorAll(".mm-section");

  mmSections.forEach((section) => {
    const mmTrack = section.querySelector(".mm-carousel-track");
    const mmPrev = section.querySelector("#mm-prev");
    const mmNext = section.querySelector("#mm-next");

    if (mmTrack && mmPrev && mmNext) {
      const mmCards = Array.from(mmTrack.querySelectorAll(".mm-card"));
      const mmGap = 28;
      let mmIndex = 0;
      let mmPerView = 3;
      let mmCardWidth = 0;

      function mmComputeLayout() {
        const w = window.innerWidth;
        mmPerView = w <= 680 ? 1 : w <= 1080 ? 2 : 3;
        mmCardWidth = mmCards[0].offsetWidth;
        const maxIndex = Math.max(0, mmCards.length - mmPerView);
        if (mmIndex > maxIndex) mmIndex = maxIndex;
        mmUpdate();
      }

      function mmUpdate() {
        const offset = mmIndex * (mmCardWidth + mmGap);
        mmTrack.style.transform = `translateX(-${offset}px)`;
        mmPrev.disabled = mmIndex === 0;
        mmNext.disabled = mmIndex >= mmCards.length - mmPerView;
      }

      mmNext.onclick = () => {
        if (mmIndex < mmCards.length - mmPerView) {
          mmIndex++;
          mmUpdate();
        }
      };

      mmPrev.onclick = () => {
        if (mmIndex > 0) {
          mmIndex--;
          mmUpdate();
        }
      };

      window.addEventListener("resize", mmComputeLayout);
      window.addEventListener("load", mmComputeLayout);
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
     STORIES HERO SECTION
  ==========================*/
  const storiesSearchInput = document.getElementById("storiesSearchInput");
  const storiesSearchBtn = document.getElementById("storiesSearchBtn");
  const storiesArticles = document.querySelectorAll(".stories-article");
  const storiesFilterBtns = document.querySelectorAll(".stories-filter-btn");

  if (storiesSearchInput && storiesSearchBtn && storiesArticles.length > 0) {
    // Filter by category
    storiesFilterBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        storiesFilterBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const category = btn.dataset.category;

        storiesArticles.forEach(article => {
          article.style.display =
            category === "all" || article.dataset.category === category
              ? "block"
              : "none";
        });
      });
    });

    // Search functionality
    storiesSearchBtn.addEventListener("click", () => {
      const term = storiesSearchInput.value.toLowerCase();
      storiesArticles.forEach(article => {
        const text = article.textContent.toLowerCase();
        article.style.display = text.includes(term) ? "block" : "none";
      });
    });

    // Press Enter to trigger search
    storiesSearchInput.addEventListener("keyup", e => {
      if (e.key === "Enter") storiesSearchBtn.click();
    });
  }

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



