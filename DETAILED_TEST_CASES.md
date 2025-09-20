# NeuraMaint Detailed Test Cases

## 🧪 Test Case Repository

This document contains detailed test cases for all critical components of the NeuraMaint system, following the 4-level testing approach.

## 1. Authentication System Test Cases

### TC-AUTH-001: Successful User Login
**Test Type:** Unit Test  
**Priority:** High  
**Preconditions:** 
- Valid user account exists in database
- User account is active
- System is running

**Test Steps:**
1. Send POST request to `/api/auth/login` with valid email and password
2. Verify response status is 200
3. Verify response contains user data and token
4. Verify token is stored in HTTPOnly cookie
5. Verify user is redirected to dashboard

**Expected Results:**
- HTTP 200 OK response
- User data in response body
- JWT token in HTTPOnly cookie
- Redirect to dashboard page

**Post-conditions:**
- User session is active
- User can access protected routes

### TC-AUTH-002: Failed Login with Invalid Credentials
**Test Type:** Unit Test  
**Priority:** High  
**Preconditions:** 
- System is running
- No valid credentials provided

**Test Steps:**
1. Send POST request to `/api/auth/login` with invalid email
2. Verify response status is 401
3. Send POST request to `/api/auth/login` with invalid password
4. Verify response status is 401

**Expected Results:**
- HTTP 401 Unauthorized response
- Error message: "Invalid email or password"
- No token generated
- No session created

### TC-AUTH-003: Token Expiration Handling
**Test Type:** Unit Test  
**Priority:** High  
**Preconditions:** 
- Valid user is logged in
- JWT token is generated with 1-hour expiration

**Test Steps:**
1. Log in with valid credentials
2. Wait for token to expire (1 hour)
3. Attempt to access protected route
4. Verify response status

**Expected Results:**
- HTTP 401 Unauthorized response after token expiration
- Error message: "Token expired"
- Redirect to login page

### TC-AUTH-004: Role-based Access Control - Admin
**Test Type:** Integration Test  
**Priority:** High  
**Preconditions:** 
- Admin user account exists
- Regular user account exists

**Test Steps:**
1. Log in as admin user
2. Attempt to access admin-only endpoints
3. Attempt to access manager endpoints
4. Attempt to access technician endpoints
5. Log in as regular user
6. Attempt to access admin-only endpoints

**Expected Results:**
- Admin can access all endpoints
- Regular user cannot access admin-only endpoints (403 Forbidden)

## 2. Dashboard System Test Cases

### TC-DASH-001: Real-time Data Visualization
**Test Type:** Integration Test  
**Priority:** High  
**Preconditions:** 
- User is authenticated
- Sensors are sending data
- Dashboard is loaded

**Test Steps:**
1. Load dashboard page
2. Verify real-time charts display
3. Send new sensor data
4. Verify charts update automatically
5. Check RAG status indicators

**Expected Results:**
- Charts display without errors
- Data updates in real-time
- RAG indicators change based on values
- No UI blocking during updates

### TC-DASH-002: Alert Notification System
**Test Type:** Integration Test  
**Priority:** High  
**Preconditions:** 
- User is authenticated
- ML service is running
- High probability sensor reading is generated

**Test Steps:**
1. Generate sensor reading with >70% failure probability
2. Verify alert is created in database
3. Verify visual notification appears on dashboard
4. Verify audio notification plays
5. Verify alert appears in alert list

**Expected Results:**
- Alert created successfully
- Visual notification displayed
- Audio notification played
- Alert listed in alerts section

## 3. Equipment Management Test Cases

### TC-EQUIP-001: Create New Equipment
**Test Type:** Integration Test  
**Priority:** High  
**Preconditions:** 
- Admin user is authenticated
- Valid equipment data is prepared

**Test Steps:**
1. Send POST request to `/api/bombas` with valid equipment data
2. Verify response status is 201
3. Verify equipment is stored in database
4. Verify equipment appears in equipment list

**Expected Results:**
- HTTP 201 Created response
- Equipment data stored correctly
- Equipment appears in listings
- Associated sensors created

### TC-EQUIP-002: Update Equipment Information
**Test Type:** Integration Test  
**Priority:** High  
**Preconditions:** 
- Admin user is authenticated
- Equipment exists in database

**Test Steps:**
1. Send PUT request to `/api/bombas/{id}` with updated data
2. Verify response status is 200
3. Verify equipment data is updated in database
4. Verify changes appear in equipment list

**Expected Results:**
- HTTP 200 OK response
- Equipment data updated correctly
- Changes visible in listings
- No data loss

### TC-EQUIP-003: Technician Equipment Assignment
**Test Type:** Integration Test  
**Priority:** Medium  
**Preconditions:** 
- Admin user is authenticated
- Technician user exists
- Equipment exists

**Test Steps:**
1. Assign equipment to technician via API
2. Log in as technician
3. Verify technician can see assigned equipment
4. Verify technician cannot see unassigned equipment

**Expected Results:**
- Equipment assigned successfully
- Technician sees only assigned equipment
- Technician cannot access unassigned equipment
- Proper access control enforced

## 4. ML Service Test Cases

### TC-ML-001: Failure Prediction Accuracy
**Test Type:** Unit Test  
**Priority:** High  
**Preconditions:** 
- ML service is running
- Test dataset is available
- Prediction endpoint is accessible

**Test Steps:**
1. Send normal sensor reading to ML service
2. Verify prediction probability < 70%
3. Send abnormal sensor reading to ML service
4. Verify prediction probability > 70%
5. Validate prediction format

**Expected Results:**
- Normal readings return < 70% probability
- Abnormal readings return > 70% probability
- Response follows expected format
- Response time < 2 seconds

### TC-ML-002: Service Unavailability Handling
**Test Type:** Integration Test  
**Priority:** High  
**Preconditions:** 
- ML service is stopped
- Backend service is running
- Sensor reading is generated

**Test Steps:**
1. Stop ML service
2. Generate sensor reading
3. Verify system handles ML service unavailability
4. Check fallback mechanism
5. Restart ML service
6. Verify normal operation resumes

**Expected Results:**
- System continues to operate
- Fallback mechanism activated
- No data loss
- Normal operation resumes when service is available

## 5. Alert System Test Cases

### TC-ALERT-001: Alert Generation from ML Predictions
**Test Type:** Integration Test  
**Priority:** High  
**Preconditions:** 
- ML service is running
- Equipment with sensors exists
- User is authenticated

**Test Steps:**
1. Generate high probability sensor reading
2. Verify ML service returns > 70% probability
3. Verify alert is created automatically
4. Verify alert contains correct information
5. Verify alert is assigned proper priority

**Expected Results:**
- Alert created when probability > 70%
- Alert contains accurate sensor data
- Alert priority set correctly
- Alert appears in dashboard notifications

### TC-ALERT-002: Alert Resolution Workflow
**Test Type:** Integration Test  
**Priority:** High  
**Preconditions:** 
- Active alert exists
- Technician user is authenticated
- Technician has permission to resolve alert

**Test Steps:**
1. Technician accesses alert
2. Technician marks alert as resolved
3. Provide resolution notes
4. Submit resolution
5. Verify alert status updated
6. Verify resolution time logged

**Expected Results:**
- Alert status changes to "resolved"
- Resolution notes stored
- Resolution time calculated and stored
- Alert removed from active alerts list

## 6. Reading Processing Test Cases

### TC-READ-001: Sensor Reading Validation
**Test Type:** Unit Test  
**Priority:** High  
**Preconditions:** 
- Sensor reading service is available
- Test data includes valid and invalid readings

**Test Steps:**
1. Send valid sensor reading
2. Verify reading is accepted
3. Send invalid sensor reading (out of range)
4. Verify reading is rejected
5. Send malformed data
6. Verify proper error response

**Expected Results:**
- Valid readings accepted and processed
- Invalid readings rejected with proper error
- Malformed data handled gracefully
- Error messages are descriptive

### TC-READ-002: Historical Data Analysis
**Test Type:** Integration Test  
**Priority:** Medium  
**Preconditions:** 
- Historical sensor data exists
- User is authenticated
- Analysis endpoints are available

**Test Steps:**
1. Request historical data for sensor
2. Verify data is returned in correct format
3. Verify statistical calculations are accurate
4. Verify data aggregation works correctly
5. Test with different time ranges

**Expected Results:**
- Historical data returned correctly
- Statistical calculations accurate
- Data aggregation functions properly
- Performance acceptable with large datasets

## 7. Security Test Cases

### TC-SEC-001: SQL Injection Prevention
**Test Type:** Security Test  
**Priority:** High  
**Preconditions:** 
- System is running
- Database is connected
- Input fields are accessible

**Test Steps:**
1. Submit SQL injection payloads in form fields
2. Submit SQL injection payloads in API requests
3. Monitor database for unauthorized access
4. Verify inputs are properly sanitized

**Expected Results:**
- SQL injection attempts blocked
- No unauthorized database access
- Inputs properly sanitized
- Error responses do not expose system information

### TC-SEC-002: Cross-Site Scripting (XSS) Prevention
**Test Type:** Security Test  
**Priority:** High  
**Preconditions:** 
- System is running
- Input forms are accessible
- Output display areas exist

**Test Steps:**
1. Submit XSS payloads in form fields
2. Submit XSS payloads via API
3. Check if scripts execute in browser
4. Verify output is properly encoded

**Expected Results:**
- XSS payloads do not execute
- Output properly HTML encoded
- No script execution in browser
- Content Security Policy enforced

## 8. Performance Test Cases

### TC-PERF-001: API Response Time
**Test Type:** Performance Test  
**Priority:** High  
**Preconditions:** 
- System is running under normal load
- Test endpoints are identified
- Performance monitoring tools are ready

**Test Steps:**
1. Send requests to critical API endpoints
2. Measure response times
3. Repeat under various load conditions
4. Compare against performance benchmarks

**Expected Results:**
- Response times < 3 seconds for 95% of requests
- Consistent performance under normal load
- Graceful degradation under high load
- No timeouts or errors

### TC-PERF-002: Concurrent User Support
**Test Type:** Performance Test  
**Priority:** High  
**Preconditions:** 
- Load testing tools are configured
- System resources are monitored
- Test scenarios are defined

**Test Steps:**
1. Simulate 500 concurrent users
2. Monitor system resources
3. Measure response times
4. Check for errors or timeouts
5. Verify data consistency

**Expected Results:**
- System supports 500 concurrent users
- Response times remain acceptable
- No data corruption or loss
- Resource usage within limits

## 9. Database Test Cases

### TC-DB-001: Data Integrity
**Test Type:** Database Test  
**Priority:** High  
**Preconditions:** 
- Database is connected
- CRUD operations are available
- Test data is prepared

**Test Steps:**
1. Perform create operations
2. Verify data is stored correctly
3. Perform read operations
4. Verify data integrity
5. Perform update operations
6. Verify changes are applied
7. Perform delete operations
8. Verify data is removed

**Expected Results:**
- All CRUD operations succeed
- Data integrity maintained
- No orphaned records
- Foreign key constraints enforced

### TC-DB-002: Query Performance
**Test Type:** Database Test  
**Priority:** Medium  
**Preconditions:** 
- Large dataset is available
- Query performance monitoring tools are ready
- Indexes are configured

**Test Steps:**
1. Execute time-series queries
2. Measure query execution times
3. Test with and without indexes
4. Verify query optimization

**Expected Results:**
- Time-series queries execute quickly
- Indexes improve query performance
- No full table scans for large datasets
- Query execution times within acceptable limits

## 📋 Test Data Requirements

### Authentication Test Data
```json
{
  "validAdmin": {
    "email": "admin@test.com",
    "password": "admin123",
    "role": "admin"
  },
  "validTechnician": {
    "email": "tech@test.com",
    "password": "tech123",
    "role": "tecnico"
  },
  "validManager": {
    "email": "manager@test.com",
    "password": "manager123",
    "role": "gestor"
  },
  "invalidCredentials": {
    "email": "invalid@test.com",
    "password": "wrongpassword"
  }
}
```

### Equipment Test Data
```json
{
  "validPump": {
    "nome": "Test Pump 01",
    "modelo": "TEST-500",
    "localizacao": "Test Location",
    "capacidade": 500,
    "potencia": 15,
    "anoFabricacao": 2023
  },
  "invalidPump": {
    "nome": "",
    "modelo": "TEST-500",
    "localizacao": "Test Location"
  }
}
```

### Sensor Reading Test Data
```json
{
  "normalTemperature": {
    "sensorId": 1,
    "valor": 65.5,
    "timestamp": "2025-08-26T10:00:00Z",
    "tipo_sensor": "temperatura"
  },
  "highTemperature": {
    "sensorId": 1,
    "valor": 95.0,
    "timestamp": "2025-08-26T10:00:00Z",
    "tipo_sensor": "temperatura"
  },
  "normalVibration": {
    "sensorId": 2,
    "valor": 3.2,
    "timestamp": "2025-08-26T10:00:00Z",
    "tipo_sensor": "vibracao"
  },
  "highVibration": {
    "sensorId": 2,
    "valor": 8.5,
    "timestamp": "2025-08-26T10:00:00Z",
    "tipo_sensor": "vibracao"
  }
}
```

## 🧪 Test Environment Configuration

### Backend Test Environment
```env
NODE_ENV=test
DATABASE_URL=sqlite://localhost:./test.db
JWT_SECRET=test-secret-key
JWT_EXPIRES_IN=1h
ML_SERVICE_URL=http://localhost:5000
PORT=3001
```

### Frontend Test Environment
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ML_SERVICE_URL=http://localhost:5000
```

### ML Service Test Environment
```env
FLASK_ENV=testing
DATABASE_URL=sqlite://localhost:./ml_test.db
```

## 📊 Test Execution Reports

### Test Case Execution Template
```markdown
# Test Execution Report: [Test Case ID]

## Execution Details
- **Date**: [Execution Date]
- **Tester**: [Tester Name]
- **Environment**: [Test Environment]
- **Build**: [Build Version]

## Execution Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Actual Results
- [Result 1]
- [Result 2]

## Expected vs Actual
| Expected | Actual | Status |
|----------|--------|--------|
| [Expected Result] | [Actual Result] | [Pass/Fail] |

## Defects Found
- [Defect ID]: [Defect Description]

## Screenshots/Evidence
[Attachments]

## Conclusion
[Pass/Fail]
```

## 🐞 Defect Reporting Template

### Defect Report Template
```markdown
# Defect Report: [Defect ID]

## Defect Details
- **Title**: [Brief Description]
- **Severity**: [Critical/High/Medium/Low]
- **Priority**: [High/Medium/Low]
- **Reported By**: [Reporter Name]
- **Date**: [Report Date]
- **Component**: [Affected Component]
- **Version**: [System Version]

## Description
[Detailed description of the defect]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Result
[What should happen]

## Actual Result
[What actually happens]

## Environment
- **OS**: [Operating System]
- **Browser**: [Browser Version]
- **Device**: [Device Information]

## Screenshots/Attachments
[Attachments]

## Impact
[Business impact of the defect]

## Workaround
[Temporary solution if available]
```

## 📈 Test Metrics Collection

### Key Performance Indicators
1. **Test Coverage**: Percentage of requirements covered by test cases
2. **Defect Detection Rate**: Number of defects found during testing
3. **Test Execution Rate**: Percentage of test cases executed
4. **Defect Resolution Time**: Average time to resolve defects
5. **Performance Benchmarks**: Response times and throughput metrics
6. **Security Compliance**: Number of security vulnerabilities found

### Metrics Dashboard Template
```markdown
# Test Metrics Dashboard

## Overall Status
- **Test Execution Progress**: [Percentage]%
- **Pass Rate**: [Percentage]%
- **Defects Found**: [Number]

## Coverage Metrics
- **Requirements Coverage**: [Percentage]%
- **Code Coverage**: [Percentage]%
- **Test Case Coverage**: [Percentage]%

## Defect Metrics
- **Critical Defects**: [Number]
- **High Severity Defects**: [Number]
- **Medium Severity Defects**: [Number]
- **Low Severity Defects**: [Number]

## Performance Metrics
- **Average Response Time**: [Time]ms
- **95th Percentile**: [Time]ms
- **Throughput**: [Requests]/second
- **Error Rate**: [Percentage]%

## Security Metrics
- **Vulnerabilities Found**: [Number]
- **Critical Vulnerabilities**: [Number]
- **High Risk Issues**: [Number]
```

## 📝 Conclusion

This comprehensive set of test cases ensures thorough validation of all critical components of the NeuraMaint system. Each test case is designed to verify specific functionality while maintaining traceability to system requirements.