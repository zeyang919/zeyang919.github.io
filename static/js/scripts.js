(() => {
    const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const themeToggle = document.getElementById('theme-toggle');
    let selectedTheme = null;
    try {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark' || saved === 'light') selectedTheme = saved;
    } catch {
        // Keep the selection in memory when browser storage is unavailable.
    }

    const applyTheme = () => {
        const theme = selectedTheme || (themeQuery.matches ? 'dark' : 'light');
        document.documentElement.dataset.theme = theme;
        const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`;
        themeToggle.setAttribute('aria-label', label);
        themeToggle.title = label;
        themeToggle.innerHTML = `<i class="bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-stars-fill'}" aria-hidden="true"></i>`;
    };
    themeToggle.addEventListener('click', () => {
        selectedTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        try {
            localStorage.setItem('theme', selectedTheme);
        } catch {
            // The current tab still remembers the user's choice.
        }
        applyTheme();
    });
    themeQuery.addEventListener('change', applyTheme);
    applyTheme();
    themeToggle.hidden = false;

    const nav = document.getElementById('mainNav');
    const menu = document.getElementById('navbarResponsive');
    const menuToggle = nav.querySelector('.navbar-toggler');
    const links = [...menu.querySelectorAll('.nav-link')];
    const targets = links.map(link => document.getElementById(link.hash.slice(1)));
    let navOffset = 0;
    let framePending = false;

    const updateNavigation = () => {
        framePending = false;
        const navRect = nav.getBoundingClientRect();
        const navStyle = getComputedStyle(nav);
        // Measure the control row, excluding the expanded mobile menu.
        const controls = [nav.querySelector('.navbar-brand'), themeToggle, menuToggle];
        const bottom = Math.max(...controls.map(control => control.getBoundingClientRect().bottom));
        navOffset = Math.ceil(bottom - navRect.top + parseFloat(navStyle.paddingBottom)
            + parseFloat(navStyle.borderBottomWidth)) + 8;
        document.documentElement.style.setProperty('--nav-offset', `${navOffset}px`);

        let activeIndex = 0;
        targets.forEach((target, index) => {
            if (index > 0 && target.getBoundingClientRect().top <= navOffset + 1) activeIndex = index;
        });
        if (window.scrollY > 0 && Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight) {
            activeIndex = links.length - 1;
        }
        links.forEach((link, index) => {
            const active = index === activeIndex;
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
    };
    const scheduleUpdate = () => {
        if (!framePending) {
            framePending = true;
            requestAnimationFrame(updateNavigation);
        }
    };

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('hashchange', scheduleUpdate);
    window.addEventListener('pageshow', scheduleUpdate);
    if ('ResizeObserver' in window) {
        const observer = new ResizeObserver(scheduleUpdate);
        observer.observe(nav);
        observer.observe(document.body);
    }

    updateNavigation();
    // Leave initial fragments and reload/history scroll restoration to the browser.
})();
