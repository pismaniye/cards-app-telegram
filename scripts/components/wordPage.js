import app from '../main.js';

export const wordPage = {
  render() {
    const container = document.createElement('div');
    const word = app.currentWord;
    const isNewWord = !word || !word.id;
    
    container.innerHTML = `
      <div class="header">
        <h1>${isNewWord ? 'Новое слово' : 'Редактировать слово'}</h1>
        <button class="button back-button">Назад</button>
      </div>
      <div class="card">
        <div class="word-form">
          <input type="text" id="side1" placeholder="Сторона 1" value="${word ? word.side1 || '' : ''}">
          <input type="text" id="side2" placeholder="Сторона 2" value="${word ? word.side2 || '' : ''}">
          <input type="text" id="example" placeholder="Пример (опционально)" value="${word ? word.example || '' : ''}">
        </div>
      </div>
      <div class="button-container">
        <button class="button save-word-button">Сохранить</button>
      </div>
    `;

    this.setupListeners(container);
    return container;
  },

  setupListeners(container) {
    container.querySelector('.back-button').addEventListener('click', () => {
      app.navigateTo('list');
    });

    container.querySelector('.save-word-button').addEventListener('click', () => {
      const side1 = document.getElementById('side1').value;
      const side2 = document.getElementById('side2').value;
      const example = document.getElementById('example').value;

      if (side1 && side2) {
        if (app.currentWord && app.currentWord.id) {
          app.updateWord(app.currentWord.id, side1, side2, example);
        } else {
          app.addWord(side1, side2, example);
        }
        app.navigateTo('list');
      } else {
        alert('Пожалуйста, заполните обе стороны слова');
      }
    });
  }
};