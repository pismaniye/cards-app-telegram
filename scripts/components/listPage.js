export function renderListPage(container, list) {
    const html = `
        <div class="header">
            <button class="button back-button">Назад</button>
            <h1>${list.name}</h1>
        </div>
        <ul class="words-list">
            ${list.words.map((word, index) => `
                <li class="list-item word-item" data-index="${index}">
                    <span>${word.side1} - ${word.side2}</span>
                </li>
            `).join('')}
        </ul>
        <button class="button repeat-button">Повторить</button>
        <button class="fab add-word-button">+</button>
    `;
    
    container.innerHTML = html;

    setupListPageListeners(container, list);
}

function setupListPageListeners(container, list) {
    container.querySelector('.back-button').addEventListener('click', () => {
        app.currentPage = 'main';
        app.currentList = null;
        app.renderPage();
    });

    container.querySelectorAll('.word-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const index = e.currentTarget.dataset.index;
            app.currentWord = list.words[index];
            app.currentWordIndex = index;
            app.currentPage = 'word';
            app.renderPage();
        });
    });

    container.querySelector('.add-word-button').addEventListener('click', () => {
        app.currentWord = { side1: '', side2: '', example: '' };
        app.currentWordIndex = -1;
        app.currentPage = 'word';
        app.renderPage();
    });

    container.querySelector('.repeat-button').addEventListener('click', () => {
        showRepeatSettings(list);
    });
}

function showRepeatSettings(list) {
    const settingsHtml = `
        <div class="repeat-settings-overlay">
            <div class="repeat-settings">
                <h2>Настройки повторения</h2>
                <div>
                    <label>Сторона:</label>
                    <select id="side-select">
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="mix">Перемешать</option>
                    </select>
                </div>
                <div>
                    <label>Порядок слов:</label>
                    <select id="order-select">
                        <option value="order">По порядку</option>
                        <option value="shuffle">Перемешать</option>
                    </select>
                </div>
                <button class="button start-repeat-button">Начать</button>
            </div>
        </div>
    `;

    const settingsContainer = document.createElement('div');
    settingsContainer.innerHTML = settingsHtml;
    document.body.appendChild(settingsContainer);

    settingsContainer.querySelector('.start-repeat-button').addEventListener('click', () => {
        const side = document.getElementById('side-select').value;
        const order = document.getElementById('order-select').value;
        document.body.removeChild(settingsContainer);
        app.startRepeat(list, side, order);
    });
}