# Project Root

This is the root directory of the project.

## Structure

```
junk25/
├── backend/              # Node.js API
│   ├── src/             # Source code
│   ├── package.json     # Backend dependencies
│   ├── tsconfig.json    # TypeScript config
│   ├── init.sql         # Database initialization
│   └── .env             # Environment variables
├── docker-compose.yml   # Docker Compose configuration
└── Dockerfile           # Docker build instructions
```

## Quick Start

### Using Docker (Recommended)

1. Navigate to project root:
```bash
cd junk25
```

2. Start all services:
```bash
docker-compose up -d
```

3. View logs:
```bash
docker-compose logs -f
```

4. Stop services:
```bash
docker-compose down
```

### From Backend Directory

You can also use npm scripts from the backend directory:

```bash
cd backend
npm run docker:up    # Start services
npm run docker:logs  # View logs
npm run docker:down  # Stop services
```

## Services

- **Backend API**: http://localhost:3000
- **MySQL Database**: localhost:3306

## Documentation

See the [backend README](backend/README.md) for detailed API documentation.

