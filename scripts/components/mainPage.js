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
        <div class="list-item-actions">
          <button class="edit-btn">Редактировать</button>
          <button class="delete-btn">Удалить</button>
        </div>
      `;
      listContainer.appendChild(li);
      if (!app.isSelectMode) {
        this.setupSwipe(li);
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
      const listId = parseInt(listItem.dataset.id);
      this.editList(listId);
    });

    deleteBtn.addEventListener('click', () => {
      const listId = parseInt(listItem.dataset.id);
      this.deleteList(listId);
    });

    listItem.querySelector('.item-name').addEventListener('click', () => {
      const listId = parseInt(listItem.dataset.id);
      this.openList(listId);
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
  }
};