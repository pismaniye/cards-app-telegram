import app from '../main.js';

export const listPage = {
    render() {
      const container = document.createElement('div');
      container.innerHTML = `
        <h1>${app.currentList.name}
          ${app.isSelectMode ? `
            <button id="deleteSelected">Удалить</button>
            <button id="repeatSelected">Повторить</button>
            <button id="exitSelectMode">Выйти из режима выбора</button>
          ` : `
            <button id="selectMode">Выбрать</button>
          `}
        </h1>
        <ul id="wordContainer"></ul>
        <button id="addWord">+ слово</button>
        <button id="repeatAll">Повторить все</button>
        <button id="back">Назад</button>
      `;

    const wordContainer = container.querySelector('#wordContainer');
    app.currentList.words.forEach(word => {
      const li = document.createElement('li');
      li.innerHTML = `
        ${app.isSelectMode ? `<input type="checkbox" class="selectItem" data-id="${word.id}">` : ''}
        <span class="wordSide1">${word.side1}</span> - <span class="wordSide2">${word.side2}</span>
        ${!app.isSelectMode ? `
          <button class="editWord" data-id="${word.id}">Edit</button>
          <button class="deleteWord" data-id="${word.id}">Delete</button>
        ` : ''}
      `;
      wordContainer.appendChild(li);
    });

    this.setupListeners(container);
    return container;
  },

  setupListeners(container) {
    container.querySelector('#addWord').addEventListener('click', () => {
      app.currentWord = null;
      app.navigateTo('word');
    });

    container.querySelector('#repeatAll').addEventListener('click', () => {
        app.startRepeat(app.currentList.words);
      });

    container.querySelector('#back').addEventListener('click', () => {
      app.navigateTo('main');
    });

    const selectModeButton = container.querySelector('#selectMode');
    if (selectModeButton) {
      selectModeButton.addEventListener('click', () => {
        app.toggleSelectMode();
      });
    }

    if (app.isSelectMode) {
      container.querySelector('#deleteSelected').addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите удалить выбранные слова?')) {
          app.deleteSelectedItems();
        }
      });

      container.querySelector('#repeatSelected').addEventListener('click', () => {
        const selectedWords = app.selectedItems.filter(item => item.side1 && item.side2);
        app.startRepeat(selectedWords);
      });

      container.querySelectorAll('.selectItem').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const wordId = parseInt(e.target.dataset.id);
          const word = app.currentList.words.find(w => w.id === wordId);
          app.toggleItemSelection(word);
        });
      });

      container.querySelector('#exitSelectMode').addEventListener('click', () => {
        app.isSelectMode = false;
        app.selectedItems = [];
        app.renderPage();
      });
      
    } else {
      container.querySelectorAll('.editWord').forEach(button => {
        button.addEventListener('click', (e) => {
          const wordId = parseInt(e.target.dataset.id);
          app.currentWord = app.currentList.words.find(w => w.id === wordId);
          app.navigateTo('word');
        });
      });

      container.querySelectorAll('.deleteWord').forEach(button => {
        button.addEventListener('click', (e) => {
          const wordId = parseInt(e.target.dataset.id);
          if (confirm('Вы уверены, что хотите удалить это слово?')) {
            app.deleteWord(wordId);
          }
        });
      });
    }
  }
};