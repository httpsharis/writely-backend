FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
# We use npm install here so it works universally inside the container
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]