import remarkGfm from 'remark-gfm';

interface MarkdownNode {
  type: string;
  value?: string;
  children?: MarkdownNode[];
}

const STRONG_OPEN_BOUNDARY = '\uE000strong-open\uE001';
const STRONG_CLOSE_BOUNDARY = '\uE000strong-close\uE001';
const PUNCTUATION_CHARACTER = /\p{P}/u;

function isEscaped(value: string, index: number) {
  let slashCount = 0;

  for (let cursor = index - 1; cursor >= 0 && value[cursor] === '\\'; cursor -= 1) {
    slashCount += 1;
  }

  return slashCount % 2 === 1;
}

function findStrongDelimiter(value: string, fromIndex: number) {
  let index = value.indexOf('**', fromIndex);

  while (index !== -1) {
    const isExactlyTwoAsterisks = value[index - 1] !== '*' && value[index + 2] !== '*';

    if (isExactlyTwoAsterisks && !isEscaped(value, index)) {
      return index;
    }

    index = value.indexOf('**', index + 2);
  }

  return -1;
}

function isWhitespace(value: string | undefined) {
  return value !== undefined && value.trim() === '';
}

/**
 * Gives punctuation-wrapped strong spans an unambiguous CommonMark boundary.
 * The temporary markers are removed from the AST before anything is rendered.
 */
export function prepareAIMessageMarkdown(source: string) {
  let prepared = '';
  let cursor = 0;
  let searchIndex = 0;

  while (searchIndex < source.length) {
    const openIndex = findStrongDelimiter(source, searchIndex);
    if (openIndex === -1) break;

    const closeIndex = findStrongDelimiter(source, openIndex + 2);
    if (closeIndex === -1) break;

    const content = source.slice(openIndex + 2, closeIndex);
    if (!content || content.trim() !== content) {
      searchIndex = closeIndex + 2;
      continue;
    }

    const previousCharacter = source[openIndex - 1];
    const nextCharacter = source[closeIndex + 2];
    const needsOpenBoundary =
      previousCharacter !== undefined &&
      !isWhitespace(previousCharacter) &&
      PUNCTUATION_CHARACTER.test(content[0]);
    const needsCloseBoundary =
      nextCharacter !== undefined &&
      !isWhitespace(nextCharacter) &&
      PUNCTUATION_CHARACTER.test(content[content.length - 1]);

    if (!needsOpenBoundary && !needsCloseBoundary) {
      searchIndex = closeIndex + 2;
      continue;
    }

    prepared += source.slice(cursor, openIndex);
    if (needsOpenBoundary) prepared += `${STRONG_OPEN_BOUNDARY} `;
    prepared += source.slice(openIndex, closeIndex + 2);
    if (needsCloseBoundary) prepared += ` ${STRONG_CLOSE_BOUNDARY}`;

    cursor = closeIndex + 2;
    searchIndex = cursor;
  }

  return cursor === 0 ? source : prepared + source.slice(cursor);
}

function stripBoundaryMarkers(node: MarkdownNode) {
  if (typeof node.value === 'string') {
    node.value = node.value
      .split(`${STRONG_OPEN_BOUNDARY} `)
      .join('')
      .split(` ${STRONG_CLOSE_BOUNDARY}`)
      .join('');
  }

  node.children?.forEach(stripBoundaryMarkers);
}

export function remarkStripStrongBoundaries() {
  return (tree: MarkdownNode) => stripBoundaryMarkers(tree);
}

export const AI_MARKDOWN_REMARK_PLUGINS = [remarkGfm, remarkStripStrongBoundaries];
