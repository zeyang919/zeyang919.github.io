import { readFile, writeFile } from 'node:fs/promises'

const indexPath = new URL('../index.html', import.meta.url)
const homePath = new URL('../contents/home.md', import.meta.url)
const publicationsPath = new URL('../contents/publications.md', import.meta.url)

const externalLinkAttrs = ' target="_blank" rel="noopener noreferrer"'

const markdownLinksToHtml = (markdown) => markdown.replace(
  /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
  `<a href="$2"${externalLinkAttrs}>$1</a>`
)

const markdownParagraphsToHtml = (markdown) => markdown
  .replace(/<!--[\s\S]*?-->/g, '')
  .split(/\n{2,}/)
  .map((paragraph) => paragraph.trim())
  .filter(Boolean)
  .map((paragraph) => `                        <p>${markdownLinksToHtml(paragraph)}</p>`)
  .join('\n')

const addExternalLinkAttrs = (html) => html.replace(
  /<a href="(https?:\/\/[^"]+)"(?![^>]*\brel=)([^>]*)>/g,
  `<a href="$1"${externalLinkAttrs}$2>`
)

const indentLines = (value, spaces) => {
  const indent = ' '.repeat(spaces)
  return value
    .split('\n')
    .map((line) => line ? `${indent}${line}` : line)
    .join('\n')
}

const replaceBetween = (source, marker, replacement) => {
  const start = `<!-- ${marker}:start -->`
  const end = `<!-- ${marker}:end -->`
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`)
  if (!pattern.test(source)) {
    throw new Error(`Missing fallback marker pair: ${marker}`)
  }
  return source.replace(pattern, `${start}\n${replacement}\n${' '.repeat(16)}${end}`)
}

const index = await readFile(indexPath, 'utf8')
const homeFallback = markdownParagraphsToHtml(await readFile(homePath, 'utf8'))
const publicationsFallback = indentLines(addExternalLinkAttrs(await readFile(publicationsPath, 'utf8')).trim(), 16)

const updated = replaceBetween(
  replaceBetween(index, 'fallback-home', homeFallback),
  'fallback-publications',
  publicationsFallback
)

await writeFile(indexPath, updated)
