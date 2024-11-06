import app from '../main.js';

export const wordPage = {
  render() {
    const container = document.createElement('div');
    const word = app.currentWord;
    const isNewWord = !word || !word.id;
    
    container.innerHTML = `
      <div class="header">
        <button class="text-button back-button">Назад</button>
        <h1>${isNewWord ? 'Новое слово' : 'Редактировать слово'}</h1>
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
      <div id="errorContainer" class="error-container"></div>
    `;

    this.setupListeners(container);
    return container;
  },

  setupListeners(container) {
    container.querySelector('.back-button').addEventListener('click', async () => {
      if (confirm('Вы уверены, что хотите выйти без сохранения изменений?')) {
        try {
          await app.navigateTo('list');
        } catch (error) {
          this.showError(container, 'Ошибка при возврате к списку: ' + error.message);
        }
      }
    });

    container.querySelector('.save-word-button').addEventListener('click', async () => {
      const side1 = document.getElementById('side1').value.trim();
      const side2 = document.getElementById('side2').value.trim();
      const example = document.getElementById('example').value.trim();

      if (side1 && side2) {
        try {
          if (app.currentWord && app.currentWord.id) {
            await app.updateWord(app.currentWord.id, side1, side2, example);
          } else {
            await app.addWord(side1, side2, example);
          }
          await app.navigateTo('list');
        } catch (error) {
          this.showError(container, 'Ошибка при сохранении слова: ' + error.message);
        }
      } else {
        this.showError(container, 'Пожалуйста, заполните обе стороны слова');
      }
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