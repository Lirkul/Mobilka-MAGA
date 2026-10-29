export function readingWords(text) {
  return text.split('\n\n').flatMap((paragraph, index) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    return words.map((text, word) => ({ text, paragraph: index, first: word === 0, last: word === words.length - 1 }));
  });
}

// Half-open word ranges allow page breaks inside long paragraphs without loss.
export function pageFragments(words, start, end) {
  const fragments = [];
  for (const word of words.slice(start, end)) {
    let fragment = fragments[fragments.length - 1];
    if (!fragment || fragment.paragraph !== word.paragraph) {
      fragment = { paragraph: word.paragraph, words: [], startsParagraph: word.first, endsParagraph: false };
      fragments.push(fragment);
    }
    fragment.words.push(word.text); fragment.endsParagraph = word.last;
  }
  return fragments.map(({ words, ...fragment }) => ({ ...fragment, text: words.join(' ') }));
}

export const pageForPercent = (percent, count) => Math.max(0, Math.min(count - 1, Math.round((Number.isFinite(percent) ? percent : 0) / 100 * Math.max(0, count - 1))));
export const percentForPage = (index, count) => count <= 1 ? 0 : Math.max(0, Math.min(100, index / (count - 1) * 100));
