async (page) => {
    // Run through Playwright CLI with the local site already open.
    const origin = await page.evaluate(() => location.origin);
    const browser = page.context().browser();
    const contexts = [];
    const results = [];
    const pageErrors = [];
    const check = (condition, message) => {
        if (!condition) throw new Error(message);
    };
    const openContext = async (options = {}) => {
        const context = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce', ...options });
        context.on('page', tab => tab.on('pageerror', error => pageErrors.push(error.message)));
        contexts.push(context);
        return context;
    };

    try {
        const normal = await (await openContext()).newPage();
        await normal.goto(`${origin}/#publications`);
        await normal.waitForFunction(() => Math.abs(document.querySelector('#publications').getBoundingClientRect().top
            - parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)) < 3, null, { timeout: 5000 })
            .catch(async error => {
                const state = await normal.evaluate(() => ({ y: scrollY, top: document.querySelector('#publications').getBoundingClientRect().top,
                    padding: getComputedStyle(document.documentElement).scrollPaddingTop }));
                throw new Error(`Initial fragment failed: ${JSON.stringify(state)}; ${error.message}`);
            });
        await normal.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }));
        await normal.waitForTimeout(100);
        await normal.reload();
        await normal.waitForTimeout(200);
        const reloadPosition = await normal.evaluate(() => scrollY);
        check(Math.abs(reloadPosition - 1500) < 2, `Reload lost reading position: ${reloadPosition}`);
        await normal.goto(`${origin}/?away=1`);
        await normal.goBack();
        await normal.waitForTimeout(200);
        const backPosition = await normal.evaluate(() => scrollY);
        check(Math.abs(backPosition - 1500) < 2, `Back navigation lost reading position: ${backPosition}`);
        await normal.goForward();
        await normal.waitForTimeout(200);
        check(await normal.evaluate(() => scrollY) === 0, 'Forward navigation restored the wrong page position');
        results.push({ reloadPosition, backPosition });

        const headingLevels = await normal.locator('#service h2, #service h3, #service h4, #service h5').evaluateAll(
            headings => headings.map(heading => Number(heading.tagName.slice(1)))
        );
        check(headingLevels.length > 1 && headingLevels[0] === 2, 'Missing SERVICE heading hierarchy');
        check(headingLevels.every((level, i) => i === 0 || level <= headingLevels[i - 1] + 1), 'SERVICE headings skip a level');
        results.push({ headingLevels });

        for (const width of [375, 1200]) {
            const context = await openContext({ viewport: { width, height: 812 } });
            await context.addInitScript(() => {
                window.layoutShifts = [];
                new PerformanceObserver(list => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) window.layoutShifts.push(entry.value);
                    }
                }).observe({ type: 'layout-shift', buffered: true });
            });
            const slow = await context.newPage();
            await slow.route('**/static/js/scripts.js*', async route => {
                await slow.waitForTimeout(2200);
                await route.continue();
            });
            await slow.goto(origin, { waitUntil: 'commit' });
            await slow.locator('#home-subtitle').waitFor();
            const before = await slow.locator('#home-subtitle').boundingBox();
            check(await slow.locator('#theme-toggle').isHidden(), 'Slow-load probe started after the delayed script ran');
            await slow.locator('#theme-toggle').waitFor();
            await slow.waitForTimeout(100);
            const after = await slow.locator('#home-subtitle').boundingBox();
            const shift = Math.abs(after.y - before.y);
            const cls = await slow.evaluate(() => window.layoutShifts.reduce((sum, value) => sum + value, 0));
            check(shift < 2, `Delayed script moved content ${shift}px at width ${width}`);
            check(cls < 0.02, `Unexpected initial layout shifts at width ${width}: ${cls}`);
            results.push({ width, shift, cls });
        }

        for (const javascriptDisabled of [false, true]) {
            const fallback = await (await openContext({ javaScriptEnabled: !javascriptDisabled })).newPage();
            if (!javascriptDisabled) await fallback.route('**/static/js/scripts.js*', route => route.abort());
            await fallback.goto(origin);
            if (!javascriptDisabled) await fallback.getByRole('button', { name: 'Toggle navigation' }).click();
            await fallback.getByRole('link', { name: 'SERVICE', exact: true }).click();
            const top = await fallback.locator('#service').evaluate(section => section.getBoundingClientRect().top);
            check(top >= -1 && top < 100, 'Fallback navigation failed to reach SERVICE');
            check(await fallback.locator('.publication-card').count() > 0, 'Fallback lost publication content');
            results.push({ fallback: javascriptDisabled ? 'no JavaScript' : 'external script blocked', top });
        }

        const responsive = await (await openContext()).newPage();
        for (const width of [320, 375, 736, 737, 991, 992, 1200, 1440]) {
            await responsive.setViewportSize({ width, height: 812 });
            await responsive.goto(origin);
            const layout = await responsive.evaluate(() => {
                const icons = document.querySelector('.social-icons').getBoundingClientRect();
                const heading = document.querySelector('#home-subtitle').getBoundingClientRect();
                return {
                    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                    overlap: icons.left < heading.right && icons.right > heading.left
                        && icons.top < heading.bottom && icons.bottom > heading.top,
                };
            });
            check(!layout.overflow && !layout.overlap, `Invalid layout at ${width}px: ${JSON.stringify(layout)}`);
            for (const name of ['PUBLICATIONS', 'EDUCATION', 'SERVICE', 'AWARDS', 'HOME']) {
                const toggle = responsive.getByRole('button', { name: 'Toggle navigation' });
                if (await toggle.isVisible()) await toggle.click();
                await responsive.getByRole('link', { name, exact: true }).click();
                await responsive.waitForFunction(expected => document.querySelector('.nav-link.active')?.textContent === expected,
                    name, { timeout: 5000 }).catch(async error => {
                        const state = await responsive.evaluate(() => ({ hash: location.hash, y: scrollY,
                            top: document.querySelector(location.hash)?.getBoundingClientRect().top,
                            active: document.querySelector('.nav-link.active')?.textContent,
                            padding: getComputedStyle(document.documentElement).scrollPaddingTop }));
                        throw new Error(`Navigation failed at ${width}px for ${name}: ${JSON.stringify(state)}; ${error.message}`);
                    });
                const position = await responsive.evaluate(() => ({
                    top: document.querySelector(location.hash).getBoundingClientRect().top,
                    header: document.querySelector('#mainNav').getBoundingClientRect().bottom,
                    expanded: document.querySelector('.navbar-toggler').getAttribute('aria-expanded'),
                    scrollY,
                }));
                check(position.expanded === 'false', `Menu remained open at ${width}px`);
                check(name === 'HOME' ? position.scrollY === 0 : position.top >= position.header - 1,
                    `${name} is hidden by the header at ${width}px`);
            }
            results.push({ width, navigation: 'passed' });
        }

        await responsive.setViewportSize({ width: 375, height: 812 });
        await responsive.getByRole('button', { name: 'Toggle navigation' }).click();
        await responsive.keyboard.press('Escape');
        check(await responsive.locator('.navbar-toggler').evaluate(button => document.activeElement === button
            && button.getAttribute('aria-expanded') === 'false'), 'Escape did not close the menu and restore focus');
        await responsive.getByRole('button', { name: 'Switch to dark theme' }).click();
        await responsive.reload();
        check(await responsive.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'Theme was not saved');
        results.push({ keyboardAndTheme: 'passed' });
        check(pageErrors.length === 0, `Browser exceptions: ${pageErrors.join('; ')}`);
        return results;
    } finally {
        for (const context of contexts) await context.close();
    }
}
