const LONGPRESS_DURATION = 500; // Длительность нажатия в миллисекундах

export function addLongPressListener(element, callback) {
  let timer;
  let isLongPress = false;

  function startLongPress(event) {
    isLongPress = false;
    timer = setTimeout(() => {
      isLongPress = true;
      callback(event);
    }, LONGPRESS_DURATION);
  }

  function cancelLongPress() {
    clearTimeout(timer);
    isLongPress = false;
  }

  function handleTouchEnd(event) {
    cancelLongPress();
    if (isLongPress) {
      event.preventDefault();
    }
  }

  // Обработчики для мобильных устройств
  element.addEventListener('touchstart', startLongPress, { passive: true });
  element.addEventListener('touchend', handleTouchEnd);
  element.addEventListener('touchcancel', cancelLongPress);

  // Обработчики для десктопных устройств
  element.addEventListener('mousedown', startLongPress);
  element.addEventListener('mouseup', cancelLongPress);
  element.addEventListener('mouseleave', cancelLongPress);

  // Предотвращение стандартного контекстного меню
  element.addEventListener('contextmenu', (event) => {
    if (isLongPress) {
      event.preventDefault();
    }
  });
}