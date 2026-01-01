// Управление авторизацией через OAuth Яндекс

class AuthManager {
    constructor() {
        this.tokenKey = 'yandex_smart_home_token';
        this.clientIdKey = 'yandex_client_id';
    }

    // Сохранение токена
    saveToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    // Получение токена
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    // Сохранение Client ID
    saveClientId(clientId) {
        localStorage.setItem(this.clientIdKey, clientId);
    }

    // Получение Client ID
    getClientId() {
        return localStorage.getItem(this.clientIdKey);
    }

    // Проверка авторизации
    isAuthenticated() {
        return !!this.getToken();
    }

    // Выход
    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.clientIdKey);
        window.location.reload();
    }

    // Авторизация через OAuth
    async login(clientId) {
        if (!clientId) {
            throw new Error('Client ID не указан');
        }

        // Сохраняем Client ID
        this.saveClientId(clientId);

        // Формируем URL для авторизации
        // Используем текущий URL как redirect_uri
        const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
        const authUrl = `https://oauth.yandex.ru/authorize?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}`;

        // Перенаправляем на страницу авторизации
        window.location.href = authUrl;
    }

    // Обработка ответа OAuth (токен в URL)
    handleOAuthCallback() {
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const token = params.get('access_token');
            
            if (token) {
                this.saveToken(token);
                // Убираем токен из URL
                window.history.replaceState({}, document.title, window.location.pathname);
                return true;
            }
        }
        return false;
    }
}

// Экспорт для использования в других файлах
window.AuthManager = AuthManager;

