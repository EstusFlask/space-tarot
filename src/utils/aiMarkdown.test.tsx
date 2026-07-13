import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import { AI_MARKDOWN_REMARK_PLUGINS, prepareAIMessageMarkdown } from './aiMarkdown';

function renderMarkdown(markdown: string) {
  return renderToStaticMarkup(
    createElement(ReactMarkdown, {
      remarkPlugins: AI_MARKDOWN_REMARK_PLUGINS,
      children: prepareAIMessageMarkdown(markdown),
    }),
  );
}

test('renders quoted strong text when it touches surrounding prose', () => {
  const quotePairs = [
    ['"', '"'],
    ["'", "'"],
    ['“', '”'],
    ['‘', '’'],
    ['「', '」'],
    ['『', '』'],
    ['【', '】'],
    ['（', '）'],
    ['《', '》'],
    ['〔', '〕'],
    ['〖', '〗'],
    ['«', '»'],
  ];

  for (const [openQuote, closeQuote] of quotePairs) {
    const html = renderMarkdown(`前文**${openQuote}abc${closeQuote}**后文`);
    const encodeQuote = (quote: string) => (quote === '"' ? '&quot;' : quote === "'" ? '&#x27;' : quote);

    assert.ok(html.includes(`<strong>${encodeQuote(openQuote)}abc${encodeQuote(closeQuote)}</strong>`));
    assert.doesNotMatch(html, /\*\*/);
  }
});

test('repairs plain intraword strong text and multiple spans', () => {
  const html = renderMarkdown('before**first**middle**「second」**after，中文**“third”**继续');

  assert.equal(
    html,
    '<p>before<strong>first</strong>middle<strong>「second」</strong>after，中文<strong>“third”</strong>继续</p>',
  );
});

test('supports inline markdown inside punctuation-wrapped strong text', () => {
  const html = renderMarkdown('前文**「[abc](https://example.com)」**后文');

  assert.equal(html, '<p>前文<strong>「<a href="https://example.com">abc</a>」</strong>后文</p>');
});

test('leaves intentionally escaped asterisks and code untouched', () => {
  assert.equal(renderMarkdown('前文\\*\\*「abc」\\*\\*后文'), '<p>前文**「abc」**后文</p>');
  assert.equal(renderMarkdown('`前文**「abc」**后文`'), '<p><code>前文**「abc」**后文</code></p>');
  assert.match(renderMarkdown('```txt\n前文**「abc」**后文\n```'), /<code class="language-txt">前文\*\*「abc」\*\*后文/);
});

test('keeps standard emphasis and malformed delimiters behavior stable', () => {
  assert.equal(renderMarkdown('**「abc」**'), '<p><strong>「abc」</strong></p>');
  assert.equal(renderMarkdown('***abc***'), '<p><em><strong>abc</strong></em></p>');
  assert.equal(renderMarkdown('前文** abc **后文'), '<p>前文** abc **后文</p>');
  assert.equal(renderMarkdown('前文**abc后文'), '<p>前文**abc后文</p>');
});
