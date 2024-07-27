export function renderRepeatPage(container, list, settings) {
    const currentWord = app.getCurrentWord();
    const showingAnswer = app.showingAnswer;
    const html = `
        <div class="header">
            <button class="button back-button">Назад</button>
            <h1>Повторение</h1>
        </div>
        <div class="card">
            <div class="card-content">${getCurrentSide(currentWord, settings.side, showingAnswer)}</div>
        </div>
        <div class="button-container">
            <button class="button answer-button">Ответ</button>
            <button class="button remember-button">Помню</button>
        </div>
    `;
    
    container.innerHTML = html;

    setupRepeatPageListeners(container);
}

function getCurrentSide(word, side, showingAnswer) {
    if (showingAnswer) {
        return `${word.side1} - ${word.side2}`;
    }
    if (side === 'mix') {
        return Math.random() < 0.5 ? word.side1 : word.side2;
    }
    return side === '1' ? word.side1 : word.side2;
}

function setupRepeatPageListeners(container) {
    container.querySelector('.back-button').addEventListener('click', () => {
        app.currentPage = 'list';
        app.showingAnswer = false;
        app.renderPage();
    });

    container.querySelector('.answer-button').addEventListener('click', () => {
        app.showAnswer();
    });

    container.querySelector('.remember-button').addEventListener('click', () => {
        app.nextWord();
    });
}