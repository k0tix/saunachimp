# Backend API

Node.js REST API built with Express, TypeScript, and MySQL, containerized with Docker Compose.

## Features

- ✅ Express.js web framework
- ✅ TypeScript for type safety
- ✅ MySQL database
- ✅ Docker Compose setup
- ✅ Environment variables configuration
- ✅ RESTful API endpoints (CRUD operations)

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local development)

## Getting Started

### 1. Clone and Setup

```bash
cd backend
```

### 2. Environment Variables

The `.env` file is already configured with default values for Docker:

```env
NODE_ENV=development
PORT=3000
DB_HOST=backend_mysql
DB_PORT=3306
DB_USER=apiuser
DB_PASSWORD=apipassword
DB_NAME=apidb
DB_ROOT_PASSWORD=rootpassword
```

### 3. Run with Docker Compose

**Note:** Docker configuration files are now in the root directory of the project.

```bash
# From the backend directory:
# Start both database and API
npm run docker:up

# View logs
npm run docker:logs

# Stop containers
npm run docker:down
```

Or run directly from the root directory:

```bash
# From the project root:
docker-compose up -d
docker-compose logs -f
docker-compose down
```

The API will be available at `http://localhost:3000`

### 4. Local Development (without Docker)

```bash
# Install dependencies
npm install

# Make sure MySQL is running locally
# Update DB_HOST=localhost in .env

# Run in development mode with auto-reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Check API status

### Products API
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Example Requests

**Create a product:**
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"New Product","description":"A great product","price":99.99}'
```

**Get all products:**
```bash
curl http://localhost:3000/api/products
```

**Update a product:**
```bash
curl -X PUT http://localhost:3000/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Product","price":89.99}'
```

**Delete a product:**
```bash
curl -X DELETE http://localhost:3000/api/products/1
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts       # Database connection
│   ├── routes/
│   │   └── products.ts       # Product CRUD endpoints
│   └── server.ts             # Main application entry
├── docker-compose.yml        # Docker services configuration
├── Dockerfile                # API container configuration
├── init.sql                  # Database initialization script
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── .env                      # Environment variables
```

## Database

The MySQL database is automatically initialized with a `products` table and sample data when you run Docker Compose for the first time.

**Table Schema:**
```sql
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Scripts

- `npm run dev` - Run in development mode with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production build
- `npm run docker:up` - Start Docker containers
- `npm run docker:down` - Stop Docker containers
- `npm run docker:logs` - View container logs

### Database Management

To rerun `init.sql` and reset your database, use the API endpoint:

```bash
curl -X POST http://localhost:3000/api/database/reset
```

See [DATABASE_RESET.md](DATABASE_RESET.md) for more methods and details.

## Technologies

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript
- **MySQL** - Relational database
- **Docker** - Containerization
- **mysql2** - MySQL client with promise support

## License

ISC

