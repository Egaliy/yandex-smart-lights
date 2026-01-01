#!/usr/bin/env python3
"""
Скрипт для получения токена доступа через OAuth Яндекс
"""

CLIENT_ID = "7389ae19172c4163aad94c25fe90143b"

def main():
    print("=" * 80)
    print("Получение токена доступа для Яндекс Умного Дома")
    print("=" * 80)
    print()
    print("Шаг 1: Откройте в браузере следующую ссылку:")
    print()
    
    # Формируем URL для авторизации
    # Используем локальный redirect для получения токена
    redirect_uri = "https://oauth.yandex.ru/verification_code"
    auth_url = f"https://oauth.yandex.ru/authorize?response_type=token&client_id={CLIENT_ID}&redirect_uri={redirect_uri}"
    
    print(auth_url)
    print()
    print("Шаг 2: Авторизуйтесь в Яндекс")
    print("Шаг 3: После авторизации вы будете перенаправлены")
    print("Шаг 4: В URL будет параметр access_token - скопируйте его")
    print()
    print("Альтернативный способ:")
    print("После авторизации Яндекс покажет страницу с кодом или токеном.")
    print("Если токен не в URL, попробуйте использовать Client Secret для получения токена через API.")
    print()
    print("=" * 80)
    print()
    
    # Пробуем получить токен от пользователя
    token = input("Вставьте токен доступа (или нажмите Enter для выхода): ").strip()
    
    if token:
        print()
        print("Проверяю токен...")
        print()
        
        # Пробуем подключиться с этим токеном
        import sys
        sys.path.insert(0, '.')
        from yandex_smart_home_api import YandexSmartHomeAPI
        
        try:
            api = YandexSmartHomeAPI(access_token=token)
            api.list_devices(save_to_file=False)
        except Exception as e:
            print(f"Ошибка: {e}")
            print("Проверьте правильность токена.")
    else:
        print("Токен не введен. Выход.")

if __name__ == "__main__":
    main()

