// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-analytics.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDag5C32hnA_rsBLh9qJcq0im9wO9v7Cyo",
  authDomain: "m-cards-bot.firebaseapp.com",
  projectId: "m-cards-bot",
  storageBucket: "m-cards-bot.appspot.com",
  messagingSenderId: "367400626398",
  appId: "1:367400626398:web:0fdd39817f4a62613dfa4f",
  measurementId: "G-PR3VNXQ2LZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

// Function to save user data
export function saveUserData(userId, data) {
  return set(ref(database, 'users/' + userId), data);
}

// Function to load user data
export function loadUserData(userId) {
  return get(ref(database, 'users/' + userId)).then((snapshot) => {
    return snapshot.val();
  });
}