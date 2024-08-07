import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getDatabase, ref, set, get, remove, update } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";
import { getAuth, signInAnonymously as firebaseSignInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { firebaseConfig } from '../firebase-config.js';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

class FirebaseError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "FirebaseError";
    this.code = code;
  }
}

function handleFirebaseError(error) {
  console.error("Firebase Error:", error);
  if (error.code) {
    switch (error.code) {
      case "PERMISSION_DENIED":
        return new FirebaseError("У вас нет прав для выполнения этой операции", "PERMISSION_DENIED");
      case "NETWORK_ERROR":
        return new FirebaseError("Проблема с сетевым подключением", "NETWORK_ERROR");
      default:
        return new FirebaseError("Произошла ошибка при работе с базой данных", error.code);
    }
  }
  return new FirebaseError("Неизвестная ошибка", "UNKNOWN_ERROR");
}

async function ensureAuthenticated() {
  console.log("Checking authentication status...");
  if (!auth.currentUser) {
    console.log("User not authenticated, attempting anonymous sign in...");
    try {
      await signInAnonymously(auth);
      console.log("Anonymous authentication successful");
    } catch (error) {
      console.error("Anonymous authentication failed:", error);
      throw error;
    }
  } else {
    console.log("User already authenticated");
  }
  console.log("Current user:", auth.currentUser);
  return auth.currentUser.uid;
}

async function runTransaction(updates) {
  try {
    const userId = await ensureAuthenticated();
    console.log("Running transaction for user:", userId);
    console.log("Auth state:", JSON.stringify(auth.currentUser, null, 2));
    console.log("Is user anonymous?", auth.currentUser.isAnonymous);
    const userRef = ref(database, 'users/' + userId);
    
    console.log("Attempting to read current data...");
    const snapshot = await get(userRef);
    console.log("Read successful. Current data:", JSON.stringify(snapshot.val(), null, 2));
    const originalData = snapshot.val() || {};
    const updatedData = { ...originalData, ...updates };
    console.log("Data to be written:", JSON.stringify(updatedData, null, 2));
    console.log("Attempting to write data...");
    await set(userRef, updatedData);
    console.log("Write successful. Transaction completed.");
    return updatedData;
  } catch (error) {
    console.error("Transaction error:", error);
    if (error.code === "PERMISSION_DENIED") {
      console.error("Permission denied. Current user:", JSON.stringify(auth.currentUser, null, 2));
      console.error("Is user anonymous?", auth.currentUser.isAnonymous);
      console.error("Attempted write path:", 'users/' + (auth.currentUser ? auth.currentUser.uid : 'unknown'));
    }
    throw error;
  }
}

async function saveUserData(data) {
  console.log("Attempting to save user data:", JSON.stringify(data, null, 2));
  try {
    const userId = auth.currentUser.uid;
    const fullPath = `users/${userId}`;
    console.log("Full path for write operation:", fullPath);
    console.log("Data to be written:", JSON.stringify(data, null, 2));
    
    const result = await runTransaction(data);
    console.log("Save user data successful:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("Error in saveUserData:", error);
    throw handleFirebaseError(error);
  }
}

async function loadUserData() {
  try {
    const userId = await ensureAuthenticated();
    console.log("Loading data for user:", userId);
    const snapshot = await get(ref(database, 'users/' + userId));
    const data = snapshot.val() || null;
    console.log("Loaded user data:", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("Error in loadUserData:", error);
    throw handleFirebaseError(error);
  }
}

async function authenticateAnonymously() {
  try {
    await firebaseSignInAnonymously(auth);
    console.log("Anonymous authentication successful");
  } catch (error) {
    console.error("Anonymous authentication failed:", error);
    throw handleFirebaseError(error);
  }
}

export { 
  app, 
  database, 
  auth, 
  ref, 
  set, 
  get, 
  remove, 
  update, 
  saveUserData, 
  loadUserData, 
  authenticateAnonymously, 
  FirebaseError 
};