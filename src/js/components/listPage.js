export const listPage = {
  async render(app) {
    if (!app.currentList) {
      console.error('Текущий список не определен');
      app.navigateTo('main');
      return document.createElement('div');
    }

    console.log('Отрисовка страницы списка для списка:', app.currentList);

    const container = document.createElement('div');
    container.innerHTML = `
      <div class="header">
        <h1 class="nonselectable">${app.currentList.name}</h1>
        <button class="text-button nonselectable" id="${app.isSelectMode ? 'backFromSelect' : 'selectMode'}">
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
        await this.renderWordItems(wordContainer, app);
      }
    } else {
      console.error('app.currentList.words is not an array:', app.currentList.words);
      wordContainer.innerHTML = '<li>Ошибка загрузки слов</li>';
    }

    this.setupListeners(container, app);
    if (app.isSelectMode) {
      this.updateCheckboxes(container, app);
    }
    return container;
  },

  async renderWordItems(container, app) {
    const fragment = document.createDocumentFragment();
    const chunkSize = 20;

    for (let i = 0; i < app.currentList.words.length; i += chunkSize) {
      const chunk = app.currentList.words.slice(i, i + chunkSize);
      await new Promise(resolve => {
        setTimeout(() => {
          chunk.forEach(word => {
            const li = this.renderWordItem(word, app);
            fragment.appendChild(li);
          });
          resolve();
        }, 0);
      });
    }

    container.appendChild(fragment);
  },

  renderWordItem(word, app) {
    const li = document.createElement('li');
    li.className = 'list-item';
    li.dataset.id = word.id;
    li.innerHTML = `
      <div class="list-item-content">
        ${app.isSelectMode ? `<input type="checkbox" class="selectItem" data-id="${word.id}">` : ''}
        <span class="item-name nonselectable">${word.side1} - ${word.side2}</span>
      </div>
    `;
    return li;
  },

  setupListeners(container, app) {
    const wordContainer = container.querySelector('#wordContainer');
  
    wordContainer.addEventListener('long-press', (e) => {
      const wordItem = e.target.closest('.list-item');
      if (wordItem) {
        e.preventDefault();
        this.showContextMenu(wordItem, e, app);
      }
    });
  
    wordContainer.addEventListener('click', (e) => {
      const wordItem = e.target.closest('.list-item');
      if (wordItem && !e.target.closest('.context-menu') && !app.isSelectMode) {
        const wordId = parseInt(wordItem.dataset.id);
        this.editWord(wordId, app);
      }
    });
  
    const toggleSelectModeButton = container.querySelector('#selectMode, #backFromSelect');
    if (toggleSelectModeButton) {
      toggleSelectModeButton.addEventListener('click', () => {
        app.toggleSelectMode();
        app.renderPage();
      });
    }
  
    const goToMainPageButton = container.querySelector('#goToMainPage');
    if (goToMainPageButton) {
      goToMainPageButton.addEventListener('click', () => app.navigateTo('main'));
    }
  
    if (app.isSelectMode) {
      const deleteSelectedButton = container.querySelector('#deleteSelected');
      if (deleteSelectedButton) {
        deleteSelectedButton.addEventListener('click', async () => {
          if (confirm('Вы уверены, что хотите удалить выбранные слова?')) {
            try {
              await app.deleteSelectedItems();
              this.updateCheckboxes(container, app);
            } catch (error) {
              app.showError('Ошибка при удалении выбранных слов: ' + error.message);
            }
          }
        });
      }
  
      const repeatSelectedButton = container.querySelector('#repeatSelected');
      if (repeatSelectedButton) {
        repeatSelectedButton.addEventListener('click', () => app.startRepeatForSelectedItems());
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
        repeatAllButton.addEventListener('click', () => app.startRepeat(app.currentList.words));
      }
    }
  },

  showContextMenu(wordItem, event, app) {
    event.preventDefault();

    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    const wordId = parseInt(wordItem.dataset.id);
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.innerHTML = `
      <div class="context-menu-item" data-action="edit">Редактировать</div>
      <div class="context-menu-item" data-action="delete">Удалить</div>
    `;

    document.body.appendChild(contextMenu);

    const rect = wordItem.getBoundingClientRect();
    contextMenu.style.top = `${rect.bottom}px`;
    contextMenu.style.left = `${rect.left}px`;

    contextMenu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action === 'edit') {
        this.editWord(wordId, app);
      } else if (action === 'delete') {
        this.deleteWord(wordId, app);
      }
      contextMenu.remove();
    });

    document.addEventListener('click', (e) => {
      if (!contextMenu.contains(e.target)) {
        contextMenu.remove();
      }
    }, { once: true });
  },

  editWord(wordId, app) {
    app.currentWord = app.currentList.words.find(w => w.id === wordId);
    app.navigateTo('word');
  },

  deleteWord(wordId, app) {
    if (confirm('Вы уверены, что хотите удалить это слово?')) {
      app.deleteWord(wordId);
    }
  },

  updateCheckboxes(container, app) {
    container.querySelectorAll('.selectItem').forEach(checkbox => {
      const wordId = parseInt(checkbox.dataset.id);
      const isSelected = app.selectedItems.some(item => item.id === wordId);
      checkbox.checked = isSelected;
    });
  }
};