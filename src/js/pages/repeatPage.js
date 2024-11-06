import { Card } from '../components/Card.js';
import { Button } from '../components/Button.js';
import { Modal } from '../components/Modal.js';

export class repeatPage {
  constructor(app, words, settings) {
    this.app = app;
    this.words = words;
    this.settings = settings || { side: '1', order: 'sequential' };
    this.currentIndex = 0;
    this.preparedWords = this.prepareWords();
    this.isFlipped = false;
  }

  render(container) {
    container.innerHTML = '';
    container.className = 'repeat-page';
    
    const header = document.createElement('header');
    header.className = 'main-page__header';
    header.innerHTML = '<h1 class="main-page__title">Повторение</h1>';
    container.appendChild(header);

    if (this.words.length === 0) {
      this.showNoWordsMessage(container);
      return;
    }

    const cardContainer = document.createElement('div');
    cardContainer.className = 'repeat-page__card';
    cardContainer.addEventListener('click', () => this.flipCard());

    const cardInner = document.createElement('div');
    cardInner.className = 'repeat-page__card-inner';

    const cardFront = document.createElement('div');
    cardFront.className = 'repeat-page__card-front';
    cardFront.textContent = this.getCurrentWord().side1;

    const cardBack = document.createElement('div');
    cardBack.className = 'repeat-page__card-back';
    cardBack.textContent = this.getCurrentWord().side2;

    cardInner.appendChild(cardFront);
    cardInner.appendChild(cardBack);
    cardContainer.appendChild(cardInner);
    container.appendChild(cardContainer);

    const progressText = document.createElement('div');
    progressText.className = 'progress-text';
    progressText.textContent = `${this.currentIndex + 1} / ${this.preparedWords.length}`;
    container.appendChild(progressText);

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'repeat-page__actions';

    const rememberButton = new Button('Помню', () => this.handleRemember());
    rememberButton.className = 'button--primary';
    actionsContainer.appendChild(rememberButton.render());

    const dontRememberButton = new Button('Не помню', () => this.handleDontRemember());
    dontRememberButton.className = 'button--primary';
    actionsContainer.appendChild(dontRememberButton.render());

    container.appendChild(actionsContainer);

    const exitButton = new Button('Выйти', () => this.exitRepeat());
    exitButton.className = 'button--primary';
    container.appendChild(exitButton.render());
  }

  getCurrentWord() {
    return this.preparedWords[this.currentIndex];
  }

  flipCard() {
    const card = document.querySelector('.repeat-page__card');
    this.isFlipped = !this.isFlipped;
    card.classList.toggle('flipped', this.isFlipped);
  }

  prepareWords() {
    let words = [...this.words];
    
    if (this.settings.order === 'random') {
      words = this.shuffleArray(words);
    }
    
    return words.map(word => ({
      ...word,
      showSide: this.settings.side === 'random' ? (Math.random() < 0.5 ? 'side1' : 'side2') : 
                (this.settings.side === '2' ? 'side2' : 'side1')
    }));
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  handleRemember() {
    this.currentIndex++;
    this.isFlipped = false;
    if (this.currentIndex >= this.preparedWords.length) {
      this.showCompletionMessage();
    } else {
      this.render(document.getElementById('app'));
    }
  }

  handleDontRemember() {
    this.preparedWords.push(this.preparedWords[this.currentIndex]);
    this.currentIndex++;
    this.isFlipped = false;
    if (this.currentIndex >= this.preparedWords.length) {
      this.showCompletionMessage();
    } else {
      this.render(document.getElementById('app'));
    }
  }

  exitRepeat() {
    this.app.navigateTo('main');
  }

  showNoWordsMessage(container) {
    const message = document.createElement('div');
    message.className = 'no-words-message';
    message.textContent = 'Нет слов для повторения.';
    container.appendChild(message);

    const backButton = new Button('Вернуться на главную', () => this.exitRepeat());
    backButton.className = 'button--primary';
    container.appendChild(backButton.render());
  }

  showCompletionMessage() {
    const content = document.createElement('div');
    content.innerHTML = `
      <h2 class="main-page__subtitle">Поздравляем!</h2>
      <p>Вы завершили сессию повторения.</p>
      <p>Повторено слов: ${this.preparedWords.length}</p>
    `;

    const modal = new Modal(content, {
      title: 'Сессия завершена',
      onClose: () => this.exitRepeat()
    });

    modal.render();
  }
}