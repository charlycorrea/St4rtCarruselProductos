/* assets/st4rt-carrusel-productos.js */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  const prefersReducedMotion = (root) =>
    root?.dataset?.reducedMotion === 'true' ||
    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function initInViewObserver(root, slides) {
    const reduce = prefersReducedMotion(root);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const el = e.target;
          if (e.isIntersecting) {
            el.classList.add('is-inview');
            if (!reduce) {
              // optional: keep observing to re-trigger
            }
          } else {
            el.classList.remove('is-inview');
          }
        });
      },
      { threshold: 0.35 }
    );

    slides.forEach((s) => io.observe(s));
  }

  /**
   * SyncBgFx
   * Sin cambios: sincroniza .st4rt-hero__bgfx con la imagen real del fondo.
   */
  function syncBgFx(slide) {
    const fx = $('.st4rt-hero__bgfx', slide);
    if (!fx) return;

    const bgImg = $('img', $('.st4rt-hero__bg', slide) || slide);
    if (!bgImg) return;

    const applyFromImg = () => {
      const src = bgImg.currentSrc || bgImg.src;
      if (src) {
        fx.style.backgroundImage = `url("${src}")`;
        return;
      }

      const bgVar = getComputedStyle(slide).getPropertyValue('--st4rt-bg-url').trim();
      if (bgVar) fx.style.backgroundImage = bgVar;
    };

    applyFromImg();

    if (!bgImg.complete && bgImg.dataset.st4rtBgFxBound !== 'true') {
      bgImg.dataset.st4rtBgFxBound = 'true';
      bgImg.addEventListener('load', applyFromImg, { once: true });
    }
  }

  function setActiveSlide(root, slides, index) {
    const total = slides.length;
    const i = clamp(index, 0, total - 1);

    slides.forEach((s, idx) => s.classList.toggle('is-active', idx === i));

    const dots = $$('[data-dot]', root);
    dots.forEach((d, idx) => d.classList.toggle('is-active', idx === i));

    const active = slides[i];
    if (active) syncBgFx(active);

    root.dataset.activeIndex = String(i);
    return i;
  }

  function scrollToSlide(track, slides, index) {
    const slide = slides[index];
    if (!slide) return;
    track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
  }

  function initDots(root, track, slides) {
    const dotsWrap = $('.st4rt-hero__dots', root);
    if (!dotsWrap) return;

    dotsWrap.innerHTML = '';
    slides.forEach((_, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'st4rt-hero__dot';
      b.setAttribute('data-dot', '');
      b.setAttribute('aria-label', `Ir al slide ${idx + 1}`);
      b.addEventListener('click', () => {
        const next = setActiveSlide(root, slides, idx);
        scrollToSlide(track, slides, next);
      });
      dotsWrap.appendChild(b);
    });
  }

  function initArrows(root, track, slides) {
    const prev = $('[data-prev]', root);
    const next = $('[data-next]', root);
    if (!prev || !next) return;

    prev.addEventListener('click', () => {
      const current = Number(root.dataset.activeIndex || 0);
      const idx = clamp(current - 1, 0, slides.length - 1);
      const nextIdx = setActiveSlide(root, slides, idx);
      scrollToSlide(track, slides, nextIdx);
    });

    next.addEventListener('click', () => {
      const current = Number(root.dataset.activeIndex || 0);
      const idx = clamp(current + 1, 0, slides.length - 1);
      const nextIdx = setActiveSlide(root, slides, idx);
      scrollToSlide(track, slides, nextIdx);
    });
  }

  function initAutoplay(root, track, slides) {
    const enabled = root.dataset.autoplay === 'true';
    if (!enabled) return () => {};
    const seconds = Number(root.dataset.autoplaySeconds || 6);
    const interval = clamp(seconds, 2, 20) * 1000;

    let timer = null;

    const start = () => {
      stop();
      timer = window.setInterval(() => {
        const current = Number(root.dataset.activeIndex || 0);
        const idx = (current + 1) % slides.length;
        const nextIdx = setActiveSlide(root, slides, idx);
        scrollToSlide(track, slides, nextIdx);
      }, interval);
    };

    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    };

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);

    start();
    return stop;
  }

  function initSection(root) {
    const track = $('.st4rt-hero__track', root);
    if (!track) return;

    const slides = $$('[data-slide]', root);
    if (!slides.length) return;

    slides.forEach(syncBgFx);

    initInViewObserver(root, slides);

    const enableDots = (root.dataset.dots === 'true') || !!root.querySelector('.st4rt-hero__dots');
    if (enableDots) initDots(root, track, slides);

    setActiveSlide(root, slides, 0);

    const enableArrows = (root.dataset.arrows === 'true') || !!root.querySelector('[data-prev], [data-next]');
    if (enableArrows) initArrows(root, track, slides);

    initAutoplay(root, track, slides);

    let raf = 0;
    track.addEventListener('scroll', () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const left = track.scrollLeft;
        let best = 0;
        let bestDist = Infinity;
        slides.forEach((s, idx) => {
          const dist = Math.abs(s.offsetLeft - left);
          if (dist < bestDist) {
            bestDist = dist;
            best = idx;
          }
        });
        setActiveSlide(root, slides, best);
      });
    });
  }

  function boot() {
    const roots = $$('[data-st4rt-hero]');
    roots.forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();