import { initialLibraryStatuses, initialReadingProgress } from '../data/library.js';
import { defaultReaderSettings } from '../data/readerOptions.js';

export const storageKey = 'author-today:state:v1';
const clone = (value) => JSON.parse(JSON.stringify(value));

export function createMemoryStorage() {
  const values = new Map();
  return {
    async getItem(key) { return values.get(key) ?? null; },
    async setItem(key, value) { values.set(key, value); },
  };
}

function defaults() {
  return {
    version: 1,
    libraryStatuses: { ...initialLibraryStatuses },
    bookFeedback: {},
    purchasedBookIds: [],
    progressByBook: Object.fromEntries(Object.entries(initialReadingProgress).map(([bookId, progress]) => [bookId, {
      ...progress, bookId, lastReadAt: bookId === 'book_002' ? '2026-10-21T10:00:00Z' : '2026-10-18T10:00:00Z', updatedAt: '2026-10-21T10:00:00Z',
    }])),
    settings: { offline: false, latencyMs: 240, emptyResults: false, favoriteGenres: [], signedIn: true, reader: { ...defaultReaderSettings } },
    subscriptions: {}, authorNotes: {}, reactions: {},
  };
}

let storage = createMemoryStorage();
let cached = null;
let initialization = null;
let writes = Promise.resolve();

// AsyncStorage is supplied by the app entry; Node tests use the same contract.
export function configureStorage(adapter) {
  if (storage === adapter) return;
  storage = adapter;
  cached = null;
  initialization = null;
  writes = Promise.resolve();
}

async function initialize() {
  if (!initialization) initialization = (async () => {
    const serialized = await storage.getItem(storageKey);
    const initial = defaults();
    if (serialized) {
      const saved = JSON.parse(serialized);
      if (saved.version !== 1 || !saved.libraryStatuses || !saved.progressByBook) throw new Error('Не удалось прочитать сохранённые данные.');
      cached = { ...initial, ...saved, settings: { ...initial.settings, ...saved.settings, reader: { ...initial.settings.reader, ...saved.settings?.reader } } };
    } else {
      await storage.setItem(storageKey, JSON.stringify(initial));
      cached = initial;
    }
  })().catch((error) => { initialization = null; throw error; });
  await initialization;
}

export async function readAppState() {
  await initialize();
  await writes;
  return clone(cached);
}

export async function updateAppState(change) {
  await initialize();
  const operation = writes.catch(() => {}).then(async () => {
    const draft = clone(cached);
    change(draft);
    // Commit in memory only after a successful durable write.
    await storage.setItem(storageKey, JSON.stringify(draft));
    cached = draft;
    return clone(draft);
  });
  writes = operation.then(() => {}, () => {});
  return operation;
}

export function resetAppState() {
  cached = defaults();
  initialization = Promise.resolve();
  writes = storage.setItem(storageKey, JSON.stringify(cached));
  return writes;
}

export async function reloadAppState() {
  await writes;
  cached = null;
  initialization = null;
  return readAppState();
}
