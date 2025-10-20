# CodeGuardian AI Backend

A comprehensive security vulnerability scanning backend built with Node.js, Express, and AWS Bedrock for AI-powered code analysis.

## 🏗️ Architecture

### Core Technologies
- **Runtime**: Node.js 18+ with ES Modules
- **Framework**: Express.js with comprehensive middleware stack
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session management and performance optimization
- **AI**: AWS Bedrock (Claude Sonnet) for vulnerability detection
- **Authentication**: JWT with refresh tokens, GitHub OAuth
- **Real-time**: WebSocket for live dashboard updates

### Key Features
- 🔍 **AI-Powered Vulnerability Scanning**: Uses Claude Sonnet to analyze code for security issues
- 🔐 **Robust Authentication**: JWT tokens, refresh rotation, GitHub OAuth integration
- 📊 **Real-time Dashboard**: WebSocket updates for live scan progress and alerts
- 🔗 **GitHub Integration**: Repository management, webhooks, and API access
- 📧 **Email Notifications**: Security alerts and weekly reports
- 🚀 **Performance Optimized**: Redis caching, connection pooling, rate limiting

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis server
- AWS Bedrock access (Claude Sonnet model)
- GitHub OAuth app credentials
- SMTP server for emails

### Environment Setup

Create a `.env` file in the backend directory:

```bash
# Server Configuration
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/codeguardian

# Redis
REDIS_URL=redis://localhost:6379

# JWT Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback

# AWS Bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Installation & Startup

```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push

# Start development server
npm run dev

# Or start production server
npm start
```

## 📁 Project Structure

```
src/
├── controllers/           # Request handlers and business logic
│   └── authController.js
├── lib/                  # Core libraries and configurations
│   └── prisma.js
├── middleware/           # Express middleware functions
│   ├── auth.js          # JWT authentication & authorization
│   ├── security.js      # Security headers and rate limiting
│   └── validation.js    # Request validation schemas
├── routes/              # API route definitions
│   ├── auth.js         # Authentication endpoints
│   ├── repositories.js # Repository management
│   ├── vulnerabilities.js # Vulnerability operations
│   ├── dashboard.js    # Dashboard data endpoints
│   └── webhooks.js     # GitHub webhook handlers
├── services/           # External service integrations
│   ├── github.js       # GitHub API client
│   ├── scanner.js      # AI-powered vulnerability scanner
│   ├── email.js        # Email service (notifications)
│   ├── redis.js        # Redis operations
│   └── websocket.js    # Real-time WebSocket service
├── utils/              # Utility functions
│   └── logger.js       # Structured logging
└── server.js          # Main application entry point
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/github` - GitHub OAuth login
- `POST /api/auth/logout` - User logout

### Repository Management
- `GET /api/repositories` - List user repositories
- `GET /api/repositories/:id` - Get repository details
- `POST /api/repositories/connect` - Connect GitHub repository
- `PATCH /api/repositories/:id` - Update repository settings
- `DELETE /api/repositories/:id` - Disconnect repository
- `POST /api/repositories/:id/scan` - Trigger manual scan
- `GET /api/repositories/:id/stats` - Repository statistics
- `GET /api/repositories/:id/activity` - Activity timeline

### Vulnerability Management
- `GET /api/vulnerabilities/repository/:repositoryId` - List vulnerabilities
- `GET /api/vulnerabilities/:id` - Get vulnerability details
- `PATCH /api/vulnerabilities/:id/status` - Update vulnerability status
- `POST /api/vulnerabilities/:id/comments` - Add comment
- `DELETE /api/vulnerabilities/comments/:commentId` - Delete comment
- `GET /api/vulnerabilities/stats/overview` - Vulnerability statistics
- `PATCH /api/vulnerabilities/bulk/update` - Bulk update vulnerabilities

### Dashboard
- `GET /api/dashboard/overview` - Dashboard overview data
- `GET /api/dashboard/trends` - Vulnerability and scan trends
- `GET /api/dashboard/security-score` - Security score breakdown

### Webhooks
- `POST /api/webhooks/github` - GitHub webhook handler

## 🧠 AI-Powered Vulnerability Detection

The system uses AWS Bedrock's Claude Sonnet model to perform sophisticated code analysis:

### Supported Languages
- JavaScript/TypeScript (Node.js, React, Vue, etc.)
- Python
- Java
- C#/.NET
- PHP
- Ruby
- Go
- Rust
- Swift
- Kotlin
- SQL

### Vulnerability Categories
- SQL Injection
- Cross-Site Scripting (XSS)  
- Cross-Site Request Forgery (CSRF)
- Authentication/Authorization flaws
- Input validation issues
- Insecure direct object references
- Security misconfigurations
- Cryptographic issues
- Business logic flaws
- Dependency vulnerabilities

### Severity Levels
- **CRITICAL**: Immediate attention required (25 points deduction)
- **HIGH**: High priority fix needed (10 points deduction)
- **MEDIUM**: Moderate risk, plan fix (5 points deduction)
- **LOW**: Minor issue, low impact (2 points deduction)

## 🔄 Real-time Features

WebSocket integration provides live updates for:
- Scan progress and completion
- New vulnerability discoveries
- Repository connections/disconnections
- Comment additions
- Status changes

### WebSocket Events
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3001');

// Listen for scan progress
ws.on('scan:progress', (data) => {
  console.log(`Scan ${data.progress}% complete`);
});

// Listen for new vulnerabilities
ws.on('vulnerability:discovered', (data) => {
  console.log('New vulnerability found:', data.vulnerability);
});
```

## 🔧 Configuration

### Security Settings
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for frontend domain
- **Helmet**: Security headers enabled
- **JWT**: 15-minute access tokens, 7-day refresh tokens
- **Password**: Bcrypt hashing with 12 rounds

### Performance Optimizations
- **Redis Caching**: Dashboard data cached for 5 minutes
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient database connections
- **Concurrent Scanning**: Max 3 simultaneous scans

### Email Templates
Professional HTML email templates for:
- Email verification
- Password reset
- Critical vulnerability alerts
- Weekly security reports

## 🚀 Deployment

### Production Configuration
```bash
# Set production environment
NODE_ENV=production

# Use production database
DATABASE_URL=postgresql://user:pass@prod-db:5432/codeguardian

# Configure production Redis
REDIS_URL=redis://prod-redis:6379

# Set secure secrets
JWT_SECRET=production-jwt-secret-256-bits-minimum
JWT_REFRESH_SECRET=production-refresh-secret-256-bits-minimum
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "start"]
```

### Health Checks
- `GET /api/health` - Basic health check
- Database connectivity verification
- Redis connection status
- AWS Bedrock service availability

## 📊 Monitoring & Logging

### Structured Logging
- Request/response logging
- Error tracking with stack traces
- Performance metrics
- Security event logging

### Metrics
- Scan success/failure rates
- API response times
- Authentication events
- WebSocket connection counts

## 🔒 Security Best Practices

### Input Validation
- Joi schema validation for all endpoints
- SQL injection prevention with Prisma
- XSS protection with sanitization
- File upload restrictions

### Authentication Security
- Secure JWT implementation
- Token rotation on refresh
- Rate limiting on auth endpoints
- GitHub OAuth integration

### Infrastructure Security
- Environment variable protection
- Secure headers with Helmet
- CORS configuration
- Input sanitization

## 🧪 Testing

```bash
# Run test suite
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 📈 Performance

### Optimization Features
- Database query optimization
- Redis caching strategy
- WebSocket connection management
- Concurrent scan limiting
- Efficient AI model usage

### Monitoring
- Response time tracking
- Database query performance
- Memory usage monitoring
- CPU utilization alerts

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Email: support@codeguardian-ai.com
- Documentation: [docs.codeguardian-ai.com](https://docs.codeguardian-ai.com)

---

**Built with ❤️ for secure code development**