import app from '../main.js';

export const mainPage = {
  render() {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="header">
        <h1>Списки</h1>
        ${app.isSelectMode ? `
          <button class="text-button" id="backFromSelect">Готово</button>
        ` : `
          <button class="text-button" id="selectMode">Выбрать</button>
        `}
      </div>
      <div class="card">
        <ul id="listContainer"></ul>
      </div>
      ${!app.isSelectMode ? `
        <button class="fab" id="addList">+</button>
      ` : ''}
      ${app.isSelectMode ? `
        <div class="button-container">
          <button class="button" id="deleteSelected" style="display: none;">Удалить</button>
          <button class="button" id="repeatSelected" style="display: none;">Повторить выбранное</button>
          <button class="button" id="repeatAll">Повторить все</button>
        </div>
      ` : ''}
    `;

    const listContainer = container.querySelector('#listContainer');
    app.lists.forEach(list => {
      this.renderListItem(listContainer, list);
    });

    this.setupListeners(container);
    if (app.isSelectMode) {
      this.updateCheckboxes(container);
    }
    return container;
  },

  renderListItem(container, list) {
    const li = document.createElement('li');
    li.className = 'list-item';
    li.dataset.id = list.id;
    li.innerHTML = `
      <div class="list-item-content">
        ${app.isSelectMode ? `<input type="checkbox" class="selectItem" data-id="${list.id}">` : ''}
        <span class="item-name nonselectable">${list.name || ''}</span>
        ${!list.name ? `<input type="text" class="edit-list-name" placeholder="Введите название списка">` : ''}
      </div>
    `;
    container.appendChild(li);
    if (!app.isSelectMode) {
      this.setupListItemListeners(li);
    }
  },

  setupListeners(container) {
    const addListButton = container.querySelector('#addList');
    if (addListButton) {
      addListButton.addEventListener('click', () => {
        const listContainer = container.querySelector('#listContainer');
        const newList = { id: Date.now(), name: '' };
        app.lists.unshift(newList);
        this.renderListItem(listContainer, newList);
        listContainer.firstChild.querySelector('.edit-list-name').focus();
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

  setupListItemListeners(li) {
    const itemName = li.querySelector('.item-name');
    const editInput = li.querySelector('.edit-list-name');

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

    if (editInput) {
      editInput.addEventListener('blur', async () => {
        const newName = editInput.value.trim();
        if (newName) {
          const listId = parseInt(li.dataset.id);
          await app.updateList(listId, newName);
          itemName.textContent = newName;
          editInput.remove();
        }
      });

      editInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
          editInput.blur();
        }
      });
    }

    li.addEventListener('click', (e) => {
      if (!isLongPress && (!editInput || (editInput && e.target !== editInput))) {
        const listId = parseInt(li.dataset.id);
        app.setCurrentList(listId);
        app.navigateTo('list');
      }
    });
  },
  
  showContextMenu(listItem, event) {
    event.preventDefault();
    const listId = parseInt(listItem.dataset.id);
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.innerHTML = `
      <div class="context-menu-item" id="editList">Редактировать</div>
      <div class="context-menu-item" id="deleteList">Удалить</div>
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
    const listItem = document.querySelector(`.list-item[data-id="${listId}"]`);
    const itemName = listItem.querySelector('.item-name');
    const currentName = itemName.textContent;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'edit-list-name';

    itemName.replaceWith(input);
    input.focus();

    input.addEventListener('blur', async () => {
      const newName = input.value.trim();
      if (newName && newName !== currentName) {
        await app.updateList(listId, newName);
        itemName.textContent = newName;
      }
      input.replaceWith(itemName);
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        input.blur();
      }
    });
  },

  deleteList(listId) {
    if (confirm('Вы уверены, что хотите удалить этот список?')) {
      app.deleteList(listId);
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
    app.startRepeat(allWords);
  }
};