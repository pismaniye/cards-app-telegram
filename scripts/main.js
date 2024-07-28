import { mainPage } from './components/mainPage.js';
import { listPage } from './components/listPage.js';
import { wordPage } from './components/wordPage.js';
import { repeatPage } from './components/repeatPage.js';

const tg = window.Telegram.WebApp;

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

  init() {
    tg.ready();
    this.loadData();
    this.renderPage();
    this.setupTelegramBackButton();
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

  navigateTo(page) {
    this.currentPage = page;
    this.isSelectMode = false;
    this.selectedItems = [];
    this.renderPage();
    this.updateTelegramBackButton();
  },

  updateTelegramBackButton() {
    if (this.currentPage === 'main') {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
    }
  },

  renderPage() {
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

  navigateTo(page) {
    this.currentPage = page;
    this.isSelectMode = false;
    this.selectedItems = [];
    this.renderPage();
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

  deleteSelectedItems() {
    if (this.currentPage === 'main') {
      this.lists = this.lists.filter(list => !this.selectedItems.some(item => item.id === list.id));
    } else if (this.currentPage === 'list') {
      this.currentList.words = this.currentList.words.filter(word => !this.selectedItems.some(item => item.id === word.id));
    }
    this.isSelectMode = false;
    this.selectedItems = [];
    this.saveData();
    this.renderPage();
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

  // Обновите эти функции в объекте app в main.js

startRepeat(words = this.currentList.words) {
    this.showRepeatSettings(() => {
      this.repeatWords = [...words];
      this.shuffleWordsIfNeeded();
      this.currentRepeatIndex = 0;
      this.showingAnswer = false;
      this.navigateTo('repeat');
    });
  },
  
  shuffleWordsIfNeeded() {
    if (this.repeatSettings.order === 'random') {
      this.shuffleArray(this.repeatWords);
    }
  },
  
  getCurrentWord() {
    const currentWord = this.repeatWords[this.currentRepeatIndex];
    if (!currentWord) return null;
  
    let isReversed;
    if (this.repeatSettings.side === 'mix') {
      isReversed = Math.random() < 0.5;
    } else {
      isReversed = this.repeatSettings.side === '2';
    }
    
    return {
      question: isReversed ? currentWord.side2 : currentWord.side1,
      answer: isReversed ? currentWord.side1 : currentWord.side2
    };
  },
  
  startRepeat(words = this.currentList.words) {
    this.showRepeatSettings(() => {
      this.repeatWords = [...words];
      this.shuffleWordsIfNeeded();
      this.currentRepeatIndex = 0;
      this.showingAnswer = false;
      this.navigateTo('repeat');
    });
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

  saveData() {
    const data = {
      lists: this.lists,
      currentList: this.currentList ? this.currentList.id : null,
      currentWord: this.currentWord ? this.currentWord.id : null,
    };
    localStorage.setItem('cardAppData', JSON.stringify(data));
  },

  loadData() {
    const savedData = localStorage.getItem('cardAppData');
    if (savedData) {
      const data = JSON.parse(savedData);
      this.lists = data.lists || [];
      if (data.currentList) {
        this.currentList = this.lists.find(list => list.id === data.currentList) || null;
      }
      if (this.currentList && data.currentWord) {
        this.currentWord = this.currentList.words.find(word => word.id === data.currentWord) || null;
      }
    }
  },

  addList(name) {
    const newList = { id: Date.now(), name, words: [] };
    this.lists.push(newList);
    this.saveData();
    this.renderPage();
  },

  updateList(listId, newName) {
    const list = this.lists.find(l => l.id === listId);
    if (list) {
      list.name = newName;
      this.saveData();
      this.renderPage();
    }
  },

  deleteList(listId) {
    this.lists = this.lists.filter(l => l.id !== listId);
    this.saveData();
    this.renderPage();
  },

  addWord(side1, side2, example = '') {
    const newWord = { id: Date.now(), side1, side2, example };
    this.currentList.words.push(newWord);
    this.saveData();
    this.renderPage();
  },

  updateWord(wordId, side1, side2, example = '') {
    const word = this.currentList.words.find(w => w.id === wordId);
    if (word) {
      word.side1 = side1;
      word.side2 = side2;
      word.example = example;
      this.saveData();
      this.renderPage();
    }
  },

  deleteWord(wordId) {
    this.currentList.words = this.currentList.words.filter(w => w.id !== wordId);
    this.saveData();
    this.renderPage();
  }
};

document.addEventListener('DOMContentLoaded', () => app.init());

export default app;