FROM node:20

# Install Playwright dependencies and browsers
RUN npx -y playwright@1.58.2 install --with-deps chromium

WORKDIR /app

# Copy all source files first so postinstall scripts can run successfully
COPY . .

# Install dependencies and the CLI itself globally
RUN npm install
RUN npm install -g .
RUN npm install express uuid

EXPOSE 3000

CMD ["node", "server.js"]
