/* ═══════════════════════════════════════════════════
   VIOM CLEANING — SECTIONS JAVASCRIPT
   - Testimonial slider (drag + click + keyboard)
   - FAQ accordion
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ──────────────────────────────────────
       TESTIMONIAL SLIDER
    ────────────────────────────────────── */
    const track = document.getElementById('testiTrack');
    const cards = track ? Array.from(track.querySelectorAll('.testi-card')) : [];
    const dots = document.querySelectorAll('.testi-dot');
    const counter = document.getElementById('testiCounter');
    const btnPrev = document.getElementById('testiPrev');
    const btnNext = document.getElementById('testiNext');

    if (track && cards.length) {
        let current = 0;
        let autoplayTimer = null;
        let isDragging = false;
        let dragStartX = 0;
        let dragOffset = 0;

        /* How many cards visible at once */
        function visibleCount() {
            if (window.innerWidth <= 900) return 1;
            if (window.innerWidth <= 1100) return 2;
            return 3;
        }

        /* Card width as a fraction of track width */
        function cardWidth() {
            const gap = 20;
            const vis = visibleCount();
            const total = track.parentElement.offsetWidth;
            return (total - gap * (vis - 1)) / vis;
        }

        function totalSlides() {
            return Math.max(0, cards.length - visibleCount() + 1);
        }

        function clamp(n) {
            return Math.max(0, Math.min(n, totalSlides() - 1));
        }

        function goTo(index, animate = true) {
            current = clamp(index);
            const cw = cardWidth();
            const gap = 20;
            const move = current * (cw + gap);

            track.style.transition = animate
                ? 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'none';
            track.style.transform = `translateX(-${move}px)`;

            /* Update active card highlight */
            cards.forEach((c, i) => c.classList.toggle('active', i === current));

            /* Counter */
            if (counter) {
                const pad = n => String(n).padStart(2, '0');
                counter.textContent = `${pad(current + 1)} / ${pad(cards.length)}`;
            }

            /* Dots */
            dots.forEach((d, i) => d.classList.toggle('active', i === current));
        }

        /* Next / Prev */
        function next() { goTo(current + 1); }
        function prev() { goTo(current - 1); }

        if (btnNext) btnNext.addEventListener('click', () => { resetAutoplay(); next(); });
        if (btnPrev) btnPrev.addEventListener('click', () => { resetAutoplay(); prev(); });

        /* Dot clicks */
        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => { resetAutoplay(); goTo(i); });
        });

        /* Keyboard */
        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('testimonials')) return;
            if (e.key === 'ArrowRight') { resetAutoplay(); next(); }
            if (e.key === 'ArrowLeft') { resetAutoplay(); prev(); }
        });

        /* Drag / swipe */
        function onDragStart(e) {
            isDragging = true;
            dragStartX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
            track.style.transition = 'none';
        }

        function onDragMove(e) {
            if (!isDragging) return;
            const x = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
            dragOffset = x - dragStartX;
            const cw = cardWidth();
            const gap = 20;
            const base = current * (cw + gap);
            track.style.transform = `translateX(${-base + dragOffset}px)`;
        }

        function onDragEnd() {
            if (!isDragging) return;
            isDragging = false;
            const threshold = cardWidth() * 0.25;
            if (dragOffset < -threshold) { resetAutoplay(); next(); }
            else if (dragOffset > threshold) { resetAutoplay(); prev(); }
            else { goTo(current); }
            dragOffset = 0;
        }

        track.addEventListener('mousedown', onDragStart);
        track.addEventListener('touchstart', onDragStart, { passive: true });
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('touchmove', onDragMove, { passive: true });
        window.addEventListener('mouseup', onDragEnd);
        window.addEventListener('touchend', onDragEnd);

        /* Prevent link/img drag interference */
        track.querySelectorAll('a, img').forEach(el => {
            el.addEventListener('dragstart', e => e.preventDefault());
        });

        /* Autoplay */
        function startAutoplay() {
            autoplayTimer = setInterval(() => {
                goTo(current + 1 >= totalSlides() ? 0 : current + 1);
            }, 5000);
        }

        function resetAutoplay() {
            clearInterval(autoplayTimer);
            startAutoplay();
        }

        /* Resize handler — recalculate positions */
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                goTo(current, false);
            }, 100);
        });

        /* Init */
        goTo(0, false);
        startAutoplay();

        /* Pause on hover */
        const section = document.getElementById('testimonials');
        if (section) {
            section.addEventListener('mouseenter', () => clearInterval(autoplayTimer));
            section.addEventListener('mouseleave', startAutoplay);
        }
    }


    /* ──────────────────────────────────────
       FAQ ACCORDION
    ────────────────────────────────────── */
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const trigger = item.querySelector('.faq-trigger');
        const body = item.querySelector('.faq-body');
        const inner = item.querySelector('.faq-body p');

        if (!trigger || !body) return;

        trigger.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');

            /* Close all */
            faqItems.forEach(el => {
                el.classList.remove('open');
                el.querySelector('.faq-body').style.maxHeight = null;
            });

            /* Open clicked (if it was closed) */
            if (!isOpen) {
                item.classList.add('open');
                body.style.maxHeight = (inner ? inner.scrollHeight + 46 : body.scrollHeight) + 'px';
            }
        });

        /* Keyboard accessibility */
        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                trigger.click();
            }
        });
    });


    /* ──────────────────────────────────────
       SCROLL REVEAL (lightweight, no GSAP dep)
    ────────────────────────────────────── */
    if ('IntersectionObserver' in window) {
        const style = document.createElement('style');
        style.textContent = `
      .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.65s ease, transform 0.65s ease; }
      .reveal.visible { opacity: 1; transform: none; }
    `;
        document.head.appendChild(style);

        /* Tag elements to reveal */
        const revealSelectors = [
            '.service-card',
            '.trust-bar',
            '.testi-header',
            '.testi-track-wrap',
            '.faq-sidebar',
            '.faq-item',
        ];

        revealSelectors.forEach(sel => {
            document.querySelectorAll(sel).forEach((el, i) => {
                el.classList.add('reveal');
                el.style.transitionDelay = `${i * 0.08}s`;
            });
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    }

})();