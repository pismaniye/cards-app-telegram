import { addLongPressListener } from '../utils/longpress.js';

export class List {
    constructor(items, options = {}) {
        this.items = items;
        this.options = {
            onItemClick: options.onItemClick || (() => {}),
            onItemLongPress: options.onItemLongPress || (() => {}),
            onItemDragEnd: options.onItemDragEnd || (() => {}),
            onSelectionChange: options.onSelectionChange || (() => {}),
            onItemEdit: options.onItemEdit || (() => {}),
            isSelectable: options.isSelectable || false,
            isDraggable: options.isDraggable || false,
            itemRenderer: options.itemRenderer || this.defaultItemRenderer,
            emptyListMessage: options.emptyListMessage || "Список пуст"
        };
        this.selectedItems = new Set();
        this.element = document.createElement('ul');
        this.element.className = 'list';
        this.editingItemId = null;
    }

    render() {
        this.element.innerHTML = '';
        if (this.items && this.items.length > 0) {
            this.items.forEach((item, index) => {
                const listItem = this.createListItem(item, index);
                this.element.appendChild(listItem);
            });
            if (this.options.isDraggable) {
                this.enableDragAndDrop(this.element);
            }
        } else {
            const emptyMessage = document.createElement('li');
            emptyMessage.textContent = this.options.emptyListMessage;
            this.element.appendChild(emptyMessage);
        }
        return this.element;
    }

    createListItem(item, index) {
        const listItem = document.createElement('li');
        listItem.className = 'list-item';
        listItem.dataset.id = item.id;

        const content = this.options.itemRenderer(item);
        if (content instanceof Node) {
            listItem.appendChild(content);
        } else {
            listItem.innerHTML = content;
        }

        if (this.options.isSelectable) {
            const checkbox = this.createCheckbox(item);
            listItem.prepend(checkbox);
            listItem.classList.add('selectable');
        }

        listItem.addEventListener('click', (event) => {
            if (this.editingItemId === null && (!this.options.isSelectable || (event.target !== listItem && !event.target.classList.contains('list-item-checkbox')))) {
                this.options.onItemClick(item, event);
            }
        });

        addLongPressListener(listItem, (event) => {
            if (this.editingItemId === null) {
                console.log('Long press detected in List component');
                this.options.onItemLongPress(item, event);
            }
        });

        if (this.options.isDraggable) {
            listItem.draggable = true;
            listItem.addEventListener('dragstart', this.handleDragStart.bind(this));
            listItem.addEventListener('dragover', this.handleDragOver.bind(this));
            listItem.addEventListener('drop', this.handleDrop.bind(this));
        }

        return listItem;
    }

    startEditing(itemId) {
        this.editingItemId = itemId;
        const listItem = this.element.querySelector(`[data-id="${itemId}"]`);
        if (listItem) {
            const contentElement = listItem.querySelector('.list-item-content');
            const currentName = contentElement.textContent;
            
            const inputContainer = document.createElement('div');
            inputContainer.className = 'list-item-edit-container';

            const input = document.createElement('input');
            input.type = 'text';
            input.value = currentName;
            input.className = 'list-name-edit';

            const okButton = document.createElement('button');
            okButton.textContent = 'OK';
            okButton.className = 'list-name-edit-ok';

            inputContainer.appendChild(input);
            inputContainer.appendChild(okButton);
            
            contentElement.replaceWith(inputContainer);
            input.focus();
            input.select();

            const finishEditing = async () => {
                const newName = input.value.trim();
                if (newName && newName !== currentName) {
                    await this.options.onItemEdit(itemId, newName);
                }
                this.editingItemId = null;
                this.render(); // Re-render the list to reflect changes
            };

            okButton.addEventListener('click', finishEditing);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    finishEditing();
                } else if (e.key === 'Escape') {
                    this.editingItemId = null;
                    this.render(); // Re-render the list to cancel editing
                }
            });
        }
    }

    defaultItemRenderer(item) {
        if (item.side1 && item.side2) {
            return `<div class="list-item-content">${item.side1} - ${item.side2}</div>`;
        } else if (item.name) {
            return `<div class="list-item-content">${item.name}</div>`;
        } else {
            return '<div class="list-item-content">Неизвестный элемент</div>';
        }
    }

    createCheckbox(item) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'list-item-checkbox';
        checkbox.checked = this.selectedItems.has(item.id);
        checkbox.addEventListener('change', () => {
            this.toggleItemSelection(item);
        });
        return checkbox;
    }

    async toggleItemSelection(item) {
        if (this.selectedItems.has(item.id)) {
            this.selectedItems.delete(item.id);
        } else {
            this.selectedItems.add(item.id);
        }
        try {
            await this.options.onSelectionChange(Array.from(this.selectedItems));
        } catch (error) {
            console.error('Error in selection change handler:', error);
        }
    }

    enableDragAndDrop(list) {
        list.addEventListener('dragend', async () => {
            const newOrder = Array.from(list.children).map(item => item.dataset.id);
            try {
                await this.options.onItemDragEnd(newOrder);
            } catch (error) {
                console.error('Error in drag end handler:', error);
            }
        });
    }

    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.id);
        e.target.style.opacity = '0.5';
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDrop(e) {
        e.preventDefault();
        const id = e.dataTransfer.getData('text');
        const draggedElement = document.querySelector(`[data-id="${id}"]`);
        const dropTarget = e.target.closest('.list-item');
        if (draggedElement && dropTarget && draggedElement !== dropTarget) {
            if (dropTarget.nextSibling) {
                dropTarget.parentNode.insertBefore(draggedElement, dropTarget.nextSibling);
            } else {
                dropTarget.parentNode.appendChild(draggedElement);
            }
        }
        draggedElement.style.opacity = '1';
    }
}