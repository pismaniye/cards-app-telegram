import { addLongPressListener } from '../utils/longpress.js';

export class Card {
  constructor(word, options = {}) {
    this.word = word;
    this.options = {
      onFlip: options.onFlip || (() => {}),
      onRemember: options.onRemember || (() => {}),
      onSave: options.onSave || (() => {})
    };
    this.isFlipped = word.flipped || false;
  }

  render() {
    const cardContainer = document.createElement('div');
    cardContainer.className = 'card-container';

    const card = document.createElement('div');
    card.className = 'card';
    card.appendChild(this.createSide('front', this.word.side1));
    card.appendChild(this.createSide('back', this.word.side2));

    if (this.word.example) {
      addLongPressListener(card, () => this.showExample());
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'card-buttons';
    buttonContainer.appendChild(this.createButton('Показать ответ', () => this.flip()));
    buttonContainer.appendChild(this.createButton('Помню', () => this.remember()));

    cardContainer.appendChild(card);
    cardContainer.appendChild(buttonContainer);

    return cardContainer;
  }

  createSide(className, content) {
    const side = document.createElement('div');
    side.className = `card-side ${className}`;
    side.textContent = content;
    return side;
  }

  createButton(text, onClick) {
    const button = document.createElement('button');
    button.className = 'card-button';
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
  }

  async flip() {
    this.isFlipped = !this.isFlipped;
    const card = document.querySelector('.card');
    card.style.transform = this.isFlipped ? 'rotateY(180deg)' : 'rotateY(0)';
    this.word.flipped = this.isFlipped;
    await Promise.all([
      this.options.onFlip(this.isFlipped),
      this.options.onSave(this.word)
    ]);
  }

  async remember() {
    await Promise.all([
      this.options.onRemember(),
      this.options.onSave(this.word)
    ]);
  }

  showExample() {
    alert(`Пример: ${this.word.example}`);
  }
}

// Улучшения:
// 1. Использован Promise.all для параллельного выполнения колбэков в методах flip и remember.
// 2. Сохранена структура с разделением на методы для лучшей читаемости и поддерживаемости.
// 3. Добавлен импорт addLongPressListener, который отсутствовал в исходном коде.