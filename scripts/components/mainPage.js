export function renderMainPage(container, lists) {
    const html = `
        <div class="header">
            <h1>Списки</h1>
            <button class="button select-button">Выбрать</button>
        </div>
        <ul class="lists">
            ${lists.map((list, index) => `
                <li class="list-item" data-index="${index}">
                    <span>${list.name}</span>
                    <span>${list.words.length} слов</span>
                </li>
            `).join('')}
        </ul>
        <button class="fab create-list-button">+</button>
    `;
    
    container.innerHTML = html;

    setupMainPageListeners(container, lists);
}

function setupMainPageListeners(container, lists) {
    container.querySelectorAll('.list-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const index = e.currentTarget.dataset.index;
            app.currentList = lists[index];
            app.currentPage = 'list';
            app.renderPage();
        });
    });

    container.querySelector('.create-list-button').addEventListener('click', () => {
        const listName = prompt('Введите название нового списка:');
        if (listName) {
            app.addList(listName);
            app.renderPage();
        }
    });

    container.querySelector('.select-button').addEventListener('click', () => {
        // Здесь будет реализована функция выбора нескольких элементов
        alert('Функция выбора нескольких элементов еще не реализована');
    });
}