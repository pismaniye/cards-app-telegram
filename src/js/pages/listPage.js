import { List } from '../components/List.js';
import { Button } from '../components/Button.js';
import { Modal } from '../components/Modal.js';
import { ContextMenu } from '../components/ContextMenu.js';

export class listPage {
  constructor(app) {
    this.app = app;
    this.element = document.createElement('div');
    this.element.className = 'list-page';
  }

  render(container) {
    if (!this.app.currentList) {
      this.element.innerHTML = '<p>Список не выбран</p>';
      container.appendChild(this.element);
      return;
    }

    this.element.innerHTML = `
      <h1 class="page-title">${this.app.currentList.name}</h1>
      <div id="button-container"></div>
      <div id="word-list-container"></div>
    `;

    this.renderButtons();
    this.renderWordList();

    container.appendChild(this.element);
  }

  renderButtons() {
    const buttonContainer = this.element.querySelector('#button-container');
    
    const backButton = new Button('←', () => this.handleBackButton());
    buttonContainer.appendChild(backButton.render());

    const addButton = new Button('Добавить слово', () => this.showAddWordModal());
    buttonContainer.appendChild(addButton.render());

    if (this.app.currentList.words && this.app.currentList.words.length > 0) {
      const selectButton = new Button('Выбрать', () => this.app.toggleSelectionMode());
      buttonContainer.appendChild(selectButton.render());

      const repeatAllButton = new Button('Повторить все', () => this.app.startRepeatList(this.app.currentList.id));
      buttonContainer.appendChild(repeatAllButton.render());
    }
  }

  renderWordList() {
    const wordListContainer = this.element.querySelector('#word-list-container');
    const words = this.app.currentList.words || [];
    const wordList = new List(words, {
      onItemClick: (word, event) => this.handleWordClick(word, event),
      onItemLongPress: (word, event) => this.showContextMenu(word, event),
      onSelectionChange: (selectedItems) => this.handleSelectionChange(selectedItems),
      onItemDragEnd: (newOrder) => this.handleWordReorder(newOrder),
      isSelectable: this.app.isSelectionMode,
      isDraggable: true,
      itemRenderer: (word) => this.renderWordCard(word),
      emptyListMessage: "В этом списке пока нет слов. Нажмите 'Добавить слово', чтобы начать."
    });
  
    wordListContainer.innerHTML = '';
    wordListContainer.appendChild(wordList.render());
  }

  renderWordCard(word) {
    return `
      <div class="word-card">
        <div class="word-card__side">${word.side1}</div>
        <div class="word-card__side">${word.side2}</div>
      </div>
    `;
  }

  handleWordClick(word, event) {
    if (!this.app.isSelectionMode) {
      this.app.currentWord = word;
      this.app.saveData();
      this.app.navigateTo('word');
    } else {
      this.toggleWordSelection(word);
    }
  }

  toggleWordSelection(word) {
    word.selected = !word.selected;
    this.renderWordList();
  }

  showContextMenu(word, event) {
    const contextMenu = new ContextMenu({
      'Редактировать': () => this.editWord(word),
      'Удалить': () => this.showDeleteConfirmation(word)
    });
    contextMenu.show(event.clientX, event.clientY);
  }

  editWord(word) {
    this.app.currentWord = word;
    this.app.saveData();
    this.app.navigateTo('word');
  }

  showDeleteConfirmation(word) {
    new Modal('Вы уверены, что хотите удалить это слово?', {
      onConfirm: async () => {
        await this.app.deleteWord(this.app.currentList.id, word.id);
        await this.app.saveData();
        this.render(this.element.parentNode);
      },
      showConfirmButtons: true
    }).render();
  }

  showAddWordModal() {
    const content = `
      <form id="add-word-form">
        <input type="text" id="side1" placeholder="Сторона 1" required>
        <input type="text" id="side2" placeholder="Сторона 2" required>
        <input type="text" id="example" placeholder="Пример (необязательно)">
      </form>
    `;

    new Modal(content, {
      onConfirm: () => this.handleAddWord(document.getElementById('add-word-form')),
      showConfirmButtons: true
    }).render();
  }

  handleAddWord(form) {
    const side1 = form.side1.value.trim();
    const side2 = form.side2.value.trim();
    const example = form.example.value.trim();

    if (!side1 || !side2) {
      alert('Пожалуйста, заполните обе стороны карточки.');
      return;
    }

    const newWord = { side1, side2, example };
    this.app.addWord(this.app.currentList.id, newWord);
    this.app.saveData();
    this.render(this.element.parentNode);
  }

  handleWordReorder(newOrder) {
    this.app.currentList.words = newOrder.map(id => 
      this.app.currentList.words.find(word => word.id === id)
    );
    this.app.saveData();
  }

  handleSelectionChange(selectedItems) {
    console.log('Selected items:', selectedItems);
  }

  handleBackButton() {
    this.app.currentList = null;
    this.app.saveData();
    this.app.navigateTo('main');
  }
}