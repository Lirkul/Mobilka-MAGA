import test from 'node:test';
import assert from 'node:assert/strict';
import { pageForPercent, pageFragments, percentForPage, readingWords } from '../src/utils/readingPages.js';

test('разрыв внутри длинного абзаца сохраняет каждое слово и границы абзацев', () => {
  const source = 'Первый абзац — с «кавычками» и знаками.\n\nВторой абзац продолжается долго и не должен терять слова.';
  const words = readingWords(source);
  const pieces = [[0, 3], [3, 10], [10, words.length]].flatMap(([start, end]) => pageFragments(words, start, end));
  assert.equal(pieces.map(piece => piece.text).join(' '), source.replace(/\s+/g, ' '));
  assert.equal(pieces[0].startsParagraph, true);
  assert.equal(pieces[0].endsParagraph, false);
  assert.equal(pieces[1].startsParagraph, false);
  assert.equal(pieces.at(-1).endsParagraph, true);
});

test('неполный абзац на следующей странице не получает повторного отступа', () => {
  const words = readingWords('Один два три четыре.\n\nНовый абзац.');
  const fragments = pageFragments(words, 2, words.length);
  assert.deepEqual(fragments.map(({ text, startsParagraph, endsParagraph }) => ({ text, startsParagraph, endsParagraph })), [
    { text: 'три четыре.', startsParagraph: false, endsParagraph: true },
    { text: 'Новый абзац.', startsParagraph: true, endsParagraph: true },
  ]);
});

test('сохранённая позиция восстанавливает страницу даже в длинной главе', () => {
  for (const count of [2, 4, 11, 251]) {
    for (let page = 0; page < count; page++) assert.equal(pageForPercent(percentForPage(page, count), count), page);
    assert.equal(percentForPage(0, count), 0);
    assert.equal(percentForPage(count - 1, count), 100);
  }
});

test('одна страница и крайние значения не создают несуществующие страницы', () => {
  assert.equal(pageForPercent(100, 1), 0); assert.equal(percentForPage(0, 1), 0);
  assert.equal(pageForPercent(-20, 4), 0); assert.equal(pageForPercent(120, 4), 3);
  assert.equal(pageForPercent(NaN, 4), 0); assert.deepEqual(pageFragments(readingWords(''), 0, 0), []);
});
