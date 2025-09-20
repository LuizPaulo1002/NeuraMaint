# Enhanced Pump Details System

## Overview
The Enhanced Pump Details system provides comprehensive real-time monitoring of individual pumps with RAG status indicators, sensor charts, alert management, and technician-specific functionality.

## Features

### 1. Real-time Monitoring
- **Auto-refresh**: Data updates every 10 seconds
- **RAG Status**: Visual failure probability indicators
- **Live Sensor Data**: Current readings with 30-minute history
- **Status Indicators**: Color-coded system health

### 2. Sensor Visualization
- **Individual Sensor Cards**: Temperature, Vibration, Pressure
- **Real-time Charts**: Last 30 minutes of sensor data
- **Statistics Display**: Min, Max, Average values
- **Status Classification**: Normal/Warning/Critical thresholds

### 3. Alert Management
- **Active Alerts**: Pending alerts requiring attention
- **Alert History**: Recent alert timeline
- **Technician Controls**: Alert resolution for technicians
- **Priority Levels**: High/Medium/Low with visual indicators

### 4. Access Control
- **Role-based Access**: Admin and Technician roles
- **Alert Resolution**: Technicians can resolve alerts
- **Admin Controls**: Additional edit/delete permissions

## Components

### Core Components

#### `SensorCard.tsx`
```tsx
interface SensorCardProps {
  sensorType: 'temperatura' | 'vibracao' | 'pressao';
  data: SensorData[];
  currentValue?: number;
  unit?: string;
  status?: 'normal' | 'warning' | 'critical';
  showChart?: boolean;
}
```

**Features:**
- Sensor-specific icons and colors
- Statistical calculations (min/max/avg)
- Integrated time series charts
- Status-based styling
- Custom units support

#### Enhanced Equipment Service
```tsx
interface PumpDetails extends Pump {
  sensors?: {
    temperatura: SensorReading[];
    vibracao: SensorReading[];
    pressao: SensorReading[];
  };
  alerts?: Alert[];
  currentReadings?: {
    temperatura?: number;
    vibracao?: number; 
    pressao?: number;
  };
  failureProbability?: number;
}
```

**New Methods:**
- `getPumpDetails()` - Complete pump information
- `getPumpSensorData()` - Historical sensor data
- `getCurrentSensorReadings()` - Latest values
- `getPumpAlerts()` - Pump-specific alerts
- `resolveAlert()` - Technician alert resolution

### Pages

#### `/equipment/[id]/details/page.tsx`
**Main enhanced pump details view featuring:**
- Real-time pump status with RAG indicators
- Three sensor cards with live data and charts
- Active alerts section with resolution controls
- Alert history timeline
- Auto-refresh functionality
- Role-based UI elements

## Business Rules

### 1. Sensor Thresholds
```typescript
const thresholds = {
  temperatura: { warning: 60°C, critical: 80°C },
  vibracao: { warning: 3.5mm/s, critical: 5mm/s },
  pressao: { warning: 8bar, critical: 10bar }
};
```

### 2. Access Control
- **Admins**: Full access including edit/delete
- **Technicians**: View and resolve alerts
- **Other roles**: Redirected to appropriate pages

### 3. Alert Resolution
- Only technicians and admins can resolve alerts
- Confirmation toast on successful resolution
- Real-time data refresh after resolution
- Alert status updates immediately

### 4. Data Refresh
- 10-second auto-refresh for real-time monitoring
- 30-minute historical data display
- SWR caching for efficient data management
- Background updates without disruption

## API Integration

### Expected Endpoints
```
GET /api/bombas/{id}/sensors?minutes=30    - Historical sensor data
GET /api/bombas/{id}/sensors/current       - Current readings
GET /api/bombas/{id}/alerts               - Pump alerts
PUT /api/alerts/{id}/resolve              - Resolve alert
```

### Data Structures

#### Sensor Reading
```typescript
interface SensorReading {
  id: number;
  sensor_id: number;
  valor: number;
  timestamp: string;
  tipo_sensor: 'temperatura' | 'vibracao' | 'pressao';
  bomba_id: number;
}
```

#### Alert
```typescript
interface Alert {
  id: number;
  bomba_id: number;
  tipo: string;
  nivel: 'baixo' | 'medio' | 'alto';
  status: 'pendente' | 'resolvido' | 'cancelado';
  descricao: string;
  timestamp: string;
  resolvedAt?: string;
  resolvedBy?: number;
}
```

## Usage Examples

### Accessing Pump Details
```tsx
// Navigate from equipment list
router.push(`/equipment/${pumpId}/details`);

// Direct access (role-protected)
<ProtectedRoute requireAnyRole={['admin', 'tecnico']}>
  <PumpDetailsPage />
</ProtectedRoute>
```

### Sensor Card Implementation
```tsx
<SensorCard
  sensorType="temperatura"
  data={temperatureReadings}
  currentValue={currentTemp}
  status={getSensorStatus(currentTemp, 'temperatura')}
/>
```

### Alert Resolution
```tsx
const handleResolveAlert = async (alertId: number) => {
  await equipmentService.resolveAlert(alertId);
  toast.success('Alert resolved successfully');
  mutate(); // Refresh data
};
```

## Error Handling

### Client-Side
- Loading states during data fetch
- Error boundaries for component failures
- Graceful fallbacks when API unavailable
- User-friendly error messages

### Fallback Data
- Mock sensor data for development
- Simulated alerts and readings
- Realistic data patterns for testing
- Proper error state handling

## Performance Optimizations

### Data Management
- SWR caching and background revalidation
- Efficient re-rendering with React optimization
- Debounced updates for smooth UX
- Selective data refreshing

### Chart Performance
- Optimized Chart.js configuration
- Limited data points (30 minutes)
- Efficient update strategies
- Memory leak prevention

## Security Features

### Authentication
- Role-based route protection
- HTTPOnly cookie authentication
- Automatic session validation
- Secure alert resolution

### Input Validation
- Client-side validation for all inputs
- Server-side validation expected
- XSS protection through proper escaping
- CSRF protection via cookies

## Testing

### Component Tests
```bash
npm test SensorCard.test.tsx
```

**Coverage includes:**
- Sensor card rendering
- Status calculations
- Chart integration
- Error states
- User interactions

### Integration Tests
- End-to-end pump details flow
- Alert resolution workflow
- Real-time data updates
- Role-based access control

## Deployment Considerations

### Environment Variables
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Performance Requirements
- Real-time updates without performance impact
- Efficient chart rendering
- Responsive design for all devices
- Fast initial page load

### Monitoring
- Error tracking for API failures
- Performance monitoring for chart rendering
- User interaction analytics
- Alert resolution metrics

## Future Enhancements

### Planned Features
- Maintenance history integration
- Predictive analytics dashboard
- Custom alert thresholds
- Export functionality
- Mobile app integration

### Technical Improvements
- WebSocket real-time updates
- Advanced chart interactions
- Offline data caching
- Push notifications