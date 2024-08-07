import { mainPage } from './components/mainPage.js';
import { listPage } from './components/listPage.js';
import { wordPage } from './components/wordPage.js';
import { repeatPage } from './components/repeatPage.js';
import { saveUserData, loadUserData, authenticateAnonymously, FirebaseError } from './utils/firebase.js';
import { getTelegramInstance } from './utils/telegram.js';

class App {
    constructor() {
        this.currentPage = 'main';
        this.lists = [];
        this.currentList = null;
        this.currentWord = null;
        this.selectedItems = [];
        this.isSelectMode = false;
        this.repeatWords = [];
        this.currentRepeatIndex = 0;
        this.showingAnswer = false;
        this.repeatSettings = { side: '1', order: 'sequential' };
        this.tg = getTelegramInstance();
        this.pageContainer = null; // Добавляем эту строку
    }

    async init() {
        console.log("Initializing app...");
        try {
            this.pageContainer = document.getElementById('app'); // Инициализируем pageContainer
            if (!this.pageContainer) {
                throw new Error('Page container not found');
            }
            await authenticateAnonymously();
            await this.loadData();
            await this.renderPage();
            this.setupTelegramBackButton();
            console.log("App initialized successfully");
        } catch (error) {
            this.handleError(error, 'Ошибка инициализации');
        }
    }

    setupTelegramBackButton() {
        console.log("Setting up Telegram back button");
        this.tg.BackButton.onClick(() => {
            if (this.currentPage === 'main') {
                this.tg.close();
            } else {
                this.navigateTo('main');
            }
        });
    }

    async navigateTo(page) {
        console.log(`Navigating to page: ${page}`);
        this.currentPage = page;
        this.isSelectMode = false;
        this.selectedItems = [];
        await this.renderPage();
        this.updateTelegramBackButton();
    }

    updateTelegramBackButton() {
        if (this.currentPage === 'main') {
            this.tg.BackButton.hide();
        } else {
            this.tg.BackButton.show();
        }
    }

    async renderPage() {
        console.log('Rendering page:', this.currentPage);
        if (!this.pageContainer) {
            console.error('Page container is not initialized');
            return;
        }
        this.pageContainer.innerHTML = '';
        let pageContent;

        try {
            switch (this.currentPage) {
                case 'main':
                    pageContent = await mainPage.render(this);
                    break;
                case 'list':
                    pageContent = await listPage.render(this);
                    break;
                case 'word':
                    pageContent = await wordPage.render(this);
                    break;
                case 'repeat':
                    pageContent = await repeatPage.render(this);
                    break;
                default:
                    console.error('Unknown page:', this.currentPage);
                    return;
            }

            this.pageContainer.appendChild(pageContent);
        } catch (error) {
            console.error('Error rendering page:', error);
            this.showError('Произошла ошибка при загрузке страницы');
        }
    }

    toggleSelectMode() {
        console.log(`Переключение режима выбора. Текущее состояние: ${this.isSelectMode}`);
        this.isSelectMode = !this.isSelectMode;
        this.selectedItems = [];
        this.renderPage();
    }

    toggleItemSelection(item) {
        console.log(`Переключение выбора элемента: ${JSON.stringify(item)}`);
        const index = this.selectedItems.findIndex(selectedItem => selectedItem.id === item.id);
        if (index === -1) {
            this.selectedItems.push(item);
        } else {
            this.selectedItems.splice(index, 1);
        }
        this.updateSelectModeUI();
    }

    updateSelectModeUI() {
        console.log("Обновление UI режима выбора");
        const deleteSelectedButton = document.getElementById('deleteSelected');
        const repeatSelectedButton = document.getElementById('repeatSelected');
        const repeatAllButton = document.getElementById('repeatAll');

        const hasSelectedItems = this.selectedItems.length > 0;

        if (deleteSelectedButton) {
            deleteSelectedButton.style.display = hasSelectedItems ? 'inline-block' : 'none';
        }
        if (repeatSelectedButton) {
            repeatSelectedButton.style.display = hasSelectedItems ? 'inline-block' : 'none';
        }
        if (repeatAllButton) {
            repeatAllButton.disabled = this.lists.length === 0;
        }
    }

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
    }

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
    }

    startRepeat(words = this.currentList.words) {
        console.log(`Начало повторения с ${words.length} словами`);
        this.showRepeatSettings(() => {
            this.repeatWords = [...words];
            if (this.repeatSettings.order === 'random') {
                this.repeatWords = this.shuffleArray(this.repeatWords);
            }
            this.currentRepeatIndex = 0;
            this.showingAnswer = false;
            this.navigateTo('repeat');
        });
    }

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
    }

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
    }

    getRandomSide(word) {
        const isFirstSide = Math.random() < 0.5;
        return {
            question: isFirstSide ? word.side1 : word.side2,
            answer: isFirstSide ? word.side2 : word.side1
        };
    }

    shuffleWordsIfNeeded() {
        if (this.repeatSettings.order === 'random') {
            this.shuffleArray(this.repeatWords);
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

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
    }

    showAnswer() {
        console.log("Showing answer");
        this.showingAnswer = true;
        this.renderPage();
    }

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
    }

    async loadData() {
        console.log("Loading data...");
        try {
            const data = await loadUserData();
            if (data) {
                console.log("Data loaded:", data);
                this.lists = Array.isArray(data.lists) ? data.lists : [];
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
    }

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
            this.lists.pop();
        }
    }

    setCurrentList(listId) {
        console.log("Setting current list:", listId);
        this.currentList = this.lists.find(list => list.id === listId);
        if (this.currentList && !Array.isArray(this.currentList.words)) {
            this.currentList.words = [];
        }
        console.log("Current list set to:", this.currentList);
    }

    async updateList(listId, newName) {
        const list = this.lists.find(l => l.id === listId);
        if (list) {
            list.name = newName;
            try {
                await this.saveData();
                console.log("Список обновлен успешно");
            } catch (error) {
                console.error("Ошибка при обновлении списка:", error);
                this.handleError(error, 'Ошибка при обновлении списка');
            }
        }
    }

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
    }

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
            this.currentList.words.pop();
        }
    }

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
    }

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
    }

    handleError(error, context) {
        console.error(`${context}:`, error);
        let errorMessage = 'Произошла неизвестная ошибка';
        if (error instanceof FirebaseError) {
            switch(error.code) {
                case 'PERMISSION_DENIED':
                    errorMessage = 'У вас нет прав для выполнения этого действия';
                    break;
                case 'NETWORK_ERROR':
                    errorMessage = 'Проблема с подключением к сети';
                    break;
                default:
                    errorMessage = `Ошибка Firebase: ${error.message}`;
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        this.showError(`${context}: ${errorMessage}`);
    }

    showError(message) {
        console.error(message);
        let errorContainer = document.getElementById('errorContainer');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.id = 'errorContainer';
            errorContainer.className = 'error-container';
            document.body.appendChild(errorContainer);
        }
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }
}

export default App;