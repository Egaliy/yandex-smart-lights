#!/usr/bin/env python3
"""
Получение токена через OAuth flow с использованием Client Secret
"""

import requests
import base64
import json

CLIENT_ID = "7389ae19172c4163aad94c25fe90143b"
CLIENT_SECRET = "07413685068e4c0fbefdcafc4686669b"

def get_token_with_code(authorization_code):
    """Получение токена по authorization code"""
    token_url = "https://oauth.yandex.ru/token"
    
    data = {
        'grant_type': 'authorization_code',
        'code': authorization_code,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }
    
    response = requests.post(token_url, data=data)
    
    if response.status_code == 200:
        token_data = response.json()
        return token_data.get('access_token')
    else:
        print(f"Ошибка: {response.status_code}")
        print(response.text)
        return None

def main():
    print("=" * 80)
    print("Получение токена через OAuth flow")
    print("=" * 80)
    print()
    print("Вариант 1: Получение токена напрямую (response_type=token)")
    print("Откройте в браузере:")
    print()
    print(f"https://oauth.yandex.ru/authorize?response_type=token&client_id={CLIENT_ID}")
    print()
    print("После авторизации токен будет в URL как параметр access_token")
    print()
    print("=" * 80)
    print()
    print("Вариант 2: Получение через authorization code")
    print("Откройте в браузере:")
    print()
    print(f"https://oauth.yandex.ru/authorize?response_type=code&client_id={CLIENT_ID}")
    print()
    print("После авторизации скопируйте код из URL и вставьте ниже:")
    print()
    
    code = input("Authorization code: ").strip()
    
    if code:
        print()
        print("Получаю токен...")
        token = get_token_with_code(code)
        
        if token:
            print(f"✅ Токен получен: {token[:20]}...")
            print()
            print("Теперь можно использовать этот токен:")
            print(f"python3 yandex_smart_home_api.py {token}")
        else:
            print("❌ Не удалось получить токен")
    else:
        print("Код не введен")

if __name__ == "__main__":
    main()

