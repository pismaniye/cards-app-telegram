import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getDatabase, ref, set, get, remove, update } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";
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

// Класс для создания пользовательских ошибок
class FirebaseError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "FirebaseError";
    this.code = code;
  }
}

// Функция для обработки ошибок Firebase
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

// Функция для выполнения транзакции с откатом
async function runTransaction(updates) {
  const userId = auth.currentUser ? auth.currentUser.uid : null;
  if (!userId) {
    throw new FirebaseError("Пользователь не аутентифицирован", "UNAUTHENTICATED");
  }

  const userRef = ref(database, 'users/' + userId);
  
  try {
    // Получаем текущее состояние данных пользователя
    const snapshot = await get(userRef);
    const originalData = snapshot.val() || {};

    // Применяем обновления
    const updatedData = { ...originalData, ...updates };
    await set(userRef, updatedData);

    return updatedData;
  } catch (error) {
    console.error("Transaction error:", error);
    // В случае ошибки, пытаемся восстановить оригинальные данные
    try {
      await set(userRef, originalData);
    } catch (rollbackError) {
      console.error("Rollback failed:", rollbackError);
      throw new FirebaseError("Не удалось выполнить откат изменений", "ROLLBACK_FAILED");
    }
    throw handleFirebaseError(error);
  }
}

// Улучшенные функции для работы с данными
async function saveUserData(data) {
  try {
    return await runTransaction(data);
  } catch (error) {
    throw handleFirebaseError(error);
  }
}

async function loadUserData() {
  try {
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    if (!userId) {
      throw new FirebaseError("Пользователь не аутентифицирован", "UNAUTHENTICATED");
    }
    const snapshot = await get(ref(database, 'users/' + userId));
    return snapshot.val() || null;
  } catch (error) {
    throw handleFirebaseError(error);
  }
}

async function authenticateAnonymously() {
  try {
    await signInAnonymously(auth);
  } catch (error) {
    throw handleFirebaseError(error);
  }
}

export { app, database, auth, saveUserData, loadUserData, authenticateAnonymously, FirebaseError };