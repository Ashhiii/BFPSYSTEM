# ✅ Base Node image
FROM node:18-slim

# ✅ Install LibreOffice + dependencies
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    fonts-dejavu \
    fonts-liberation \
    fonts-freefont-ttf \
    && rm -rf /var/lib/apt/lists/*

# ✅ Set working directory
WORKDIR /app

# ✅ Copy package files
COPY package*.json ./

# ✅ Install dependencies
RUN npm install

# ✅ Copy rest of backend
COPY . .

# ✅ Expose backend port
EXPOSE 5000

# ✅ Start server
CMD ["node", "server.js"]
