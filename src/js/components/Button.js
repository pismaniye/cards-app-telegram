export class Button {
    constructor(text, onClick, options = {}) {
      this.text = text;
      this.onClick = onClick;
      this.options = {
        className: options.className || '',
        disabled: options.disabled || false,
        type: options.type || 'button'
      };
    }
  
    render() {
      const button = document.createElement('button');
      button.textContent = this.text;
      button.className = `button ${this.options.className}`.trim();
      button.type = this.options.type;
      button.disabled = this.options.disabled;
  
      button.addEventListener('click', async (e) => {
        if (button.disabled) return;
        
        button.disabled = true;
        try {
          await this.onClick(e);
        } catch (error) {
          console.error('Error in button click handler:', error);
          // Здесь можно добавить обработку ошибок, например, показать уведомление пользователю
        } finally {
          button.disabled = false;
        }
      });
  
      return button;
    }
  }
  
  // Улучшения:
  // 1. Добавлена проверка на disabled состояние перед выполнением onClick.
  // 2. Использован метод trim() для удаления лишних пробелов в className.
  // 3. Сохранена асинхронная обработка клика для предотвращения множественных нажатий.