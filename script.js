(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('#mobile-nav');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      menuButton.textContent = isOpen ? 'Меню' : 'Закрыть';
      mobileNav.hidden = isOpen;
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileNav.hidden = true;
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.textContent = 'Меню';
      });
    });
  }

  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();

  const consultBar = document.querySelector('.consult-bar');
  if (consultBar) {
    const updateConsultBar = () => {
      consultBar.classList.toggle('is-visible', window.scrollY > 650);
    };
    updateConsultBar();
    window.addEventListener('scroll', updateConsultBar, { passive: true });
  }

  const carousel = document.querySelector('[data-service-carousel]');
  if (carousel) {
    const track = carousel.querySelector('[data-carousel-track]');
    const slides = [...carousel.querySelectorAll('[data-slide]')];
    const tabs = [...carousel.querySelectorAll('[data-service-tab]')];
    const dots = [...carousel.querySelectorAll('[data-service-dot]')];
    const previous = carousel.querySelector('[data-carousel-prev]');
    const next = carousel.querySelector('[data-carousel-next]');
    const activeTitle = carousel.querySelector('[data-active-title]');
    const activeDescription = carousel.querySelector('[data-active-description]');
    const activeNumber = carousel.querySelector('[data-active-number]');
    const mobileQuery = window.matchMedia('(max-width: 760px)');
    let activeIndex = 0;
    let scrollFrame = 0;

    const modulo = (value, length) => ((value % length) + length) % length;

    function getPositions() {
      if (mobileQuery.matches) {
        const width = track.clientWidth || window.innerWidth;
        const nearX = Math.round(Math.min(168, Math.max(112, width * 0.39)));
        const farX = Math.round(width * 0.76);
        return {
          '-2': { x: -farX, y: 42, rotation: -11, scale: .72, z: 1 },
          '-1': { x: -nearX, y: 22, rotation: -7, scale: .88, z: 2 },
          '0': { x: 0, y: 0, rotation: 0, scale: 1, z: 4 },
          '1': { x: nearX, y: 22, rotation: 7, scale: .88, z: 2 },
          '2': { x: farX, y: 42, rotation: 11, scale: .72, z: 1 }
        };
      }

      return {
        '-2': { x: -500, y: 62, rotation: -12, scale: .80, z: 1 },
        '-1': { x: -275, y: 34, rotation: -8, scale: .92, z: 2 },
        '0': { x: 0, y: 0, rotation: 0, scale: 1, z: 4 },
        '1': { x: 275, y: 34, rotation: 8, scale: .92, z: 2 },
        '2': { x: 500, y: 62, rotation: 12, scale: .80, z: 1 }
      };
    }

    function updateCarousel() {
      const count = slides.length;
      const positions = getPositions();

      slides.forEach((slide, index) => {
        const difference = modulo(index - activeIndex + Math.floor(count / 2), count) - Math.floor(count / 2);
        const position = positions[String(difference)];
        const visible = Boolean(position);

        slide.classList.toggle('is-active', index === activeIndex);
        slide.classList.toggle('is-near', Math.abs(difference) === 1);
        slide.classList.toggle('is-far', Math.abs(difference) === 2);
        slide.classList.toggle('is-visible', visible);

        if (position) {
          slide.style.setProperty('--slide-x', `${position.x}px`);
          slide.style.setProperty('--slide-y', `${position.y}px`);
          slide.style.setProperty('--slide-rotation', `${position.rotation}deg`);
          slide.style.setProperty('--slide-scale', position.scale);
          slide.style.setProperty('--slide-z', position.z);
        } else {
          ['--slide-x', '--slide-y', '--slide-rotation', '--slide-scale', '--slide-z'].forEach((property) => slide.style.removeProperty(property));
        }

        slide.setAttribute('aria-hidden', String(!visible));
        slide.inert = !visible;
        const card = slide.querySelector('.service-card');
        if (card) card.setAttribute('aria-pressed', String(index === activeIndex));
      });

      tabs.forEach((tab, index) => tab.setAttribute('aria-selected', String(index === activeIndex)));
      dots.forEach((dot, index) => dot.setAttribute('aria-current', String(index === activeIndex)));

      const activeSlide = slides[activeIndex];
      if (activeTitle) activeTitle.textContent = activeSlide.dataset.title || '';
      if (activeDescription) activeDescription.textContent = activeSlide.dataset.description || '';
      if (activeNumber) activeNumber.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`;
    }

    function setActive(index) {
      activeIndex = modulo(index, slides.length);
      updateCarousel();
    }

    if (previous) previous.addEventListener('click', () => setActive(activeIndex - 1, false));
    if (next) next.addEventListener('click', () => setActive(activeIndex + 1, false));

    slides.forEach((slide, index) => {
      const card = slide.querySelector('.service-card');
      if (card) card.addEventListener('click', () => setActive(index));
    });
    tabs.forEach((tab) => tab.addEventListener('click', () => setActive(Number(tab.dataset.serviceTab))));
    dots.forEach((dot) => dot.addEventListener('click', () => setActive(Number(dot.dataset.serviceDot))));

    const stage = carousel.querySelector('.service-carousel-stage');
    let pointerStart = null;
    let suppressClickUntil = 0;

    if (stage) {
      stage.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        pointerStart = { x: event.clientX, y: event.clientY };
      });

      stage.addEventListener('pointerup', (event) => {
        if (!pointerStart) return;
        const deltaX = event.clientX - pointerStart.x;
        const deltaY = event.clientY - pointerStart.y;
        pointerStart = null;

        if (Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15) {
          setActive(activeIndex + (deltaX < 0 ? 1 : -1));
          suppressClickUntil = performance.now() + 500;
        }
      });

      stage.addEventListener('pointercancel', () => { pointerStart = null; });

      // Prevent a swipe from also activating the card that happened to be under the finger.
      stage.addEventListener('click', (event) => {
        if (performance.now() > suppressClickUntil) return;
        suppressClickUntil = 0;
        event.preventDefault();
        event.stopImmediatePropagation();
      }, true);

      stage.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight') { event.preventDefault(); setActive(activeIndex + 1); }
        if (event.key === 'ArrowLeft') { event.preventDefault(); setActive(activeIndex - 1); }
      });
      stage.tabIndex = 0;
    }

    if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', updateCarousel);
    else if (mobileQuery.addListener) mobileQuery.addListener(updateCarousel);
    window.addEventListener('resize', updateCarousel, { passive: true });

    updateCarousel();
  }
})();
