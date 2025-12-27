// Глобальное состояние приложения
const state = {
    cards: [],
    currentIndex: 0,
    isAnimating: false
};
// Состояние для touch событий
const touchState = {
    startX: 0,
    endX: 0
};
// DOM элементы с проверкой типов
const cardElement = document.getElementById('card');
const cardTextElement = document.getElementById('cardText');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const randomBtn = document.getElementById('randomBtn');
const currentCardElement = document.getElementById('currentCard');
const totalCardsElement = document.getElementById('totalCards');
const cardContainer = document.getElementById('cardContainer');
// Константы
const SWIPE_THRESHOLD = 50;
const ANIMATION_DURATION = 300;
const STORAGE_KEY = 'cardIndex';
/**
 * Загрузка карточек из JSON файла
 */
async function loadCards() {
    try {
        const response = await fetch('cards.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const cards = await response.json();
        return cards;
    }
    catch (error) {
        console.error('Ошибка загрузки карточек:', error);
        throw error;
    }
}
/**
 * Восстановление позиции из localStorage
 */
function restorePosition(maxIndex) {
    const savedIndex = localStorage.getItem(STORAGE_KEY);
    if (savedIndex !== null) {
        const index = parseInt(savedIndex, 10);
        if (!isNaN(index) && index >= 0 && index < maxIndex) {
            return index;
        }
    }
    return 0;
}
/**
 * Сохранение позиции в localStorage
 */
function savePosition(index) {
    localStorage.setItem(STORAGE_KEY, index.toString());
}
/**
 * Отображение текущей карточки
 */
function renderCard() {
    if (state.cards.length === 0)
        return;
    const card = state.cards[state.currentIndex];
    cardTextElement.textContent = card.text || 'Пустая карточка';
}
/**
 * Обновление индикатора прогресса
 */
function updateProgress() {
    currentCardElement.textContent = (state.currentIndex + 1).toString();
    totalCardsElement.textContent = state.cards.length.toString();
}
/**
 * Обновление состояния кнопок навигации
 */
function updateButtons() {
    prevBtn.disabled = state.currentIndex === 0;
    nextBtn.disabled = state.currentIndex === state.cards.length - 1;
}
/**
 * Применение анимации к карточке
 */
function applyAnimation(outClass, inClass, callback) {
    if (state.isAnimating)
        return;
    state.isAnimating = true;
    cardElement.classList.add(outClass);
    setTimeout(() => {
        cardElement.classList.remove(outClass);
        callback();
        cardElement.classList.add(inClass);
        setTimeout(() => {
            cardElement.classList.remove(inClass);
            state.isAnimating = false;
        }, ANIMATION_DURATION);
    }, ANIMATION_DURATION);
}
/**
 * Переход к предыдущей карточке
 */
function goToPrevCard() {
    if (state.currentIndex > 0 && !state.isAnimating) {
        applyAnimation('slide-out-right', 'slide-in-left', () => {
            state.currentIndex--;
            renderCard();
            updateProgress();
            updateButtons();
            savePosition(state.currentIndex);
        });
    }
}
/**
 * Переход к следующей карточке
 */
function goToNextCard() {
    if (state.currentIndex < state.cards.length - 1 && !state.isAnimating) {
        applyAnimation('slide-out-left', 'slide-in-right', () => {
            state.currentIndex++;
            renderCard();
            updateProgress();
            updateButtons();
            savePosition(state.currentIndex);
        });
    }
}
/**
 * Переход к случайной карточке
 */
function goToRandomCard() {
    if (state.cards.length <= 1 || state.isAnimating)
        return;
    // Генерируем случайный индекс, отличный от текущего
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * state.cards.length);
    } while (randomIndex === state.currentIndex);
    // Определяем направление анимации
    const outClass = randomIndex > state.currentIndex ? 'slide-out-left' : 'slide-out-right';
    const inClass = randomIndex > state.currentIndex ? 'slide-in-right' : 'slide-in-left';
    applyAnimation(outClass, inClass, () => {
        state.currentIndex = randomIndex;
        renderCard();
        updateProgress();
        updateButtons();
        savePosition(state.currentIndex);
    });
}
/**
 * Обработка свайпа
 */
function handleSwipe() {
    const diff = touchState.startX - touchState.endX;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
        if (diff > 0) {
            goToNextCard();
        }
        else {
            goToPrevCard();
        }
    }
}
/**
 * Регистрация Service Worker
 */
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker зарегистрирован:', registration);
            // Обработка обновлений Service Worker
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('Доступно обновление приложения. Обновите страницу для применения изменений.');
                            // Можно добавить UI для уведомления пользователя об обновлении
                        }
                    });
                }
            });
        }
        catch (error) {
            console.error('Ошибка регистрации Service Worker:', error);
        }
    }
}
/**
 * Настройка обработчиков событий
 */
function setupEventListeners() {
    // Кнопки навигации
    prevBtn.addEventListener('click', goToPrevCard);
    nextBtn.addEventListener('click', goToNextCard);
    // Touch события
    cardContainer.addEventListener('touchstart', (e) => {
        touchState.startX = e.changedTouches[0].screenX;
    }, { passive: true });
    cardContainer.addEventListener('touchend', (e) => {
        touchState.endX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    // Клавиатура
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            goToPrevCard();
        }
        else if (e.key === 'ArrowRight') {
            goToNextCard();
        }
    });
    // Кнопка случайной карточки
    randomBtn.addEventListener('click', goToRandomCard);
}
/**
 * Инициализация приложения
 */
async function init() {
    try {
        // Загрузка карточек
        state.cards = await loadCards();
        if (state.cards.length === 0) {
            cardTextElement.textContent = 'Нет карточек для отображения';
            return;
        }
        // Восстановление позиции
        state.currentIndex = restorePosition(state.cards.length);
        // Отображение
        renderCard();
        updateProgress();
        updateButtons();
        // Настройка обработчиков
        setupEventListeners();
        // Регистрация Service Worker
        await registerServiceWorker();
    }
    catch (error) {
        console.error('Ошибка инициализации приложения:', error);
        cardTextElement.textContent = 'Ошибка загрузки карточек. Проверьте файл cards.json.';
    }
}
// Запуск приложения
init();
export {};
