export class ContextMenu {
    constructor(options) {
      this.options = options;
      this.menu = null;
      this.handleOutsideClick = this.handleOutsideClick.bind(this);
    }
  
    show(x, y) {
      this.hide();
      this.menu = document.createElement('div');
      this.menu.className = 'context-menu';
      this.menu.style.left = `${x}px`;
      this.menu.style.top = `${y}px`;
  
      Object.entries(this.options).forEach(([text, action]) => {
        const item = document.createElement('div');
        item.className = 'context-menu-item';
        item.textContent = text;
        item.addEventListener('click', async () => {
          try {
            await action();
          } catch (error) {
            console.error('Error in context menu action:', error);
          } finally {
            this.hide();
          }
        });
        this.menu.appendChild(item);
      });
  
      document.body.appendChild(this.menu);
      setTimeout(() => {
        document.addEventListener('click', this.handleOutsideClick);
      }, 0);
    }
  
    hide() {
      if (this.menu && this.menu.parentNode) {
        this.menu.parentNode.removeChild(this.menu);
      }
      document.removeEventListener('click', this.handleOutsideClick);
    }
  
    handleOutsideClick(e) {
      if (this.menu && !this.menu.contains(e.target)) {
        this.hide();
      }
    }
  }
  
  // Улучшения:
  // 1. Привязка this к handleOutsideClick в конструкторе для предотвращения проблем с контекстом.
  // 2. Сохранена асинхронная обработка действий меню и обработка ошибок.
  // 3. Использование setTimeout для добавления слушателя кликов, чтобы избежать немедленного закрытия меню.