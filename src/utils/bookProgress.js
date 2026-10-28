/**
 * Chapter position is stored separately from the book-wide percentage.
 * Both full chapters and metadata with textLength use this same calculation.
 * @param {Array<{ id: string, number: number, textLength?: number, text?: string }>} chapters
 * @param {string | null} chapterId
 * @param {number} chapterPercent
 */
export function getBookPercent(chapters, chapterId, chapterPercent = 0) {
  const ordered = [...chapters].sort((a, b) => a.number - b.number);
  const index = ordered.findIndex(chapter => chapter.id === chapterId);
  if (index < 0) return 0;
  const lengths = ordered.map(chapter => Math.max(0, chapter.textLength ?? chapter.text?.length ?? 0));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  if (!total) return 0;
  const current = Number.isFinite(chapterPercent) ? Math.max(0, Math.min(100, chapterPercent)) : 0;
  if (index === ordered.length - 1 && current === 100) return 100;
  const read = lengths.slice(0, index).reduce((sum, length) => sum + length, 0) + lengths[index] * current / 100;
  // Rounding near the end must not report completion before the final chapter ends.
  return Math.min(99, Math.round(read / total * 100));
}
