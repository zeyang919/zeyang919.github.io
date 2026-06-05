

const content_dir = 'contents/'
const config_file = 'config.yml'
const scriptUrl = document.currentScript ? new URL(document.currentScript.src, document.baseURI) : null
const content_version = scriptUrl ? scriptUrl.searchParams.get('v') || Date.now().toString() : Date.now().toString()

const contentUrl = (path) => `${path}?v=${content_version}`

const themeStorageKey = 'theme'
const systemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
const storedTheme = () => {
    try {
        const theme = localStorage.getItem(themeStorageKey)
        return theme === 'dark' || theme === 'light' ? theme : null
    } catch {
        return null
    }
}
const activeTheme = () => storedTheme() || systemTheme()
const fetchText = (url) => fetch(url).then(response => {
    if (!response.ok) {
        throw new Error(`Could not load ${url}: ${response.status}`)
    }
    return response.text()
})
const prepareLinks = (root = document) => {
    root.querySelectorAll('a[href^="http://"], a[href^="https://"]').forEach(link => {
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
    })
}
const contentSectionName = (section) => section.id.replace(/-md$/, '')
const logUnknownConfigValue = (key, value) => console.log("Unknown id and value: " + key + "," + value.toString())

const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme
    const toggle = document.getElementById('theme-toggle')
    if (!toggle) {
        return
    }

    const isDark = theme === 'dark'
    toggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`)
    toggle.title = `Switch to ${isDark ? 'light' : 'dark'} theme`
    toggle.innerHTML = `<i class="bi ${isDark ? 'bi-sun-fill' : 'bi-moon-stars-fill'}" aria-hidden="true"></i>`
}


window.addEventListener('DOMContentLoaded', event => {
    applyTheme(activeTheme())
    prepareLinks()

    const themeToggle = document.getElementById('theme-toggle')
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
            try {
                localStorage.setItem(themeStorageKey, nextTheme)
            } catch {
                console.log('Theme preference could not be saved')
            }
            applyTheme(nextTheme)
        })
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (!storedTheme()) {
            applyTheme(systemTheme())
        }
    })

    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            offset: 74,
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });


    // Yaml
    fetchText(contentUrl(content_dir + config_file))
        .then(text => {
            const yml = jsyaml.load(text);
            Object.keys(yml).forEach(key => {
                const element = document.getElementById(key)
                if (!element) {
                    logUnknownConfigValue(key, yml[key])
                    return
                }
                try {
                    element.innerHTML = yml[key];
                } catch {
                    logUnknownConfigValue(key, yml[key])
                }

            })
        })
        .catch(error => console.log(error));


    // Marked
    marked.use({ mangle: false, headerIds: false })
    document.querySelectorAll('[id$="-md"]').forEach(section => {
        const name = contentSectionName(section)
        fetchText(contentUrl(content_dir + name + '.md'))
            .then(markdown => {
                const html = marked.parse(markdown);
                section.innerHTML = html;
                prepareLinks(section)
            }).then(() => {
                // MathJax
                if (window.MathJax && MathJax.typeset) {
                    MathJax.typeset();
                }
            })
            .catch(error => console.log(error));
    })

}); 
