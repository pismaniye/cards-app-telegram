import { App } from './js/app.js';
import { getTelegramInstance } from './js/utils/telegram.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM loaded, initializing app");
    try {
        const telegramWebApp = getTelegramInstance();
        // Инициализация Telegram Web App
        telegramWebApp.ready();
        
        // Создание экземпляра приложения
        const app = new App(telegramWebApp);
        
        // Инициализация приложения
        await app.init();
        
        // Обработка изменения хэша URL для маршрутизации
        window.addEventListener('hashchange', () => {
            app.handleRouteChange();
        });
        
        // Запуск начальной маршрутизации
        app.handleRouteChange();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.textContent = `Ошибка инициализации приложения: ${error.message}`;
            errorContainer.style.display = 'block';
        }
    }
});