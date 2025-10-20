// const images = [
//       "https://via.placeholder.com/400x250.png?text=Image+1",
//       "https://via.placeholder.com/400x250.png?text=Image+2",
//       "https://via.placeholder.com/400x250.png?text=Image+3"
//     ];
//     let currentIndex = 0;
//     const sliderImg = document.getElementById("slider-img");

//     function nextImage() {
//       currentIndex = (currentIndex + 1) % images.length;
//       sliderImg.src = images[currentIndex];
//     }

//     function prevImage() {
//       currentIndex = (currentIndex - 1 + images.length) % images.length;
//       sliderImg.src = images[currentIndex];
//     }



    

    // NAV-BAR


    // function toggleMenu() {
    //         const navLinks = document.getElementById('navLinks');
    //         navLinks.classList.toggle('active');
    //     }

    //     let currentSlide = 0;
    //     const images = document.querySelectorAll('.carousel-image');
    //     const totalSlides = images.length;
    //     let autoAdvanceInterval;
        
    //     function showSlide(index) {
    //         images.forEach((img, i) => {
    //             img.classList.remove('active');
    //             if (i === index) {
    //                 img.classList.add('active');
    //             }
    //         });
    //     }

    //     function nextSlide() {
    //         currentSlide = (currentSlide + 1) % totalSlides;
    //         showSlide(currentSlide);
    //     }

    //     function prevSlide() {
    //         currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    //         showSlide(currentSlide);
    //     }

        // // Auto-advance only on mobile view
        // function setupAutoAdvance() {
        //     if (autoAdvanceInterval) {
        //         clearInterval(autoAdvanceInterval);
        //     }
            
        //     if (window.innerWidth <= 968) {
        //         autoAdvanceInterval = setInterval(nextSlide, 5000);
        //     }
        // }

        // // Initialize auto-advance based on screen size
        // setupAutoAdvance();

        // // Re-check on window resize
        // window.addEventListener('resize', setupAutoAdvance);


const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

mobileMenuToggle.addEventListener('click', () => {
  mobileMenuToggle.classList.toggle('active');
  navMenu.classList.toggle('active');
});

const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    mobileMenuToggle.classList.remove('active');
    navMenu.classList.remove('active');
  });
});

document.addEventListener('click', (e) => {
  if (!navMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
    mobileMenuToggle.classList.remove('active');
    navMenu.classList.remove('active');
  }
});


// HIDE NAV LIST

document.addEventListener('click', (e) => {
  if (!navMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
    mobileMenuToggle.classList.remove('active');
    navMenu.classList.remove('active');
  }
});

window.addEventListener('scroll', () => {
  if (navMenu.classList.contains('active')) {
    mobileMenuToggle.classList.remove('active');
    navMenu.classList.remove('active');
  }
});





/* ---------- scroll show/hide logic ---------- */
/* Robust logic:
   - don't hide while mobile menu is open
   - add small tolerance to avoid jitter
   - only hide once user scrolled down some amount (50px)
   - keep navbar visible at top
*/
let lastScrollY = window.pageYOffset || 0;
const tolerance = 10;    // pixels of tolerance to ignore tiny moves
const visibleAfter = 50; // only start hiding after this scroll distance

window.addEventListener('scroll', () => {
  const currentY = window.pageYOffset || 0;

  // don't change state if movement is tiny
  if (Math.abs(currentY - lastScrollY) <= tolerance) {
    return;
  }

  // if mobile menu is active, keep navbar visible
  if (navMenu.classList.contains('active')) {
    navbar.classList.remove('hide');
    navbar.classList.add('visible-shadow');
    lastScrollY = currentY;
    return;
  }

  // if at very top, always show
  if (currentY <= 0) {
    navbar.classList.remove('hide');
    navbar.classList.remove('visible-shadow');
    lastScrollY = currentY;
    return;
  }

  // scroll DOWN: hide only when we've scrolled past "visibleAfter"
  if (currentY > lastScrollY && currentY > visibleAfter) {
    navbar.classList.add('hide');
    navbar.classList.remove('visible-shadow');
  } else {
    // scroll UP: show
    navbar.classList.remove('hide');
    // add subtle shadow when not at the very top
    if (currentY > 30) navbar.classList.add('visible-shadow');
    else navbar.classList.remove('visible-shadow');
  }

  lastScrollY = currentY;
}, { passive: true });





        // STORIES-SECTION


const mmTrack = document.getElementById('mm-track');
    const mmPrev = document.getElementById('mm-prev');
    const mmNext = document.getElementById('mm-next');
    const mmCards = Array.from(mmTrack.querySelectorAll('.mm-card'));
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

    mmNext.onclick = () => { if (mmIndex < mmCards.length - mmPerView) { mmIndex++; mmUpdate(); } };
    mmPrev.onclick = () => { if (mmIndex > 0) { mmIndex--; mmUpdate(); } };

    window.addEventListener('resize', mmComputeLayout);
    window.addEventListener('load', mmComputeLayout);






    // MOMENTS SECTION



    //  const mtmTestimonials = [
    //         {
    //             text: "BEFORE LEARN N' LUNCH, I USED TO SKIP MEALS DURING EXAM WEEK. NOW I HAVE THE ENERGY TO FOCUS AND PERFORM BETTER",
    //             name: "Brian,",
    //             school: "Kyambogo University",
    //             image: "data:image/svg+xml,%3Csvg width='180' height='180' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23333' width='180' height='180'/%3E%3Ctext x='50%25' y='50%25' font-size='60' fill='%23fff' text-anchor='middle' dy='.3em'%3EB%3C/text%3E%3C/svg%3E"
    //         },
    //         {
    //             text: "THE PROGRAM CHANGED MY LIFE. I NO LONGER WORRY ABOUT WHERE MY NEXT MEAL WILL COME FROM DURING STUDY SESSIONS",
    //             name: "Sarah,",
    //             school: "Makerere University",
    //             image: "data:image/svg+xml,%3Csvg width='180' height='180' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%236366f1' width='180' height='180'/%3E%3Ctext x='50%25' y='50%25' font-size='60' fill='%23fff' text-anchor='middle' dy='.3em'%3ES%3C/text%3E%3C/svg%3E"
    //         },
    //         {
    //             text: "THANKS TO LEARN N' LUNCH, I CAN CONCENTRATE ON MY STUDIES WITHOUT THE CONSTANT DISTRACTION OF HUNGER",
    //             name: "David,",
    //             school: "Uganda Christian University",
    //             image: "data:image/svg+xml,%3Csvg width='180' height='180' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%2310b981' width='180' height='180'/%3E%3Ctext x='50%25' y='50%25' font-size='60' fill='%23fff' text-anchor='middle' dy='.3em'%3ED%3C/text%3E%3C/svg%3E"
    //         },
    //         {
    //             text: "THIS INITIATIVE HAS GIVEN ME HOPE. NOW I CAN DREAM BIGGER BECAUSE I KNOW I HAVE SUPPORT",
    //             name: "Grace,",
    //             school: "Kampala International University",
    //             image: "data:image/svg+xml,%3Csvg width='180' height='180' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23ec4899' width='180' height='180'/%3E%3Ctext x='50%25' y='50%25' font-size='60' fill='%23fff' text-anchor='middle' dy='.3em'%3EG%3C/text%3E%3C/svg%3E"
    //         }
    //     ];

    //     let mtmCurrentIndex = 0;
    //     const mtmCard = document.getElementById('mtmTestimonialCard');
    //     const mtmPrevBtn = document.getElementById('mtmPrevBtn');
    //     const mtmNextBtn = document.getElementById('mtmNextBtn');
    //     const mtmIndicatorsContainer = document.getElementById('mtmIndicators');

    //     function mtmCreateIndicators() {
    //         mtmTestimonials.forEach((_, index) => {
    //             const indicator = document.createElement('div');
    //             indicator.className = 'mtm-indicator';
    //             if (index === 0) indicator.classList.add('mtm-active');
    //             indicator.addEventListener('click', () => mtmGoToSlide(index));
    //             mtmIndicatorsContainer.appendChild(indicator);
    //         });
    //     }

    //     function mtmUpdateTestimonial(index) {
    //         const testimonial = mtmTestimonials[index];
            
    //         mtmCard.classList.remove('mtm-slide-anim');
    //         void mtmCard.offsetWidth;
    //         mtmCard.classList.add('mtm-slide-anim');
            
    //         document.getElementById('mtmTestimonialText').textContent = testimonial.text;
    //         document.getElementById('mtmAuthorName').textContent = testimonial.name;
    //         document.getElementById('mtmAuthorSchool').textContent = testimonial.school;
    //         document.getElementById('mtmProfileImg').src = testimonial.image;
    //         document.getElementById('mtmProfileImg').alt = `${testimonial.name} profile photo`;
            
    //         document.querySelectorAll('.mtm-indicator').forEach((indicator, i) => {
    //             indicator.classList.toggle('mtm-active', i === index);
    //         });
    //     }

    //     function mtmNextSlide() {
    //         mtmCurrentIndex = (mtmCurrentIndex + 1) % mtmTestimonials.length;
    //         mtmUpdateTestimonial(mtmCurrentIndex);
    //     }

    //     function mtmPrevSlide() {
    //         mtmCurrentIndex = (mtmCurrentIndex - 1 + mtmTestimonials.length) % mtmTestimonials.length;
    //         mtmUpdateTestimonial(mtmCurrentIndex);
    //     }

    //     function mtmGoToSlide(index) {
    //         mtmCurrentIndex = index;
    //         mtmUpdateTestimonial(mtmCurrentIndex);
    //     }

    //     mtmPrevBtn.addEventListener('click', mtmPrevSlide);
    //     mtmNextBtn.addEventListener('click', mtmNextSlide);

    //     // Keyboard navigation
    //     document.addEventListener('keydown', (e) => {
    //         if (e.key === 'ArrowLeft') mtmPrevSlide();
    //         if (e.key === 'ArrowRight') mtmNextSlide();
    //     });

    //     // Initialize
    //     mtmCreateIndicators();
    //     mtmUpdateTestimonial(0);





let mtmCurrentIndex = 0;
const mtmTestimonials = document.querySelectorAll('.mtm-testimonial-container');
const mtmTotalTestimonials = mtmTestimonials.length;

function mtmShowTestimonial(index) {
  mtmTestimonials.forEach((testimonial, i) => {
    if (i === index) {
      testimonial.classList.remove('mtm-hidden');
    } else {
      testimonial.classList.add('mtm-hidden');
    }
  });
}

function mtmNextTestimonial() {
  mtmCurrentIndex = (mtmCurrentIndex + 1) % mtmTotalTestimonials;
  mtmShowTestimonial(mtmCurrentIndex);
}

function mtmPreviousTestimonial() {
  mtmCurrentIndex = (mtmCurrentIndex - 1 + mtmTotalTestimonials) % mtmTotalTestimonials;
  mtmShowTestimonial(mtmCurrentIndex);
}

// Add event listeners to all navigation buttons
document.querySelectorAll('.mtm-prev-button').forEach(button => {
  button.addEventListener('click', mtmPreviousTestimonial);
});

document.querySelectorAll('.mtm-next-button').forEach(button => {
  button.addEventListener('click', mtmNextTestimonial);
});




