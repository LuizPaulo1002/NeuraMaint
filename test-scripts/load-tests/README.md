# NeuraMaint Load Testing Suite

This directory contains load test configurations for the NeuraMaint system using Artillery.

## Prerequisites

1. Install Node.js (version 14 or higher)
2. Install Artillery globally:
   ```bash
   npm install -g artillery
   ```

## Load Test Configurations

### 1. Authentication Load Tests (`auth-load-test.yml`)
- Tests user login and registration endpoints
- Simulates typical authentication workflows
- Tests token-based authentication

### 2. Dashboard Load Tests (`dashboard-load-test.yml`)
- Tests dashboard overview and statistics endpoints
- Simulates user accessing dashboard data
- Tests various dashboard API endpoints

### 3. Equipment Load Tests (`equipment-load-test.yml`)
- Tests equipment/pump management endpoints
- Simulates CRUD operations on equipment
- Tests listing, creating, updating equipment

### 4. Sensor Readings Load Tests (`sensor-readings-load-test.yml`)
- Tests sensor data submission and retrieval
- Simulates IoT sensor data flow
- Tests reading history and statistics

### 5. Alerts Load Tests (`alerts-load-test.yml`)
- Tests alert management endpoints
- Simulates alert creation, resolution, and querying
- Tests alert history and statistics

## Running Load Tests

### On Linux/Mac:
```bash
# Make the script executable
chmod +x run-load-tests.sh

# Run all load tests
./run-load-tests.sh
```

### On Windows:
```cmd
# Run all load tests
run-load-tests.bat
```

### Running Individual Tests:
```bash
# Run a specific test
artillery run load-tests/auth-load-test.yml

# Run with custom output
artillery run load-tests/dashboard-load-test.yml --output report.json

# Generate HTML report from JSON output
artillery report report.json --output report.html
```

## Test Scenarios

Each test configuration includes multiple scenarios that simulate real user workflows:

1. **User Authentication**: Login, registration, token validation
2. **Dashboard Access**: Overview data, alerts, readings, equipment status
3. **Equipment Management**: List, create, update, view equipment
4. **Sensor Data Flow**: Submit readings, retrieve latest data, get history
5. **Alert Handling**: View active alerts, resolve alerts, get statistics

## Load Patterns

All tests follow a standard load pattern:
1. **Ramp-up Phase**: Gradually increase load to simulate real traffic
2. **Sustained Load Phase**: Maintain consistent load for measurement
3. **Ramp-down Phase**: Gradually decrease load to clean up

## Results

Test results are saved in the `results` directory:
- JSON reports for detailed analysis
- HTML reports for visual inspection
- Metrics include response times, throughput, error rates

## Customization

You can customize the load tests by modifying:
- Target URLs in the `config.target` section
- Load patterns in the `config.phases` section
- Test data in the scenario flows
- Headers and authentication methods