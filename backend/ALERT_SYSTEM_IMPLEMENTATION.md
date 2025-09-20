# Alert System Implementation - NeuraMaint

## Overview
The Alert System provides intelligent monitoring and notification capabilities for NeuraMaint's industrial equipment monitoring system. It automatically generates alerts based on ML predictions and allows technicians to manage and resolve them efficiently.

## Architecture

### Core Components

#### 1. Alert Service (`alert.service.ts`)
- **ML Integration**: Automatically processes ML predictions and creates alerts for failure probabilities > 70%
- **Alert Management**: Create, resolve, cancel, and query alerts
- **Permission Control**: Role-based access control for different operations
- **Response Time Tracking**: Calculates and tracks alert resolution times
- **Real-time Notifications**: Event system for frontend notifications

#### 2. Alert Controller (`alert.controller.ts`)
- **HTTP API**: RESTful endpoints for alert management
- **Validation**: Comprehensive input validation and error handling
- **Role Enforcement**: Ensures proper permissions for each operation
- **Statistics**: Performance metrics and alert analytics

#### 3. Alert Routes (`alert.routes.ts`)
- **Route Definitions**: 8 comprehensive API endpoints
- **Middleware Integration**: Authentication, validation, and authorization
- **Parameter Validation**: Express-validator for input sanitization

#### 4. Notification Service (`notification.service.ts`)
- **Frontend Integration**: Real-time notification system
- **Event Management**: Subscribe/unsubscribe to alert events
- **Message Formatting**: Standardized notification format for UI

## Features

### 🤖 **ML-Triggered Alerts**
- **Automatic Generation**: Creates alerts when ML prediction > 70% failure probability
- **Severity Levels**: 
  - `critico` (High/Red) - Failure probability > 90%
  - `atencao` (Medium/Yellow) - Failure probability 70-90%
- **Duplicate Prevention**: Avoids creating similar alerts within 1-hour window
- **Rich Messages**: Contextual alert messages with sensor data and recommendations

### 👷 **Technician Workflow**
- **Resolution Tracking**: Technicians can resolve alerts with action descriptions
- **Response Time**: Automatically calculates time from alert creation to resolution
- **Permissions**: Only technicians and admins can resolve alerts
- **Action Documentation**: Mandatory action description for audit trail

### 📊 **Alert Analytics**
- **Real-time Statistics**: Count of pending, resolved, and critical alerts
- **Performance Metrics**: Average response time and resolution rates
- **Historical Analysis**: Date-range filtering and trend analysis
- **Pump-specific Filtering**: Filter alerts by specific equipment

### 🔒 **Security & Permissions**
- **Role-based Access**:
  - `admin`: Full access (create, resolve, cancel, view all)
  - `tecnico`: Can resolve and view alerts
  - `gestor`: Can view alerts and statistics
- **Input Validation**: Comprehensive validation for all endpoints
- **Authentication**: JWT cookie-based authentication required

## API Endpoints

### Core Alert Management

#### POST `/api/alerts`
Create a new alert (authenticated users)
```json
{
  "bombaId": 1,
  "tipo": "Manual Alert",
  "mensagem": "Alert description",
  "nivel": "atencao",
  "valor": 75.5,
  "threshold": 70.0
}
```

#### PUT `/api/alerts/:id/resolve`
Resolve an alert (technicians only)
```json
{
  "acaoTomada": "Performed calibration and system check. Issue resolved."
}
```

#### GET `/api/alerts/active`
Get active alerts with optional filtering
- Query parameters: `bombaId`, `nivel`
- Returns: Active alerts with summary statistics

#### GET `/api/alerts/history`
Get alert history with filtering
- Query parameters: `bombaId`, `startDate`, `endDate`, `limit`
- Returns: Historical alerts with response times

#### GET `/api/alerts/statistics`
Get alert statistics and performance metrics
- Query parameters: `bombaId`, `days`
- Returns: Comprehensive analytics

#### PUT `/api/alerts/:id/cancel`
Cancel an alert (admin only)

#### GET `/api/alerts/:id`
Get specific alert by ID

#### GET `/api/alerts/health`
Health check for alert service

## ML Integration

### Automatic Alert Generation
The system integrates with the ML service to automatically create alerts:

```typescript
// In reading-processing.service.ts
if (probabilidadeFalha > 70) {
  const alert = await AlertService.processMLPrediction(
    sensorId,
    probabilidadeFalha,
    valor,
    'admin'
  );
}
```

### Alert Level Determination
```typescript
private static determineAlertLevel(probabilidadeFalha: number): AlertLevel {
  if (probabilidadeFalha > 90) {
    return 'critico'; // High priority (red)
  } else if (probabilidadeFalha > 70) {
    return 'atencao'; // Medium priority (yellow)
  } else {
    return 'normal'; // Low priority (green)
  }
}
```

### Message Generation
Intelligent message generation based on sensor type and failure probability:

```typescript
// Example outputs:
"CRÍTICO: Temperatura da bomba Bomba Principal indica falha iminente (95.2%). Valor atual: 98.5. Intervenção imediata necessária."

"ATENÇÃO: Vibração da bomba Bomba Secundária indica risco elevado de falha (78.3%). Valor atual: 6.2. Verificação recomendada."
```

## Database Schema

### Alert Table Structure
```sql
model Alerta {
  id          Int         @id @default(autoincrement())
  tipo        String      // Alert type
  mensagem    String      // Alert message
  nivel       String      // "normal", "atencao", "critico"
  status      String      @default("pendente") // "pendente", "resolvido", "cancelado"
  valor       Float?      // Value that triggered alert
  threshold   Float?      // Threshold that was exceeded
  acaoTomada  String?     // Action taken to resolve
  resolvidoPor Int?       // User who resolved the alert
  resolvidoEm DateTime?   // Resolution timestamp
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  bombaId     Int         // Associated pump
  
  // Relationships
  bomba       Bomba       @relation(fields: [bombaId], references: [id])
  resolvedor  Usuario?    @relation(fields: [resolvidoPor], references: [id])
  
  // Indexes for performance
  @@index([status])
  @@index([nivel])
  @@index([bombaId, status])
}
```

## Frontend Integration

### Real-time Notifications
```typescript
import { frontendNotificationManager } from './notification.service.js';

// Subscribe to notifications
frontendNotificationManager.onAlertNotification((notification) => {
  const displayData = frontendNotificationManager.formatNotificationForDisplay(notification);
  
  showToastNotification({
    title: displayData.title,
    message: displayData.message,
    type: displayData.type,
    icon: displayData.icon,
    duration: displayData.duration
  });
});
```

### Notification Formatting
- **Critical Alerts**: Red color, error sound, no auto-dismiss
- **Warning Alerts**: Yellow color, 8-second duration
- **Normal Alerts**: Blue color, 5-second duration

## Testing

### Comprehensive Test Suite
The alert system includes extensive testing in `test-alert-system.js`:

1. **Basic Functionality**
   - Alert creation and retrieval
   - Resolution workflow
   - Permission enforcement

2. **ML Integration**
   - Automatic alert generation
   - Different failure probability scenarios
   - Alert level determination

3. **Performance Testing**
   - Response time tracking
   - Statistics calculation
   - Date range filtering

4. **Security Testing**
   - Role-based access control
   - Input validation
   - Authentication requirements

### Running Tests
```bash
cd backend
node test-alert-system.js
```

## Performance Considerations

### Database Optimization
- **Indexes**: Strategic indexes on status, nivel, and bombaId fields
- **Query Optimization**: Efficient queries for active alerts and statistics
- **Pagination**: Limited result sets to prevent performance issues

### Memory Management
- **Event Listeners**: Proper cleanup of notification listeners
- **Queue Management**: Efficient notification queue processing
- **Cache Strategy**: No persistent caching to ensure real-time accuracy

### Scalability
- **Async Processing**: Non-blocking ML integration
- **Error Isolation**: Alert failures don't affect core functionality
- **Rate Limiting**: Duplicate alert prevention

## Business Rules

### Alert Creation Rules
1. **ML Threshold**: Only create alerts for failure probability > 70%
2. **Duplicate Prevention**: No similar alerts within 1 hour for same pump/sensor
3. **Severity Mapping**: Automatic level assignment based on probability
4. **Rich Context**: Include sensor data, pump info, and recommendations

### Resolution Rules
1. **Technician Only**: Only technicians and admins can resolve alerts
2. **Action Required**: Mandatory action description for resolution
3. **Time Tracking**: Automatic response time calculation
4. **Audit Trail**: Complete history of who resolved what and when

### Permission Rules
1. **View Access**: All authenticated users can view alerts
2. **Resolve Access**: Technicians and admins only
3. **Cancel Access**: Admins only
4. **Create Access**: All authenticated users (for manual alerts)

## Monitoring and Logging

### Alert Logging
```typescript
console.log(`🚨 Alert created for bomba ${bomba.nome}: ${nivel} level (${probabilidadeFalha}% failure probability)`);
console.log(`✅ Alert ${alertId} resolved by user ${userId} (response time: ${responseTime} minutes)`);
```

### Statistics Tracking
- **Response Times**: Track how quickly alerts are resolved
- **Resolution Rates**: Percentage of alerts successfully resolved
- **Critical Alert Frequency**: Monitor system health trends
- **Performance Metrics**: Average response times and efficiency

## Error Handling

### Robust Error Management
- **ML Service Failures**: Continue operation even if ML predictions fail
- **Database Errors**: Graceful handling of database connectivity issues
- **Validation Errors**: Clear error messages for invalid inputs
- **Permission Errors**: Informative access denied messages

### Fallback Strategies
- **Service Degradation**: System continues without ML if service unavailable
- **Manual Override**: Admins can manually create/manage alerts
- **Error Recovery**: Automatic retry mechanisms for transient failures

## Future Enhancements

### Planned Features
1. **Email/SMS Integration**: External notification channels
2. **Alert Escalation**: Automatic escalation for unresolved critical alerts
3. **Machine Learning**: Learn from resolution patterns
4. **Mobile Push Notifications**: Native mobile app integration
5. **Alert Templates**: Predefined alert templates for common scenarios

### Scalability Improvements
1. **Message Queue**: Redis/RabbitMQ for high-volume environments
2. **Microservice Architecture**: Separate alert service deployment
3. **Real-time WebSocket**: Live dashboard updates
4. **Alert Aggregation**: Group related alerts intelligently

---

## Summary

The Alert System provides a comprehensive, production-ready solution for intelligent equipment monitoring in NeuraMaint. With ML integration, role-based permissions, real-time notifications, and comprehensive analytics, it delivers the foundation for proactive maintenance management while maintaining system reliability and performance.

Key achievements:
- ✅ **ML-Triggered Alerts**: Automatic alert generation based on failure predictions
- ✅ **Technician Workflow**: Complete resolution workflow with response time tracking  
- ✅ **Role-based Security**: Proper permission enforcement for all operations
- ✅ **Real-time Notifications**: Frontend integration for immediate alert visibility
- ✅ **Performance Analytics**: Comprehensive statistics and trend analysis
- ✅ **Production Ready**: Robust error handling and scalability considerations