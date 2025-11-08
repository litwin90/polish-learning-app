# Подробное описание IndexedDB и Dexie.js

## 📚 IndexedDB - Нативный API браузера

### Что такое IndexedDB?

IndexedDB - это низкоуровневый асинхронный API для хранения больших объемов структурированных данных в браузере. Это не реляционная база данных, а объектное хранилище (NoSQL), похожее на MongoDB.

### Ключевые особенности IndexedDB

#### 1. **Асинхронность**
```javascript
// IndexedDB работает асинхронно - не блокирует UI
const request = indexedDB.open('MyDB', 1);
request.onsuccess = (event) => {
  const db = event.target.result;
  // Работа с базой
};
```

**Преимущества:**
- ✅ Не блокирует основной поток выполнения
- ✅ UI остается отзывчивым даже при больших операциях
- ✅ Можно обрабатывать миллионы записей без зависаний

**Недостатки:**
- ❌ Сложнее работать с асинхронным кодом
- ❌ Нужно обрабатывать события и промисы

#### 2. **Объектное хранилище (Object Store)**

IndexedDB хранит JavaScript объекты напрямую, без сериализации:

```javascript
// localStorage требует JSON.stringify/parse
localStorage.setItem('word', JSON.stringify({id: 1, polish: 'kot'}));

// IndexedDB хранит объекты напрямую
const transaction = db.transaction(['words'], 'readwrite');
const store = transaction.objectStore('words');
store.add({id: 1, polish: 'kot', russian: 'кот'});
```

**Преимущества:**
- ✅ Нет накладных расходов на сериализацию
- ✅ Может хранить Date, Blob, File, ArrayBuffer
- ✅ Быстрее для сложных объектов

#### 3. **Индексы для быстрого поиска**

```javascript
// Создание индекса
const store = db.createObjectStore('words', {keyPath: 'id'});
store.createIndex('polish', 'polish', {unique: false});
store.createIndex('category', 'category', {unique: false});

// Быстрый поиск по индексу
const index = store.index('polish');
const request = index.getAll('kot'); // Мгновенный поиск
```

**Преимущества:**
- ✅ Поиск в миллионах записей за миллисекунды
- ✅ Сортировка по индексам
- ✅ Фильтрация без загрузки всех данных в память

**Пример производительности:**
- localStorage: 10,000 слов = ~2-3 секунды на поиск
- IndexedDB с индексом: 100,000 слов = ~10-50ms на поиск

#### 4. **Транзакции**

```javascript
const transaction = db.transaction(['words'], 'readwrite');
const store = transaction.objectStore('words');

// Все операции в одной транзакции - атомарны
store.add(word1);
store.add(word2);
store.update(word3);

// Если одна операция упадет - все откатятся
transaction.onerror = () => {
  // Все изменения отменены
};
```

**Преимущества:**
- ✅ Гарантия целостности данных
- ✅ Либо все операции успешны, либо все откатываются
- ✅ Защита от частичных обновлений

#### 5. **Объем данных**

**Лимиты:**
- localStorage: ~5-10 MB (зависит от браузера)
- IndexedDB: до 50% свободного места на диске (обычно гигабайты)

**Практические примеры:**
- 1,000 слов с примерами: ~500 KB (localStorage OK)
- 10,000 слов: ~5 MB (localStorage на грани)
- 100,000 слов: ~50 MB (только IndexedDB)
- 1,000,000 слов: ~500 MB (только IndexedDB)

#### 6. **Курсоры для больших наборов данных**

```javascript
// Обработка больших объемов по частям
const cursor = store.openCursor();
cursor.onsuccess = (event) => {
  const cursor = event.target.result;
  if (cursor) {
    const word = cursor.value;
    // Обработка одной записи
    cursor.continue(); // Переход к следующей
  }
};
```

**Преимущества:**
- ✅ Не загружает все данные в память сразу
- ✅ Можно обрабатывать миллионы записей
- ✅ Экономия памяти

### Недостатки нативного IndexedDB

1. **Сложный API**
   - Много boilerplate кода
   - Работа через события (callbacks)
   - Сложная обработка ошибок

2. **Версионирование**
   ```javascript
   // Нужно вручную управлять миграциями
   request.onupgradeneeded = (event) => {
     const db = event.target.result;
     if (!db.objectStoreNames.contains('words')) {
       db.createObjectStore('words', {keyPath: 'id'});
     }
   };
   ```

3. **Нет автоматической типизации**
   - Нет TypeScript поддержки из коробки
   - Нужно вручную типизировать

---

## 🚀 Dexie.js - Обертка над IndexedDB

### Что такое Dexie.js?

Dexie.js - это минималистичная библиотека (~15 KB), которая упрощает работу с IndexedDB, предоставляя Promise-based API вместо событий.

### Ключевые особенности Dexie.js

#### 1. **Простой Promise-based API**

**Сравнение кода:**

```javascript
// Нативный IndexedDB (много кода)
function addWord(word) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MyDB', 1);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['words'], 'readwrite');
      const store = transaction.objectStore('words');
      const addRequest = store.add(word);
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
}

// Dexie.js (просто и понятно)
async function addWord(word) {
  await db.words.add(word);
}
```

**Преимущества:**
- ✅ В 5-10 раз меньше кода
- ✅ Использует async/await
- ✅ Легко читать и поддерживать

#### 2. **Автоматическое версионирование и миграции**

```typescript
class PolishLearningDB extends Dexie {
  words!: Table<Word, string>;
  stats!: Table<Stat, number>;

  constructor() {
    super('PolishLearningDB');

    // Версия 1: только слова
    this.version(1).stores({
      words: 'id, polish, russian'
    });

    // Версия 2: добавляем статистику
    this.version(2).stores({
      words: 'id, polish, russian, category',
      stats: '++id, date, wordsReviewed'
    }).upgrade(tx => {
      // Автоматическая миграция данных
      return tx.table('words').toCollection().modify(word => {
        word.category = word.category || 'general';
      });
    });
  }
}
```

**Преимущества:**
- ✅ Автоматическое обновление схемы
- ✅ Миграции данных при обновлении версии
- ✅ Безопасное обновление структуры БД

#### 3. **Мощные методы запросов**

```typescript
// Простые запросы
const allWords = await db.words.toArray();
const word = await db.words.get('123');

// Фильтрация
const hardWords = await db.words
  .where('difficulty').equals('hard')
  .toArray();

// Сложные запросы
const recentWords = await db.words
  .where('lastReviewed')
  .above(Date.now() - 7 * 24 * 60 * 60 * 1000) // Последние 7 дней
  .and(word => word.difficulty === 'hard')
  .sortBy('lastReviewed');

// Поиск по нескольким полям
const searchResults = await db.words
  .filter(word =>
    word.polish.toLowerCase().includes('kot') ||
    word.russian.toLowerCase().includes('кот')
  )
  .toArray();

// Агрегация
const count = await db.words.count();
const hardCount = await db.words
  .where('difficulty').equals('hard')
  .count();
```

**Преимущества:**
- ✅ Цепочки методов (method chaining)
- ✅ Ленивая загрузка (lazy evaluation)
- ✅ Оптимизированные запросы

#### 4. **TypeScript поддержка из коробки**

```typescript
import Dexie, { Table } from 'dexie';

interface Word {
  id: string;
  polish: string;
  russian: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

class PolishLearningDB extends Dexie {
  words!: Table<Word, string>; // Типизированная таблица

  constructor() {
    super('PolishLearningDB');
    this.version(1).stores({
      words: 'id, polish, difficulty'
    });
  }
}

const db = new PolishLearningDB();

// Полная типизация и автодополнение
const word: Word = await db.words.get('123');
word.polish; // TypeScript знает тип
```

**Преимущества:**
- ✅ Автодополнение в IDE
- ✅ Проверка типов на этапе компиляции
- ✅ Меньше ошибок в runtime

#### 5. **Транзакции с async/await**

```typescript
// Простые транзакции
await db.transaction('rw', db.words, async () => {
  await db.words.add(word1);
  await db.words.add(word2);
  // Если ошибка - все откатится
});

// Сложные транзакции с несколькими таблицами
await db.transaction('rw', [db.words, db.stats], async () => {
  await db.words.add(newWord);
  await db.stats.add({
    date: new Date(),
    wordsReviewed: 1
  });
});
```

**Преимущества:**
- ✅ Простой синтаксис
- ✅ Автоматический откат при ошибках
- ✅ Гарантия целостности данных

#### 6. **Хуки (Hooks) для реактивности**

```typescript
// Хук на создание слова
db.words.hook('creating', (primKey, obj, trans) => {
  // Автоматически добавляем дату создания
  obj.createdAt = Date.now();
});

// Хук на обновление
db.words.hook('updating', (modifications, primKey, obj, trans) => {
  // Автоматически обновляем дату изменения
  modifications.updatedAt = Date.now();
});

// Хук на удаление
db.words.hook('deleting', (primKey, obj, trans) => {
  // Логирование удаления
  console.log(`Удалено слово: ${obj.polish}`);
});
```

**Преимущества:**
- ✅ Автоматизация повторяющихся операций
- ✅ Валидация данных
- ✅ Логирование и аудит

#### 7. **Bulk операции**

```typescript
// Массовое добавление (быстрее чем по одному)
await db.words.bulkAdd([
  {id: '1', polish: 'kot', russian: 'кот'},
  {id: '2', polish: 'pies', russian: 'собака'},
  // ... тысячи слов
]);

// Массовое обновление
await db.words.bulkUpdate([
  {key: '1', changes: {difficulty: 'easy'}},
  {key: '2', changes: {difficulty: 'medium'}},
]);

// Массовое удаление
await db.words.bulkDelete(['1', '2', '3']);
```

**Преимущества:**
- ✅ В 10-100 раз быстрее чем по одной записи
- ✅ Одна транзакция вместо множества
- ✅ Эффективно для импорта данных

#### 8. **Поддержка Observable (реактивность)**

```typescript
import { liveQuery } from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';

// React хук для автоматического обновления
function WordList() {
  const words = useLiveQuery(() =>
    db.words.where('difficulty').equals('hard').toArray()
  );

  // Компонент автоматически обновится при изменении данных
  return <div>{words?.map(w => w.polish)}</div>;
}
```

**Преимущества:**
- ✅ Автоматическое обновление UI
- ✅ Реактивность без ручного управления состоянием
- ✅ Интеграция с React/Vue

### Производительность Dexie.js

**Сравнение операций (10,000 слов):**

| Операция | localStorage | IndexedDB (нативный) | Dexie.js |
|----------|--------------|---------------------|----------|
| Загрузка всех | ~500ms | ~50ms | ~50ms |
| Поиск по индексу | ~2000ms | ~10ms | ~10ms |
| Добавление 1 слова | ~5ms | ~2ms | ~2ms |
| Массовое добавление (1000) | ~5000ms | ~100ms | ~100ms |
| Обновление 1 слова | ~5ms | ~2ms | ~2ms |
| Удаление 1 слова | ~5ms | ~2ms | ~2ms |

**Вывод:** Dexie.js имеет такую же производительность как нативный IndexedDB, но с гораздо более простым API.

### Когда использовать IndexedDB/Dexie.js?

**Используйте IndexedDB/Dexie.js, если:**
- ✅ У вас > 1000 записей
- ✅ Нужен быстрый поиск и фильтрация
- ✅ Данные > 5 MB
- ✅ Нужны сложные запросы
- ✅ Планируете масштабирование
- ✅ Нужна статистика и аналитика

**Оставайтесь с localStorage, если:**
- ✅ У вас < 1000 записей
- ✅ Данные < 5 MB
- ✅ Простые операции (сохранить/загрузить)
- ✅ Нет проблем с производительностью

### Практические примеры для вашего приложения

#### Пример 1: Быстрый поиск слов

```typescript
// С localStorage - медленно
function searchWords(query: string): Word[] {
  const allWords = loadWords(); // Загружает ВСЕ слова
  return allWords.filter(w =>
    w.polish.includes(query) || w.russian.includes(query)
  );
}

// С Dexie.js - быстро (с индексом)
async function searchWords(query: string): Promise<Word[]> {
  const lowerQuery = query.toLowerCase();
  return await db.words
    .where('polish').startsWithIgnoreCase(lowerQuery)
    .or('russian').startsWithIgnoreCase(lowerQuery)
    .toArray();
}
```

#### Пример 2: Статистика по категориям

```typescript
// С localStorage - нужно загрузить все
function getStats(): Stats {
  const allWords = loadWords(); // Загружает ВСЕ
  return {
    total: allWords.length,
    byCategory: groupBy(allWords, 'category'),
    byDifficulty: groupBy(allWords, 'difficulty')
  };
}

// С Dexie.js - эффективные запросы
async function getStats(): Promise<Stats> {
  const [total, byCategory, byDifficulty] = await Promise.all([
    db.words.count(),
    db.words.orderBy('category').toArray(), // Сортировка по индексу
    db.words.orderBy('difficulty').toArray()
  ]);
  return { total, byCategory, byDifficulty };
}
```

#### Пример 3: Импорт большого файла

```typescript
// С localStorage - может упасть при больших данных
function importWords(words: Word[]): void {
  const existing = loadWords(); // Загружает ВСЕ
  const merged = [...existing, ...words];
  saveWords(merged); // Сохраняет ВСЕ - может быть медленно
}

// С Dexie.js - эффективная массовая операция
async function importWords(words: Word[]): Promise<number> {
  const existingIds = new Set(
    await db.words.toCollection().primaryKeys()
  );
  const newWords = words.filter(w => !existingIds.has(w.id));

  if (newWords.length > 0) {
    await db.words.bulkAdd(newWords); // Быстро даже для 10,000 слов
  }

  return newWords.length;
}
```

### Миграция с localStorage на Dexie.js

**План миграции:**

1. **Установка:** `npm install dexie`
2. **Создание схемы БД** с определением таблиц
3. **Миграция данных** из localStorage в IndexedDB
4. **Обновление функций** на async/await
5. **Обновление компонентов** для работы с промисами

**Пример миграции:**

```typescript
// При первом запуске - переносим данные из localStorage
async function migrateFromLocalStorage() {
  const existing = localStorage.getItem('polish-learning-words');
  if (existing) {
    const words = JSON.parse(existing);
    await db.words.bulkAdd(words);
    localStorage.removeItem('polish-learning-words'); // Очищаем старые данные
  }
}
```

### Резюме

**IndexedDB:**
- Мощный нативный API браузера
- Большие объемы данных (гигабайты)
- Быстрый поиск через индексы
- Асинхронные операции
- Сложный API, много boilerplate

**Dexie.js:**
- Простой Promise-based API
- TypeScript поддержка
- Автоматические миграции
- Мощные методы запросов
- Хуки и реактивность
- Такая же производительность как IndexedDB
- ~15 KB размер библиотеки

**Для вашего приложения изучения польского языка:**
- Если планируете > 1000 слов → Dexie.js
- Если нужен быстрый поиск → Dexie.js
- Если нужна статистика → Dexie.js
- Если все работает хорошо с localStorage → можно остаться

