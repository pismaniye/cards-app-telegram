import app from '../main.js';

export const listPage = {
  render() {
    if (!app.currentList) {
      console.error('Текущий список не определен');
      app.navigateTo('main');
      return document.createElement('div');
    }

    const container = document.createElement('div');
    container.innerHTML = `
      <div class="header">
        <h1>${app.currentList.name}</h1>
        <button class="button" id="${app.isSelectMode ? 'exitSelectMode' : 'selectMode'}">
          ${app.isSelectMode ? 'Выйти из режима выбора' : 'Выбрать'}
        </button>
      </div>
      <div class="card">
        <ul id="wordContainer"></ul>
      </div>
      <div class="button-container">
        ${app.isSelectMode ? `
          <button class="button" id="deleteSelected">Удалить</button>
          <button class="button" id="repeatSelected">Повторить</button>
        ` : `
          <button class="button" id="addWord">+ слово</button>
          <button class="button" id="repeatAll">Повторить все</button>
        `}
        <button class="button" id="back">Назад</button>
      </div>
      <div id="errorContainer" class="error-container"></div>
    `;

    const wordContainer = container.querySelector('#wordContainer');
    app.currentList.words.forEach(word => {
      const li = document.createElement('li');
      li.className = 'list-item';
      li.innerHTML = `
        ${app.isSelectMode ? `<input type="checkbox" class="selectItem" data-id="${word.id}">` : ''}
        <span class="word-item">
          <span class="wordSide1">${word.side1}</span> - <span class="wordSide2">${word.side2}</span>
        </span>
        ${!app.isSelectMode ? `
          <div class="button-container">
            <button class="button editWord" data-id="${word.id}">Редактировать</button>
            <button class="button deleteWord" data-id="${word.id}">Удалить</button>
          </div>
        ` : ''}
      `;
      wordContainer.appendChild(li);
    });

    this.setupListeners(container);
    this.updateCheckboxes(container);
    return container;
  },

  setupListeners(container) {
    const toggleSelectModeButton = container.querySelector('#selectMode, #exitSelectMode');
    if (toggleSelectModeButton) {
      toggleSelectModeButton.addEventListener('click', () => {
        app.toggleSelectMode();
      });
    }

    const backButton = container.querySelector('#back');
    if (backButton) {
      backButton.addEventListener('click', async () => {
        try {
          await app.navigateTo('main');
        } catch (error) {
          this.showError(container, 'Ошибка при возврате на главную страницу: ' + error.message);
        }
      });
    }

    if (app.isSelectMode) {
      const deleteSelectedButton = container.querySelector('#deleteSelected');
      if (deleteSelectedButton) {
        deleteSelectedButton.addEventListener('click', async () => {
          if (confirm('Вы уверены, что хотите удалить выбранные слова?')) {
            try {
              await app.deleteSelectedItems();
              this.updateCheckboxes(container);
            } catch (error) {
              this.showError(container, 'Ошибка при удалении выбранных слов: ' + error.message);
            }
          }
        });
      }

      const repeatSelectedButton = container.querySelector('#repeatSelected');
      if (repeatSelectedButton) {
        repeatSelectedButton.addEventListener('click', () => {
          app.startRepeatForSelectedItems();
        });
      }

      container.querySelectorAll('.selectItem').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const wordId = parseInt(e.target.dataset.id);
          const word = app.currentList.words.find(w => w.id === wordId);
          if (word) {
            app.toggleItemSelection(word);
            this.updateCheckboxes(container);
          }
        });
      });
    } else {
      const addWordButton = container.querySelector('#addWord');
      if (addWordButton) {
        addWordButton.addEventListener('click', async () => {
          app.currentWord = null;
          try {
            await app.navigateTo('word');
          } catch (error) {
            this.showError(container, 'Ошибка при переходе на страницу добавления слова: ' + error.message);
          }
        });
      }

      const repeatAllButton = container.querySelector('#repeatAll');
      if (repeatAllButton) {
        repeatAllButton.addEventListener('click', () => {
          app.startRepeat(app.currentList.words);
        });
      }

      container.querySelectorAll('.editWord').forEach(button => {
        button.addEventListener('click', async (e) => {
          const wordId = parseInt(e.target.dataset.id);
          app.currentWord = app.currentList.words.find(w => w.id === wordId);
          try {
            await app.navigateTo('word');
          } catch (error) {
            this.showError(container, 'Ошибка при переходе на страницу редактирования слова: ' + error.message);
          }
        });
      });

      container.querySelectorAll('.deleteWord').forEach(button => {
        button.addEventListener('click', async (e) => {
          const wordId = parseInt(e.target.dataset.id);
          if (confirm('Вы уверены, что хотите удалить это слово?')) {
            try {
              await app.deleteWord(wordId);
            } catch (error) {
              this.showError(container, 'Ошибка при удалении слова: ' + error.message);
            }
          }
        });
      });
    }
  },

  updateCheckboxes(container) {
    container.querySelectorAll('.selectItem').forEach(checkbox => {
      const wordId = parseInt(checkbox.dataset.id);
      const isSelected = app.selectedItems.some(item => item.id === wordId);
      checkbox.checked = isSelected;
    });
  },

  showError(container, message) {
    const errorContainer = container.querySelector('#errorContainer');
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 3000);
  }
};