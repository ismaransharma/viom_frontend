/* ═══════════════════════════════════════════════════
   VIOM CLEANING — MAIN SCRIPT
   script.js
   ═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {
    gsap.registerPlugin(ScrollTrigger);

    // ── Mobile menu ──
    document.getElementById('menu-toggle').addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.toggle('hidden');
    });

    // ── Hero entrance ──
    const heroTl = gsap.timeline();
    heroTl.to('#heroContent', { opacity: 1, duration: 0.1 });
    heroTl.from('.hero-item', { y: 50, opacity: 0, duration: 1, stagger: 0.15, ease: 'power4.out' });

    // ── How It Works ──
    gsap.timeline({ scrollTrigger: { trigger: '#howitworks', start: 'top 80%' } })
        .fromTo('#howitworksHeader', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' })
        .fromTo('.how-it-works-item', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.2, ease: 'back.out(1.7)' }, '-=0.4');

    // ── About Us ──
    gsap.timeline({ scrollTrigger: { trigger: '#about-us', start: 'top 70%' } })
        .fromTo('.about-text', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out' });

    // ── Services scroll reveal ──
    gsap.fromTo('.service-card, .trust-bar',
        { y: 60, opacity: 0, scale: 0.95 },
        {
            y: 0, opacity: 1, scale: 1, duration: 1, stagger: 0.12, ease: 'expo.out',
            scrollTrigger: { trigger: '#services', start: 'top 80%' },
            onComplete: () => gsap.set('.service-card, .trust-bar', { clearProps: 'transform' })
        }
    );

    // ── Quote form ──
    gsap.fromTo('.quote-reveal',
        { y: 60, opacity: 0 },
        {
            y: 0, opacity: 1, duration: 1.2, stagger: 0.1, ease: 'power4.out',
            scrollTrigger: { trigger: '#get-quote', start: 'top 80%' },
            onComplete: () => gsap.set('.quote-reveal', { clearProps: 'transform' })
        }
    );

    // ── Testimonials reveal ──
    if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
            });
        }, { threshold: 0.15 });
        document.querySelectorAll('#testimonials .testi-reveal').forEach((el, i) => {
            el.style.transitionDelay = (i * 0.12) + 's';
            obs.observe(el);
        });
    } else {
        document.querySelectorAll('#testimonials .testi-reveal').forEach(el => el.classList.add('visible'));
    }

    // ── Testimonials Swiper ──
    const dots = document.querySelectorAll('.testi-dot');

    function updateDots(index) {
        dots.forEach((d, i) => d.classList.toggle('active', i === index));
    }

    const testiSwiper = new Swiper('.testiSwiper', {
        slidesPerView: 1,
        spaceBetween: 20,
        loop: false,
        rewind: true,
        autoplay: { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true },
        navigation: { nextEl: '#testiNext', prevEl: '#testiPrev' },
        breakpoints: {
            640: { slidesPerView: 1.2, spaceBetween: 20 },
            900: { slidesPerView: 2, spaceBetween: 20 },
            1200: { slidesPerView: 2.5, spaceBetween: 20 },
        },
        on: {
            slideChange: function () { updateDots(this.realIndex); }
        }
    });

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            testiSwiper.slideTo(i);
            updateDots(i);
        });
    });

    // ── FAQ Accordion ──
    document.querySelectorAll('.faq-item').forEach(item => {
        const trigger = item.querySelector('.faq-trigger');
        const body = item.querySelector('.faq-body');
        const inner = item.querySelector('.faq-body p');

        trigger.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');

            // Close all
            document.querySelectorAll('.faq-item.open').forEach(el => {
                el.classList.remove('open');
                el.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
                el.querySelector('.faq-body').style.maxHeight = null;
            });

            // Open clicked (if it was closed)
            if (!isOpen) {
                item.classList.add('open');
                trigger.setAttribute('aria-expanded', 'true');
                body.style.maxHeight = (inner ? inner.scrollHeight + 46 : body.scrollHeight) + 'px';
            }
        });

        // Keyboard support
        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                trigger.click();
            }
        });
    });

});