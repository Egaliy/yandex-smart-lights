// Управление авторизацией через OAuth Яндекс

class AuthManager {
    constructor() {
        this.tokenKey = 'yandex_smart_home_token';
        this.clientIdKey = 'yandex_client_id';
        // Ваши ключи
        this.clientId = '7389ae19172c4163aad94c25fe90143b';
        this.clientSecret = '07413685068e4c0fbefdcafc4686669b';
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

    // Автоматическое подключение
    async autoConnect() {
        // Проверяем сохраненный токен
        const savedToken = this.getToken();
        if (savedToken) {
            // Проверяем, что токен еще действителен
            try {
                const api = new YandexSmartHomeAPI(savedToken);
                await api.getDevices();
                return savedToken; // Токен валидный
            } catch (e) {
                // Токен недействителен, удаляем
                localStorage.removeItem(this.tokenKey);
            }
        }

        // Токена нет или он недействителен
        return null;
    }

    // Вход по токену напрямую
    loginWithToken(token) {
        if (!token || !token.trim()) {
            throw new Error('Токен не указан');
        }
        this.saveToken(token.trim());
        return true;
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

