# ML Service Integration - NeuraMaint

## Overview
The ML Service integration provides intelligent failure prediction capabilities for NeuraMaint's industrial equipment monitoring system. It integrates seamlessly with the backend to analyze sensor data and predict potential equipment failures.

## Architecture

### ML Service (`ml.service.ts`)
- **Singleton Pattern**: Ensures consistent configuration and connection management
- **Railway Integration**: Configured for Railway deployment with fallback to local development
- **Intelligent Caching**: 5-minute TTL cache to reduce redundant API calls
- **Error Handling**: Comprehensive timeout and failure handling with fallback predictions
- **Type Safety**: Full TypeScript integration with proper type definitions

### Core Features

#### 1. Failure Prediction
```typescript
const probability = await mlService.predictFailure({
  sensor_id: 1,
  valor: 75.5,
  timestamp: new Date().toISOString(),
  tipo_sensor: 'temperatura'
});
```

#### 2. Detailed Predictions
```typescript
const details = await mlService.getPredictionDetails(sensorData);
// Returns: probabilidade_falha, risco, recomendacao, confianca
```

#### 3. Health Monitoring
```typescript
const isHealthy = await mlService.healthCheck();
```

## Configuration

### Environment Variables
```env
# ML Service URL (Railway deployment)
ML_SERVICE_URL=https://neuramaint-ml.railway.app
```

### Service Configuration
- **Timeout**: 2 seconds (as required)
- **Cache TTL**: 5 minutes
- **Retry Logic**: Built-in axios retry with exponential backoff
- **Base URL**: Railway production URL with localhost fallback

## API Integration

### ML Service Endpoints
The service communicates with the following Railway endpoints:

#### POST /api/predicoes
**Request Format:**
```json
{
  "sensor_id": 1,
  "valor": 75.5,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "tipo_sensor": "temperatura"
}
```

**Response Format:**
```json
{
  "sensor_id": 1,
  "probabilidade_falha": 85.2,
  "risco": "alto",
  "recomendacao": "Verificar sistema de refrigeração imediatamente",
  "confianca": 92.5,
  "timestamp_predicao": "2024-01-15T10:30:05.000Z"
}
```

#### GET /health
Simple health check endpoint returning 200 OK when service is available.

## Integration Points

### 1. Reading Processing Service
Automatically calls ML service when new readings are processed:

```typescript
// In reading-processing.service.ts
this.processWithMLService(readingWithSensor).catch(error => {
  console.error('ML Service call failed:', error);
});
```

### 2. Simulator Service
Integrates ML predictions for enhanced simulation realism:

```typescript
// In simulator.service.ts
this.processWithMLService(reading).catch(error => {
  // ML processing doesn't affect main simulation
});
```

## Error Handling

### Timeout Management
- **Connection Timeout**: 2 seconds (strict requirement)
- **Request Timeout**: 2 seconds total processing time
- **Retry Strategy**: No automatic retries to maintain strict timeout

### Fallback Strategies
When ML service is unavailable, the system provides intelligent fallbacks:

```typescript
private getDefaultPrediction(sensorData: SensorData): number {
  // Returns conservative prediction based on sensor type and value
  // temperatura > 75°C = 85% failure risk
  // vibracao > 4.5mm/s = 60% failure risk
  // etc.
}
```

### Error Types
- `TIMEOUT`: Request exceeded 2-second limit
- `SERVICE_UNAVAILABLE`: ML service returned 502/503
- `INVALID_RESPONSE`: Malformed or invalid ML response
- `NETWORK_ERROR`: Network connectivity issues

## Caching Strategy

### Cache Key Generation
```typescript
private generateCacheKey(sensorData: SensorData): string {
  const timeWindow = Math.floor(Date.now() / (5 * 60 * 1000)) * (5 * 60 * 1000);
  const valorRange = Math.floor(sensorData.valor / 10) * 10;
  return `${sensorData.sensor_id}_${valorRange}_${timeWindow}`;
}
```

### Cache Management
- **TTL**: 5 minutes per entry
- **Cleanup**: Automatic cleanup every 100 cache operations
- **Memory Efficient**: Only stores essential prediction data
- **Manual Control**: `clearCache()` and `getCacheStats()` methods

## Performance Optimization

### Request Optimization
- **Concurrent Requests**: Supports multiple parallel predictions
- **Connection Pooling**: Axios instance with keep-alive
- **Response Compression**: Gzip support for faster transfers

### Memory Management
- **Singleton Pattern**: Single instance across application
- **Cache Limits**: Automatic cleanup prevents memory leaks
- **Weak References**: No circular references in cache entries

## Monitoring and Logging

### Request Logging
```typescript
console.log(`[ML Service] Making request to: ${config.url}`);
console.log(`[ML Service] Received response: ${response.status}`);
```

### Error Logging
```typescript
console.error('[ML Service] Response error:', error.message);
```

### Prediction Logging
```typescript
console.log(`[ML Service] Prediction successful for sensor ${sensorId}: ${probability}%`);
```

## Testing

### Test Coverage
The ML service includes comprehensive tests in `test-ml-service.js`:

1. **Basic Functionality Tests**
   - Health check verification
   - Single sensor predictions
   - Detailed prediction metadata

2. **Performance Tests**
   - Cache hit/miss performance
   - Concurrent request handling
   - Batch prediction processing

3. **Error Handling Tests**
   - Timeout scenarios
   - Invalid input validation
   - Network failure handling

4. **Integration Tests**
   - Reading processing integration
   - Simulator service integration
   - End-to-end workflow testing

### Running Tests
```bash
cd backend
node test-ml-service.js
```

## Production Deployment

### Railway Configuration
The service is pre-configured for Railway deployment:

```typescript
private readonly BASE_URL = process.env.ML_SERVICE_URL || 'https://neuramaint-ml.railway.app';
```

### Security Headers
```typescript
headers: {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'NeuraMaint/1.0.0'
}
```

### Rate Limiting
The service respects Railway's rate limits and includes exponential backoff for failed requests.

## Best Practices

### Usage Patterns
1. **Async Processing**: All ML calls are non-blocking
2. **Error Isolation**: ML failures don't affect core functionality
3. **Graceful Degradation**: Fallback predictions when service unavailable
4. **Cache First**: Check cache before making external requests

### Performance Guidelines
1. **Batch Processing**: Group similar requests when possible
2. **Cache Awareness**: Understand cache key generation for optimal hit rates
3. **Timeout Respect**: Always use 2-second timeout limit
4. **Error Handling**: Always wrap ML calls in try-catch blocks

## Troubleshooting

### Common Issues

#### High Latency
- Check Railway service status
- Verify network connectivity
- Review cache hit rates

#### Prediction Accuracy
- Validate input data ranges
- Check sensor type mapping
- Review historical data quality

#### Memory Usage
- Monitor cache statistics
- Implement periodic cache cleanup
- Check for memory leaks in long-running processes

### Debug Tools
```typescript
// Check cache performance
const stats = mlService.getCacheStats();
console.log('Cache stats:', stats);

// Test service connectivity
const isHealthy = await mlService.healthCheck();
console.log('ML service status:', isHealthy);

// Clear cache if needed
mlService.clearCache();
```

## Future Enhancements

### Planned Features
1. **Batch Prediction API**: Single request for multiple sensors
2. **Prediction History**: Store and analyze prediction accuracy
3. **Custom Models**: Support for equipment-specific ML models
4. **Real-time Alerts**: Integration with alerting system based on predictions

### Scalability Considerations
1. **Load Balancing**: Support multiple ML service instances
2. **Regional Deployment**: Edge deployments for reduced latency
3. **Model Versioning**: Support for A/B testing different ML models
4. **Metrics Collection**: Detailed performance and accuracy metrics

---

## Summary

The ML Service integration provides a robust, production-ready solution for intelligent failure prediction in NeuraMaint. With comprehensive error handling, intelligent caching, and Railway deployment support, it delivers reliable predictive capabilities while maintaining system stability and performance.