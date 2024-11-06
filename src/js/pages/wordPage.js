import { Button } from '../components/Button.js';

export class wordPage {
  constructor(app) {
    this.app = app;
  }

  render(container) {
    container.innerHTML = '';
    
    const header = document.createElement('header');
    header.innerHTML = '<h1>Редактирование слова</h1>';
    container.appendChild(header);

    const form = document.createElement('form');
    form.className = 'word-form';

    const side1Input = this.createInput('Сторона 1', 'side1', this.app.currentWord?.side1 || '');
    form.appendChild(side1Input);

    const side2Input = this.createInput('Сторона 2', 'side2', this.app.currentWord?.side2 || '');
    form.appendChild(side2Input);

    const exampleInput = this.createInput('Пример', 'example', this.app.currentWord?.example || '');
    form.appendChild(exampleInput);

    const saveButton = new Button('Сохранить', (e) => this.handleSave(e));
    form.appendChild(saveButton.render());

    container.appendChild(form);
  }

  createInput(label, name, value) {
    const wrapper = document.createElement('div');
    wrapper.className = 'input-wrapper';

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.htmlFor = name;

    const input = document.createElement('input');
    input.type = 'text';
    input.id = name;
    input.name = name;
    input.value = value;
    input.required = name !== 'example';  // example is optional

    wrapper.appendChild(labelElement);
    wrapper.appendChild(input);

    return wrapper;
  }

  handleSave(e) {
    e.preventDefault();

    const side1 = document.getElementById('side1').value.trim();
    const side2 = document.getElementById('side2').value.trim();
    const example = document.getElementById('example').value.trim();

    if (!side1 || !side2) {
      alert('Пожалуйста, заполните обе стороны карточки.');
      return;
    }

    const word = {
      id: this.app.currentWord?.id || Date.now().toString(),
      side1,
      side2,
      example
    };

    if (this.app.currentWord) {
      this.app.updateWord(this.app.currentList.id, word.id, word);
    } else {
      this.app.addWord(this.app.currentList.id, word);
    }

    this.app.currentWord = null;
    this.app.navigateTo('list');
  }
}