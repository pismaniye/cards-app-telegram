import app from '../main.js';

export const repeatPage = {
  render() {
    const container = document.createElement('div');
    const currentWord = app.getCurrentWord();
    
    if (!currentWord) {
      container.innerHTML = `
        <div class="header">
          <button class="button back-button">Назад</button>
          <h1>Повторение завершено</h1>
        </div>
        <p>Вы повторили все слова в этом списке.</p>
      `;
      this.setupListeners(container);
      return container;
    }
    
    const showingAnswer = app.showingAnswer;
    
    container.innerHTML = `
      <div class="header">
        <button class="button back-button">Назад</button>
        <h1>Повторение</h1>
      </div>
      <div class="card">
        <div class="card-content">${showingAnswer ? `${currentWord.question} - ${currentWord.answer}` : currentWord.question}</div>
      </div>
      <div class="button-container">
        <button class="button answer-button">${showingAnswer ? 'Следующее слово' : 'Показать ответ'}</button>
        ${!showingAnswer ? '<button class="button remember-button">Помню</button>' : ''}
      </div>
    `;

    this.setupListeners(container);
    return container;
  },

  setupListeners(container) {
    container.querySelector('.back-button').addEventListener('click', () => {
      app.navigateTo('list');
    });

    const answerButton = container.querySelector('.answer-button');
    if (answerButton) {
      answerButton.addEventListener('click', () => {
        if (app.showingAnswer) {
          app.nextWord();
        } else {
          app.showAnswer();
        }
        app.renderPage();
      });
    }

    const rememberButton = container.querySelector('.remember-button');
    if (rememberButton) {
      rememberButton.addEventListener('click', () => {
        app.nextWord();
        app.renderPage();
      });
    }
  }
};