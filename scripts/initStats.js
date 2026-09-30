/**
 * OquNet — Бір реттік скрипт: stats/global бастапқы мәндерді есептеу
 *
 * Cloud Function орнатылғанға дейін бар деректерді санайды.
 * Бір рет іске қосасың — содан кейін Function автоматты жаңартады.
 *
 * Іске қосу (Node.js, firebase-admin орнатылған):
 *   node initStats.js
 *
 * Алдын ала:
 *   npm install firebase-admin
 *   export GOOGLE_APPLICATION_CREDENTIALS="path/t./oqunet-6070b-firebase-adminsdk-fbsvc-344063baac.json"
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Service account JSON файлыңның жолы
// Firebase Console → Project Settings → Service accounts → Generate new private key
const serviceAccount = require('./oqunet-6070b-firebase-adminsdk-fbsvc-344063baac.json'); // ← осыны өзгерт

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function initStats() {
  console.log('Санау басталды...');

  // 1. books
  const booksSnap = await db.collection('books').count().get();
  const totalBooks = booksSnap.data().count;
  console.log(`books: ${totalBooks}`);

  // 2. users
  const usersSnap = await db.collection('users').count().get();
  const totalUsers = usersSnap.data().count;
  console.log(`users: ${totalUsers}`);

  // 3. borrowings
  const borrowSnap = await db.collection('borrowings').count().get();
  const totalBorrowings = borrowSnap.data().count;
  console.log(`borrowings: ${totalBorrowings}`);

  // 4. readingSessions → seconds → minutes
  // (бұл толық оқу — тек бір рет іске қосылады)
  let totalSeconds = 0;
  const sessions = await db.collection('readingSessions').get();
  sessions.forEach(doc => {
    totalSeconds += doc.data().seconds ?? 0;
  });
  const totalMinutes = Math.floor(totalSeconds / 60);
  console.log(`totalMinutes: ${totalMinutes} (${totalSeconds} секундтан)`);

  // stats/global жазу
  await db.doc('stats/global').set({
    totalBooks,
    totalUsers,
    totalBorrowings,
    totalMinutes,
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log('✅ stats/global сәтті жазылды!');
  process.exit(0);
}

initStats().catch(err => {
  console.error('Қате:', err);
  process.exit(1);
});
