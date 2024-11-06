export class Modal {
    constructor(content, options = {}) {
      this.content = content;
      this.options = {
        onClose: options.onClose || (() => {}),
        onConfirm: options.onConfirm || null,
        onCancel: options.onCancel || null,
        closable: options.closable !== undefined ? options.closable : true,
        showConfirmButtons: options.showConfirmButtons || false
      };
      this.modal = null;
    }
  
    render() {
      this.modal = document.createElement('div');
      this.modal.className = 'modal';
  
      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content';
  
      if (typeof this.content === 'string') {
        modalContent.innerHTML = this.content;
      } else if (this.content instanceof Node) {
        modalContent.appendChild(this.content);
      }
  
      if (this.options.closable) {
        const closeButton = document.createElement('button');
        closeButton.className = 'modal-close';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => this.close());
        modalContent.appendChild(closeButton);
      }
  
      if (this.options.showConfirmButtons) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'modal-buttons';
        buttonContainer.appendChild(this.createButton('Да', this.options.onConfirm));
        buttonContainer.appendChild(this.createButton('Нет', this.options.onCancel));
        modalContent.appendChild(buttonContainer);
      }
  
      this.modal.appendChild(modalContent);
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal && this.options.closable) {
          this.close();
        }
      });
  
      document.body.appendChild(this.modal);
      return this.modal;
    }
  
    createButton(text, onClick) {
      const button = document.createElement('button');
      button.textContent = text;
      button.addEventListener('click', async () => {
        if (onClick) await onClick();
        this.close();
      });
      return button;
    }
  
    async close() {
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
      try {
        await this.options.onClose();
      } catch (error) {
        console.error('Error in modal close handler:', error);
      }
    }
  }
  
  // Улучшения:
  // 1. Добавлен метод createButton для уменьшения дублирования кода.
  // 2. Использованы async/await для обработки асинхронных действий при закрытии модального окна.
  // 3. Сохранена ссылка на модальное окно в this.modal для удобства доступа и управления.
  // 4. Улучшена обработка ошибок в методе close.