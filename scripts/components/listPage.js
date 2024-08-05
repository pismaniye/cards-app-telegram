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
    `;

    const wordContainer = container.querySelector('#wordContainer');
    app.currentList.words.forEach(word => {
      const li = document.createElement('li');
      li.className = 'list-item';
      li.dataset.id = word.id;
      li.innerHTML = `
        <div class="list-item-content">
          ${app.isSelectMode ? `<input type="checkbox" class="selectItem" data-id="${word.id}">` : ''}
          <span class="item-name">${word.side1} - ${word.side2}</span>
        </div>
        <div class="list-item-actions">
          <button class="edit-btn">Редактировать</button>
          <button class="delete-btn">Удалить</button>
        </div>
      `;
      wordContainer.appendChild(li);
      if (!app.isSelectMode) {
        this.setupSwipe(li);
      }
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
          app.showError('Ошибка при возврате на главную страницу: ' + error.message);
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
              app.showError('Ошибка при удалении выбранных слов: ' + error.message);
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
            app.showError('Ошибка при переходе на страницу добавления слова: ' + error.message);
          }
        });
      }

      const repeatAllButton = container.querySelector('#repeatAll');
      if (repeatAllButton) {
        repeatAllButton.addEventListener('click', () => {
          app.startRepeat(app.currentList.words);
        });
      }
    }
  },

  setupSwipe(listItem) {
    const hammer = new Hammer(listItem);
    const content = listItem.querySelector('.list-item-content');
    const actions = listItem.querySelector('.list-item-actions');
    let isOpen = false;

    hammer.on('swipeleft swiperight', function(ev) {
      if (ev.type === 'swipeleft' && !isOpen) {
        content.style.transform = 'translateX(-100px)';
        actions.style.transform = 'translateX(-100px)';
        isOpen = true;
      } else if (ev.type === 'swiperight' && isOpen) {
        content.style.transform = 'translateX(0)';
        actions.style.transform = 'translateX(0)';
        isOpen = false;
      }
    });

    const editBtn = listItem.querySelector('.edit-btn');
    const deleteBtn = listItem.querySelector('.delete-btn');

    editBtn.addEventListener('click', () => {
      const wordId = parseInt(listItem.dataset.id);
      this.editWord(wordId);
    });

    deleteBtn.addEventListener('click', () => {
      const wordId = parseInt(listItem.dataset.id);
      this.deleteWord(wordId);
    });
  },

  editWord(wordId) {
    app.currentWord = app.currentList.words.find(w => w.id === wordId);
    app.navigateTo('word');
  },

  deleteWord(wordId) {
    if (confirm('Вы уверены, что хотите удалить это слово?')) {
      app.deleteWord(wordId);
    }
  },

  updateCheckboxes(container) {
    container.querySelectorAll('.selectItem').forEach(checkbox => {
      const wordId = parseInt(checkbox.dataset.id);
      const isSelected = app.selectedItems.some(item => item.id === wordId);
      checkbox.checked = isSelected;
    });
  }
};