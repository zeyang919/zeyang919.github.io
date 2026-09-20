# Vendored build dependencies

These checked-in libraries are used only by `scripts/build.cjs`. The browser does
not load them, and generating the site requires no package installation or network
access. The existing library files were moved here without modification.

| Library | Version | Local file | Upstream release | License |
| --- | --- | --- | --- | --- |
| Marked | 5.1.0 | [marked.min.js](marked/marked.min.js) | [v5.1.0](https://github.com/markedjs/marked/tree/v5.1.0) | [Original notices](marked/LICENSE.md): MIT for Marked, plus the upstream Markdown notice |
| js-yaml | 4.1.0 | [js-yaml.min.js](js-yaml/js-yaml.min.js) | [4.1.0](https://github.com/nodeca/js-yaml/tree/4.1.0) | [MIT](js-yaml/LICENSE) |

The license files are copied from the corresponding tagged upstream sources:

- [Marked v5.1.0 LICENSE.md](https://raw.githubusercontent.com/markedjs/marked/v5.1.0/LICENSE.md)
- [js-yaml 4.1.0 LICENSE](https://raw.githubusercontent.com/nodeca/js-yaml/4.1.0/LICENSE)

## File integrity

SHA-256 checksums of the checked-in JavaScript files:

```text
4d4bf2717e7b3a1f002a8fc8b931616dfd28101cc1b0f4529ea623bc86e650c8  marked/marked.min.js
4b9d5561407d44382ca0612380e9f349470237acf6812a85948004aa188ee35d  js-yaml/js-yaml.min.js
```

When intentionally upgrading a dependency, update its version, source link,
license, and checksum here, then run `node scripts/build.cjs`,
`node --test scripts/build.test.cjs`, and `node scripts/build.cjs --check`.
Review any generated HTML differences before committing.
