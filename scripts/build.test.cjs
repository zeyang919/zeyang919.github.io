const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { renderSite } = require('./build.cjs');

const root = path.resolve(__dirname, '..');
function fixture(t) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'personal-site-'));
    for (const folder of ['templates', 'contents']) {
        fs.cpSync(path.join(root, folder), path.join(directory, folder), { recursive: true });
    }
    fs.mkdirSync(path.join(directory, 'static/js'), { recursive: true });
    fs.copyFileSync(path.join(root, 'static/js/navigation.js'), path.join(directory, 'static/js/navigation.js'));
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    return directory;
}

test('published HTML includes all content and needs no runtime content requests', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.equal(html, renderSite(), 'Regenerate index.html after editing source content.');
    for (const text of ['I am a Ph.D. candidate', 'LLMParser', 'fast-tracked', 'Journal Reviewer', 'CAPS Award']) {
        assert.ok(html.includes(text), `Missing pre-rendered content: ${text}`);
    }
    assert.doesNotMatch(html, /<script[^>]+src="[^"]*(?:marked|js-yaml|tex-svg|bootstrap)/);
    assert.doesNotMatch(html, /\{\{\s*(config|content|script):/);
});

test('external links are safe in the generated page without JavaScript', () => {
    const anchors = renderSite().match(/<a\b[^>]*>/g);
    for (const anchor of anchors.filter(tag => /href="https?:/.test(tag))) {
        assert.match(anchor, /target="_blank"/);
        assert.match(anchor, /rel="noopener noreferrer"/);
    }
    assert.match(renderSite(), /<a href="paper\/LLMParser.pdf">/);
});

test('missing content fails generation instead of publishing an empty section', t => {
    const directory = fixture(t);
    fs.unlinkSync(path.join(directory, 'contents/service.md'));
    assert.throws(() => renderSite(directory), /service\.md/);
});

test('unused config keys fail generation', t => {
    const directory = fixture(t);
    fs.appendFileSync(path.join(directory, 'contents/config.yml'), '\ntimezone: America/Toronto\n');
    assert.throws(() => renderSite(directory), /Unused config key: timezone/);
});

test('invalid YAML, missing values and invalid config types fail generation', t => {
    const directory = fixture(t);
    const file = path.join(directory, 'contents/config.yml');
    for (const config of ['title: [', '', '- title', 'title: 42', 'title: Zeyang Ma']) {
        fs.writeFileSync(file, config);
        assert.throws(() => renderSite(directory));
    }
});

test('content placeholders require matching DOM containers', t => {
    const directory = fixture(t);
    const file = path.join(directory, 'templates/index.html');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('id="service-md"', 'id="wrong-id"'));
    assert.throws(() => renderSite(directory), /Missing DOM id for content:service/);
});

test('new Markdown entries and external links are included at generation time', t => {
    const directory = fixture(t);
    fs.appendFileSync(path.join(directory, 'contents/service.md'), '\n### New service entry\n\n[Organization](https://example.org/)\n');
    const html = renderSite(directory);
    assert.match(html, /<h3>New service entry<\/h3>/);
    assert.match(html, /<a href="https:\/\/example.org\/" target="_blank" rel="noopener noreferrer">Organization<\/a>/);
});

test('malformed placeholders fail generation', t => {
    const directory = fixture(t);
    const file = path.join(directory, 'templates/index.html');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('{{ content:service }}', '{{ content:bad.name }}'));
    assert.throws(() => renderSite(directory), /Unresolved template placeholder/);
});
