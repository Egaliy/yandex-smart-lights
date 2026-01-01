// Главное приложение

const auth = new AuthManager();
let api = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Показываем текущий redirect URI в интерфейсе
    const redirectUriDisplay = document.getElementById('redirect-uri-display');
    if (redirectUriDisplay) {
        const currentUrl = window.location.origin + window.location.pathname;
        redirectUriDisplay.textContent = currentUrl;
    }

    // Проверяем OAuth callback (токен в URL)
    if (auth.handleOAuthCallback()) {
        showDashboard();
        return;
    }

    // Проверяем авторизацию (сохраненный токен)
    if (auth.isAuthenticated()) {
        // Автоматически показываем дашборд если токен есть
        showDashboard();
    } else {
        showLogin();
    }

    // Обработчики событий
    setupEventListeners();
});

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопка активации через Яндекс
    const activateBtn = document.getElementById('activate-btn');
    if (activateBtn) {
        activateBtn.addEventListener('click', handleActivate);
    }

    // Кнопка входа по токену
    const tokenLoginBtn = document.getElementById('token-login-btn');
    if (tokenLoginBtn) {
        tokenLoginBtn.addEventListener('click', handleTokenLogin);
    }

    // Кнопка выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.logout();
        });
    }

    // Enter в полях
    const clientIdInput = document.getElementById('client-id');
    const tokenInput = document.getElementById('token-input');
    
    if (clientIdInput) {
        const savedClientId = auth.getClientId();
        if (savedClientId && !clientIdInput.value) {
            clientIdInput.value = savedClientId;
        }

        clientIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleActivate();
            }
        });
    }

    if (tokenInput) {
        tokenInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleTokenLogin();
            }
        });
    }
}

// Обработка активации через Яндекс
async function handleActivate() {
    const clientId = document.getElementById('client-id').value.trim();
    
    if (!clientId) {
        alert('Пожалуйста, введите Client ID');
        return;
    }

    try {
        await auth.login(clientId);
    } catch (error) {
        alert('Ошибка при активации: ' + error.message);
    }
}

// Обработка входа по токену
function handleTokenLogin() {
    const token = document.getElementById('token-input').value.trim();
    
    if (!token) {
        alert('Пожалуйста, введите токен доступа');
        return;
    }

    try {
        auth.loginWithToken(token);
        showDashboard();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

// Показать страницу входа
function showLogin() {
    document.getElementById('login-page').classList.add('active');
    document.getElementById('dashboard-page').classList.remove('active');
}

// Показать панель управления
async function showDashboard() {
    document.getElementById('login-page').classList.remove('active');
    document.getElementById('dashboard-page').classList.add('active');

    const token = auth.getToken();
    if (!token) {
        showLogin();
        return;
    }

    api = new YandexSmartHomeAPI(token);
    await loadDevices();
}

// Загрузка устройств
async function loadDevices() {
    const loading = document.getElementById('loading');
    const container = document.getElementById('devices-container');
    const noDevices = document.getElementById('no-devices');

    loading.classList.remove('hidden');
    container.innerHTML = '';
    noDevices.classList.add('hidden');

    try {
        const devices = await api.getDevices();
        
        loading.classList.add('hidden');

        if (devices.length === 0) {
            noDevices.classList.remove('hidden');
            return;
        }

        // Фильтруем только лампочки
        const lights = devices.filter(device => 
            device.type === 'devices.types.light' || 
            device.type === 'devices.types.light.bulb'
        );

        if (lights.length === 0) {
            noDevices.classList.remove('hidden');
            return;
        }

        // Отображаем лампочки
        lights.forEach(device => {
            const card = createDeviceCard(device);
            container.appendChild(card);
        });

    } catch (error) {
        loading.classList.add('hidden');
        alert('Ошибка при загрузке устройств: ' + error.message);
        console.error(error);
    }
}

// Создание карточки устройства
function createDeviceCard(device) {
    const card = document.createElement('div');
    card.className = 'device-card';
    card.dataset.deviceId = device.id;

    // Получаем состояние устройства
    const capabilities = device.capabilities || [];
    const onOffCap = capabilities.find(c => c.type === 'devices.capabilities.on_off');
    const brightnessCap = capabilities.find(c => c.type === 'devices.capabilities.range' && 
        c.parameters?.instance === 'brightness');
    const colorCap = capabilities.find(c => c.type === 'devices.capabilities.color_setting');

    const isOn = onOffCap?.state?.value || false;
    const brightness = brightnessCap?.state?.value || 100;
    const colorState = colorCap?.state?.value || {};

    card.innerHTML = `
        <div class="device-header">
            <div class="device-name">${device.name || 'Лампочка'}</div>
            <div class="device-status ${isOn ? 'on' : ''}"></div>
        </div>

        <div class="control-group">
            <div class="control-label">
                <span>Включение</span>
            </div>
            <div class="toggle-switch ${isOn ? 'active' : ''}" data-action="toggle"></div>
        </div>

        ${brightnessCap ? `
        <div class="control-group">
            <div class="control-label">
                <span>Яркость</span>
                <span id="brightness-value-${device.id}">${brightness}%</span>
            </div>
            <input type="range" min="1" max="100" value="${brightness}" 
                   class="slider" id="brightness-${device.id}" 
                   ${!isOn ? 'disabled' : ''}>
        </div>
        ` : ''}

        ${colorCap ? `
        <div class="control-group">
            <div class="control-label">
                <span>Цвет</span>
            </div>
            <div class="color-picker-container">
                <input type="color" class="color-input" id="color-${device.id}" 
                       value="${getColorValue(colorState)}" ${!isOn ? 'disabled' : ''}>
            </div>
        </div>

        ${colorCap.parameters?.temperature_k ? `
        <div class="control-group">
            <div class="control-label">
                <span>Температура цвета</span>
            </div>
            <div class="temperature-control">
                <input type="range" min="2000" max="9000" step="100" 
                       value="${colorState.temperature_k || 4500}" 
                       class="slider temp-slider" id="temp-${device.id}"
                       ${!isOn ? 'disabled' : ''}>
                <div class="temp-buttons">
                    <button class="temp-btn" data-temp="2700">Теплый</button>
                    <button class="temp-btn" data-temp="4500">Нейтр.</button>
                    <button class="temp-btn" data-temp="6500">Холодный</button>
                </div>
            </div>
        </div>
        ` : ''}
        ` : ''}
    `;

    // Обработчики событий
    setupDeviceControls(card, device, isOn, brightnessCap, colorCap);

    return card;
}

// Настройка элементов управления устройством
function setupDeviceControls(card, device, isOn, brightnessCap, colorCap) {
    const deviceId = device.id;

    // Переключатель включения/выключения
    const toggle = card.querySelector('[data-action="toggle"]');
    toggle.addEventListener('click', async () => {
        const newState = !isOn;
        try {
            await api.toggleDevice(deviceId, newState);
            toggle.classList.toggle('active');
            card.querySelector('.device-status').classList.toggle('on');
            
            // Включаем/выключаем другие элементы управления
            const controls = card.querySelectorAll('.slider, .color-input, .temp-btn');
            controls.forEach(control => {
                control.disabled = !newState;
            });
        } catch (error) {
            alert('Ошибка: ' + error.message);
        }
    });

    // Слайдер яркости
    if (brightnessCap) {
        const brightnessSlider = card.querySelector(`#brightness-${deviceId}`);
        const brightnessValue = card.querySelector(`#brightness-value-${deviceId}`);
        
        brightnessSlider.addEventListener('input', (e) => {
            brightnessValue.textContent = e.target.value + '%';
        });

        brightnessSlider.addEventListener('change', async (e) => {
            try {
                await api.setBrightness(deviceId, parseInt(e.target.value));
            } catch (error) {
                alert('Ошибка: ' + error.message);
            }
        });
    }

    // Выбор цвета
    if (colorCap) {
        const colorInput = card.querySelector(`#color-${deviceId}`);
        colorInput.addEventListener('change', async (e) => {
            const hex = e.target.value;
            const rgb = hexToRgb(hex);
            try {
                await api.setColor(deviceId, rgb.r, rgb.g, rgb.b);
            } catch (error) {
                alert('Ошибка: ' + error.message);
            }
        });

        // Кнопки температуры цвета
        if (colorCap.parameters?.temperature_k) {
            const tempButtons = card.querySelectorAll('.temp-btn');
            const tempSlider = card.querySelector(`#temp-${deviceId}`);
            
            tempButtons.forEach(btn => {
                btn.addEventListener('click', async () => {
                    const temp = parseInt(btn.dataset.temp);
                    tempSlider.value = temp;
                    try {
                        await api.setColorTemperature(deviceId, temp);
                        tempButtons.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                    } catch (error) {
                        alert('Ошибка: ' + error.message);
                    }
                });
            });

            tempSlider.addEventListener('change', async (e) => {
                try {
                    await api.setColorTemperature(deviceId, parseInt(e.target.value));
                } catch (error) {
                    alert('Ошибка: ' + error.message);
                }
            });
        }
    }
}

// Получение значения цвета для color input
function getColorValue(colorState) {
    if (colorState.rgb) {
        const { r, g, b } = colorState.rgb;
        return rgbToHex(r, g, b);
    }
    return '#ffffff';
}

// Конвертация RGB в HEX
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// Конвертация HEX в RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
}


