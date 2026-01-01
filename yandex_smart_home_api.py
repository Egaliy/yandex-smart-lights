#!/usr/bin/env python3
"""
Скрипт для подключения к API Яндекс Умного Дома и получения списка устройств
"""

import requests
import json
import os
import sys
from typing import Dict, List, Optional


class YandexSmartHomeAPI:
    """Класс для работы с API Яндекс Умного Дома"""
    
    def __init__(self, access_token: Optional[str] = None):
        """
        Инициализация API клиента
        
        Args:
            access_token: OAuth токен доступа к API Яндекс Умного Дома
        """
        self.access_token = access_token or os.getenv('YANDEX_SMART_HOME_TOKEN')
        self.base_url = "https://yandex.ru/dev/dialogs/smart-home/doc/ru/"
        self.api_url = "https://api.iot.yandex.net/v1.0"
        
    def get_devices(self) -> List[Dict]:
        """
        Получение списка всех устройств
        
        Returns:
            Список устройств в формате JSON
        """
        if not self.access_token:
            raise ValueError("Токен доступа не указан. Укажите токен при инициализации или через переменную окружения YANDEX_SMART_HOME_TOKEN")
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        try:
            # Получение информации о пользователе и устройствах через API
            response = requests.get(
                f"{self.api_url}/user/info",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                # API возвращает информацию о пользователе, включая список устройств
                devices = data.get('devices', [])
                return devices
            elif response.status_code == 401:
                print("Ошибка авторизации: неверный или истекший токен")
                print("Получите новый токен по инструкции в README.md")
                return []
            else:
                print(f"Ошибка при запросе: {response.status_code}")
                print(f"Ответ: {response.text}")
                return []
                
        except requests.exceptions.RequestException as e:
            print(f"Ошибка подключения: {e}")
            return []
    
    def get_device_info(self, device_id: str) -> Optional[Dict]:
        """
        Получение информации о конкретном устройстве
        
        Args:
            device_id: ID устройства
            
        Returns:
            Информация об устройстве или None
        """
        devices = self.get_devices()
        for device in devices:
            if device.get('id') == device_id:
                return device
        return None
    
    def list_devices(self, save_to_file: bool = False) -> None:
        """
        Вывод списка всех устройств в консоль
        
        Args:
            save_to_file: Сохранить список устройств в JSON файл
        """
        devices = self.get_devices()
        
        if not devices:
            print("Устройства не найдены или произошла ошибка при подключении.")
            return
        
        print(f"\nНайдено устройств: {len(devices)}\n")
        print("=" * 80)
        
        # Фильтр для лампочек
        lights = [d for d in devices if d.get('type') == 'devices.types.light']
        if lights:
            print(f"\n💡 Найдено лампочек: {len(lights)}\n")
        
        for i, device in enumerate(devices, 1):
            device_type = device.get('type', 'N/A')
            device_name = device.get('name', 'N/A')
            
            # Иконка для лампочек
            icon = "💡" if device_type == 'devices.types.light' else "🔌"
            
            print(f"\n{icon} Устройство #{i}: {device_name}")
            print(f"ID: {device.get('id', 'N/A')}")
            print(f"Тип: {device_type}")
            
            # Вывод возможностей (capabilities)
            capabilities = device.get('capabilities', [])
            if capabilities:
                print("Возможности:")
                for cap in capabilities:
                    cap_type = cap.get('type', 'N/A')
                    state = cap.get('state', {})
                    
                    # Красивое форматирование для разных типов возможностей
                    if cap_type == 'devices.capabilities.on_off':
                        is_on = state.get('value', False)
                        status = "🟢 ВКЛ" if is_on else "🔴 ВЫКЛ"
                        print(f"  - Включение/выключение: {status}")
                    elif cap_type == 'devices.capabilities.color_setting':
                        color = state.get('value', {})
                        if 'rgb' in color:
                            rgb = color['rgb']
                            print(f"  - Цвет RGB: ({rgb.get('r', 0)}, {rgb.get('g', 0)}, {rgb.get('b', 0)})")
                        if 'temperature_k' in color:
                            print(f"  - Температура цвета: {color['temperature_k']}K")
                    elif cap_type == 'devices.capabilities.range':
                        instance = cap.get('parameters', {}).get('instance', 'brightness')
                        value = state.get('value', 0)
                        unit = cap.get('parameters', {}).get('unit', '')
                        print(f"  - {instance.capitalize()}: {value} {unit}")
                    else:
                        print(f"  - {cap_type}: {state}")
            
            # Вывод свойств (properties)
            properties = device.get('properties', [])
            if properties:
                print("Свойства:")
                for prop in properties:
                    prop_type = prop.get('type', 'N/A')
                    state = prop.get('state', {})
                    print(f"  - {prop_type}: {state}")
            
            print("-" * 80)
        
        # Сохранение в файл
        if save_to_file:
            filename = 'devices.json'
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(devices, f, ensure_ascii=False, indent=2)
            print(f"\n✅ Список устройств сохранен в файл: {filename}")


def main():
    """Основная функция"""
    print("Подключение к API Яндекс Умного Дома...")
    print("=" * 80)
    
    # Попытка получить токен из аргументов командной строки
    token = None
    if len(sys.argv) > 1:
        token = sys.argv[1]
    
    # Если не передан как аргумент, пробуем из переменной окружения
    if not token:
        token = os.getenv('YANDEX_SMART_HOME_TOKEN')
    
    # Если все еще нет токена, показываем инструкцию
    if not token:
        print("\nТокен доступа не найден.")
        print("Использование:")
        print("  python3 yandex_smart_home_api.py <токен>")
        print("  или")
        print("  export YANDEX_SMART_HOME_TOKEN='ваш_токен'")
        print("  python3 yandex_smart_home_api.py")
        print("\n" + "=" * 80)
        print("КАК ПОЛУЧИТЬ ТОКЕН ДОСТУПА:")
        print("=" * 80)
        print("\n1. Зарегистрируйте приложение на OAuth Яндекса:")
        print("   https://oauth.yandex.ru/client/new")
        print("\n2. При создании приложения:")
        print("   - Выберите платформу: 'Веб-сервисы'")
        print("   - Укажите Redirect URI (например: https://google.com)")
        print("   - В разделе 'Доступ к данным' отметьте права:")
        print("     ✓ iot:view - просмотр устройств")
        print("     ✓ iot:control - управление устройствами")
        print("\n3. Сохраните CLIENT_ID вашего приложения")
        print("\n4. Получите токен доступа:")
        print("   Перейдите по ссылке (замените ВАШ_CLIENT_ID):")
        print("   https://oauth.yandex.ru/authorize?response_type=token&client_id=ВАШ_CLIENT_ID")
        print("\n5. После авторизации токен будет в URL после redirect")
        print("   (параметр access_token в адресной строке)")
        print("\n" + "=" * 80)
        return
    
    # Создание клиента и получение устройств
    api = YandexSmartHomeAPI(access_token=token)
    api.list_devices(save_to_file=False)


if __name__ == "__main__":
    main()

