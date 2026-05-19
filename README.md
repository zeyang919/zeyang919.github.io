Repo for Zeyang Ma's personal website. https://zeyang919.github.io

## Maintenance

Update the source content in `contents/`. After changing `contents/home.md` or
`contents/publications.md`, run:

```sh
node scripts/build-fallback.mjs
```

This keeps the static HTML fallback in `index.html` in sync for crawlers and
non-JavaScript visitors.
