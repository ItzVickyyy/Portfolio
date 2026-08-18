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

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  (function initTheme() {
    var saved;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (saved === 'light' || saved === 'dark') {
      applyTheme(saved);
    } else {
      var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      applyTheme(prefersLight ? 'light' : 'dark');
    }
  })();

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
     Modal helpers
  --------------------------------------------------------- */
  function openModal(overlay) {
    overlay.classList.add('is-open');
    document.body.classList.add('modal-open');
    var closeBtn = overlay.querySelector('.modal-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal(overlay) {
    overlay.classList.remove('is-open');
    document.body.classList.remove('modal-open');
  }

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
