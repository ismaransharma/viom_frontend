/* ═══════════════════════════════════════════════════
   VIOM CLEANING — DUST WIPE ANIMATION ENGINE
   dust.js
   ═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ─────────────────────────────────────────────────
       CONFIG
    ───────────────────────────────────────────────── */
    const CONFIG = {
        idleDelay: 1200,
        dustToClothDelay: 3500,
        scrubDuration: 1200,      // how long the cloth scrubs (ms)
        shineDelay: 1200,          // ms after cloth starts
        shineDuration: 1100,      // ms shine stays
        maxDustPerSection: 2,
        particleCount: { min: 10, max: 20 },
        clusterW: 70,
        clusterH: 30,
        clothW: 90,
        clothH: 52,
        viewportMargin: 0.15,
    };

    /* ─────────────────────────────────────────────────
       STATE
    ───────────────────────────────────────────────── */
    const firedSections = new Set();
    let scrollTimer = null;
    let lastScrollY = window.scrollY;
    let isAnimating = false;
    let lastEmitX = -9999; // not used here but kept for consistency

    /* ─────────────────────────────────────────────────
       UTILITY
    ───────────────────────────────────────────────── */
    function rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    function randInt(min, max) {
        return Math.floor(rand(min, max + 1));
    }

    function clamp(val, min, max) {
        return Math.min(Math.max(val, min), max);
    }

    /* ─────────────────────────────────────────────────
       PICK RANDOM POSITION INSIDE SECTION
    ───────────────────────────────────────────────── */
    function pickPosition(sectionRect, usedRects) {
        const margin = CONFIG.viewportMargin;
        const padX = sectionRect.width * margin;
        const padY = sectionRect.height * margin;

        const minX = padX;
        const maxX = sectionRect.width - padX - CONFIG.clusterW;
        const minY = padY;
        const maxY = sectionRect.height - padY - CONFIG.clusterH;

        if (maxX <= minX || maxY <= minY) return null;

        let tries = 0;
        while (tries < 25) {
            const x = rand(minX, maxX);
            const y = rand(minY, maxY);

            const tooClose = usedRects.some(r =>
                Math.abs(r.x - x) < 120 && Math.abs(r.y - y) < 60
            );

            if (!tooClose) {
                usedRects.push({ x, y });
                return { x, y };
            }
            tries++;
        }
        return null;
    }

    /* ─────────────────────────────────────────────────
       BUILD DUST CLUSTER (sand grains + micro)
    ───────────────────────────────────────────────── */
    function buildDustCluster(section, x, y) {
        const cluster = document.createElement('div');
        cluster.className = 'dust-cluster';
        cluster.style.left = x + 'px';
        cluster.style.top = y + 'px';
        cluster.style.width = CONFIG.clusterW + 'px';
        cluster.style.height = CONFIG.clusterH + 'px';

        const count = randInt(CONFIG.particleCount.min, CONFIG.particleCount.max);

        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'dust-particle';

            const distFromCentre = Math.abs((i / count) - 0.5) * 2;
            const size = rand(4, 12) * (1 - distFromCentre * 0.4);
            const px = rand(0, CONFIG.clusterW - size);
            const py = rand(CONFIG.clusterH * 0.2, CONFIG.clusterH - size);
            const delay = rand(0, 0.35);
            const dur = rand(0.5, 0.85);
            const rotation = rand(-25, 25);

            // Wind parameters
            const gustDur = rand(1.8, 3.2);
            const gustDelay = rand(0.4, 1.4); // start after fade-in
            const gx1 = rand(-10, 10);
            const gy1 = rand(-8, 4);
            const gx2 = rand(-8, 8);
            const gy2 = rand(-4, 6);
            const gx3 = rand(-6, 6);
            const gy3 = rand(-5, 3);

            p.style.cssText = `
                width: ${size}px;
                height: ${size * rand(0.5, 0.85)}px;
                left: ${px}px;
                top: ${py}px;
                --settle-delay: ${delay}s;
                --settle-dur: ${dur}s;
                --r: ${rotation}deg;
                --gust-dur: ${gustDur}s;
                --gust-delay: ${gustDelay}s;
                --gx1: ${gx1}px;
                --gy1: ${gy1}px;
                --gx2: ${gx2}px;
                --gy2: ${gy2}px;
                --gx3: ${gx3}px;
                --gy3: ${gy3}px;
            `;
            cluster.appendChild(p);
        }

        // Micro floating particles
        const microCount = randInt(3, 5);
        for (let i = 0; i < microCount; i++) {
            const m = document.createElement('div');
            m.className = 'dust-micro';
            const sz = rand(1.5, 4);
            const mx = rand(-8, CONFIG.clusterW + 8);
            const my = rand(-8, CONFIG.clusterH + 4);
            const floatDelay = rand(0, 0.5);
            const floatDur = rand(0.9, 1.5);
            const fx = rand(-28, 28);
            const fy = rand(-30, -8);
            const microWindDur = rand(1.5, 2.5);
            const microWindDelay = rand(0, 0.8);
            const mmx = rand(-6, 6);
            const mmy = rand(-6, 2);

            m.style.cssText = `
                width: ${sz}px;
                height: ${sz}px;
                left: ${mx}px;
                top: ${my}px;
                --float-delay: ${floatDelay}s;
                --float-dur: ${floatDur}s;
                --fx: ${fx}px;
                --fy: ${fy}px;
                --micro-wind-dur: ${microWindDur}s;
                --micro-wind-delay: ${microWindDelay}s;
                --mx: ${mmx}px;
                --my: ${mmy}px;
            `;
            cluster.appendChild(m);
        }

        section.appendChild(cluster);
        return cluster;
    }

    /* ─────────────────────────────────────────────────
       BUILD CLOTH
    ───────────────────────────────────────────────── */
    function buildCloth(section) {
        const cloth = document.createElement('div');
        cloth.className = 'dust-cloth';
        section.appendChild(cloth);
        return cloth;
    }

    /* ─────────────────────────────────────────────────
       BUILD SHINE (central gleam + 3 flares + sparkle swarm)
    ───────────────────────────────────────────────── */
    function buildShine(section, cx, cy) {
        const shine = document.createElement('div');
        shine.className = 'dust-shine';
        shine.style.left = cx + 'px';
        shine.style.top = cy + 'px';

        /* Generate more sparkles (20) — all small, bright white */
        const sparkCount = 20;
        const containerSize = 70;   // a little bigger to give them breathing room
        shine.style.width = containerSize + 'px';
        shine.style.height = containerSize + 'px';
        shine.style.marginLeft = (containerSize / -2) + 'px';
        shine.style.marginTop = (containerSize / -2) + 'px';

        for (let i = 0; i < sparkCount; i++) {
            // Random position inside a circular area
            const angle = Math.random() * Math.PI * 2;
            const radius = 5 + Math.random() * (containerSize / 2 - 5);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            const spark = document.createElement('div');
            spark.className = 'shine-sparkle';
            spark.style.setProperty('--sp-size', (3 + Math.random() * 4) + 'px'); // 3‑7px
            spark.style.setProperty('--sp-delay', (Math.random() * 0.3).toFixed(2) + 's');
            spark.style.setProperty('--sp-dur', (0.35 + Math.random() * 0.35).toFixed(2) + 's');
            spark.style.setProperty('--sp-move-x', x + 'px');
            spark.style.setProperty('--sp-move-y', y + 'px');
            spark.style.left = '50%';
            spark.style.top = '50%';

            // Two inner spans for the 4‑point shape
            for (let j = 0; j < 2; j++) {
                spark.appendChild(document.createElement('span'));
            }

            shine.appendChild(spark);
        }

        section.appendChild(shine);
        return shine;
    }

    /* ─────────────────────────────────────────────────
       ANIMATE ONE CLUSTER: sand blowing → cloth scrub → shine
    ───────────────────────────────────────────────── */
    function animateCluster(section, clusterX, clusterY, onComplete) {
        // 1. Build and show dust (wind starts automatically)
        const cluster = buildDustCluster(section, clusterX, clusterY);

        // 2. After dust settles a bit, cloth scrubs over it
        setTimeout(() => {
            const cloth = buildCloth(section);

            const clothW = parseFloat(CONFIG.clothW);
            const clothH = parseFloat(CONFIG.clothH);
            const clusterW = CONFIG.clusterW;
            const clusterH = CONFIG.clusterH;

            // Cloth starts at left edge of cluster, scrubs to the right
            const startX = clusterX;
            const scrubRange = clusterW * 0.8;  // scrub 80% of cluster width
            const topY = clusterY + (clusterH / 2) - (clothH / 2);

            cloth.style.left = startX + 'px';
            cloth.style.top = topY + 'px';
            cloth.style.setProperty('--scrub-range', scrubRange + 'px');
            cloth.style.setProperty('--scrub-dur', (CONFIG.scrubDuration / 1000) + 's');
            cloth.classList.add('scrub');

            // 3. Shine after scrubbing starts
            setTimeout(() => {
                const shineCX = clusterX + clusterW / 2;
                const shineCY = clusterY + clusterH / 2;
                const shine = buildShine(section, shineCX, shineCY);

                // Remove shine later
                setTimeout(() => shine.remove(), CONFIG.shineDuration);
            }, CONFIG.shineDelay);

            // 4. Hide dust cluster when cloth has mostly passed
            setTimeout(() => {
                cluster.classList.add('wiped');
            }, 600);

            // 5. Cleanup everything
            setTimeout(() => {
                cluster.remove();
                cloth.remove();
                if (onComplete) onComplete();
            }, CONFIG.scrubDuration + 400);

        }, CONFIG.dustToClothDelay);
    }

    /* ─────────────────────────────────────────────────
       TRIGGER DUST FOR A SECTION
    ───────────────────────────────────────────────── */
    function triggerSection(section) {
        if (firedSections.has(section) || isAnimating) return;
        firedSections.add(section);
        isAnimating = true;

        const sectionW = section.offsetWidth;
        const sectionH = section.offsetHeight;

        const clusterCount = randInt(1, CONFIG.maxDustPerSection);
        const usedRects = [];
        const positions = [];

        for (let i = 0; i < clusterCount; i++) {
            const pos = pickPosition({ width: sectionW, height: sectionH }, usedRects);
            if (pos) positions.push(pos);
        }

        if (positions.length === 0) {
            isAnimating = false;
            return;
        }

        let completed = 0;
        const total = positions.length;

        positions.forEach((pos, i) => {
            const staggerDelay = i * 350;
            setTimeout(() => {
                animateCluster(section, pos.x, pos.y, () => {
                    completed++;
                    if (completed >= total) {
                        isAnimating = false;
                    }
                });
            }, staggerDelay);
        });
    }

    /* ─────────────────────────────────────────────────
       FIND VISIBLE SECTION
    ───────────────────────────────────────────────── */
    function findCandidateSection() {
        const sections = document.querySelectorAll('.dust-section');
        const vTop = window.scrollY;
        const vBottom = vTop + window.innerHeight;
        const vMid = vTop + window.innerHeight * 0.5;

        let best = null;
        let bestScore = Infinity;

        sections.forEach(section => {
            if (firedSections.has(section)) return;

            const rect = section.getBoundingClientRect();
            const secTop = rect.top + window.scrollY;
            const secBottom = secTop + rect.height;

            const visibleTop = Math.max(secTop, vTop);
            const visibleBottom = Math.min(secBottom, vBottom);
            const visibleH = visibleBottom - visibleTop;
            const visibleRatio = visibleH / rect.height;

            if (visibleRatio < 0.35) return;

            const secMid = secTop + rect.height / 2;
            const score = Math.abs(secMid - vMid);

            if (score < bestScore) {
                bestScore = score;
                best = section;
            }
        });

        return best;
    }

    /* ─────────────────────────────────────────────────
       SCROLL IDLE DETECTION
    ───────────────────────────────────────────────── */
    let lastScrollTime = 0;
    let idleCheckTimer = null;

    function onScroll() {
        lastScrollTime = Date.now();
        clearTimeout(idleCheckTimer);

        idleCheckTimer = setTimeout(() => {
            const timeSinceScroll = Date.now() - lastScrollTime;
            if (timeSinceScroll >= CONFIG.idleDelay - 50) {
                const candidate = findCandidateSection();
                if (candidate) {
                    triggerSection(candidate);
                }
            }
        }, CONFIG.idleDelay);
    }

    /* ─────────────────────────────────────────────────
       INIT
    ───────────────────────────────────────────────── */
    function init() {
        document.querySelectorAll('.dust-section').forEach(s => {
            s.style.position = 'relative';
        });

        window.addEventListener('scroll', onScroll, { passive: true });

        setTimeout(() => {
            const candidate = findCandidateSection();
            if (candidate) triggerSection(candidate);
        }, CONFIG.idleDelay + 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();