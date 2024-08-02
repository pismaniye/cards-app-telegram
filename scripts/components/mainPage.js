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
      <div id="errorContainer" class="error-container"></div>
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
      addListButton.addEventListener('click', async () => {
        const name = prompt('Введите название списка:');
        if (name) {
          try {
            await app.addList(name);
          } catch (error) {
            this.showError(container, 'Ошибка при добавлении списка: ' + error.message);
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
              this.showError(container, 'Ошибка при удалении выбранных списков: ' + error.message);
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
    } else {
      container.querySelectorAll('.listName').forEach(span => {
        span.addEventListener('click', async (e) => {
          const listId = parseInt(e.target.dataset.id);
          const list = app.lists.find(l => l.id === listId);
          if (list) {
            app.currentList = list;
            try {
              await app.navigateTo('list');
            } catch (error) {
              this.showError(container, 'Ошибка при переходе к списку: ' + error.message);
            }
          } else {
            this.showError(container, 'Список не найден');
          }
        });
      });

      container.querySelectorAll('.editList').forEach(button => {
        button.addEventListener('click', async (e) => {
          const listId = parseInt(e.target.dataset.id);
          const newName = prompt('Введите новое название списка:');
          if (newName) {
            try {
              await app.updateList(listId, newName);
            } catch (error) {
              this.showError(container, 'Ошибка при обновлении списка: ' + error.message);
            }
          }
        });
      });

      container.querySelectorAll('.deleteList').forEach(button => {
        button.addEventListener('click', async (e) => {
          const listId = parseInt(e.target.dataset.id);
          if (confirm('Вы уверены, что хотите удалить этот список?')) {
            try {
              await app.deleteList(listId);
            } catch (error) {
              this.showError(container, 'Ошибка при удалении списка: ' + error.message);
            }
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