import app from '../main.js';

export const listPage = {
  render() {
    if (!app.currentList) {
      console.error('Текущий список не определен');
      app.navigateTo('main');
      return document.createElement('div');
    }

    console.log('Отрисовка страницы списка для списка:', app.currentList);

    const container = document.createElement('div');
    container.innerHTML = `
      <div class="header">
        <h1>${app.currentList.name}</h1>
        <button class="text-button" id="${app.isSelectMode ? 'backFromSelect' : 'selectMode'}">
          ${app.isSelectMode ? 'Готово' : 'Выбрать'}
        </button>
      </div>
      <div class="card">
        <ul id="wordContainer"></ul>
      </div>
      ${app.isSelectMode ? `
        <div class="button-container">
          <button class="button" id="deleteSelected" style="display: none;">Удалить</button>
          <button class="button" id="repeatSelected" style="display: none;">Повторить</button>
        </div>
      ` : `
        <button class="fab" id="addWord"><span class="nonselectable">+</span></button>
      `}
      <div class="button-container">
        <button class="button" id="goToMainPage">Списки</button>
        ${!app.isSelectMode ? `<button class="button" id="repeatAll">Повторить все</button>` : ''}
      </div>
    `;

    const wordContainer = container.querySelector('#wordContainer');
    if (Array.isArray(app.currentList.words)) {
      if (app.currentList.words.length === 0) {
        wordContainer.innerHTML = '<li>Список пуст. Добавьте новые слова.</li>';
      } else {
        app.currentList.words.forEach(word => {
          this.renderWordItem(wordContainer, word);
        });
      }
    } else {
      console.error('app.currentList.words is not an array:', app.currentList.words);
      wordContainer.innerHTML = '<li>Ошибка загрузки слов</li>';
    }

    this.setupListeners(container);
    if (app.isSelectMode) {
      this.updateCheckboxes(container);
    }
    return container;
  },

  renderWordItem(container, word) {
    const li = document.createElement('li');
    li.className = 'list-item';
    li.dataset.id = word.id;
    li.innerHTML = `
      <div class="list-item-content">
        ${app.isSelectMode ? `<input type="checkbox" class="selectItem" data-id="${word.id}">` : ''}
        <span class="item-name nonselectable">${word.side1} - ${word.side2}</span>
      </div>
    `;
    container.appendChild(li);
    if (!app.isSelectMode) {
      this.setupWordItemListeners(li);
    }
  },

  setupListeners(container) {
    const toggleSelectModeButton = container.querySelector('#selectMode, #backFromSelect');
    if (toggleSelectModeButton) {
      toggleSelectModeButton.addEventListener('click', () => {
        if (app.isSelectMode) {
          app.isSelectMode = false;
          app.selectedItems = [];
          app.renderPage();
        } else {
          app.toggleSelectMode();
        }
      });
    }

    const goToMainPageButton = container.querySelector('#goToMainPage');
    if (goToMainPageButton) {
      goToMainPageButton.addEventListener('click', () => {
        app.navigateTo('main');
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
            app.updateSelectModeUI();
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

  setupWordItemListeners(li) {
    let longPressTimer;
    let isLongPress = false;

    const startLongPress = (e) => {
      isLongPress = false;
      longPressTimer = setTimeout(() => {
        isLongPress = true;
        this.showContextMenu(li, e);
      }, 500);
    };

    const endLongPress = () => {
      clearTimeout(longPressTimer);
    };

    li.addEventListener('touchstart', startLongPress);
    li.addEventListener('touchend', endLongPress);
    li.addEventListener('touchmove', endLongPress);

    li.addEventListener('mousedown', startLongPress);
    li.addEventListener('mouseup', endLongPress);
    li.addEventListener('mouseleave', endLongPress);

    li.addEventListener('click', (e) => {
      if (!isLongPress) {
        const wordId = parseInt(li.dataset.id);
        this.editWord(wordId);
      }
    });
  },

  showContextMenu(listItem, event) {
    event.preventDefault();
    const wordId = parseInt(listItem.dataset.id);
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.innerHTML = `
      <div class="context-menu-item" id="editWord">Редактировать</div>
      <div class="context-menu-item" id="deleteWord">Удалить</div>
    `;

    document.body.appendChild(contextMenu);

    const rect = listItem.getBoundingClientRect();
    contextMenu.style.top = `${rect.bottom}px`;
    contextMenu.style.left = `${rect.left}px`;

    contextMenu.querySelector('#editWord').addEventListener('click', () => {
      this.editWord(wordId);
      document.body.removeChild(contextMenu);
    });

    contextMenu.querySelector('#deleteWord').addEventListener('click', () => {
      this.deleteWord(wordId);
      document.body.removeChild(contextMenu);
    });

    document.addEventListener('click', function removeMenu() {
      document.body.removeChild(contextMenu);
      document.removeEventListener('click', removeMenu);
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