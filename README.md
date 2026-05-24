# Express TypeScript Starter

A minimalist, enterprise-grade Express and TypeScript boilerplate. This template utilizes a feature-based architecture, ensuring the codebase remains modular, scalable, and maintainable as the application grows.

## Tech Stack

* **Runtime:** Node.js
* **Framework:** Express
* **Language:** TypeScript
* **Database:** MongoDB (via Mongoose)
* **DevOps:** Docker & Docker Compose

## Project Structure

The codebase strictly separates configuration from application logic. All application code lives inside the `src` directory, grouped by feature.

```text
├── .env.example         # Environment variable template
├── docker-compose.yml   # Docker configuration for app and local MongoDB
├── Dockerfile           # Node.js container build instructions
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── src/                 # Application source code
    ├── api/             # Feature-based domain modules (e.g., users, projects)
    ├── config/          # Application configuration (e.g., database connection)
    ├── middleware/      # Global Express middlewares (e.g., error handler)
    └── server.ts        # Application entry point
```

## Prerequisites

* Node.js (v20+)
* Docker and Docker Compose (if running via containers)
* pnpm (recommended) or npm

## Installation

1. Clone the repository and navigate into the directory.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
4. Update the `.env` file with your specific variables.

## Running the Application

### Option 1: Local Development
To run the server locally (requires a running instance of MongoDB):
```bash
npm run dev
```

### Option 2: Docker Environment
To run the server and a local MongoDB instance in isolated containers:
```bash
docker-compose up --build
```

## Available Scripts

* `npm run dev`: Starts the application in watch mode using `tsx`.
* `npm run build`: Compiles the TypeScript code into JavaScript inside the `dist` folder.
* `npm run start`: Runs the compiled JavaScript code from the `dist` folder (used for production).

## License

MIT