import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function test() {
  try {
    console.log("Testing write without auth...");
    await addDoc(collection(db, 'posts'), {
      title: 'Test Post',
      createdAt: serverTimestamp(),
      authorId: 'test'
    });
    console.log("Write succeeded!");
  } catch (e) {
    console.error("Write failed:", e.message);
  }
  process.exit(0);
}

test();
