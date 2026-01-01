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

    // Автоматическое получение токена через OAuth flow
    async getTokenAutomatically() {
        // Пробуем получить токен через authorization code flow
        const currentUrl = window.location.origin + window.location.pathname;
        const redirectUri = encodeURIComponent(currentUrl);
        
        // Используем невидимый iframe для получения authorization code
        return new Promise((resolve, reject) => {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${this.clientId}&redirect_uri=${redirectUri}`;
            
            const handleMessage = (event) => {
                if (event.origin !== 'https://oauth.yandex.ru') return;
                
                if (event.data.code) {
                    // Получаем токен по authorization code
                    this.exchangeCodeForToken(event.data.code, redirectUri)
                        .then(token => {
                            document.body.removeChild(iframe);
                            window.removeEventListener('message', handleMessage);
                            resolve(token);
                        })
                        .catch(reject);
                }
            };
            
            window.addEventListener('message', handleMessage);
            document.body.appendChild(iframe);
            
            // Таймаут на случай ошибки
            setTimeout(() => {
                document.body.removeChild(iframe);
                window.removeEventListener('message', handleMessage);
                reject(new Error('Таймаут получения токена'));
            }, 30000);
        });
    }

    // Обмен authorization code на токен
    async exchangeCodeForToken(code, redirectUri) {
        const response = await fetch('https://oauth.yandex.ru/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                client_id: this.clientId,
                client_secret: this.clientSecret,
                redirect_uri: decodeURIComponent(redirectUri)
            })
        });

        if (!response.ok) {
            throw new Error('Ошибка получения токена');
        }

        const data = await response.json();
        const token = data.access_token;
        
        if (token) {
            this.saveToken(token);
            return token;
        }
        
        throw new Error('Токен не получен');
    }

    // Автоматическое подключение
    async autoConnect() {
        // Сначала проверяем сохраненный токен
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

        // Если токена нет или он недействителен, пробуем получить новый
        // Но для этого нужен редирект, поэтому просто возвращаем null
        // и показываем дашборд с возможностью ввода токена вручную
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

