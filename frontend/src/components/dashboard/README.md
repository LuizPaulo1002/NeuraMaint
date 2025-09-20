# NeuraMaint Dashboard

## Overview
The NeuraMaint dashboard provides real-time monitoring of industrial equipment with RAG (Red, Amber, Green) status indicators, time series charts, and alert management.

## Features

### 1. RAG Status Indicators
- **Green**: Failure probability < 30% (Normal operation)
- **Amber**: Failure probability 30-70% (Warning - needs attention)
- **Red**: Failure probability > 70% (Critical - requires immediate action)

### 2. Real-time Charts
- Time series visualization of sensor data (temperature, vibration, pressure)
- Shows last 5 minutes of data
- Auto-refreshes every 10 seconds
- Interactive tooltips with precise values

### 3. Alert Management
- Displays pending alerts with priority levels
- High priority alerts (red) for probabilities > 90%
- Medium priority alerts (amber) for probabilities 70-90%
- One-click alert resolution for technicians
- Real-time updates when alerts are resolved

### 4. Auto-refresh
- Configurable auto-refresh every 10 seconds
- Toggle button to enable/disable auto-refresh
- Manual refresh capability
- Last update timestamp display

## Components

### RAGStatus.tsx
- `RAGStatus`: Main status indicator component
- `PumpRAGList`: Grouped list of pumps by status
- `RAGStatusCard`: Large status card for detailed view
- `RAGDot`: Compact status indicator

### TimeSeriesChart.tsx
- `TimeSeriesChart`: Main chart component with Chart.js
- `MiniTimeSeriesChart`: Compact chart for smaller displays
- Supports temperature, vibration, and pressure data
- Configurable time range (default: 5 minutes)

### AlertsList.tsx
- `AlertsList`: Main alerts management component
- Priority-based styling and icons
- Time-ago display for alert timestamps
- Resolve button with loading states
- Empty state when no alerts

### DashboardService.ts
- API service for dashboard data
- SWR integration for real-time updates
- Error handling and fallback data
- ML service integration for failure predictions

## API Endpoints

The dashboard expects the following API endpoints:

```
GET /api/dashboard/stats - Dashboard statistics
GET /api/bombas - List of pumps
GET /api/leituras/timeseries?minutes=5 - Time series data
GET /api/alertas?status=pendente - Pending alerts
PUT /api/alertas/:id/resolve - Resolve alert
POST /api/predicoes - ML prediction (ML service)
```

## Data Flow

1. **SWR** fetches data every 10 seconds
2. **Dashboard Service** handles API calls and fallbacks
3. **ML Service** provides failure probability predictions
4. **Components** render data with real-time updates
5. **User actions** (resolve alerts) trigger data mutations

## Business Rules

1. **RAG Classification**:
   - Green: < 30% failure probability
   - Amber: 30-70% failure probability  
   - Red: > 70% failure probability

2. **Alert Creation**:
   - Alerts created when probability > 70%
   - High priority when probability > 90%

3. **Data Refresh**:
   - Charts show last 5 minutes of data
   - Auto-refresh every 10 seconds
   - Real-time updates via SWR

4. **Access Control**:
   - Alert resolution restricted to technicians
   - Dashboard viewing available to all authenticated users

## Usage

```tsx
import DashboardPage from '@/app/dashboard/page';

// The dashboard is automatically rendered at /dashboard
// All data fetching and real-time updates are handled internally
```

## Error Handling

- Graceful fallbacks when API services are unavailable
- Mock data for development and testing
- Toast notifications for user actions
- Loading states for all data operations
- Error boundaries for component failures

## Testing

Run the dashboard tests:

```bash
cd frontend
npm test Dashboard.test.tsx
```

## Performance

- SWR caching reduces unnecessary API calls
- Chart.js optimized for real-time updates
- Lazy loading of chart data
- Efficient re-rendering with React optimizations