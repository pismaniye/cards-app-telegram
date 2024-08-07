import App from './js/app.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing app");
    const app = new App();
    app.init();
});