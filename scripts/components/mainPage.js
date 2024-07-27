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
      li.innerHTML = `
        ${app.isSelectMode ? `<input type="checkbox" class="selectItem" data-id="${list.id}">` : ''}
        <span class="listName" data-id="${list.id}">${list.name}</span>
        ${!app.isSelectMode ? `
          <div class="button-container">
            <button class="button editList" data-id="${list.id}">Редактировать</button>
            <button class="button deleteList" data-id="${list.id}">Удалить</button>
          </div>
        ` : ''}
      `;
      listContainer.appendChild(li);
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
      addListButton.addEventListener('click', () => {
        const name = prompt('Введите название списка:');
        if (name) app.addList(name);
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
        deleteSelectedButton.addEventListener('click', () => {
          if (confirm('Вы уверены, что хотите удалить выбранные списки?')) {
            app.deleteSelectedItems();
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
          const allWords = app.lists.flatMap(list => list.words);
          app.startRepeat(allWords);
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
    } else {
      container.querySelectorAll('.listName').forEach(span => {
        span.addEventListener('click', (e) => {
          const listId = parseInt(e.target.dataset.id);
          const list = app.lists.find(l => l.id === listId);
          if (list) {
            app.currentList = list;
            app.navigateTo('list');
          } else {
            console.error('Список не найден');
          }
        });
      });

      container.querySelectorAll('.editList').forEach(button => {
        button.addEventListener('click', (e) => {
          const listId = parseInt(e.target.dataset.id);
          const newName = prompt('Введите новое название списка:');
          if (newName) app.updateList(listId, newName);
        });
      });

      container.querySelectorAll('.deleteList').forEach(button => {
        button.addEventListener('click', (e) => {
          const listId = parseInt(e.target.dataset.id);
          if (confirm('Вы уверены, что хотите удалить этот список?')) {
            app.deleteList(listId);
          }
        });
      });
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