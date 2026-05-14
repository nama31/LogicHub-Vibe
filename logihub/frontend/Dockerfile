FROM node:20-alpine

# Устанавливаем pnpm глобально
RUN npm install -g pnpm

WORKDIR /app/frontend

# Обязательно копируем файлы манифестов ДО установки зависимостей
COPY package.json pnpm-lock.yaml* ./

# Запускаем установку
RUN pnpm install

# Копируем остальной код
COPY . .

# Открываем порт (для Next.js по умолчанию 3000)
EXPOSE 3000

# for local development
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]

# #for deployment 
# CMD ["sh", "-c", "npm run start -- -p $PORT"]