(function () {
  'use strict';

  /* ---------------------------------------------------------
     Disable image dragging (CSS user-drag doesn't cover every
     browser — Firefox in particular — so this is the reliable
     cross-browser fallback). Doesn't affect clicks/taps.
  --------------------------------------------------------- */
  document.addEventListener('dragstart', function (e) {
    if (e.target && e.target.tagName === 'IMG') e.preventDefault();
  });

  /* ---------------------------------------------------------
     Skeleton loading for images
     Any .skeleton-img-wrap shows a shimmering placeholder (see
     components.css) until its <img> finishes loading — or
     immediately, if the image was already cached. Works for
     eager and loading="lazy" images alike, and needs no extra
     wiring for new instances: just add the class in the markup.
  --------------------------------------------------------- */
  document.querySelectorAll('.skeleton-img-wrap').forEach(function (wrap) {
    var img = wrap.querySelector('img');
    if (!img) return;

    function markLoaded() { wrap.classList.add('is-loaded'); }

    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
    } else {
      img.addEventListener('load', markLoaded);
      img.addEventListener('error', markLoaded); // don't shimmer forever over a broken image
    }
  });

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
     Scroll reveal via IntersectionObserver
  --------------------------------------------------------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
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
     Certificate tabs (Excellence & Awards / Completions /
     Participation / In progress) — only one label + carousel
     is shown at a time.
  --------------------------------------------------------- */
  var certTabButtons = Array.prototype.slice.call(document.querySelectorAll('.cert-tab-btn'));
  var certTabPanels = Array.prototype.slice.call(document.querySelectorAll('.cert-tab-panel'));

  certTabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = btn.getAttribute('data-cert-tab');
      var targetPanel = document.getElementById('certPanel-' + target);

      certTabButtons.forEach(function (b) {
        var isActive = b === btn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-selected', String(isActive));
      });

      certTabPanels.forEach(function (panel) {
        panel.hidden = panel !== targetPanel;
      });

      // Carousels inside a hidden panel report a 0-width viewport, so their
      // prev/next buttons need to be recalculated once the panel is shown.
      if (targetPanel) {
        window.dispatchEvent(new Event('resize'));
      }
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
  var contactOpeners = ['heroContactBtn', 'connectContactBtn', 'servicesContactBtn', 'footerContactBtn', 'footerContactBtn2']
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

     - Clears the previous certificate immediately on click so it can
       never flash while the new one is loading.
     - Uses a request id to guard against rapid switching: if a slow
       image finishes loading after a newer certificate was selected,
       its result is discarded instead of overwriting the modal.
     - Preloads the full-resolution image on hover/focus so it's often
       already cached by the time the person clicks.
  --------------------------------------------------------- */
  var certModal = document.getElementById('certModal');
  var certModalEl = certModal ? certModal.querySelector('.cert-modal') : null;
  var certModalImg = document.getElementById('certModalImg');
  var certModalTitle = document.getElementById('certModalTitle');
  var certModalDesc = document.getElementById('certModalDesc');
  var certModalClose = document.getElementById('certModalClose');

  var certRequestId = 0;                    // guards against a late-loading image overwriting a newer selection
  var certPreloaded = Object.create(null);  // avoids re-requesting the same certificate more than once per session

  function preloadCertImage(src) {
    if (!src || certPreloaded[src]) return;
    certPreloaded[src] = true;
    var pre = new Image();
    pre.src = src;
  }

  function setCertModalState(state) {
    if (!certModalEl) return;
    certModalEl.classList.remove('is-loading', 'is-error');
    if (state === 'loading' || state === 'error') certModalEl.classList.add('is-' + state);
  }

  function loadCertImage(src, title, requestId) {
    var loader = new Image();

    loader.onload = function () {
      if (requestId !== certRequestId) return; // a newer certificate was opened meanwhile — ignore
      certModalImg.src = src;
      certModalImg.alt = title;
      setCertModalState('ready');
    };

    loader.onerror = function () {
      if (requestId !== certRequestId) return;
      setCertModalState('error');
    };

    loader.src = src;
  }

  document.querySelectorAll('[data-cert-img]').forEach(function (card) {
    var src = card.getAttribute('data-cert-img');

    card.addEventListener('mouseenter', function () { preloadCertImage(src); });
    card.addEventListener('focus', function () { preloadCertImage(src); });

    card.addEventListener('click', function () {
      var title = card.getAttribute('data-cert-title') || '';
      var desc = card.getAttribute('data-cert-desc') || '';

      certRequestId += 1;
      var thisRequestId = certRequestId;

      // Reset immediately — the previous certificate must never linger.
      certModalImg.removeAttribute('src');
      certModalImg.alt = '';
      certModalTitle.textContent = title;
      certModalDesc.textContent = desc;
      setCertModalState('loading');

      openModal(certModal);
      loadCertImage(src, title, thisRequestId);
    });
  });

  if (certModalClose) {
    certModalClose.addEventListener('click', function () { closeModal(certModal); });
  }

})();