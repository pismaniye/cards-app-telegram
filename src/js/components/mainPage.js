export const mainPage = {
  async render(app) {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="header">
        <h1 class="nonselectable">Списки</h1>
        ${app.isSelectMode ? `
          <button class="text-button nonselectable" id="backFromSelect">Готово</button>
        ` : `
          <button class="text-button nonselectable" id="selectMode">Выбрать</button>
        `}
      </div>
      <div class="card">
        <ul id="listContainer"></ul>
      </div>
      ${!app.isSelectMode ? `
        <button class="fab" id="addList"><span class="nonselectable">+</span></button>
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
    await this.renderListItems(listContainer, app);

    this.setupListeners(container, app);
    if (app.isSelectMode) {
      this.updateCheckboxes(container, app);
    }
    return container;
  },

  async renderListItems(container, app) {
    const fragment = document.createDocumentFragment();
    const chunkSize = 20;

    for (let i = 0; i < app.lists.length; i += chunkSize) {
      const chunk = app.lists.slice(i, i + chunkSize);
      await new Promise(resolve => {
        setTimeout(() => {
          chunk.forEach(list => {
            const li = this.renderListItem(list, app);
            fragment.appendChild(li);
          });
          resolve();
        }, 0);
      });
    }

    container.appendChild(fragment);
  },

  renderListItem(list, app) {
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
    return li;
  },

  setupListeners(container, app) {
    const listContainer = container.querySelector('#listContainer');
  
    listContainer.addEventListener('long-press', (e) => {
      const listItem = e.target.closest('.list-item');
      if (listItem) {
        e.preventDefault();
        this.showContextMenu(listItem, e, app);
      }
    });
  
    listContainer.addEventListener('click', (e) => {
      const listItem = e.target.closest('.list-item');
      if (listItem && !e.target.closest('.context-menu') && !app.isSelectMode) {
        const listId = parseInt(listItem.dataset.id);
        app.setCurrentList(listId);
        app.navigateTo('list');
      }
    });
  
    const addListButton = container.querySelector('#addList');
    if (addListButton) {
      addListButton.addEventListener('click', () => {
        const newList = { id: Date.now(), name: '' };
        app.lists.unshift(newList);
        const newListItem = this.renderListItem(listContainer, newList, app);
        const editInput = newListItem.querySelector('.edit-list-name');
        if (editInput) {
          editInput.focus();
        }
      });
    }
  
    const selectModeButton = container.querySelector('#selectMode');
    if (selectModeButton) {
      selectModeButton.addEventListener('click', () => app.toggleSelectMode());
    }
  
    const backFromSelectButton = container.querySelector('#backFromSelect');
    if (backFromSelectButton) {
      backFromSelectButton.addEventListener('click', () => app.toggleSelectMode());
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
        repeatSelectedButton.addEventListener('click', () => app.startRepeatForSelectedItems());
      }
  
      const repeatAllButton = container.querySelector('#repeatAll');
      if (repeatAllButton) {
        repeatAllButton.addEventListener('click', () => this.startRepeatAll(app));
      }
  
      container.querySelectorAll('.selectItem').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const listId = parseInt(e.target.dataset.id);
          const list = app.lists.find(l => l.id === listId);
          if (list) {
            app.toggleItemSelection(list);
            this.updateCheckboxes(container, app);
          }
        });
      });
    }
  },

  showContextMenu(listItem, event, app) {
    event.preventDefault();

    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    const listId = parseInt(listItem.dataset.id);
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.innerHTML = `
      <div class="context-menu-item" data-action="edit">Редактировать</div>
      <div class="context-menu-item" data-action="delete">Удалить</div>
    `;

    document.body.appendChild(contextMenu);

    const rect = listItem.getBoundingClientRect();
    contextMenu.style.top = `${rect.bottom}px`;
    contextMenu.style.left = `${rect.left}px`;

    contextMenu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action === 'edit') {
        this.editList(listId, app);
      } else if (action === 'delete') {
        this.deleteList(listId, app);
      }
      contextMenu.remove();
    });

    document.addEventListener('click', (e) => {
      if (!contextMenu.contains(e.target)) {
        contextMenu.remove();
      }
    }, { once: true });
  },

  editList(listId, app) {
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

  deleteList(listId, app) {
    if (confirm('Вы уверены, что хотите удалить этот список?')) {
      app.deleteList(listId);
    }
  },

  updateCheckboxes(container, app) {
    container.querySelectorAll('.selectItem').forEach(checkbox => {
      const listId = parseInt(checkbox.dataset.id);
      const isSelected = app.selectedItems.some(item => item.id === listId);
      checkbox.checked = isSelected;
    });
  },

  startRepeatAll(app) {
    const allWords = app.lists.flatMap(list => list.words);
    if (allWords.length === 0) {
      app.showError('Нет слов для повторения');
      return;
    }
    app.startRepeat(allWords);
  }
};