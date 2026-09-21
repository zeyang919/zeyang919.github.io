# Vendored build dependencies

These libraries are used by `scripts/build.cjs` to generate `index.html`. They are
not loaded by the browser, and no package installation is required.

| Library | Version | Source | License |
| --- | --- | --- | --- |
| Marked | 5.1.0 | [GitHub](https://github.com/markedjs/marked/tree/v5.1.0) | [License](marked/LICENSE.md) |
| js-yaml | 4.1.0 | [GitHub](https://github.com/nodeca/js-yaml/tree/4.1.0) | [License](js-yaml/LICENSE) |

When upgrading a dependency, update its version and license here, regenerate the
site, and run the build tests before committing.
