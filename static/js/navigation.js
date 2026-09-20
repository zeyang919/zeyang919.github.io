// Inlined in the document head so navigation works before optional enhancements load.
(() => {
    const closeMenu = () => {
        const menu = document.getElementById('navbarResponsive');
        const toggle = document.querySelector('#mainNav .navbar-toggler');
        if (menu && toggle) {
            menu.classList.remove('show');
            toggle.setAttribute('aria-expanded', 'false');
        }
    };

    document.addEventListener('click', event => {
        if (!(event.target instanceof Element)) return;
        const toggle = event.target.closest('#mainNav .navbar-toggler');
        if (toggle) {
            const expanded = document.getElementById('navbarResponsive').classList.toggle('show');
            toggle.setAttribute('aria-expanded', String(expanded));
        } else if (event.target.closest('#mainNav a[href^="#"]')
            && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            // Close synchronously before the browser performs native anchor navigation.
            closeMenu();
        }
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && event.target instanceof Element && event.target.closest('#mainNav')
            && document.getElementById('navbarResponsive').classList.contains('show')) {
            closeMenu();
            document.querySelector('#mainNav .navbar-toggler').focus();
        }
    });
    window.matchMedia('(min-width: 992px)').addEventListener('change', event => {
        if (event.matches) closeMenu();
    });

    // Apply only after the fallback-independent menu handlers are registered.
    document.documentElement.classList.add('navigation-ready');
})();
