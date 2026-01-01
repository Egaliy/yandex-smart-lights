#!/bin/bash

# Скрипт для получения токена доступа

CLIENT_ID="7389ae19172c4163aad94c25fe90143b"
REDIRECT_URI="https://oauth.yandex.ru/verification_code"

echo "=========================================="
echo "Получение токена доступа Яндекс OAuth"
echo "=========================================="
echo ""
echo "1. Откройте в браузере следующую ссылку:"
echo ""
echo "https://oauth.yandex.ru/authorize?response_type=token&client_id=${CLIENT_ID}"
echo ""
echo "2. Авторизуйтесь в Яндекс"
echo "3. После авторизации вы будете перенаправлены"
echo "4. Скопируйте значение access_token из URL"
echo "5. Запустите скрипт с токеном:"
echo "   python3 yandex_smart_home_api.py ваш_токен"
echo ""

