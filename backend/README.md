# NeuraMaint Backend

Backend API for NeuraMaint - Industrial Equipment Predictive Maintenance System.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn
- PostgreSQL database (ElephantSQL recommended)

### Installation

1. **Clone and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your actual configuration values.

4. **Start development server:**
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:3001`

## 📋 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:deploy` - Deploy migrations (production)

## 🏗️ Architecture

```
backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── middlewares/     # Express middlewares
│   ├── services/        # Business logic
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── config/         # Configuration files
│   └── index.ts        # Main server file
├── prisma/             # Database schema and migrations
├── dist/               # Compiled JavaScript (auto-generated)
└── package.json
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `ML_SERVICE_URL` | ML Service endpoint | `http://localhost:5000` |

## 🛡️ Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate limiting** - DDoS protection
- **Input validation** - Joi schema validation
- **JWT authentication** - Secure token-based auth
- **Password hashing** - bcrypt encryption

## 🚀 Deployment

### Railway Deployment

1. **Connect GitHub repository to Railway**
2. **Set environment variables in Railway dashboard**
3. **Deploy automatically triggers on push to main branch**

### Manual Deployment

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

## 📊 API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Equipment Management
- `GET /api/bombas` - List all pumps
- `POST /api/bombas` - Create new pump
- `PUT /api/bombas/:id` - Update pump
- `DELETE /api/bombas/:id` - Delete pump

### Sensor Data
- `GET /api/leituras/ultimas` - Latest sensor readings
- `POST /api/leituras` - Create sensor reading

### Predictions
- `POST /api/predicoes` - Request failure prediction
- `GET /api/predicoes/:bomba_id` - Get pump predictions

## 🧪 Testing

Run the test suite:
```bash
npm test
```

For coverage report:
```bash
npm run test:coverage
```

## 📝 API Documentation

API documentation is available at `/api/docs` when the server is running.

## 🔍 Monitoring

- **Health endpoint**: `/health`
- **Logs**: Console output with timestamps
- **Error tracking**: Centralized error handling

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.