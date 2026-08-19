(function () {
  'use strict';

  /* ---------------------------------------------------------
     Footer year
  --------------------------------------------------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Theme toggle (persisted)
  --------------------------------------------------------- */
  var root = document.documentElement;
  var themeToggle = document.getElementById('themeToggle');
  var THEME_KEY = 'vjs-portfolio-theme';

  // Theme is already applied by the inline script in <head> (avoids a flash
  // of the wrong theme on load). This just persists changes on toggle.
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var current = root.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  /* ---------------------------------------------------------
     Mobile nav toggle
  --------------------------------------------------------- */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------------------------------------------------
     Active nav link on scroll
  --------------------------------------------------------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  var navAnchors = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));

  function setActiveNav() {
    var scrollPos = window.scrollY + 160;
    var current = null;
    sections.forEach(function (sec) {
      if (sec.offsetTop <= scrollPos) current = sec.id;
    });
    navAnchors.forEach(function (a) {
      var match = a.getAttribute('href') === '#' + current;
      a.classList.toggle('active', match);
    });
  }
  window.addEventListener('scroll', setActiveNav, { passive: true });
  setActiveNav();

  /* ---------------------------------------------------------
     Scroll reveal + skill ring animation via IntersectionObserver
  --------------------------------------------------------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var skillCards = Array.prototype.slice.call(document.querySelectorAll('.skill-card'));

  function animateRing(card) {
    var target = parseFloat(card.getAttribute('data-skill')) || 0;
    var circle = card.querySelector('.ring-fill');
    if (!circle) return;
    var circumference = 2 * Math.PI * 54; // r=54
    var offset = circumference - (target / 100) * circumference;
    requestAnimationFrame(function () {
      circle.style.strokeDashoffset = offset;
    });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          if (entry.target.classList.contains('skill-card')) {
            animateRing(entry.target);
          }
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    skillCards.forEach(animateRing);
  }

  /* ---------------------------------------------------------
     Project filter
  --------------------------------------------------------- */
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll('.filter-btn'));
  var projectCards = Array.prototype.slice.call(document.querySelectorAll('.project-card'));

  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.getAttribute('data-filter');

      filterButtons.forEach(function (b) {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });

      projectCards.forEach(function (card) {
        var cats = (card.getAttribute('data-category') || '').split(' ');
        var show = filter === 'all' || cats.indexOf(filter) !== -1;
        card.style.display = show ? '' : 'none';
      });
    });
  });

  /* ---------------------------------------------------------
     Certificate carousels
  --------------------------------------------------------- */
  document.querySelectorAll('[data-carousel]').forEach(function (carousel) {
    var viewport = carousel.querySelector('[data-track-viewport]');
    var prevBtn = carousel.querySelector('[data-prev]');
    var nextBtn = carousel.querySelector('[data-next]');
    if (!viewport || !prevBtn || !nextBtn) return;

    function slideAmount() {
      var slide = viewport.querySelector('.cert-carousel-slide');
      if (!slide) return viewport.clientWidth;
      var style = window.getComputedStyle(slide);
      return slide.getBoundingClientRect().width + parseFloat(style.marginRight || 0) + 20; // + track gap
    }

    function updateButtons() {
      var maxScroll = viewport.scrollWidth - viewport.clientWidth - 1;
      prevBtn.disabled = viewport.scrollLeft <= 0;
      nextBtn.disabled = maxScroll <= 0 || viewport.scrollLeft >= maxScroll;
    }

    prevBtn.addEventListener('click', function () {
      viewport.scrollBy({ left: -slideAmount(), behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', function () {
      viewport.scrollBy({ left: slideAmount(), behavior: 'smooth' });
    });

    viewport.addEventListener('scroll', function () {
      requestAnimationFrame(updateButtons);
    }, { passive: true });

    window.addEventListener('resize', updateButtons);
    updateButtons();
  });

  /* ---------------------------------------------------------
     Modal helpers
  --------------------------------------------------------- */
  function openModal(overlay) {
    overlay._returnFocusEl = document.activeElement;
    overlay.classList.add('is-open');
    document.body.classList.add('modal-open');
    var closeBtn = overlay.querySelector('.modal-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal(overlay) {
    overlay.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    if (overlay._returnFocusEl && typeof overlay._returnFocusEl.focus === 'function') {
      overlay._returnFocusEl.focus();
    }
  }

  function getFocusable(container) {
    return Array.prototype.slice.call(
      container.querySelectorAll('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])')
    ).filter(function (el) { return el.offsetParent !== null; });
  }

  // Keep keyboard focus trapped inside whichever modal is currently open.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var openModalEl = document.querySelector('.modal-overlay.is-open');
    if (!openModalEl) return;
    var focusable = getFocusable(openModalEl);
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal(overlay);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.is-open').forEach(closeModal);
    }
  });

  /* ---------------------------------------------------------
     Contact modal
  --------------------------------------------------------- */
  var contactModal = document.getElementById('contactModal');
  var contactOpeners = ['heroContactBtn', 'connectContactBtn', 'footerContactBtn', 'footerContactBtn2']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  contactOpeners.forEach(function (btn) {
    btn.addEventListener('click', function () { openModal(contactModal); });
  });

  var contactModalClose = document.getElementById('contactModalClose');
  if (contactModalClose) {
    contactModalClose.addEventListener('click', function () { closeModal(contactModal); });
  }

  var contactForm = document.getElementById('contactForm');
  var formSuccess = document.getElementById('formSuccess');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }
      formSuccess.classList.add('show');
      contactForm.reset();
      setTimeout(function () { formSuccess.classList.remove('show'); }, 5000);
    });
  }

  /* ---------------------------------------------------------
     Certificate viewer modal
  --------------------------------------------------------- */
  var certModal = document.getElementById('certModal');
  var certModalImg = document.getElementById('certModalImg');
  var certModalTitle = document.getElementById('certModalTitle');
  var certModalDesc = document.getElementById('certModalDesc');
  var certModalClose = document.getElementById('certModalClose');

  document.querySelectorAll('[data-cert-img]').forEach(function (card) {
    card.addEventListener('click', function () {
      var img = card.getAttribute('data-cert-img');
      var title = card.getAttribute('data-cert-title') || '';
      var desc = card.getAttribute('data-cert-desc') || '';
      certModalImg.src = img;
      certModalImg.alt = title;
      certModalTitle.textContent = title;
      certModalDesc.textContent = desc;
      openModal(certModal);
    });
  });

  if (certModalClose) {
    certModalClose.addEventListener('click', function () { closeModal(certModal); });
  }

})();
