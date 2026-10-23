import { chapterMetadata } from './chapterMetadata.js';
import { contentA } from './reading/contentA.js';
import { contentB } from './reading/contentB.js';
import { contentC } from './reading/contentC.js';

const content = { ...contentA, ...contentB, ...contentC };

// Keep stable IDs/access while giving every book its own story and chapter names.
export const chapters = chapterMetadata.map((metadata) => {
  const entry = content[metadata.bookId][metadata.number - 1];
  return {
    ...metadata,
    title: `Глава ${metadata.number}. ${entry.title}`,
    text: entry.paragraphs.join('\n\n'),
  };
});
