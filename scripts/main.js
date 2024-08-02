import { mainPage } from './components/mainPage.js';
import { listPage } from './components/listPage.js';
import { wordPage } from './components/wordPage.js';
import { repeatPage } from './components/repeatPage.js';
import { database, auth, signInAnonymously } from './firebase.js';
import { ref, set, get } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";

// Создаем заглушку для объекта Telegram.WebApp
const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : {
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
    try {
      await this.authenticateAnonymously();
      await this.loadData();
      this.renderPage();
      this.setupTelegramBackButton();
    } catch (error) {
      console.error('Ошибка при инициализации приложения:', error);
      // Показать пользователю сообщение об ошибке
    }
  },

  async authenticateAnonymously() {
    try {
      await signInAnonymously(auth);
      console.log('Анонимная аутентификация успешна');
    } catch (error) {
      console.error('Ошибка при анонимной аутентификации:', error);
      throw error;
    }
  },

  setupTelegramBackButton() {
    tg.BackButton.onClick(() => {
      if (this.currentPage === 'main') {
        tg.close();
      } else {
        this.navigateTo('main');
      }
    });
  },

  async navigateTo(page) {
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
    this.isSelectMode = !this.isSelectMode;
    this.selectedItems = [];
    this.renderPage();
  },

  toggleItemSelection(item) {
    const index = this.selectedItems.findIndex(selectedItem => selectedItem.id === item.id);
    if (index === -1) {
      this.selectedItems.push(item);
    } else {
      this.selectedItems.splice(index, 1);
    }
    this.renderPage();
  },

  async deleteSelectedItems() {
    if (this.currentPage === 'main') {
      this.lists = this.lists.filter(list => !this.selectedItems.some(item => item.id === list.id));
    } else if (this.currentPage === 'list') {
      this.currentList.words = this.currentList.words.filter(word => !this.selectedItems.some(item => item.id === word.id));
    }
    this.isSelectMode = false;
    this.selectedItems = [];
    try {
      await this.saveData();
      this.renderPage();
    } catch (error) {
      console.error('Ошибка при удалении выбранных элементов:', error);
      // Показать пользователю сообщение об ошибке
    }
  },

  startRepeatForSelectedItems() {
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
    const settingsHtml = `
      <div id="repeatSettings" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 1px solid black;">
        <h2>Настройки повторения</h2>
        <div>
          <label>Сторона:</label>
          <select id="sideSelect">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="mix">Перемешать</option>
          </select>
        </div>
        <div>
          <label>Порядок слов:</label>
          <select id="orderSelect">
            <option value="sequential">По порядку</option>
            <option value="random">Перемешать</option>
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
    this.showingAnswer = true;
    this.renderPage();
  },

  async saveData() {
    const userId = auth.currentUser ? auth.currentUser.uid : 'local_user';
    const data = {
      lists: this.lists,
      currentList: this.currentList ? this.currentList.id : null,
      currentWord: this.currentWord ? this.currentWord.id : null,
    };
    try {
      await set(ref(database, 'users/' + userId), data);
      console.log('Данные успешно сохранены');
    } catch (error) {
      console.error('Ошибка при сохранении данных:', error);
      throw error;
    }
  },

  async loadData() {
    const userId = auth.currentUser ? auth.currentUser.uid : 'local_user';
    await this.loadUserData(userId);
  },

  async loadUserData(userId) {
    try {
      const snapshot = await get(ref(database, 'users/' + userId));
      if (snapshot.exists()) {
        const data = snapshot.val();
        this.lists = data.lists || [];
        if (data.currentList) {
          this.currentList = this.lists.find(list => list.id === data.currentList) || null;
        }
        if (this.currentList && data.currentWord) {
          this.currentWord = this.currentList.words.find(word => word.id === data.currentWord) || null;
        }
      } else {
        console.log('Данные не найдены');
        this.lists = [];
        this.currentList = null;
        this.currentWord = null;
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
      throw error;
    }
  },

  async addList(name) {
    const newList = { id: Date.now(), name, words: [] };
    this.lists.push(newList);
    try {
      await this.saveData();
      this.renderPage();
    } catch (error) {
      console.error('Ошибка при добавлении списка:', error);
      // Показать пользователю сообщение об ошибке
    }
  },

  async updateList(listId, newName) {
    const list = this.lists.find(l => l.id === listId);
    if (list) {
      list.name = newName;
      try {
        await this.saveData();
        this.renderPage();
      } catch (error) {
        console.error('Ошибка при обновлении списка:', error);
        // Показать пользователю сообщение об ошибке
      }
    }
  },

  async deleteList(listId) {
    this.lists = this.lists.filter(l => l.id !== listId);
    try {
      await this.saveData();
      this.renderPage();
    } catch (error) {
      console.error('Ошибка при удалении списка:', error);
      // Показать пользователю сообщение об ошибке
    }
  },

  async addWord(side1, side2, example = '') {
    const newWord = { id: Date.now(), side1, side2, example };
    this.currentList.words.push(newWord);
    try {
      await this.saveData();
      this.renderPage();
    } catch (error) {
      console.error('Ошибка при добавлении слова:', error);
      // Показать пользователю сообщение об ошибке
    }
  },

  async updateWord(wordId, side1, side2, example = '') {
    const word = this.currentList.words.find(w => w.id === wordId);
    if (word) {
      word.side1 = side1;
      word.side2 = side2;
      word.example = example;
      try {
        await this.saveData();
        this.renderPage();
      } catch (error) {
        console.error('Ошибка при обновлении слова:', error);
        // Показать пользователю сообщение об ошибке
      }
    }
  },

  async deleteWord(wordId) {
    this.currentList.words = this.currentList.words.filter(w => w.id !== wordId);
    try {
      await this.saveData();
      this.renderPage();
    } catch (error) {
      console.error('Ошибка при удалении слова:', error);
      // Показать пользователю сообщение об ошибке
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

export default app;