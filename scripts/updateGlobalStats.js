/**
 * OquNet — Cloud Function: updateGlobalStats
 *
 * stats/global документін жаңартады. Landing page осы
 * бір документті ғана оқиды — аутентификациясыз.
 *
 * Триггерлер:
 *  - books      жасалды / жойылды
 *  - users      жасалды
 *  - borrowings жасалды
 *  - readingSessions жасалды
 *
 * Орнату:
 *   functions/ қапшығының ішіне осы файлды қой,
 *   index.js-ке import жаса немесе paste жаса.
 *
 * firebase deploy --only functions:updateGlobalStats
 */

const { onDocumentCreated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

const STATS_REF = () => db.doc('stats/global');

/* ── Көмекші: stats/global өрісін атомарлы өзгерту ── */
async function increment(field, delta = 1) {
  await STATS_REF().set(
    { [field]: FieldValue.increment(delta), updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
}

/* ══ books ══════════════════════════════════════════ */
exports.onBookCreated = onDocumentCreated('books/{bookId}', async () => {
  await increment('totalBooks', 1);
});

exports.onBookDeleted = onDocumentDeleted('books/{bookId}', async () => {
  await increment('totalBooks', -1);
});

/* ══ users ══════════════════════════════════════════ */
exports.onUserCreated = onDocumentCreated('users/{userId}', async () => {
  await increment('totalUsers', 1);
});

/* ══ borrowings ═════════════════════════════════════ */
exports.onBorrowingCreated = onDocumentCreated('borrowings/{borrowingId}', async () => {
  await increment('totalBorrowings', 1);
});

/* ══ readingSessions ════════════════════════════════ */
exports.onReadingSessionCreated = onDocumentCreated(
  'readingSessions/{sessionId}',
  async (event) => {
    const seconds = event.data?.data()?.seconds ?? 0;
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      await increment('totalMinutes', minutes);
    }
  }
);
