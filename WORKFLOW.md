# Рабочий процесс с polish-learning-app submodule

## Дефолтное поведение при работе с submodule

При внесении изменений в `polish-learning-app` всегда выполняйте следующие шаги:

### 1. Работа в submodule

```bash
# Перейти в директорию submodule
cd polish-learning-app

# Внести изменения в файлы

# Проверить статус
git status

# Добавить изменения
git add .

# Сделать коммит
git commit -m "описание изменений"

# Отправить изменения в удаленный репозиторий
git push
```

### 2. Обновление ссылки в основном репозитории

После коммита и push в submodule, вернитесь в основной репозиторий и обновите ссылку:

```bash
# Вернуться в корень основного репозитория
cd ..

# Обновить ссылку на submodule
git submodule update --remote polish-learning-app

# Или просто добавить изменения submodule
git add polish-learning-app

# Проверить статус
git status

# Закоммитить обновление ссылки
git commit -m "chore: обновлена ссылка на polish-learning-app submodule

Краткое описание изменений в submodule"

# Отправить изменения
git push
```

### 3. Автоматизация (опционально)

Можно создать скрипт для автоматизации этого процесса. Создайте файл `update-submodule.sh` в корне основного репозитория:

```bash
#!/bin/bash
# Обновление submodule и основного репозитория

cd polish-learning-app
git add .
git commit -m "$1"
git push
cd ..

git submodule update --remote polish-learning-app
git add polish-learning-app
git commit -m "chore: обновлена ссылка на polish-learning-app submodule

$1"
git push
```

Использование:
```bash
./update-submodule.sh "описание изменений"
```

### 4. Важные правила

⚠️ **ВАЖНО:**
- **НЕ коммитьте файлы из `polish-learning-app/` напрямую в основной репозиторий**
- Все изменения в `polish-learning-app/` должны коммититься в его собственный репозиторий
- В основном репозитории коммитьте только изменения ссылки на submodule
- При клонировании основного репозитория используйте `git clone --recursive` или выполните `git submodule update --init --recursive`

### 5. Первоначальная настройка submodule

Если submodule еще не настроен:

```bash
# Добавить submodule
git submodule add git@github.com:litwin90/polish-learning-app.git polish-learning-app

# Или если репозиторий уже существует локально
git submodule add -f git@github.com:litwin90/polish-learning-app.git polish-learning-app
```

### 6. Работа с другими разработчиками

При клонировании репозитория с submodule:

```bash
# Клонировать с submodule
git clone --recursive <repository-url>

# Или если уже клонирован без submodule
git submodule update --init --recursive
```

При обновлении submodule:

```bash
# Обновить submodule до последней версии
git submodule update --remote polish-learning-app

# Или обновить все submodule
git submodule update --remote
```

## Пример полного workflow

```bash
# 1. Работа в submodule
cd polish-learning-app
# ... вносим изменения ...
git add .
git commit -m "feat: добавлена новая функция"
git push

# 2. Обновление в основном репозитории
cd ..
git submodule update --remote polish-learning-app
git add polish-learning-app
git commit -m "chore: обновлена ссылка на polish-learning-app

feat: добавлена новая функция"
git push
```

## Проверка статуса

```bash
# Статус submodule
git submodule status

# Статус изменений в submodule
cd polish-learning-app
git status

# Статус ссылки на submodule в основном репозитории
cd ..
git diff polish-learning-app
```

