export function renderWordPage(container) {
    const word = app.currentWord;
    const isNewWord = app.currentWordIndex === -1;

    const html = `
        <div class="header">
            <button class="button back-button">Назад</button>
            <h1>${isNewWord ? 'Новое слово' : 'Редактировать слово'}</h1>
        </div>
        <div class="word-form">
            <input type="text" id="side1" placeholder="Сторона 1" value="${word.side1 || ''}">
            <input type="text" id="side2" placeholder="Сторона 2" value="${word.side2 || ''}">
            <input type="text" id="example" placeholder="Пример (опционально)" value="${word.example || ''}">
            <button class="button save-word-button">Сохранить</button>
        </div>
    `;
    
    container.innerHTML = html;

    setupWordPageListeners(container);
}

function setupWordPageListeners(container) {
    container.querySelector('.back-button').addEventListener('click', () => {
        app.currentPage = 'list';
        app.renderPage();
    });

    container.querySelector('.save-word-button').addEventListener('click', () => {
        const side1 = document.getElementById('side1').value;
        const side2 = document.getElementById('side2').value;
        const example = document.getElementById('example').value;

        if (side1 && side2) {
            const word = { side1, side2, example };
            const listIndex = app.lists.findIndex(l => l === app.currentList);
            if (app.currentWordIndex === -1) {
                // Add new word
                app.addWord(listIndex, word);
            } else {
                // Update existing word
                app.updateWord(listIndex, app.currentWordIndex, word);
            }
            app.currentPage = 'list';
            app.renderPage();
        } else {
            alert('Пожалуйста, заполните обе стороны слова');
        }
    });
}