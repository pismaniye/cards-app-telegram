import app from '../main.js';

export const mainPage = {
  render() {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="header">
        <h1>Списки</h1>
        ${app.isSelectMode ? `
          <button class="button" id="backFromSelect">Назад</button>
        ` : `
          <button class="button" id="selectMode">Выбрать</button>
        `}
      </div>
      <div class="card">
        <ul id="listContainer"></ul>
      </div>
      <div class="button-container">
        ${app.isSelectMode ? `
          <button class="button" id="deleteSelected">Удалить</button>
          <button class="button" id="repeatSelected">Повторить выбранное</button>
          <button class="button" id="repeatAll">Повторить все</button>
        ` : `
          <button class="button" id="addList">+ Добавить список</button>
        `}
      </div>
    `;

    const listContainer = container.querySelector('#listContainer');
    app.lists.forEach(list => {
      const li = document.createElement('li');
      li.className = 'list-item';
      li.dataset.id = list.id;
      li.innerHTML = `
        <div class="list-item-content">
          ${app.isSelectMode ? `<input type="checkbox" class="selectItem" data-id="${list.id}">` : ''}
          <span class="item-name">${list.name}</span>
        </div>
      `;
      listContainer.appendChild(li);
      if (!app.isSelectMode) {
        this.setupLongPress(li);
      }
    });

    this.setupListeners(container);
    if (app.isSelectMode) {
      this.updateCheckboxes(container);
    }
    return container;
  },

  setupListeners(container) {
    const addListButton = container.querySelector('#addList');
    if (addListButton) {
      addListButton.addEventListener('click', async () => {
        const name = prompt('Введите название списка:');
        if (name) {
          try {
            await app.addList(name);
          } catch (error) {
            app.showError('Ошибка при добавлении списка: ' + error.message);
          }
        }
      });
    }

    const selectModeButton = container.querySelector('#selectMode');
    if (selectModeButton) {
      selectModeButton.addEventListener('click', () => {
        app.toggleSelectMode();
      });
    }

    const backFromSelectButton = container.querySelector('#backFromSelect');
    if (backFromSelectButton) {
      backFromSelectButton.addEventListener('click', () => {
        app.toggleSelectMode();
      });
    }

    if (app.isSelectMode) {
      const deleteSelectedButton = container.querySelector('#deleteSelected');
      if (deleteSelectedButton) {
        deleteSelectedButton.addEventListener('click', async () => {
          if (confirm('Вы уверены, что хотите удалить выбранные списки?')) {
            try {
              await app.deleteSelectedItems();
            } catch (error) {
              app.showError('Ошибка при удалении выбранных списков: ' + error.message);
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

      const repeatAllButton = container.querySelector('#repeatAll');
      if (repeatAllButton) {
        repeatAllButton.addEventListener('click', () => {
          this.startRepeatAll();
        });
      }

      container.querySelectorAll('.selectItem').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const listId = parseInt(e.target.dataset.id);
          const list = app.lists.find(l => l.id === listId);
          if (list) {
            app.toggleItemSelection(list);
            this.updateCheckboxes(container);
          }
        });
      });
    }
  },

  setupLongPress(listItem) {
    let pressTimer;
    const itemName = listItem.querySelector('.item-name');

    itemName.addEventListener('touchstart', (e) => {
      pressTimer = setTimeout(() => {
        this.showContextMenu(listItem, e);
      }, 500);
    });

    itemName.addEventListener('touchend', () => {
      clearTimeout(pressTimer);
    });

    itemName.addEventListener('click', () => {
      const listId = parseInt(listItem.dataset.id);
      this.openList(listId);
    });
  },

  showContextMenu(listItem, event) {
    event.preventDefault();
    const listId = parseInt(listItem.dataset.id);
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.innerHTML = `
      <button class="context-menu-item" id="editList">Редактировать</button>
      <button class="context-menu-item" id="deleteList">Удалить</button>
    `;

    document.body.appendChild(contextMenu);

    const rect = listItem.getBoundingClientRect();
    contextMenu.style.top = `${rect.bottom}px`;
    contextMenu.style.left = `${rect.left}px`;

    contextMenu.querySelector('#editList').addEventListener('click', () => {
      this.editList(listId);
      document.body.removeChild(contextMenu);
    });

    contextMenu.querySelector('#deleteList').addEventListener('click', () => {
      this.deleteList(listId);
      document.body.removeChild(contextMenu);
    });

    document.addEventListener('click', function removeMenu() {
      document.body.removeChild(contextMenu);
      document.removeEventListener('click', removeMenu);
    });
  },

  editList(listId) {
    const newName = prompt('Введите новое название списка:');
    if (newName) {
      app.updateList(listId, newName);
    }
  },

  deleteList(listId) {
    if (confirm('Вы уверены, что хотите удалить этот список?')) {
      app.deleteList(listId);
    }
  },

  openList(listId) {
    const list = app.lists.find(l => l.id === listId);
    if (list) {
      app.currentList = list;
      app.navigateTo('list');
    } else {
      app.showError('Список не найден');
    }
  },

  updateCheckboxes(container) {
    container.querySelectorAll('.selectItem').forEach(checkbox => {
      const listId = parseInt(checkbox.dataset.id);
      const isSelected = app.selectedItems.some(item => item.id === listId);
      checkbox.checked = isSelected;
    });
  },

  startRepeatAll() {
    const allWords = app.lists.flatMap(list => list.words);
    if (allWords.length === 0) {
      app.showError('Нет слов для повторения');
      return;
    }
    app.showRepeatSettings(() => {
      app.startRepeat(allWords);
    });
  }
};