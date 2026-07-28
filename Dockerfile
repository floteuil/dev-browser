FROM node:20

# Install Playwright dependencies and browsers
RUN npx -y playwright@1.58.2 install --with-deps chromium

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm install -g .
RUN npm install express uuid

EXPOSE 3000

CMD ["node", "server.js"]
