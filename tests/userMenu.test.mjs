import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { configureStorage, createMemoryStorage, readAppState, reloadAppState } from '../src/services/appState.js';
import { getCurrentUser, setSignedIn, setLibraryStatus, getBookById, updateSettings, mockApiControl } from '../src/services/mockApi.js';

beforeEach(async () => {
  configureStorage(createMemoryStorage());
  await mockApiControl.reset();
  mockApiControl.setLatency(0);
});

test('пример пользователя — Bespalko Egor; выход и вход сохраняются, не удаляя библиотеку и прогресс', async () => {
  assert.equal((await getCurrentUser()).name, 'Bespalko Egor');
  assert.equal((await getCurrentUser()).signedIn, true);
  await setLibraryStatus('book_001', 'planned');
  const progress = (await readAppState()).progressByBook;
  await updateSettings({ offline: true });
  await setSignedIn(false);
  await reloadAppState();
  assert.equal((await getCurrentUser()).signedIn, false);
  assert.equal((await getBookById('book_001')).libraryStatus, 'planned');
  assert.deepEqual((await readAppState()).progressByBook, progress);
  await setSignedIn(true);
  await reloadAppState();
  assert.equal((await getCurrentUser()).signedIn, true);
});
