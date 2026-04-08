/**
 * INL261 — AI-Assisted Animated Lecturer Portfolio Website
 * script.js — Main JavaScript file
 * Belgium Campus iTversity
 *
 * TABLE OF CONTENTS
 * -----------------
 * 1.  Theme Toggle (dark / light mode)
 * 2.  Navigation — sticky header + active link highlight
 * 3.  Hamburger Menu (mobile)
 * 4.  Particle Canvas Animation (hero background)
 * 5.  Hero Name — Letter-by-letter reveal animation
 * 6.  Scroll-Reveal — Fade-in elements on scroll
 * 7.  Typing Effect (About section tagline)
 * 8.  Module Cards — Touch/click flip support
 * 9.  Fun Facts — Click-to-reveal interaction
 * 10. Quotes Carousel — Auto-rotate + manual navigation
 * 11. Smooth Scroll — Anchor link helper
 * 12. Initialisation — Runs all features when DOM is ready
 */

'use strict'; // Catches common coding errors early

/* =============================================================
   1. THEME TOGGLE
   Reads system preference on load, then listens for the toggle
   button click to switch between "dark" and "light" themes.
   The data-theme attribute on <html> controls which CSS
   custom properties are active (see style.css section 1).
============================================================= */
function initThemeToggle() {
  const btn  = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement; // the <html> element

  // Use the data-theme already set in HTML (default: dark),
  // but respect OS preference if the HTML attribute is not set.
  let currentTheme = root.getAttribute('data-theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  // Apply initial theme
  root.setAttribute('data-theme', currentTheme);
  updateThemeIcon(btn, currentTheme);

  if (!btn) return; // Safety check — if button not found, stop here

  btn.addEventListener('click', () => {
    // Toggle between 'dark' and 'light'
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', currentTheme);
    btn.setAttribute('aria-label', `Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`);
    updateThemeIcon(btn, currentTheme);
  });
}

/** Updates the SVG icon inside the theme toggle button */
function updateThemeIcon(btn, theme) {
  if (!btn) return;
  if (theme === 'dark') {
    // Show moon icon in dark mode
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>`;
  } else {
    // Show sun icon in light mode
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>`;
  }
}


/* =============================================================
   2. NAVIGATION — sticky header behaviour
   Adds/removes the "is-scrolled" class as the user scrolls,
   and highlights the nav link matching the current section.
============================================================= */
function initNavigation() {
  const header   = document.getElementById('site-header');
  const navLinks = document.querySelectorAll('.nav-link');

  // Grab all sections that have an id (used for active link detection)
  const sections = Array.from(document.querySelectorAll('section[id]'));

  // IntersectionObserver watches when each section enters the viewport
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          // Remove active class from all links first
          navLinks.forEach((link) => link.classList.remove('is-active'));
          // Add active class to the matching link
          const active = document.querySelector(`.nav-link[href="#${id}"]`);
          if (active) active.classList.add('is-active');
        }
      });
    },
    {
      // Fire when 30% of the section is visible
      threshold: 0.3,
    }
  );

  sections.forEach((section) => observer.observe(section));

  // Scroll event: add "is-scrolled" class for the box-shadow effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }, { passive: true }); // passive:true improves scroll performance
}


/* =============================================================
   3. HAMBURGER MENU (mobile)
   Toggles the mobile navigation overlay open/closed.
   Also closes the menu when a nav link is clicked.
============================================================= */
function initHamburger() {
  const btn        = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if (!btn || !mobileMenu) return;

  /** Open or close the mobile menu */
  function toggleMenu(forceClose = false) {
    const isOpen = btn.classList.contains('is-open');
    const shouldOpen = forceClose ? false : !isOpen;

    btn.classList.toggle('is-open', shouldOpen);
    mobileMenu.classList.toggle('is-open', shouldOpen);
    btn.setAttribute('aria-expanded', shouldOpen);
    mobileMenu.setAttribute('aria-hidden', !shouldOpen);
  }

  btn.addEventListener('click', () => toggleMenu());

  // Close menu when any mobile nav link is clicked
  mobileLinks.forEach((link) => {
    link.addEventListener('click', () => toggleMenu(true));
  });

  // Close menu when user presses Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleMenu(true);
  });
}


/* =============================================================
   4. PARTICLE CANVAS ANIMATION
   Draws animated floating dots on a <canvas> element.
   Pure Canvas 2D — no external libraries needed.

   HOW IT WORKS:
   - An array of particle objects is created, each with a random
     position, velocity, size, and opacity.
   - Each frame, particles are moved and their opacity oscillates.
   - Particles that drift off-screen are wrapped to the other side.
   - Lines are drawn between particles that are close together,
     creating a connected-network effect.
============================================================= */
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationId;
  let width, height;

  // Configuration — adjust these values to customise the effect
  const CONFIG = {
    count:          60,    // number of particles (fewer = lighter load)
    minRadius:      1.5,   // minimum dot radius in px
    maxRadius:      3.5,   // maximum dot radius in px
    speed:          0.35,  // movement speed (pixels per frame)
    connectionDist: 130,   // max distance to draw a connecting line
    color:          '79, 195, 201', // RGB values for particle colour (teal)
  };

  /** Resize canvas to match its CSS display size */
  function resize() {
    width  = canvas.offsetWidth;
    height = canvas.offsetHeight;
    canvas.width  = width;
    canvas.height = height;
    // Recreate particles after resize so they fill the new area
    createParticles();
  }

  /** Create all particles with random properties */
  function createParticles() {
    particles = [];
    for (let i = 0; i < CONFIG.count; i++) {
      particles.push({
        x:   Math.random() * width,
        y:   Math.random() * height,
        vx:  (Math.random() - 0.5) * CONFIG.speed * 2,
        vy:  (Math.random() - 0.5) * CONFIG.speed * 2,
        r:   CONFIG.minRadius + Math.random() * (CONFIG.maxRadius - CONFIG.minRadius),
        opacity: 0.2 + Math.random() * 0.6,
        pulseSpeed: 0.005 + Math.random() * 0.01,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  /** Draw one animation frame */
  function draw(time) {
    ctx.clearRect(0, 0, width, height);

    // Move each particle and draw it
    particles.forEach((p, i) => {
      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges (particles that leave one side re-enter the other)
      if (p.x < 0)      p.x = width;
      if (p.x > width)  p.x = 0;
      if (p.y < 0)      p.y = height;
      if (p.y > height) p.y = 0;

      // Pulsing opacity using a sine wave
      const pulse = Math.sin(time * p.pulseSpeed + p.pulsePhase) * 0.2;
      const alpha = Math.max(0.1, Math.min(0.9, p.opacity + pulse));

      // Draw the dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${CONFIG.color}, ${alpha})`;
      ctx.fill();

      // Draw lines to nearby particles
      for (let j = i + 1; j < particles.length; j++) {
        const other = particles[j];
        const dx    = p.x - other.x;
        const dy    = p.y - other.y;
        const dist  = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.connectionDist) {
          // Line opacity fades with distance
          const lineAlpha = (1 - dist / CONFIG.connectionDist) * 0.15;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(${CONFIG.color}, ${lineAlpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    });

    // Request the next frame
    animationId = requestAnimationFrame(draw);
  }

  // Set up and start
  resize();
  animationId = requestAnimationFrame(draw);

  // Re-initialise on window resize (debounced to avoid excessive calls)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  }, { passive: true });

  // Pause animation when tab is hidden (saves battery/CPU)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      animationId = requestAnimationFrame(draw);
    }
  });
}


/* =============================================================
   5. HERO NAME — LETTER-BY-LETTER REVEAL
   Takes the text inside .name-placeholder, wraps each character
   in a <span class="letter">, then CSS animation staggers them.

   REPLACE: The lecturer's name is in the HTML — change the
   text inside .name-placeholder in index.html.
============================================================= */
function initHeroName() {
  const nameEl      = document.getElementById('hero-name');
  const placeholder = nameEl && nameEl.querySelector('.name-placeholder');
  if (!nameEl || !placeholder) return;

  const originalText = placeholder.textContent.trim();
  placeholder.style.display = 'none'; // Hide placeholder

  // Create a new span for each character, with staggered animation delay
  let html = '';
  let delay = 0.5; // Initial delay in seconds (lets page settle first)

  for (let i = 0; i < originalText.length; i++) {
    const char = originalText[i];
    if (char === ' ') {
      // Spaces don't need a span — just add a gap
      html += '<span class="letter" style="display:inline-block; width:0.35em;"></span>';
    } else {
      html += `<span class="letter" style="animation-delay: ${delay.toFixed(2)}s;" aria-hidden="true">${char}</span>`;
    }
    delay += 0.06; // Stagger each letter by 60ms
  }

  // Create a visually hidden element with the full name for screen readers
  const srSpan = document.createElement('span');
  srSpan.className = 'sr-only';
  srSpan.textContent = originalText;
  nameEl.innerHTML = html;
  nameEl.insertAdjacentElement('afterend', srSpan);
}


/* =============================================================
   6. SCROLL-REVEAL
   Uses IntersectionObserver to add the "is-visible" class to
   .fade-in elements when they scroll into view.

   The CSS transition then smoothly fades them in from below.
   This replaces libraries like AOS or ScrollReveal.
============================================================= */
function initScrollReveal() {
  const elements = document.querySelectorAll('.fade-in');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Once revealed, stop observing (no need to re-animate)
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12, // Trigger when 12% of the element is visible
      rootMargin: '0px 0px -40px 0px', // Start reveal 40px before the bottom edge
    }
  );

  elements.forEach((el) => observer.observe(el));
}


/* =============================================================
   7. TYPING EFFECT
   Creates an animated typing effect for the professional tagline
   in the About section. Cycles through an array of phrases.

   REPLACE: Update the 'phrases' array below with the
   lecturer's actual professional taglines.
============================================================= */
function initTypingEffect() {
  const textEl = document.getElementById('typing-text');
  if (!textEl) return;

  // REPLACE: Update these phrases to match the lecturer's profile
  const phrases = [
    'Educator. Researcher. Innovator.',
    'Champion of Student-Centred Learning',
    'HCI & UX Design Researcher',
    'Technology Ethics Advocate',
    'Mentor to Future IT Professionals',
  ];

  let phraseIndex = 0;   // Which phrase we're currently displaying
  let charIndex   = 0;   // Which character we're typing next
  let isDeleting  = false;
  let pauseTimer  = null;

  /** Type or delete one character per call */
  function tick() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      // Remove one character
      textEl.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
    } else {
      // Add one character
      textEl.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
    }

    // Speed: faster when deleting, normal when typing
    let speed = isDeleting ? 50 : 90;

    if (!isDeleting && charIndex === currentPhrase.length) {
      // Finished typing — pause before deleting
      speed = 2200;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      // Finished deleting — move to next phrase
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      speed = 400; // Brief pause before typing next phrase
    }

    pauseTimer = setTimeout(tick, speed);
  }

  // Start typing after a short delay (lets the page load first)
  setTimeout(tick, 1800);
}


/* =============================================================
   8. MODULE CARDS — TOUCH / CLICK FLIP
   The CSS :hover already handles flipping on desktop.
   This JS adds click support for touch devices and keyboard
   users who can't hover.

   Clicking a card toggles the .is-flipped class.
   Pressing Enter or Space on a focused card also flips it.
============================================================= */
function initModuleCards() {
  const cards = document.querySelectorAll('.module-card');

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      card.classList.toggle('is-flipped');
    });

    // Keyboard support — Enter or Space
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); // Prevent page scroll on Space
        card.classList.toggle('is-flipped');
      }
    });
  });
}


/* =============================================================
   9. FUN FACTS — CLICK TO REVEAL
   Clicking a fact card toggles the .is-revealed class,
   which CSS uses to show the back face content.
   Also updates aria-expanded for accessibility.
============================================================= */
function initFunFacts() {
  const cards = document.querySelectorAll('.fact-card');

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const isRevealed = card.classList.contains('is-revealed');
      card.classList.toggle('is-revealed');
      card.setAttribute('aria-expanded', !isRevealed);
    });

    // Keyboard: Enter or Space toggles reveal
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const isRevealed = card.classList.contains('is-revealed');
        card.classList.toggle('is-revealed');
        card.setAttribute('aria-expanded', !isRevealed);
      }
    });
  });
}


/* =============================================================
   10. QUOTES CAROUSEL
   Auto-rotates through blockquote.quote-slide elements every
   5 seconds. Users can also navigate with the prev/next buttons
   or click the indicator dots.

   CSS handles the fade in/out transitions via .is-active
   and .is-exiting classes.
============================================================= */
function initQuotesCarousel() {
  const slides     = document.querySelectorAll('.quote-slide');
  const dots       = document.querySelectorAll('.carousel-dot');
  const prevBtn    = document.getElementById('quote-prev');
  const nextBtn    = document.getElementById('quote-next');

  if (!slides.length) return;

  let currentIndex = 0;
  let autoplayTimer = null;
  const AUTO_DELAY = 5000; // ms between auto-advances

  /** Navigate to a specific slide by index */
  function goTo(index) {
    // Wrap around (e.g. going past the last goes to the first)
    const next = (index + slides.length) % slides.length;

    // Mark current as exiting
    slides[currentIndex].classList.remove('is-active');
    slides[currentIndex].classList.add('is-exiting');
    dots[currentIndex].classList.remove('is-active');
    dots[currentIndex].setAttribute('aria-selected', 'false');

    // Remove exiting class after transition completes
    const exiting = slides[currentIndex];
    setTimeout(() => {
      exiting.classList.remove('is-exiting');
    }, 650); // Must match CSS transition duration

    currentIndex = next;

    // Show the new slide
    slides[currentIndex].classList.add('is-active');
    dots[currentIndex].classList.add('is-active');
    dots[currentIndex].setAttribute('aria-selected', 'true');
  }

  /** Advance to the next slide */
  function nextSlide() {
    goTo(currentIndex + 1);
  }

  /** Go to the previous slide */
  function prevSlide() {
    goTo(currentIndex - 1);
  }

  /** Start the autoplay timer */
  function startAutoplay() {
    stopAutoplay(); // Clear any existing timer first
    autoplayTimer = setInterval(nextSlide, AUTO_DELAY);
  }

  /** Stop the autoplay timer */
  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  // Wire up prev/next buttons
  if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); startAutoplay(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); startAutoplay(); });

  // Wire up dot buttons
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      startAutoplay(); // Reset autoplay timer on manual navigation
    });
  });

  // Pause on hover (so users can read a quote without it changing)
  const carousel = document.querySelector('.quotes-carousel');
  if (carousel) {
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);
    carousel.addEventListener('focusin',   stopAutoplay);  // Keyboard focus
    carousel.addEventListener('focusout',  startAutoplay);
  }

  // Keyboard navigation when carousel is focused
  document.addEventListener('keydown', (e) => {
    const isFocusInCarousel = carousel && carousel.contains(document.activeElement);
    if (!isFocusInCarousel) return;

    if (e.key === 'ArrowLeft')  { prevSlide(); startAutoplay(); }
    if (e.key === 'ArrowRight') { nextSlide(); startAutoplay(); }
  });

  // Begin autoplay
  startAutoplay();
}


/* =============================================================
   11. SMOOTH SCROLL HELPER
   Makes anchor links (#section-id) scroll smoothly instead of
   jumping. This supplements the CSS scroll-behavior: smooth,
   which some older browsers don't support.
============================================================= */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href').slice(1);
      const target   = document.getElementById(targetId);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Move focus to the target for keyboard accessibility
      target.focus({ preventScroll: true });
    });
  });
}


/* =============================================================
   12. INITIALISATION
   Runs all feature initialisations when the DOM is fully loaded.
   DOMContentLoaded fires before images load — safe for JS
   that doesn't depend on image dimensions.
============================================================= */
document.addEventListener('DOMContentLoaded', () => {

  // Core UI
  initThemeToggle();    // 1. Dark/light mode switch
  initNavigation();     // 2. Sticky header + active nav link
  initHamburger();      // 3. Mobile hamburger menu

  // Hero animations
  initParticles();      // 4. Canvas particle background
  initHeroName();       // 5. Letter-by-letter name reveal

  // Scroll & interaction
  initScrollReveal();   // 6. Fade-in elements on scroll
  initTypingEffect();   // 7. Typing effect in About section
  initModuleCards();    // 8. Click/touch to flip module cards
  initFunFacts();       // 9. Click to reveal fun facts
  initQuotesCarousel(); // 10. Auto-rotating quote carousel
  initSmoothScroll();   // 11. Smooth anchor scroll

  // Log a friendly message for developers inspecting the console
  console.log(
    '%c INL261 Lecturer Portfolio ',
    'background: #01696F; color: #fff; font-weight: bold; padding: 4px 10px; border-radius: 4px;',
    '\nBelgium Campus iTversity — Script loaded successfully.'
  );
});
