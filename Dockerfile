# 使用官方 Node.js 輕量版映像檔
FROM node:20-slim

# 設定工作目錄
WORKDIR /usr/src/app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴 (只安裝生產環境需要的)
RUN npm ci --only=production

# 安裝 TypeScript 和 tsx 以便執行 server.ts
RUN npm install -g typescript tsx

# 複製所有程式碼
COPY . .

# 暴露 Port (Cloud Run 預設會注入 PORT 環境變數，通常是 8080)
ENV PORT=8080
EXPOSE 8080

# 啟動指令
CMD [ "npx", "tsx", "server.ts" ]
