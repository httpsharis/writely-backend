FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
# Install pnpm globally inside the container
RUN npm install -g pnpm
RUN pnpm install
COPY . .
EXPOSE 4000
CMD ["pnpm", "dev"]