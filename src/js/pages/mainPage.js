import { List } from '../components/List.js';
import { Button } from '../components/Button.js';
import { Modal } from '../components/Modal.js';
import { ContextMenu } from '../components/ContextMenu.js';

export class mainPage {
  constructor(app) {
    this.app = app;
    this.element = document.createElement('div');
    this.element.className = 'main-page';
    this.listComponent = null;
  }

  render(container) {
    this.app.telegramWebApp.BackButton.hide();

    this.element.innerHTML = `
      <header class="page-header">
        <h1 class="page-title">Списки</h1>
        <div id="header-buttons"></div>
      </header>
      <div id="repeat-all-container"></div>
      <div class="list-container"></div>
    `;

    this.renderHeaderButtons();
    this.renderRepeatAllButton();
    this.renderLists();
    this.renderAddButton(container);
    this.renderActionButtons(container);

    container.appendChild(this.element);
  }

  renderHeaderButtons() {
    const headerButtons = this.element.querySelector('#header-buttons');
    const selectButton = new Button('Выбрать', () => this.toggleSelectionMode());
    selectButton.options.className = 'select-button';
    headerButtons.appendChild(selectButton.render());
  }

  renderRepeatAllButton() {
    const repeatAllContainer = this.element.querySelector('#repeat-all-container');
    const repeatAllButton = new Button('Повторить все', () => this.app.startRepeatAll(), 'button button--primary');
    repeatAllContainer.appendChild(repeatAllButton.render());
  }

  renderLists() {
    const listContainer = this.element.querySelector('.list-container');
    if (!listContainer) {
      console.error('List container not found');
      return;
    }

    listContainer.innerHTML = '';

    this.listComponent = new List(this.app.lists, {
      onItemClick: (item) => this.handleListClick(item),
      onItemLongPress: (item, event) => this.showContextMenu(item, event),
      isSelectable: this.app.isSelectionMode,
      isDraggable: true,
      onItemDragEnd: (newOrder) => this.handleListReorder(newOrder),
      onSelectionChange: (selectedItems) => this.handleSelectionChange(selectedItems),
      onItemEdit: (itemId, newName) => this.handleListNameEdit(itemId, newName),
      itemRenderer: (item) => `<div class="list-item-content">${item.name}</div>`,
      emptyListMessage: 'У вас пока нет списков. Нажмите "+" чтобы создать новый список.'
    });

    listContainer.appendChild(this.listComponent.render());
  }

  renderAddButton(container) {
    const addButton = new Button('+', () => this.showAddListModal());
    addButton.options.className = 'fab-button';
    container.appendChild(addButton.render());
  }

  renderActionButtons(container) {
    if (this.app.isSelectionMode) {
      const actionContainer = document.createElement('div');
      actionContainer.className = 'action-container';
      actionContainer.appendChild(new Button('Удалить', () => this.deleteSelectedLists()).render());
      actionContainer.appendChild(new Button('Повторить выбранное', () => this.repeatSelectedLists()).render());
      container.appendChild(actionContainer);
    }
  }

  async handleListClick(list) {
    if (!this.app.isSelectionMode) {
      try {
        this.app.currentList = list;
        await this.app.saveData();
        this.app.navigateTo('list');
      } catch (error) {
        console.error('Ошибка при переходе к списку:', error);
        alert('Не удалось открыть список. Пожалуйста, попробуйте еще раз.');
      }
    } else {
      list.selected = !list.selected;
      this.render(this.element.parentNode);
    }
  }

  showContextMenu(list, event) {
    const contextMenu = new ContextMenu({
      'Редактировать': () => this.startInlineEditing(list),
      'Удалить': () => this.showDeleteConfirmation(list)
    });
    contextMenu.show(event.clientX, event.clientY);
  }

  startInlineEditing(list) {
    const listItem = this.element.querySelector(`[data-id="${list.id}"]`);
    if (listItem) {
      const contentElement = listItem.querySelector('.list-item-content');
      const currentName = contentElement.textContent;
      
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentName;
      input.className = 'list-name-edit';
      
      contentElement.replaceWith(input);
      input.focus();
      input.select();

      const finishEditing = async () => {
        const newName = input.value.trim();
        if (newName && newName !== currentName) {
          await this.handleListNameEdit(list, newName);
        } else {
          const newContentElement = document.createElement('div');
          newContentElement.className = 'list-item-content';
          newContentElement.textContent = currentName;
          input.replaceWith(newContentElement);
        }
      };

      input.addEventListener('blur', finishEditing);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          finishEditing();
        } else if (e.key === 'Escape') {
          const newContentElement = document.createElement('div');
          newContentElement.className = 'list-item-content';
          newContentElement.textContent = currentName;
          input.replaceWith(newContentElement);
        }
      });
    }
  }

  async handleListNameEdit(list, newName) {
    try {
      await this.app.updateList(list.id, newName);
      await this.app.saveData();
      this.renderLists();
    } catch (error) {
      console.error('Error updating list name:', error);
      alert('Не удалось обновить название списка. Пожалуйста, попробуйте еще раз.');
    }
  }

  showAddListModal() {
    const content = `<input type="text" id="list-name" placeholder="Название списка">`;
    const modal = new Modal(content, {
      onConfirm: async () => {
        const name = document.getElementById('list-name').value.trim();
        if (name) {
          await this.app.addList(name);
          await this.app.saveData();
          this.render(this.element.parentNode);
        }
      }
    });
    modal.render();
  }

  showEditListModal(list) {
    const content = `<input type="text" id="list-name" value="${list.name}">`;
    let inputElement;

    const saveListName = async () => {
      const name = inputElement.value.trim();
      if (name && name !== list.name) {
        await this.app.updateList(list.id, name);
        await this.app.saveData();
        this.render(this.element.parentNode);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        saveListName();
        modal.close();
      }
    };

    const modal = new Modal(content, {
      onConfirm: saveListName,
      onClose: () => {
        inputElement.removeEventListener('keydown', handleKeyDown);
        inputElement.removeEventListener('blur', saveListName);
      }
    });

    modal.render();

    // После рендеринга модального окна получаем ссылку на input
    inputElement = document.getElementById('list-name');
    if (inputElement) {
      inputElement.focus();
      inputElement.addEventListener('keydown', handleKeyDown);
      inputElement.addEventListener('blur', saveListName);
    }
  }

  showDeleteConfirmation(list) {
    const modal = new Modal('Вы уверены, что хотите удалить этот список?', {
      showConfirmButtons: true,
      onConfirm: async () => {
        await this.app.deleteList(list.id);
        await this.app.saveData();
        this.render(this.element.parentNode);
      }
    });
    modal.render();
  }

  toggleSelectionMode() {
    this.app.toggleSelectionMode();
    this.render(this.element.parentNode);
  }

  deleteSelectedLists() {
    const selectedLists = this.app.lists.filter(list => list.selected);
    if (selectedLists.length > 0) {
      const modal = new Modal(`Вы уверены, что хотите удалить ${selectedLists.length} выбранных списков?`, {
        showConfirmButtons: true,
        onConfirm: async () => {
          await Promise.all(selectedLists.map(list => this.app.deleteList(list.id)));
          this.app.toggleSelectionMode();
          await this.app.saveData();
          this.render(this.element.parentNode);
        }
      });
      modal.render();
    }
  }

  repeatSelectedLists() {
    const selectedLists = this.app.lists.filter(list => list.selected);
    if (selectedLists.length > 0) {
      this.app.currentList = selectedLists;
      this.app.navigateTo('repeat');
    }
  }

  handleListReorder(newOrder) {
    this.app.lists = newOrder.map(id => this.app.lists.find(list => list.id === id));
    this.app.saveData();
  }

  handleSelectionChange(selectedItems) {
    console.log('Selected items:', selectedItems);
    // Additional logic for handling selected items, if needed
  }
}