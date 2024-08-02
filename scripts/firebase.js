import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDag5C32hnA_rsBLh9qJcq0im9wO9v7Cyo",
  authDomain: "m-cards-bot.firebaseapp.com",
  databaseURL: "https://m-cards-bot-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "m-cards-bot",
  storageBucket: "m-cards-bot.appspot.com",
  messagingSenderId: "367400626398",
  appId: "1:367400626398:web:0fdd39817f4a62613dfa4f",
  measurementId: "G-PR3VNXQ2LZ"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export { app, database, auth, signInAnonymously };