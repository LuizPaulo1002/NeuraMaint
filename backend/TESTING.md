# NeuraMaint - Unit Tests Implementation

## 📋 Overview

This implementation provides comprehensive unit tests for the critical services of the NeuraMaint industrial maintenance system, covering authentication, user management, and pump management with business rule validation.

## 🧪 Test Coverage

### Critical Services Tested

1. **UserService** (`user.service.test.ts`)
   - ✅ Email and password validation
   - ✅ User registration and login flows
   - ✅ Role-based access control (admin, tecnico, gestor)
   - ✅ Password strength validation
   - ✅ User CRUD operations with permissions

2. **AuthService** (`auth.service.test.ts`) 
   - ✅ JWT token generation and validation
   - ✅ Login success and failure scenarios
   - ✅ Registration with email uniqueness checks
   - ✅ Token refresh functionality
   - ✅ Permission checking utilities

3. **PumpService** (`pump.service.test.ts`)
   - ✅ Pump creation with admin-only access
   - ✅ Pump validation (name, location, manufacturing year)
   - ✅ Role-based pump viewing (technicians see only assigned pumps)
   - ✅ Pump status and date validation
   - ✅ Input sanitization and XSS prevention

## 🎯 Business Rules Tested

- **Admin-only operations**: Pump creation, user management, equipment management
- **Technician permissions**: Dashboard access, alert resolution, assigned pumps only
- **Manager permissions**: Dashboard access, reports, user filtering
- **Data validation**: Email format, password strength, sequential characters prevention
- **Security**: Input sanitization, role-based authorization, inactive user checks

## 🚀 Running Tests

### Prerequisites
```bash
cd backend
npm install
```

### Test Commands
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Use custom test runner
node scripts/test-runner.mjs
```

## 📊 Coverage Requirements

- **Global Coverage**: >60% (branches, functions, lines, statements)
- **Critical Services**: >70% (user, auth, pump services)
- **Test Environment**: Node.js with Jest and ts-jest
- **Mocking**: Prisma Client, JWT, bcryptjs, external APIs

## 🔧 Configuration

### Jest Setup (`jest.config.ts`)
- TypeScript support via ts-jest
- Prisma Client mocking
- Coverage thresholds enforcement
- Test environment: Node.js

### Test Structure
```
backend/src/services/__tests__/
├── user.service.test.ts
├── auth.service.test.ts
└── pump.service.test.ts

backend/src/__tests__/
└── setup.ts (global test configuration)
```

## 🧩 Mock Configuration

### Prisma Client
- All database operations mocked
- User, Pump, Alert, Reading models covered
- Transaction support mocked

### External Dependencies
- JWT: Token signing/verification mocked
- bcryptjs: Password hashing mocked
- Axios: HTTP requests mocked

## ✅ Test Scenarios Covered

### Success Cases
- Valid user registration and login
- Successful pump creation by admin
- Proper role-based access control
- Valid data validation passes

### Error Cases
- Invalid email formats
- Weak passwords
- Unauthorized access attempts
- Duplicate pump names
- Invalid manufacturing years
- Future installation dates

### Edge Cases
- Empty/null inputs
- XSS injection attempts
- SQL injection prevention
- Inactive user handling
- Token expiration scenarios

## 🔍 Validation Rules Tested

### Password Validation
- Minimum 8 characters
- Must contain letters and numbers
- No sequential characters (123, abc)
- No common weak passwords
- Maximum 128 characters

### Pump Validation
- Required fields: name, location
- Manufacturing year: 1900-current year
- Installation date: not in future
- Status: "ativo" or "inativo" only
- Name uniqueness enforcement

### Email Validation
- Valid email format (RFC compliant)
- Maximum 255 characters
- Domain restrictions (if configured)

## 🛡️ Security Testing

- Input sanitization validation
- Role-based authorization checks
- Token validation and expiration
- Password strength enforcement
- XSS prevention verification
- SQL injection protection

## 📈 Performance Considerations

- Tests run in isolated environments
- Mocked database operations for speed
- Parallel test execution when possible
- Memory cleanup between tests
- Fast feedback loop for developers

## 🔄 Continuous Integration

Tests are designed to run in CI/CD pipelines with:
- Automated coverage reporting
- Failure notifications
- Performance benchmarks
- Security vulnerability scanning

## 📝 Test Maintenance

- Regular updates for new business rules
- Mock data aligned with production schemas
- Coverage threshold adjustments as needed
- Test performance optimization
- Documentation updates for new scenarios

This comprehensive test suite ensures the reliability, security, and correctness of NeuraMaint's critical business logic while maintaining development velocity and code quality.