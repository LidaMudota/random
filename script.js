// Настройки
const BACKUP_INTERVAL = 10; // Напоминание о резервной копии каждые 10 генераций
const MAX_HISTORY = 1000; // Максимальное количество чисел в истории
const DISPLAY_LIMIT = 10; // Показывать только последние 10 чисел

// Проверка SEED и загрузка данных
let seed = parseInt(localStorage.getItem('uniqueSeed'), 10);
let generationCount = parseInt(localStorage.getItem('generationCount'), 10) || 0;
let storedNumbers = JSON.parse(localStorage.getItem('uniqueNumbers')) || [];

// Элементы интерфейса
const seedInfo = document.getElementById('current-seed');
const numberList = document.getElementById('number-list');
const output = document.getElementById('number-output');
const notification = document.getElementById('notification');
const minRangeInput = document.getElementById('min-range');
const maxRangeInput = document.getElementById('max-range');

// Функция для генерации числа с использованием SEED
function generateWithSeed(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Функция для генерации числа в заданном диапазоне
function generateNumberInRange(seed, min, max) {
  const randomFraction = generateWithSeed(seed);
  return Math.floor(randomFraction * (max - min + 1)) + min;
}

// Генерация числа
function generateUniqueNumber() {
  const min = parseInt(minRangeInput.value, 10);
  const max = parseInt(maxRangeInput.value, 10);

  if (min >= max) {
    alert('Минимальное значение должно быть меньше максимального.');
    return null;
  }

  const newNumber = generateNumberInRange(seed++, min, max);
  storedNumbers.push(newNumber);

  if (storedNumbers.length > MAX_HISTORY) {
    storedNumbers.shift(); // Удаляем старые записи, чтобы не превысить лимит
  }

  // Обновляем локальное хранилище раз в 10 генераций
  if (generationCount % BACKUP_INTERVAL === 0) {
    saveToLocalStorage();
  }
  return newNumber;
}

// Обновление списка чисел на экране
function updateNumberList() {
  numberList.innerHTML = '';
  const visibleNumbers = storedNumbers.slice(-DISPLAY_LIMIT); // Показываем только последние числа
  visibleNumbers.forEach((number) => {
    const li = document.createElement('li');
    li.textContent = number;
    numberList.appendChild(li);
  });
}

// Сохранение данных в локальное хранилище
function saveToLocalStorage() {
  localStorage.setItem('uniqueNumbers', JSON.stringify(storedNumbers));
  localStorage.setItem('uniqueSeed', seed);
  localStorage.setItem('generationCount', generationCount);
}

// Скачивание резервной копии
function downloadBackup() {
  const backupData = {
    seed: seed,
    numbers: storedNumbers,
    generationCount: generationCount,
    timestamp: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `unique_numbers_backup_${backupData.timestamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Восстановление данных из резервной копии
function uploadBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const backupData = JSON.parse(e.target.result);
      if (
        backupData.seed &&
        Array.isArray(backupData.numbers) &&
        backupData.timestamp &&
        backupData.generationCount !== undefined
      ) {
        if (confirm('Вы уверены, что хотите восстановить данные из резервной копии?')) {
          seed = backupData.seed;
          generationCount = backupData.generationCount;
          storedNumbers = backupData.numbers;
          saveToLocalStorage();
          updateNumberList();
          seedInfo.textContent = seed;
          alert('Данные успешно восстановлены!');
        }
      } else {
        alert('Неверный формат файла резервной копии.');
      }
    } catch (err) {
      alert('Ошибка при чтении файла резервной копии.');
    }
  };
  reader.readAsText(file);
}

// Уведомление о приватном режиме
function checkPrivateMode() {
  try {
    localStorage.setItem('privateTest', '1');
    localStorage.removeItem('privateTest');
  } catch (e) {
    notification.textContent = 'Вы работаете в приватном режиме. Данные не будут сохранены.';
  }
}

// Проверка отсутствия данных и предложение восстановить их
function checkDataIntegrity() {
  if (!storedNumbers.length && !seed && generationCount === 0) {
    if (confirm('Данные генератора отсутствуют. Хотите восстановить их из резервной копии?')) {
      document.getElementById('upload-file').click();
    } else {
      alert('Данные не восстановлены. Генерация начнётся с нового SEED.');
      seed = Math.floor(Math.random() * 1000000);
      saveToLocalStorage();
    }
  }
}

// Добавляем обработчики событий
document.getElementById('generate-btn').addEventListener('click', () => {
  const newNumber = generateUniqueNumber();
  if (newNumber !== null) {
    output.textContent = `Случайное число: ${newNumber}`;
    seedInfo.textContent = seed;
    updateNumberList();

    generationCount++;
    if (generationCount % BACKUP_INTERVAL === 0) {
      notification.textContent = 'Рекомендуется создать резервную копию данных.';
    }
  }
});

document.getElementById('download-btn').addEventListener('click', downloadBackup);

document.getElementById('upload-btn').addEventListener('click', () => {
  document.getElementById('upload-file').click();
});

document.getElementById('upload-file').addEventListener('change', uploadBackup);

// Проверка приватного режима
checkPrivateMode();

// Проверка данных при загрузке страницы
checkDataIntegrity();

// Обновление списка чисел при загрузке страницы
updateNumberList();