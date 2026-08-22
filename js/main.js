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

  function closeNav() {
    navLinks.classList.remove('is-open');
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  function openNav() {
    navLinks.classList.add('is-open');
    navToggle.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      if (navLinks.classList.contains('is-open')) {
        closeNav();
      } else {
        openNav();
      }
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        closeNav();
      });
    });

    // Tapping/clicking outside the open menu (and outside the hamburger
    // itself, so the toggle's own click isn't immediately undone) closes
    // it. Uses a single document-level 'click' listener — fires for both
    // mouse clicks and touch taps, so no separate touch handling (and no
    // duplicate handlers) is needed.
    document.addEventListener('click', function (e) {
      if (!navLinks.classList.contains('is-open')) return;
      if (navLinks.contains(e.target) || navToggle.contains(e.target)) return;
      closeNav();
    });

    // Also close on Escape, matching the modal's existing pattern.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('is-open')) {
        closeNav();
        navToggle.focus();
      }
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
    if (overlay.id === 'certModal') resetCertZoom();
    if (overlay._returnFocusEl && typeof overlay._returnFocusEl.focus === 'function') {
      overlay._returnFocusEl.focus();
    }
  }

  // Reassigned below once the certificate zoom module initializes; kept as
  // a no-op here so closeModal() can always call it safely regardless of
  // definition order.
  var resetCertZoom = function () {};

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
      resetCertZoom();
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

  /* ---------------------------------------------------------
     Certificate zoom (pan + zoom inside the existing modal)

     - Desktop: mouse wheel to zoom (centered on the cursor),
       double-click to toggle, drag to pan once zoomed in.
     - Mobile: pinch to zoom (centered on the pinch midpoint),
       double-tap to toggle, drag to pan once zoomed in.
     - Small +/− /reset controls cover keyboard & discoverability
       on both platforms.
     - Pan is always clamped to the image's own scaled bounds, and
       .cert-modal-media clips overflow, so a zoomed/panned image
       can never push the modal — or the page — wider than the
       viewport.
     - State resets whenever a certificate is opened or the modal
       closes (see closeModal() above and the click handler above).
  --------------------------------------------------------- */
  var certMedia = document.getElementById('certModalMedia');
  var certZoomIn = document.getElementById('certZoomIn');
  var certZoomOut = document.getElementById('certZoomOut');
  var certZoomReset = document.getElementById('certZoomReset');

  if (certMedia && certModalImg && certZoomIn && certZoomOut && certZoomReset) {
    var ZOOM_MIN = 1;
    var ZOOM_MAX = 4;
    var ZOOM_STEP = 0.6;
    var DOUBLE_TAP_SCALE = 2.2;
    var DOUBLE_TAP_MS = 320;
    var DOUBLE_TAP_SLOP = 24;

    var zoomState = { scale: 1, tx: 0, ty: 0 };
    var activePointers = new Map(); // pointerId -> {x, y}
    var pinchStartDist = 0;
    var pinchStartScale = 1;
    var isPanning = false;
    var panStart = null; // {x, y, tx, ty}
    var lastTapTime = 0;
    var lastTapPos = null;

    function clampNum(v, min, max) { return Math.max(min, Math.min(max, v)); }

    // Keeps the (scaled) image from panning further than its own edge —
    // this is what guarantees the zoomed image stays fully contained
    // inside the modal no matter how far the user tries to drag it.
    function clampPan(scale, tx, ty) {
      var baseW = certModalImg.offsetWidth;
      var baseH = certModalImg.offsetHeight;
      var containerW = certMedia.clientWidth;
      var containerH = certMedia.clientHeight;
      var maxX = Math.max(0, (baseW * scale - containerW) / 2);
      var maxY = Math.max(0, (baseH * scale - containerH) / 2);
      return { x: clampNum(tx, -maxX, maxX), y: clampNum(ty, -maxY, maxY) };
    }

    function applyTransform(animated) {
      certModalImg.classList.toggle('is-zoom-animated', !!animated);
      certModalImg.style.transform =
        'translate(' + zoomState.tx + 'px, ' + zoomState.ty + 'px) scale(' + zoomState.scale + ')';
      certModalImg.classList.toggle('is-zoomed', zoomState.scale > 1.001);

      var pct = Math.round(zoomState.scale * 100);
      certZoomReset.textContent = pct + '%';
      var atMin = zoomState.scale <= ZOOM_MIN + 0.001;
      certZoomOut.disabled = atMin;
      certZoomReset.disabled = atMin;
      certZoomIn.disabled = zoomState.scale >= ZOOM_MAX - 0.001;
    }

    // originX/originY (viewport coordinates) let wheel/pinch/double-click
    // zoom toward the cursor or touch point instead of always the center.
    function setZoom(newScale, originX, originY, animated) {
      newScale = clampNum(newScale, ZOOM_MIN, ZOOM_MAX);
      var oldScale = zoomState.scale;

      var containerRect = certMedia.getBoundingClientRect();
      var cx = (typeof originX === 'number') ? originX - (containerRect.left + containerRect.width / 2) : 0;
      var cy = (typeof originY === 'number') ? originY - (containerRect.top + containerRect.height / 2) : 0;

      var ratio = newScale / oldScale;
      var newTx = (zoomState.tx - cx) * ratio + cx;
      var newTy = (zoomState.ty - cy) * ratio + cy;

      if (newScale <= ZOOM_MIN + 0.001) { newTx = 0; newTy = 0; }

      zoomState.scale = newScale;
      var clamped = clampPan(newScale, newTx, newTy);
      zoomState.tx = clamped.x;
      zoomState.ty = clamped.y;
      applyTransform(animated !== false);
    }

    resetCertZoom = function () {
      zoomState.scale = 1; zoomState.tx = 0; zoomState.ty = 0;
      activePointers.clear();
      isPanning = false; panStart = null;
      pinchStartDist = 0;
      applyTransform(false);
    };

    certZoomIn.addEventListener('click', function () { setZoom(zoomState.scale + ZOOM_STEP); });
    certZoomOut.addEventListener('click', function () { setZoom(zoomState.scale - ZOOM_STEP); });
    certZoomReset.addEventListener('click', function () { setZoom(ZOOM_MIN); });

    // ---- Desktop: mouse wheel to zoom ----
    certMedia.addEventListener('wheel', function (e) {
      if (certModalEl && (certModalEl.classList.contains('is-loading') || certModalEl.classList.contains('is-error'))) return;
      e.preventDefault();
      var delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      setZoom(zoomState.scale + delta, e.clientX, e.clientY);
    }, { passive: false });

    // ---- Desktop: double-click to toggle zoom ----
    certModalImg.addEventListener('dblclick', function (e) {
      if (zoomState.scale > 1.001) {
        setZoom(ZOOM_MIN);
      } else {
        setZoom(DOUBLE_TAP_SCALE, e.clientX, e.clientY);
      }
    });

    // ---- Shared pointer handling: drag-to-pan (mouse or single touch)
    //      and pinch-to-zoom (two touches) via the Pointer Events API ----
    function pointerDistance() {
      var pts = Array.from(activePointers.values());
      var dx = pts[0].x - pts[1].x;
      var dy = pts[0].y - pts[1].y;
      return Math.sqrt(dx * dx + dy * dy);
    }
    function pointerMidpoint() {
      var pts = Array.from(activePointers.values());
      return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
    }

    certModalImg.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { certModalImg.setPointerCapture(e.pointerId); } catch (err) {}

      if (activePointers.size === 2) {
        isPanning = false;
        pinchStartDist = pointerDistance();
        pinchStartScale = zoomState.scale;
        return;
      }

      if (activePointers.size === 1) {
        if (e.pointerType === 'touch') {
          var now = Date.now();
          if (lastTapPos && (now - lastTapTime) < DOUBLE_TAP_MS &&
              Math.abs(e.clientX - lastTapPos.x) < DOUBLE_TAP_SLOP &&
              Math.abs(e.clientY - lastTapPos.y) < DOUBLE_TAP_SLOP) {
            if (zoomState.scale > 1.001) {
              setZoom(ZOOM_MIN);
            } else {
              setZoom(DOUBLE_TAP_SCALE, e.clientX, e.clientY);
            }
            lastTapTime = 0;
            lastTapPos = null;
            return;
          }
          lastTapTime = now;
          lastTapPos = { x: e.clientX, y: e.clientY };
        }

        if (zoomState.scale > 1.001) {
          isPanning = true;
          panStart = { x: e.clientX, y: e.clientY, tx: zoomState.tx, ty: zoomState.ty };
        }
      }
    });

    certModalImg.addEventListener('pointermove', function (e) {
      if (!activePointers.has(e.pointerId)) return;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.size === 2) {
        var dist = pointerDistance();
        if (pinchStartDist > 0) {
          var mid = pointerMidpoint();
          var newScale = clampNum(pinchStartScale * (dist / pinchStartDist), ZOOM_MIN, ZOOM_MAX);
          setZoom(newScale, mid.x, mid.y, false);
        }
        return;
      }

      if (isPanning && panStart) {
        certModalImg.classList.add('is-panning');
        var dx = e.clientX - panStart.x;
        var dy = e.clientY - panStart.y;
        var clamped = clampPan(zoomState.scale, panStart.tx + dx, panStart.ty + dy);
        zoomState.tx = clamped.x;
        zoomState.ty = clamped.y;
        applyTransform(false);
      }
    });

    function endPointer(e) {
      activePointers.delete(e.pointerId);
      certModalImg.classList.remove('is-panning');
      if (activePointers.size < 2) pinchStartDist = 0;
      if (activePointers.size === 0) { isPanning = false; panStart = null; }
    }
    certModalImg.addEventListener('pointerup', endPointer);
    certModalImg.addEventListener('pointercancel', endPointer);
    certModalImg.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'mouse' && activePointers.has(e.pointerId) && activePointers.size < 2 && !isPanning) {
        endPointer(e);
      }
    });

    // Re-clamp on viewport/orientation changes so a zoomed image never
    // ends up parked outside the (now different-sized) modal bounds.
    window.addEventListener('resize', function () {
      if (zoomState.scale <= ZOOM_MIN + 0.001) return;
      var clamped = clampPan(zoomState.scale, zoomState.tx, zoomState.ty);
      zoomState.tx = clamped.x;
      zoomState.ty = clamped.y;
      applyTransform(false);
    });
  }

})();