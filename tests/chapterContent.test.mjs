import test from 'node:test';
import assert from 'node:assert/strict';
import { books } from '../src/data/books.js';
import { chapters } from '../src/data/chapters.js';
import { chapterMetadata } from '../src/data/chapterMetadata.js';
import { getChapter, getChapters, mockApiControl } from '../src/services/mockApi.js';

test('все 20 книг имеют по 6 разных глав; старые идентификаторы и доступ сохранены', () => {
  assert.equal(chapters.length, 120);
  assert.deepEqual(chapters.map(({ title, text, ...metadata }) => metadata), chapterMetadata);
  for (const book of books) {
    const own = chapters.filter((chapter) => chapter.bookId === book.id);
    assert.equal(own.length, 6, book.id);
    assert.deepEqual(own.map((chapter) => chapter.number), [1, 2, 3, 4, 5, 6]);
    assert.equal(new Set(own.map((chapter) => chapter.text)).size, 6);
  }
});

test('тексты, названия, вступления и абзацы не повторяются между главами', () => {
  const titles = new Set(); const texts = new Set(); const paragraphs = new Map(); const openings = new Set();
  for (const chapter of chapters) {
    assert.ok(chapter.text.length >= 1000, `${chapter.id}: слишком короткий текст`);
    assert.ok(!titles.has(chapter.title), `${chapter.id}: повторяется название ${chapter.title}`);
    assert.ok(!texts.has(chapter.text), `${chapter.id}: повторяется текст`);
    titles.add(chapter.title); texts.add(chapter.text);
    const parts = chapter.text.split('\n\n');
    assert.ok(parts.length >= 4, `${chapter.id}: нужны отдельные абзацы`);
    assert.ok(!openings.has(parts[0]), `${chapter.id}: повторяется вступление`);
    openings.add(parts[0]);
    for (const paragraph of parts) {
      assert.ok(paragraph.trim().length > 0);
      assert.ok(!paragraphs.has(paragraph), `${chapter.id}: общий абзац с ${paragraphs.get(paragraph)}`);
      paragraphs.set(paragraph, chapter.id);
    }
  }
});

test('главы не являются одним шаблоном с заменой нескольких слов', () => {
  const fingerprints = chapters.map((chapter) => {
    const words = chapter.text.toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').match(/[\p{L}\p{N}]+/gu);
    return new Set(words.slice(0, -4).map((_, index) => words.slice(index, index + 5).join(' ')));
  });
  for (let left = 0; left < chapters.length; left += 1) {
    for (let right = left + 1; right < chapters.length; right += 1) {
      let overlap = 0;
      for (const phrase of fingerprints[left]) if (fingerprints[right].has(phrase)) overlap += 1;
      const similarity = overlap / Math.min(fingerprints[left].size, fingerprints[right].size);
      assert.ok(similarity < 0.35, `${chapters[left].id} и ${chapters[right].id}: слишком похожие тексты (${similarity})`);
    }
  }
});

test('API возвращает текст именно запрошенной книги/главы и отвергает чужой chapterId', async () => {
  await mockApiControl.reset(); mockApiControl.setLatency(0);
  for (const book of books) {
    const list = await getChapters(book.id);
    assert.equal(list.length, 6);
    for (const item of list) {
      const chapter = await getChapter(book.id, item.id);
      const source = chapters.find((entry) => entry.id === item.id);
      assert.equal(chapter.bookId, book.id);
      assert.equal(chapter.title, source.title);
      assert.equal(chapter.text, source.text);
      assert.equal(chapter.requiresPayment, !source.isFree && book.access !== 'free');
    }
  }
  await assert.rejects(() => getChapter('book_001', 'book_002_ch_01'), { status: 404 });
});
