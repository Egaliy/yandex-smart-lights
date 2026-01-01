// API клиент для работы с Яндекс Умным Домом

class YandexSmartHomeAPI {
    constructor(token) {
        this.token = token;
        this.baseUrl = 'https://api.iot.yandex.net/v1.0';
    }

    // Заголовки для запросов
    getHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    // Получение списка устройств
    async getDevices() {
        try {
            const response = await fetch(`${this.baseUrl}/user/info`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (response.status === 401) {
                throw new Error('Токен недействителен. Пожалуйста, войдите снова.');
            }

            if (!response.ok) {
                throw new Error(`Ошибка API: ${response.status}`);
            }

            const data = await response.json();
            return data.devices || [];
        } catch (error) {
            console.error('Ошибка при получении устройств:', error);
            throw error;
        }
    }

    // Управление устройством
    async controlDevice(deviceId, actions) {
        try {
            const response = await fetch(`${this.baseUrl}/devices/${deviceId}/actions`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    actions: actions
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Ошибка: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка при управлении устройством:', error);
            throw error;
        }
    }

    // Включение/выключение устройства
    async toggleDevice(deviceId, on) {
        return this.controlDevice(deviceId, [{
            type: 'devices.capabilities.on_off',
            state: {
                instance: 'on',
                value: on
            }
        }]);
    }

    // Установка яркости
    async setBrightness(deviceId, brightness) {
        return this.controlDevice(deviceId, [{
            type: 'devices.capabilities.range',
            state: {
                instance: 'brightness',
                value: brightness
            }
        }]);
    }

    // Установка цвета RGB
    async setColor(deviceId, r, g, b) {
        return this.controlDevice(deviceId, [{
            type: 'devices.capabilities.color_setting',
            state: {
                instance: 'rgb',
                value: {
                    r: r,
                    g: g,
                    b: b
                }
            }
        }]);
    }

    // Установка температуры цвета
    async setColorTemperature(deviceId, temperature) {
        return this.controlDevice(deviceId, [{
            type: 'devices.capabilities.color_setting',
            state: {
                instance: 'temperature_k',
                value: temperature
            }
        }]);
    }
}

// Экспорт для использования в других файлах
window.YandexSmartHomeAPI = YandexSmartHomeAPI;


