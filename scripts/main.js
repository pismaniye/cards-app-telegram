import { renderMainPage } from './components/mainPage.js';
import { renderListPage } from './components/listPage.js';
import { renderWordPage } from './components/wordPage.js';
import { renderRepeatPage } from './components/repeatPage.js';

const app = {
    currentPage: 'main',
    lists: [],
    currentList: null,
    currentWord: null,
    currentWordIndex: -1,
    repeatSettings: null,
    repeatQueue: [],
    showingAnswer: false,
    
    init() {
        this.loadData();
        this.renderPage();
    },
    
    renderPage() {
        const appElement = document.getElementById('app');
        appElement.innerHTML = '';
        
        switch (this.currentPage) {
            case 'main':
                renderMainPage(appElement, this.lists);
                break;
            case 'list':
                renderListPage(appElement, this.currentList);
                break;
            case 'word':
                renderWordPage(appElement);
                break;
            case 'repeat':
                renderRepeatPage(appElement, this.currentList, this.repeatSettings);
                break;
        }
    },

    startRepeat(list, side, order) {
        this.repeatSettings = { side, order };
        this.repeatQueue = [...list.words];
        if (order === 'shuffle') {
            this.shuffleArray(this.repeatQueue);
        }
        this.currentPage = 'repeat';
        this.showingAnswer = false;
        this.renderPage();
    },

    getCurrentWord() {
        return this.repeatQueue[0];
    },

    showAnswer() {
        this.showingAnswer = true;
        this.renderPage();
    },

    nextWord() {
        this.showingAnswer = false;
        if (this.repeatQueue.length > 1) {
            this.repeatQueue.shift();
        } else {
            alert("Молодец! Все слова пройдены");
            this.currentPage = 'list';
        }
        this.renderPage();
    },

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    // Новые методы для работы с данными
    saveData() {
        localStorage.setItem('cardAppLists', JSON.stringify(this.lists));
    },

    loadData() {
        const savedLists = localStorage.getItem('cardAppLists');
        if (savedLists) {
            this.lists = JSON.parse(savedLists);
        }
    },

    addList(name) {
        this.lists.push({ name, words: [] });
        this.saveData();
    },

    updateList(index, newName) {
        this.lists[index].name = newName;
        this.saveData();
    },

    deleteList(index) {
        this.lists.splice(index, 1);
        this.saveData();
    },

    addWord(listIndex, word) {
        this.lists[listIndex].words.push(word);
        this.saveData();
    },

    updateWord(listIndex, wordIndex, newWord) {
        this.lists[listIndex].words[wordIndex] = newWord;
        this.saveData();
    },

    deleteWord(listIndex, wordIndex) {
        this.lists[listIndex].words.splice(wordIndex, 1);
        this.saveData();
    }
};

window.app = app;
app.init();