// Импортируем необходимые функции и компоненты
import { saveUserData, loadUserData, authenticateAnonymously, FirebaseError } from './firebase.js';
import { mainPage } from './components/mainPage.js';
import { listPage } from './components/listPage.js';
import { wordPage } from './components/wordPage.js';
import { repeatPage } from './components/repeatPage.js';

// Объект для работы с Telegram Web App API
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

// Основной объект приложения
const app = {
  // Текущая страница приложения
  currentPage: 'main',
  // Массив списков слов
  lists: [],
  // Текущий выбранный список
  currentList: null,
  // Текущее выбранное слово
  currentWord: null,
  // Массив выбранных элементов (для режима выбора)
  selectedItems: [],
  // Флаг режима выбора
  isSelectMode: false,
  // Массив слов для повторения
  repeatWords: [],
  // Индекс текущего слова при повторении
  currentRepeatIndex: 0,
  // Флаг отображения ответа при повторении
  showingAnswer: false,
  // Настройки повторения
  repeatSettings: { side: '1', order: 'sequential' },

  // Инициализация приложения
  async init() {
    try {
      // Анонимная аутентификация в Firebase
      await authenticateAnonymously();
      // Загрузка данных пользователя
      await this.loadData();
      // Отрисовка начальной страницы
      this.renderPage();
      // Настройка кнопки "Назад" Telegram
      this.setupTelegramBackButton();
      // Сигнал о готовности приложения
      tg.ready();
    } catch (error) {
      this.handleError(error, 'Ошибка инициализации');
    }
  },

  // Настройка кнопки "Назад" Telegram
  setupTelegramBackButton() {
    tg.BackButton.onClick(() => {
      if (this.currentPage === 'main') {
        tg.close();
      } else {
        this.navigateTo('main');
      }
    });
  },

  // Навигация между страницами
  async navigateTo(page) {
    this.currentPage = page;
    this.isSelectMode = false;
    this.selectedItems = [];
    await this.renderPage();
    this.updateTelegramBackButton();
  },

  // Обновление видимости кнопки "Назад" Telegram
  updateTelegramBackButton() {
    if (this.currentPage === 'main') {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
    }
  },

  // Отрисовка текущей страницы
  async renderPage() {
    const container = document.getElementById('app');
    container.innerHTML = '';

    switch (this.currentPage) {
      case 'main':
        container.appendChild(mainPage.render(this));
        break;
      case 'list':
        container.appendChild(listPage.render(this));
        break;
      case 'word':
        container.appendChild(wordPage.render(this));
        break;
      case 'repeat':
        container.appendChild(repeatPage.render(this));
        break;
    }
  },

  // Переключение режима выбора
  toggleSelectMode() {
    this.isSelectMode = !this.isSelectMode;
    this.selectedItems = [];
    this.renderPage();
  },

  // Выбор/отмена выбора элемента
  toggleItemSelection(item) {
    const index = this.selectedItems.findIndex(selectedItem => selectedItem.id === item.id);
    if (index === -1) {
      this.selectedItems.push(item);
    } else {
      this.selectedItems.splice(index, 1);
    }
    this.renderPage();
  },

  // Удаление выбранных элементов
  async deleteSelectedItems() {
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

  // Начало повторения для выбранных элементов
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

  // Начало повторения слов
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
  
  // Отображение настроек повторения
  showRepeatSettings(callback) {
    // ... код для отображения настроек повторения ...
  },

  // Получение текущего слова для повторения
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
  
  // Получение случайной стороны слова
  getRandomSide(word) {
    const isFirstSide = Math.random() < 0.5;
    return {
      question: isFirstSide ? word.side1 : word.side2,
      answer: isFirstSide ? word.side2 : word.side1
    };
  },

  // Перемешивание массива слов, если необходимо
  shuffleWordsIfNeeded() {
    if (this.repeatSettings.order === 'random') {
      this.shuffleArray(this.repeatWords);
    }
  },
  
  // Перемешивание массива
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  },
  
  // Переход к следующему слову при повторении
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
  
  // Показать ответ при повторении
  showAnswer() {
    this.showingAnswer = true;
    this.renderPage();
  },

  // Сохранение данных пользователя
  async saveData() {
    try {
      const data = {
        lists: this.lists,
        currentList: this.currentList ? this.currentList.id : null,
        currentWord: this.currentWord ? this.currentWord.id : null,
      };
      await saveUserData(data);
    } catch (error) {
      this.handleError(error, 'Ошибка сохранения данных');
    }
  },

  // Загрузка данных пользователя
  async loadData() {
    try {
      const data = await loadUserData();
      if (data) {
        this.lists = data.lists || [];
        if (data.currentList) {
          this.currentList = this.lists.find(list => list.id === data.currentList) || null;
        }
        if (this.currentList && data.currentWord) {
          this.currentWord = this.currentList.words.find(word => word.id === data.currentWord) || null;
        }
      }
    } catch (error) {
      this.handleError(error, 'Ошибка загрузки данных');
    }
  },

  // Добавление нового списка
  async addList(name) {
    try {
      const newList = { id: Date.now(), name, words: [] };
      this.lists.push(newList);
      await this.saveData();
      this.renderPage();
    } catch (error) {
      this.handleError(error, 'Ошибка при добавлении списка');
    }
  },

  // Обновление существующего списка
  async updateList(listId, newName) {
    try {
      const list = this.lists.find(l => l.id === listId);
      if (list) {
        list.name = newName;
        await this.saveData();
        this.renderPage();
      }
    } catch (error) {
      this.handleError(error, 'Ошибка при обновлении списка');
    }
  },

  // Удаление списка
  async deleteList(listId) {
    try {
      this.lists = this.lists.filter(l => l.id !== listId);
      await this.saveData();
      this.renderPage();
    } catch (error) {
      this.handleError(error, 'Ошибка при удалении списка');
    }
  },

  // Добавление нового слова
  async addWord(side1, side2, example = '') {
    try {
      const newWord = { id: Date.now(), side1, side2, example };
      this.currentList.words.push(newWord);
      await this.saveData();
      this.renderPage();
    } catch (error) {
      this.handleError(error, 'Ошибка при добавлении слова');
    }
  },

  // Обновление существующего слова
  async updateWord(wordId, side1, side2, example = '') {
    try {
      const word = this.currentList.words.find(w => w.id === wordId);
      if (word) {
        word.side1 = side1;
        word.side2 = side2;
        word.example = example;
        await this.saveData();
        this.renderPage();
      }
    } catch (error) {
      this.handleError(error, 'Ошибка при обновлении слова');
    }
  },

  // Удаление слова
  async deleteWord(wordId) {
    try {
      this.currentList.words = this.currentList.words.filter(w => w.id !== wordId);
      await this.saveData();
      this.renderPage();
    } catch (error) {
      this.handleError(error, 'Ошибка при удалении слова');
    }
  },

  // Обработка ошибок
  handleError(error, context) {
    console.error(`${context}:`, error);
    let errorMessage = 'Произошла неизвестная ошибка';
    if (error instanceof FirebaseError) {
      errorMessage = `${context}: ${error.message}`;
    }
    this.showError(errorMessage);
  },

  // Отображение сообщения об ошибке
  showError(message) {
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
  }
};

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

// Экспорт объекта приложения для использования в других модулях
export default app;