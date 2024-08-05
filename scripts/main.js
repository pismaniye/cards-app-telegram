import { mainPage } from './components/mainPage.js';
import { listPage } from './components/listPage.js';
import { wordPage } from './components/wordPage.js';
import { repeatPage } from './components/repeatPage.js';
import { 
  // database, // database и auth закомментированы, но оставлены для потенциального будущего использования
  // auth, // database и auth закомментированы, но оставлены для потенциального будущего использования
  saveUserData, 
  loadUserData, 
  authenticateAnonymously, 
  FirebaseError,
  // Следующие импорты можно раскомментировать, когда они понадобятся:
  // ref,
  // set,
  // get,
  // remove,
  // update
} from './firebase.js';
import { ref, set, get } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";

const tg = window.Telegram?.WebApp || {
  initDataUnsafe: { user: { id: 'local_user' } },
  BackButton: {
    show: () => console.log('Show back button'),
    hide: () => console.log('Hide back button'),
    onClick: (callback) => console.log('Set back button callback')
  },
  ready: () => console.log('Telegram WebApp ready'),
  close: () => console.log('Close WebApp')
};

const app = {
  currentPage: 'main',
  lists: [],
  currentList: null,
  currentWord: null,
  selectedItems: [],
  isSelectMode: false,
  repeatWords: [],
  currentRepeatIndex: 0,
  showingAnswer: false,
  repeatSettings: { side: '1', order: 'sequential' },

  async init() {
    console.log("Initializing app...");
    try {
      await authenticateAnonymously();
      await this.loadData();
      this.renderPage();
      this.setupTelegramBackButton();
      console.log("App initialized successfully");
    } catch (error) {
      this.handleError(error, 'Ошибка инициализации');
    }
  },

  setupTelegramBackButton() {
    console.log("Setting up Telegram back button");
    tg.BackButton.onClick(() => {
      if (this.currentPage === 'main') {
        tg.close();
      } else {
        this.navigateTo('main');
      }
    });
  },

  async navigateTo(page) {
    console.log(`Navigating to page: ${page}`);
    this.currentPage = page;
    this.isSelectMode = false;
    this.selectedItems = [];
    await this.renderPage();
    this.updateTelegramBackButton();
  },

  updateTelegramBackButton() {
    if (this.currentPage === 'main') {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
    }
  },

  async renderPage() {
    console.log(`Rendering page: ${this.currentPage}`);
    const container = document.getElementById('app');
    container.innerHTML = '';

    switch (this.currentPage) {
      case 'main':
        container.appendChild(mainPage.render());
        break;
      case 'list':
        container.appendChild(listPage.render());
        break;
      case 'word':
        container.appendChild(wordPage.render());
        break;
      case 'repeat':
        container.appendChild(repeatPage.render());
        break;
    }
  },

  toggleSelectMode() {
    console.log(`Toggling select mode. Current state: ${this.isSelectMode}`);
    this.isSelectMode = !this.isSelectMode;
    this.selectedItems = [];
    this.renderPage();
  },

  toggleItemSelection(item) {
    console.log(`Toggling item selection: ${JSON.stringify(item)}`);
    const index = this.selectedItems.findIndex(selectedItem => selectedItem.id === item.id);
    if (index === -1) {
      this.selectedItems.push(item);
    } else {
      this.selectedItems.splice(index, 1);
    }
    this.renderPage();
  },

  async deleteSelectedItems() {
    console.log("Deleting selected items");
    try {
      if (this.currentPage === 'main') {
        this.lists = this.lists.filter(list => !this.selectedItems.some(item => item.id === list.id));
      } else if (this.currentPage === 'list') {
        this.currentList.words = this.currentList.words.filter(word => !this.selectedItems.some(item => item.id === word.id));
      }
      this.isSelectMode = false;
      this.selectedItems = [];
      await this.saveData();
      this.renderPage();
    } catch (error) {
      this.handleError(error, 'Ошибка при удалении выбранных элементов');
    }
  },

  startRepeatForSelectedItems() {
    console.log("Starting repeat for selected items");
    let wordsToRepeat = [];
    if (this.currentPage === 'main') {
      this.selectedItems.forEach(list => {
        wordsToRepeat = wordsToRepeat.concat(list.words);
      });
    } else if (this.currentPage === 'list') {
      wordsToRepeat = this.selectedItems;
    }
    this.startRepeat(wordsToRepeat);
  },

  startRepeat(words = this.currentList.words) {
    console.log(`Начало повторения с ${words.length} словами`);
    this.showRepeatSettings(() => {
      this.repeatWords = [...words];
      if (this.repeatSettings.order === 'random') {
        this.shuffleArray(this.repeatWords);
      }
      this.currentRepeatIndex = 0;
      this.showingAnswer = false;
      this.navigateTo('repeat');
    });
  },
  
  showRepeatSettings(callback) {
    console.log("Отображение настроек повторения");
    const settingsHtml = `
      <div id="repeatSettings" class="repeat-settings">
        <h2>Настройки повторения</h2>
        <div>
          <label>Сторона:</label>
          <select id="sideSelect">
            <option value="1" ${this.repeatSettings.side === '1' ? 'selected' : ''}>1</option>
            <option value="2" ${this.repeatSettings.side === '2' ? 'selected' : ''}>2</option>
            <option value="mix" ${this.repeatSettings.side === 'mix' ? 'selected' : ''}>Перемешать</option>
          </select>
        </div>
        <div>
          <label>Порядок слов:</label>
          <select id="orderSelect">
            <option value="sequential" ${this.repeatSettings.order === 'sequential' ? 'selected' : ''}>По порядку</option>
            <option value="random" ${this.repeatSettings.order === 'random' ? 'selected' : ''}>Перемешать</option>
          </select>
        </div>
        <button id="startRepeatBtn">Начать</button>
        <button id="closeSettingsBtn">Закрыть</button>
      </div>
    `;
  
    const settingsElement = document.createElement('div');
    settingsElement.innerHTML = settingsHtml;
    document.body.appendChild(settingsElement);
  
    document.getElementById('startRepeatBtn').addEventListener('click', () => {
      this.repeatSettings.side = document.getElementById('sideSelect').value;
      this.repeatSettings.order = document.getElementById('orderSelect').value;
      document.body.removeChild(settingsElement);
      callback();
    });
  
    document.getElementById('closeSettingsBtn').addEventListener('click', () => {
      document.body.removeChild(settingsElement);
    });
  },

  getCurrentWord() {
    const currentWord = this.repeatWords[this.currentRepeatIndex];
    if (!currentWord) return null;
  
    if (this.repeatSettings.side === 'mix') {
      return this.getRandomSide(currentWord);
    } else {
      return {
        question: this.repeatSettings.side === '1' ? currentWord.side1 : currentWord.side2,
        answer: this.repeatSettings.side === '1' ? currentWord.side2 : currentWord.side1
      };
    }
  },
  
  getRandomSide(word) {
    const isFirstSide = Math.random() < 0.5;
    return {
      question: isFirstSide ? word.side1 : word.side2,
      answer: isFirstSide ? word.side2 : word.side1
    };
  },

  shuffleWordsIfNeeded() {
    if (this.repeatSettings.order === 'random') {
      this.shuffleArray(this.repeatWords);
    }
  },
  
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  },
  
  nextWord() {
    console.log("Moving to next word");
    this.currentRepeatIndex++;
    this.showingAnswer = false;
    if (this.currentRepeatIndex >= this.repeatWords.length) {
      alert('Поздравляем! Вы повторили все слова.');
      this.navigateTo('list');
    } else {
      this.renderPage();
    }
  },
  
  showAnswer() {
    console.log("Showing answer");
    this.showingAnswer = true;
    this.renderPage();
  },

  async saveData() {
    console.log("Saving data...");
    try {
      await saveUserData({
        lists: this.lists,
        currentList: this.currentList ? this.currentList.id : null,
        currentWord: this.currentWord ? this.currentWord.id : null,
      });
      console.log("Data saved successfully");
    } catch (error) {
      console.error("Error in saveData:", error);
      this.handleError(error, 'Ошибка сохранения данных');
    }
  },
  
  async loadData() {
    console.log("Loading data...");
    try {
      const data = await loadUserData();
      if (data) {
        console.log("Data loaded:", data);
        this.lists = Array.isArray(data.lists) ? data.lists : [];
        // Убедимся, что у каждого списка есть свойство words и оно является массивом
        this.lists.forEach(list => {
          if (!Array.isArray(list.words)) {
            list.words = [];
          }
        });
        if (data.currentList) {
          this.currentList = this.lists.find(list => list.id === data.currentList) || null;
        }
        if (this.currentList && data.currentWord) {
          this.currentWord = this.currentList.words.find(word => word.id === data.currentWord) || null;
        }
      } else {
        console.log("No data found, initializing with empty state");
        this.lists = [];
        this.currentList = null;
        this.currentWord = null;
      }
    } catch (error) {
      console.error("Error in loadData:", error);
      this.handleError(error, 'Ошибка загрузки данных');
    }
  },
  
  async addList(name) {
    console.log("Adding new list:", name);
    const newList = { id: Date.now(), name, words: [] };
    this.lists.push(newList);
    try {
      await this.saveData();
      console.log("New list added successfully");
      this.renderPage();
    } catch (error) {
      console.error("Error in addList:", error);
      this.handleError(error, 'Ошибка при добавлении списка');
      this.lists.pop(); // Удаляем список из локального массива, если сохранение не удалось
    }
  },

  // Добавим новый метод для установки текущего списка
setCurrentList(listId) {
  console.log("Setting current list:", listId);
  this.currentList = this.lists.find(list => list.id === listId);
  if (this.currentList && !Array.isArray(this.currentList.words)) {
    this.currentList.words = [];
  }
  console.log("Current list set to:", this.currentList);
},

  async updateList(listId, newName) {
    console.log(`Updating list ${listId} with new name: ${newName}`);
    const list = this.lists.find(l => l.id === listId);
    if (list) {
      list.name = newName;
      try {
        await this.saveData();
        console.log("List updated successfully");
        this.renderPage();
      } catch (error) {
        console.error("Error in updateList:", error);
        this.handleError(error, 'Ошибка при обновлении списка');
      }
    }
  },

  async deleteList(listId) {
    console.log(`Deleting list: ${listId}`);
    this.lists = this.lists.filter(l => l.id !== listId);
    try {
      await this.saveData();
      console.log("List deleted successfully");
      this.renderPage();
    } catch (error) {
      console.error("Error in deleteList:", error);
      this.handleError(error, 'Ошибка при удалении списка');
    }
  },

  async addWord(side1, side2, example = '') {
    console.log(`Adding new word: ${side1} - ${side2}`);
    const newWord = { id: Date.now(), side1, side2, example };
    this.currentList.words.push(newWord);
    try {
      await this.saveData();
      console.log("New word added successfully");
      this.renderPage();
    } catch (error) {
      console.error("Error in addWord:", error);
      this.handleError(error, 'Ошибка при добавлении слова');
      this.currentList.words.pop(); // Удаляем слово из локального массива, если сохранение не удалось
    }
  },

  async updateWord(wordId, side1, side2, example = '') {
    console.log(`Updating word ${wordId}: ${side1} - ${side2}`);
    const word = this.currentList.words.find(w => w.id === wordId);
    if (word) {
      word.side1 = side1;
      word.side2 = side2;
      word.example = example;
      try {
        await this.saveData();
        console.log("Word updated successfully");
        this.renderPage();
      } catch (error) {
        console.error("Error in updateWord:", error);
        this.handleError(error, 'Ошибка при обновлении слова');
      }
    }
  },

  async deleteWord(wordId) {
    console.log(`Deleting word: ${wordId}`);
    this.currentList.words = this.currentList.words.filter(w => w.id !== wordId);
    try {
      await this.saveData();
      console.log("Word deleted successfully");
      this.renderPage();
    } catch (error) {
      console.error("Error in deleteWord:", error);
      this.handleError(error, 'Ошибка при удалении слова');
    }
  },

  handleError(error, context) {
    console.error(`${context}:`, error);
    let errorMessage = 'Произошла неизвестная ошибка';
    if (error instanceof FirebaseError) {
      errorMessage = `${context}: ${error.message}`;
    } else if (error.message) {
      errorMessage = `${context}: ${error.message}`;
    }
    this.showError(errorMessage);
  },

  showError(message) {
    console.error("Showing error:", message);
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.style.display = 'block';
      setTimeout(() => {
        errorContainer.style.display = 'none';
      }, 5000);
    } else {
      console.error('Элемент для отображения ошибок не найден');
      alert(message);
    }
  },
};

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, initializing app");
  app.init();
});

export default app;