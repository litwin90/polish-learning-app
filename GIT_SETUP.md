# 🔧 Настройка Git репозитория

## Создание нового публичного репозитория

### Вариант 1: Отдельный репозиторий (рекомендуется)

1. Создайте новый репозиторий на GitHub:
   - Перейдите на https://github.com/new
   - Название: `polish-learning-app` (или другое на ваше усмотрение)
   - Описание: "Приложение для изучения польского языка с карточками"
   - Выберите **Public**
   - **НЕ** добавляйте README, .gitignore или лицензию (они уже есть)

2. Инициализируйте Git в папке приложения:

```bash
cd polish-learning-app
git init
git add .
git commit -m "Initial commit: Polish learning app with flashcards"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/polish-learning-app.git
git push -u origin main
```

### Вариант 2: Подмодуль внутри текущего репозитория

Если вы хотите разместить приложение как подмодуль в текущем репозитории:

```bash
cd ..
git submodule add https://github.com/YOUR_USERNAME/polish-learning-app.git polish-learning-app
git commit -m "Add polish-learning-app as submodule"
```

## Обновление репозитория

После внесения изменений:

```bash
cd polish-learning-app
git add .
git commit -m "Описание изменений"
git push
```

## Деплой приложения

### GitHub Pages

1. Установите пакет для деплоя:

```bash
npm install --save-dev gh-pages
```

2. Добавьте в `package.json`:

```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  },
  "homepage": "https://YOUR_USERNAME.github.io/polish-learning-app"
}
```

3. Деплой:

```bash
npm run deploy
```

### Vercel / Netlify

- **Vercel**: Подключите репозиторий на https://vercel.com
- **Netlify**: Подключите репозиторий на https://netlify.com

Оба сервиса автоматически определят настройки Vite и задеплоят приложение.

