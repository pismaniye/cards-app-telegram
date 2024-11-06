import { mainPage } from './pages/mainPage.js';
import { listPage } from './pages/listPage.js';
import { wordPage } from './pages/wordPage.js';
import { repeatPage } from './pages/repeatPage.js';
import { Modal } from './components/Modal.js';
import { Button } from './components/Button.js';
import { List } from './components/List.js';
import { Card } from './components/Card.js';
import { ContextMenu } from './components/ContextMenu.js';
import { saveUserData, loadUserData, authenticateAnonymously } from './utils/firebase.js';
import { getTelegramInstance } from './utils/telegram.js';

export class App {
    constructor(telegramWebApp = getTelegramInstance()) {
        this.telegramWebApp = telegramWebApp;
        this.currentPage = null;
        this.lists = [];
        this.currentList = null;
        this.currentWord = null;
        this.isSelectionMode = false;
        this.components = {
            button: Button,
            list: List,
            card: Card,
            contextMenu: ContextMenu
        };
        
        this.handleRouteChange = this.handleRouteChange.bind(this);
        this.initTelegramBackButton();
    }

    initTelegramBackButton() {
        if (this.telegramWebApp.BackButton) {
            this.telegramWebApp.BackButton.onClick(() => {
                if (this.currentPage instanceof mainPage) {
                    this.telegramWebApp.close();
                } else {
                    this.navigateTo('main');
                }
            });
        }
    }

    createButton(text, onClick, className) {
        const button = new this.components.button(text, onClick);
        if (className) button.options.className = className;
        return button;
    }

    createList(items, options) {
        return new this.components.list(items, options);
    }

    createCard(word, options) {
        return new this.components.card(word, options);
    }

    showContextMenu(items, x, y) {
        const menu = new this.components.contextMenu(items);
        menu.show(x, y);
        return menu;
    }

    async init() {
        try {
            await authenticateAnonymously();
            await this.loadData();
            this.handleRouteChange();
            console.log('App initialized, currentList:', this.currentList);
        } catch (error) {
            console.error('Ошибка инициализации приложения:', error);
            this.showErrorMessage(`Ошибка инициализации приложения: ${error.message}`);
            
            // Устанавливаем значения по умолчанию в случае ошибки
            this.lists = [];
            this.currentList = null;
            this.currentWord = null;
            
            // Все равно пытаемся отрендерить главную страницу
            this.navigateTo('main');
        }
    }

    async loadData() {
        try {
            const data = await loadUserData();
            console.log('Loaded data:', data);
      
            if (data && typeof data === 'object') {
                this.lists = Array.isArray(data.lists) ? data.lists : [];
                
                if (data.currentList && typeof data.currentList === 'string') {
                    this.currentList = this.lists.find(list => list && list.id === data.currentList) || null;
                } else {
                    this.currentList = null;
                }
          
                if (this.currentList && data.currentWord && typeof data.currentWord === 'string') {
                    this.currentWord = Array.isArray(this.currentList.words) 
                        ? this.currentList.words.find(word => word && word.id === data.currentWord) || null
                        : null;
                } else {
                    this.currentWord = null;
                }
            } else {
                this.lists = [];
                this.currentList = null;
                this.currentWord = null;
            }
      
            console.log('Data loaded, lists:', this.lists);
            console.log('Current list:', this.currentList);
            console.log('Current word:', this.currentWord);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.showErrorMessage('Ошибка загрузки данных: ' + error.message);
            
            this.lists = [];
            this.currentList = null;
            this.currentWord = null;
        }
    }

    async saveData() {
        try {
            const data = {
                lists: this.lists,
                currentList: this.currentList ? this.currentList.id : null,
                currentWord: this.currentWord ? this.currentWord.id : null,
            };
            await saveUserData(data);
            console.log('Данные успешно сохранены:', data);
        } catch (error) {
            console.error('Ошибка сохранения данных:', error);
            this.showErrorMessage('Ошибка сохранения данных');
        }
    }

    handleRouteChange() {
        const hash = window.location.hash.slice(1);
        const appContainer = document.getElementById('app');
        appContainer.innerHTML = '';

        switch (hash) {
            case '':
                this.currentPage = new mainPage(this);
                break;
            case 'list':
                this.currentPage = new listPage(this);
                break;
            case 'word':
                this.currentPage = new wordPage(this);
                break;
            case 'repeat':
                this.currentPage = new repeatPage(this);
                break;
            default:
                this.currentPage = new mainPage(this);
        }

        if (this.currentPage) {
            this.currentPage.render(appContainer);
        } else {
            console.error('Ошибка: текущая страница не определена');
        }
    }

    renderPage() {
        const appContainer = document.getElementById('app');
        if (appContainer && this.currentPage) {
            appContainer.innerHTML = '';
            this.currentPage.render(appContainer);
        } else {
            console.error('Ошибка рендеринга: контейнер или текущая страница не найдены');
        }
    }

    navigateTo(page, params = {}) {
        switch (page) {
            case 'main':
            case '':
                this.currentPage = new mainPage(this);
                break;
            case 'list':
                this.currentPage = new listPage(this);
                break;
            case 'word':
                this.currentPage = new wordPage(this);
                break;
            case 'repeat':
                this.currentPage = new repeatPage(this, params.words, params.settings);
                break;
            default:
                console.error('Unknown page:', page);
                this.currentPage = new mainPage(this);
                break;
        }
        
        this.renderPage();
    }

    getList(listId) {
        return this.lists.find(list => list.id === listId);
    }

    addList(name) {
        const newList = {
            id: Date.now().toString(),
            name: name,
            words: []
        };
        this.lists.push(newList);
        this.saveData();
        return newList;
    }

    updateList(listId, newName) {
        const list = this.lists.find(l => l.id === listId);
        if (list) {
            list.name = newName;
            this.saveData();
        }
        return list;
    }

    deleteList(listId) {
        this.lists = this.lists.filter(l => l.id !== listId);
        if (this.currentList && this.currentList.id === listId) {
            this.currentList = null;
        }
        this.saveData();
    }

    addWord(listId, word) {
        const list = this.lists.find(l => l.id === listId);
        if (!list) {
            console.error(`Список с id ${listId} не найден`);
            throw new Error(`Список не найден`);
        }
        if (!Array.isArray(list.words)) {
            list.words = [];
        }
        const newWord = {
            id: Date.now().toString(),
            ...word
        };
        list.words.push(newWord);
        this.saveData();
        return newWord;
    }

    updateWord(listId, wordId, updatedWord) {
        const list = this.lists.find(l => l.id === listId);
        if (list) {
            const wordIndex = list.words.findIndex(w => w.id === wordId);
            if (wordIndex !== -1) {
                list.words[wordIndex] = { ...list.words[wordIndex], ...updatedWord };
                this.saveData();
                return list.words[wordIndex];
            }
        }
        return null;
    }

    deleteWord(listId, wordId) {
        const list = this.lists.find(l => l.id === listId);
        if (list) {
            list.words = list.words.filter(w => w.id !== wordId);
            if (this.currentWord && this.currentWord.id === wordId) {
                this.currentWord = null;
            }
            this.saveData();
        }
    }

    toggleSelectionMode() {
        this.isSelectionMode = !this.isSelectionMode;
        this.renderPage();
    }

    startRepeatAll() {
        const allWords = this.lists.flatMap(list => list.words);
        this.startRepeat(allWords);
    }

    startRepeatList(listId) {
        const list = this.getList(listId);
        if (list) {
            this.startRepeat(list.words);
        }
    }

    startRepeat(words) {
        const content = document.createElement('div');
        
        const titleEl = document.createElement('h2');
        titleEl.textContent = 'Настройки повторения';
        content.appendChild(titleEl);

        const sideSelect = this.createSelect('side-select', 'Сторона:', [
            { value: '1', text: 'Первая сторона' },
            { value: '2', text: 'Вторая сторона' },
            { value: 'random', text: 'Перемешать' }
        ]);
        content.appendChild(sideSelect);

        const orderSelect = this.createSelect('order-select', 'Порядок слов:', [
            { value: 'sequential', text: 'По порядку' },
            { value: 'random', text: 'Перемешать' }
        ]);
        content.appendChild(orderSelect);

        new Modal(content, {
            onConfirm: () => {
                const side = document.getElementById('side-select').value;
                const order = document.getElementById('order-select').value;
                this.navigateTo('repeat', { words, settings: { side, order } });
            },
            showConfirmButtons: true
        }).render();
    }

    createSelect(id, label, options) {
        const container = document.createElement('div');
        container.className = 'select-container';

        const labelEl = document.createElement('label');
        labelEl.htmlFor = id;
        labelEl.textContent = label;
        container.appendChild(labelEl);

        const select = document.createElement('select');
        select.id = id;
        select.className = 'settings-select';

        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            select.appendChild(option);
        });

        container.appendChild(select);
        return container;
    }

    showErrorMessage(message) {
        const errorButton = this.createButton('OK', () => {}, 'error-button');
        new Modal(`
            <div class="error-message">
                <div class="error-icon">⚠️</div>
                <div class="error-text">${message}</div>
                ${errorButton.render().outerHTML}
            </div>
        `, {
            onClose: () => {},
            closable: true,
            className: 'error-modal'
        }).render();
    }
}