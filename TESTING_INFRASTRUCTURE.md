# NeuraMaint Testing Infrastructure

## 🏗️ Infrastructure Overview

This document describes the testing infrastructure for the NeuraMaint system, including environment setup, tools, and processes.

## 🐳 Docker-based Testing Environment

### Services Architecture

```mermaid
graph TD
    A[Test Runner] --> B[Backend Service]
    A --> C[Frontend Service]
    A --> D[ML Service]
    B --> E[(PostgreSQL - Main)]
    D --> F[(PostgreSQL - ML)]
    B --> G[(Redis - Cache)]
    C --> B
    C --> D
```

### Container Services

1. **Backend Test Service** (`backend-test`)
   - Node.js 18 environment
   - Runs backend unit and integration tests
   - Connects to test database

2. **Frontend Test Service** (`frontend-test`)
   - Node.js environment with Next.js
   - Runs frontend unit and component tests
   - Connects to backend test service

3. **ML Service Test Service** (`ml-service-test`)
   - Python 3.10 environment
   - Runs ML service unit tests
   - Uses Flask framework

4. **PostgreSQL Test Database** (`postgres-test`)
   - PostgreSQL 15 database
   - Contains test data schema
   - Isolated from production data

5. **PostgreSQL ML Test Database** (`postgres-ml-test`)
   - Dedicated database for ML service testing
   - Contains ML model data

6. **Redis Test Service** (`redis-test`)
   - Caching layer for test environment
   - Session storage for tests

7. **Test Runner** (`test-runner`)
   - Orchestrates all test execution
   - Collects and reports test results
   - Generates coverage reports

## 🧪 Testing Tools and Frameworks

### Backend Testing
- **Framework**: Jest
- **Test Types**: Unit, Integration, API
- **Coverage**: Istanbul/nyc
- **Mocking**: jest-mock, supertest

### Frontend Testing
- **Framework**: Jest with React Testing Library
- **Test Types**: Unit, Component, Integration
- **Coverage**: Istanbul/nyc
- **E2E**: Cypress (planned)

### ML Service Testing
- **Framework**: Pytest
- **Test Types**: Unit, Integration
- **Mocking**: unittest.mock
- **Performance**: timeit module

### Performance Testing
- **Load Testing**: Artillery
- **Stress Testing**: k6 (planned)
- **Monitoring**: Prometheus + Grafana (planned)

### Security Testing
- **Vulnerability Scanning**: OWASP ZAP
- **Dependency Scanning**: npm audit, safety
- **Code Analysis**: SonarQube (planned)

### Database Testing
- **Schema Validation**: Prisma Migrate
- **Data Integrity**: Custom test scripts
- **Performance**: pgbench (planned)

## 📁 Directory Structure

```
NeuraMaint/
├── test-scripts/              # Test execution scripts
│   ├── backend-unit-tests.sh
│   ├── frontend-unit-tests.sh
│   ├── ml-service-tests.py
│   ├── api-integration-tests.js
│   ├── performance-tests.js
│   ├── security-tests.js
│   ├── database-tests.js
│   ├── run-all-tests.sh
│   └── load-tests/
│       ├── auth-load-test.yml
│       ├── dashboard-load-test.yml
│       ├── equipment-load-test.yml
│       └── sensor-load-test.yml
├── test-data/                 # Generated test data
│   ├── users.json
│   ├── pumps.json
│   ├── sensors.json
│   ├── readings.json
│   └── alerts.json
├── test-results/              # Test execution results
├── test-reports/              # Test reports and metrics
├── coverage/                  # Code coverage reports
├── docker-compose.test.yml    # Docker testing environment
├── Dockerfile.test-runner     # Test runner Dockerfile
├── backend/
│   ├── Dockerfile.test
│   └── __tests__/             # Backend unit tests
├── frontend/
│   ├── Dockerfile.test
│   └── __tests__/             # Frontend unit tests
└── ml-service/
    ├── Dockerfile.test
    └── test_*.py              # ML service tests
```

## 🚀 Environment Setup

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 1.29+
- Node.js 18+
- Python 3.10+

### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd NeuraMaint

# Build and start test environment
docker-compose -f docker-compose.test.yml up -d

# Run all tests
docker-compose -f docker-compose.test.yml run test-runner

# View test results
docker-compose -f docker-compose.test.yml logs test-runner
```

### Environment Variables
```env
# Backend
NODE_ENV=test
DATABASE_URL=postgresql://postgres:postgres@postgres-test:5432/neuramaint_test
JWT_SECRET=test-secret-key
JWT_EXPIRES_IN=1h
ML_SERVICE_URL=http://ml-service-test:5000

# Frontend
NEXT_PUBLIC_API_URL=http://backend-test:3001
NEXT_PUBLIC_ML_SERVICE_URL=http://ml-service-test:5000

# ML Service
FLASK_ENV=test
ML_DATABASE_URL=postgresql://postgres:postgres@postgres-ml-test:5432/neuramaint_ml_test
```

## 🧪 Test Execution Process

### 1. Unit Testing Phase
```bash
# Backend unit tests
docker-compose -f docker-compose.test.yml run backend-test npm run test

# Frontend unit tests
docker-compose -f docker-compose.test.yml run frontend-test npm run test

# ML service unit tests
docker-compose -f docker-compose.test.yml run ml-service-test python -m pytest
```

### 2. Integration Testing Phase
```bash
# API integration tests
docker-compose -f docker-compose.test.yml run test-runner node test-scripts/api-integration-tests.js

# Database integration tests
docker-compose -f docker-compose.test.yml run test-runner node test-scripts/database-tests.js
```

### 3. Performance Testing Phase
```bash
# Load testing
docker-compose -f docker-compose.test.yml run test-runner node test-scripts/performance-tests.js

# Stress testing (when implemented)
docker-compose -f docker-compose.test.yml run test-runner node test-scripts/stress-tests.js
```

### 4. Security Testing Phase
```bash
# Security scanning
docker-compose -f docker-compose.test.yml run test-runner node test-scripts/security-tests.js
```

## 📊 Test Reporting

### Report Generation
- **JUnit XML**: For CI/CD integration
- **HTML Reports**: For human-readable results
- **Coverage Reports**: Istanbul HTML and LCOV formats
- **Performance Reports**: Artillery JSON and HTML formats

### Report Locations
- `test-results/` - Raw test execution results
- `test-reports/` - Formatted test reports
- `coverage/` - Code coverage reports
- `performance-reports/` - Load test reports

## 🔄 CI/CD Integration

### GitHub Actions Workflow
```yaml
name: NeuraMaint Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: neuramaint_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.10'
        
    - name: Install backend dependencies
      run: |
        cd backend
        npm ci
        
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci
        
    - name: Install ML service dependencies
      run: |
        cd ml-service
        pip install -r requirements.txt
        
    - name: Run backend tests
      run: |
        cd backend
        npm run test:coverage
        
    - name: Run frontend tests
      run: |
        cd frontend
        npm run test:coverage
        
    - name: Run ML service tests
      run: |
        cd ml-service
        python -m pytest test_ml_service.py -v
        
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
```

## 📈 Monitoring and Metrics

### Test Execution Metrics
- **Test Execution Time**: Track test suite duration
- **Pass/Fail Rates**: Monitor test stability
- **Coverage Trends**: Track code coverage over time
- **Performance Benchmarks**: API response times

### Infrastructure Metrics
- **Container Resource Usage**: CPU, memory, disk
- **Database Performance**: Query execution times
- **Network Latency**: Service-to-service communication
- **Error Rates**: Application and infrastructure errors

## 🛠️ Maintenance and Updates

### Regular Maintenance Tasks
1. **Dependency Updates**: Weekly security scans
2. **Test Data Refresh**: Monthly data regeneration
3. **Environment Cleanup**: Daily log rotation
4. **Performance Tuning**: Quarterly optimization

### Update Procedures
1. **Tool Version Updates**: 
   - Update Docker images
   - Update package dependencies
   - Validate compatibility

2. **Infrastructure Changes**:
   - Update Docker Compose files
   - Modify environment variables
   - Test configuration changes

3. **Test Suite Updates**:
   - Add new test cases
   - Remove deprecated tests
   - Update test data

## 📚 Documentation

### Test Documentation
- **Test Plans**: COMPREHENSIVE_TESTING_PLAN.md
- **Test Cases**: DETAILED_TEST_CASES.md
- **Traceability**: TRACEABILITY_MATRIX.md
- **Test Reports**: COMPREHENSIVE_TEST_REPORT.md

### Infrastructure Documentation
- **Setup Guide**: This document
- **Troubleshooting**: TESTING_TROUBLESHOOTING.md
- **Best Practices**: TESTING_BEST_PRACTICES.md

## 🆘 Support and Troubleshooting

### Common Issues

1. **Container Startup Failures**
   ```bash
   # Check container logs
   docker-compose -f docker-compose.test.yml logs <service-name>
   
   # Restart specific service
   docker-compose -f docker-compose.test.yml restart <service-name>
   ```

2. **Database Connection Issues**
   ```bash
   # Check database connectivity
   docker-compose -f docker-compose.test.yml exec postgres-test pg_isready
   
   # View database logs
   docker-compose -f docker-compose.test.yml logs postgres-test
   ```

3. **Test Execution Failures**
   ```bash
   # Run tests with verbose output
   docker-compose -f docker-compose.test.yml run test-runner bash
   # Then execute specific test scripts with debug flags
   ```

### Contact Support
- **Team**: NeuraMaint QA Team
- **Email**: qa@neuramaint.com
- **Slack**: #testing-channel

## 📅 Future Enhancements

### Planned Improvements
1. **Automated Test Generation**: AI-driven test case creation
2. **Chaos Engineering**: Integration with chaos testing tools
3. **Advanced Monitoring**: Real-time test execution dashboards
4. **Cross-platform Testing**: Mobile and desktop testing environments
5. **AI-assisted Debugging**: Automated defect root cause analysis

## 📝 Conclusion

This testing infrastructure provides a comprehensive, isolated environment for validating all aspects of the NeuraMaint system. The Docker-based approach ensures consistency across different development and CI/CD environments while maintaining scalability and reliability.