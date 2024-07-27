import app from '../main.js';

export const mainPage = {
  render() {
    const container = document.createElement('div');
    container.innerHTML = `
      <h1>Списки
        ${app.isSelectMode ? `
          <button id="deleteSelected">Удалить</button>
          <button id="repeatSelected">Повторить выбранное</button>
          <button id="repeatAll">Повторить все</button>
          <button id="backFromSelect">Назад</button>
        ` : `
          <button id="selectMode">Выбрать</button>
        `}
      </h1>
      <ul id="listContainer"></ul>
      <button id="addList">+</button>
    `;

    const listContainer = container.querySelector('#listContainer');
    app.lists.forEach(list => {
      const li = document.createElement('li');
      li.innerHTML = `
        ${app.isSelectMode ? `<input type="checkbox" class="selectItem" data-id="${list.id}">` : ''}
        <span class="listName">${list.name}</span>
        ${!app.isSelectMode ? `
          <button class="editList" data-id="${list.id}">Edit</button>
          <button class="deleteList" data-id="${list.id}">Delete</button>
        ` : ''}
      `;
      listContainer.appendChild(li);
    });

    this.setupListeners(container);
    return container;
  },

  setupListeners(container) {
    container.querySelector('#addList').addEventListener('click', () => {
      const name = prompt('Введите название списка:');
      if (name) app.addList(name);
    });

    if (app.isSelectMode) {
      container.querySelector('#deleteSelected').addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите удалить выбранные списки?')) {
          app.deleteSelectedItems();
        }
      });

      container.querySelector('#repeatSelected').addEventListener('click', () => {
        app.startRepeatForSelectedItems();
      });

      container.querySelector('#repeatAll').addEventListener('click', () => {
        const allWords = app.lists.flatMap(list => list.words);
        app.startRepeat(allWords);
      });

      container.querySelector('#backFromSelect').addEventListener('click', () => {
        app.toggleSelectMode();
      });

      container.querySelectorAll('.selectItem').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const listId = parseInt(e.target.dataset.id);
          const list = app.lists.find(l => l.id === listId);
          app.toggleItemSelection(list);
        });
      });
    } else {
      container.querySelectorAll('.listName').forEach(span => {
        span.addEventListener('click', (e) => {
          const listId = parseInt(e.target.nextElementSibling.dataset.id);
          app.currentList = app.lists.find(l => l.id === listId);
          app.navigateTo('list');
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

    const selectModeButton = container.querySelector('#selectMode');
    if (selectModeButton) {
      selectModeButton.addEventListener('click', () => {
        app.toggleSelectMode();
      });
    }
  }
};