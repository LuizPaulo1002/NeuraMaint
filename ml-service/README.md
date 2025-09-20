# NeuraMaint - ML Service

Machine Learning service for predictive maintenance in the NeuraMaint industrial equipment monitoring system.

## Overview

This ML service provides failure prediction capabilities for industrial pumps based on sensor data analysis. It integrates with the main NeuraMaint backend to deliver real-time failure probability assessments.

## Features

- **Failure Prediction**: ML-based prediction of equipment failure probability
- **Multi-sensor Support**: Handles temperatura, vibração, pressão, fluxo, and rotação sensors
- **Railway Deployment**: Optimized for Railway cloud platform
- **Health Monitoring**: Built-in health check endpoints
- **Async Processing**: Threaded request handling for performance
- **Fallback System**: Rule-based predictions when ML model unavailable

## Technology Stack

- **Python 3.10+**
- **Flask 3.0.0** - Web framework
- **scikit-learn 1.3.2** - Machine learning
- **pandas 2.1.4** - Data manipulation
- **numpy 1.25.2** - Numerical computing
- **Gunicorn 21.2.0** - Production WSGI server

## Project Structure

```
ml-service/
├── app.py                 # Main Flask application
├── model.py              # ML model implementation
├── requirements.txt      # Python dependencies
├── Procfile             # Railway deployment config
├── runtime.txt          # Python version specification
├── railway.json         # Railway service configuration
├── .env.example         # Environment variables template
├── test_ml_service.py   # Test script
├── models/              # Trained model storage (created at runtime)
└── README.md           # This file
```

## API Endpoints

### Health Check
```
GET /health
```
Returns service status and model information.

### Failure Prediction
```
POST /api/predicoes
Content-Type: application/json

{
  "sensor_id": 1,
  "valor": 75.5,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "tipo_sensor": "temperatura"
}
```

Response:
```json
{
  "probabilidade_falha": 78.5,
  "timestamp": "2024-01-15T10:30:05.000Z"
}
```

### Model Metrics
```
GET /api/model/metrics
```

Response:
```json
{
  "acuracia": 87.3,
  "model_type": "IsolationForest",
  "contamination_rate": 0.05,
  "n_estimators": 100,
  "supported_sensors": ["temperatura", "vibracao", "pressao"],
  "timestamp": "2024-01-15T10:30:05.000Z"
}
```

## Local Development

### Prerequisites
- Python 3.10 or higher
- pip package manager

### Setup

1. **Clone and navigate to ML service directory:**
```bash
cd ml-service
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Set environment variables:**
```bash
cp .env.example .env
# Edit .env file as needed
```

5. **Run the service:**
```bash
python app.py
```

The service will start on `http://localhost:5000`

## Testing

### Quick Start
```bash
# Start the service
python start_service.py

# Or start with automatic testing
python start_service.py --test
```

### Manual Testing
```bash
# Start service
python app.py

# Run API tests (in another terminal)
python test_api.py
```

### Example API Calls

**Test prediction endpoint:**
```bash
curl -X POST http://localhost:5000/api/predicoes \
  -H "Content-Type: application/json" \
  -d '{
    "sensor_id": 1,
    "valor": 85.0,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "tipo_sensor": "temperatura"
  }'
```

**Test metrics endpoint:**
```bash
curl http://localhost:5000/api/model/metrics
```

## Railway Deployment

### Automatic Deployment

1. **Connect to Railway:**
   - Connect your repository to Railway
   - Railway will automatically detect the Python project

2. **Environment Variables:**
   Set these environment variables in Railway dashboard:
   ```
   PORT=5000
   FLASK_ENV=production
   CORS_ORIGINS=https://neuramaint.railway.app
   ```

3. **Deploy:**
   - Railway will automatically build and deploy on git push
   - The service will be available at your Railway domain

### Manual Deployment

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login and deploy:**
```bash
railway login
railway link
railway up
```

## Model Details

### Architecture
- **Primary Model**: Random Forest Classifier
- **Fallback**: Rule-based prediction system
- **Features**: 8 engineered features from sensor data
- **Training**: Synthetic data generation for initial model

### Sensor Support
- **Temperatura**: 20-80°C normal range
- **Vibração**: 0-5mm/s normal range  
- **Pressão**: 0-10bar normal range
- **Fluxo**: 50-200L/min normal range
- **Rotação**: 1500-3000RPM normal range

### Prediction Logic
- **Rule-based**: Used when ML model unavailable
- **ML-based**: Random Forest with feature engineering
- **Risk Levels**: baixo (<40%), medio (40-80%), alto (>80%)
- **Confidence**: 50-95% based on data quality and prediction certainty

## Performance

### Response Times
- **Target**: <2 seconds (1.8s internal timeout)
- **Typical**: 100-500ms for predictions
- **Health Check**: <100ms

### Scalability
- **Workers**: 2 Gunicorn workers with 4 threads each
- **Concurrency**: Thread pool executor for async processing
- **Memory**: ~100-200MB typical usage

## Monitoring

### Health Checks
- **Endpoint**: `GET /health`
- **Railway**: Automatic health monitoring
- **Response**: Service status, model status, environment info

### Logging
- **Level**: INFO (configurable)
- **Format**: Timestamp, logger name, level, message
- **Railway**: Logs available in Railway dashboard

## Error Handling

### Common Errors
- **400**: Invalid input data or missing fields
- **408**: Prediction timeout (>1.8 seconds)
- **500**: Internal server error
- **503**: Service unhealthy

### Fallback Behavior
- ML model failure → Rule-based prediction
- Service overload → Conservative default prediction
- Invalid data → Validation error with details

## Integration

### Backend Integration
The ML service integrates with the NeuraMaint backend through:
- **Reading Processing Service**: Automatic predictions on new readings
- **Simulator Service**: Enhanced simulation with ML predictions
- **Alert System**: Automatic alert generation based on predictions

### Authentication
- No authentication required (internal service)
- CORS configured for NeuraMaint domains
- Rate limiting handled by Railway platform

## Troubleshooting

### Common Issues

1. **Service won't start:**
   - Check Python version (3.10+ required)
   - Verify all dependencies installed
   - Check port availability

2. **Predictions failing:**
   - Verify request format matches API specification
   - Check model initialization in logs
   - Confirm sensor type is supported

3. **Slow responses:**
   - Check model loading status
   - Monitor memory usage
   - Review thread pool configuration

### Debug Mode
Enable debug mode for development:
```bash
export FLASK_ENV=development
python app.py
```

## Future Enhancements

### Planned Features
- **Model Retraining**: Automatic model updates with new data
- **Batch Predictions**: Process multiple sensors simultaneously
- **Advanced Models**: Deep learning and ensemble methods
- **Real-time Streaming**: WebSocket support for live predictions

### Scalability Improvements
- **Model Versioning**: A/B testing different model versions
- **Caching Layer**: Redis for prediction caching
- **Load Balancing**: Multiple service instances
- **Model Registry**: Centralized model management

---

## Support

For issues and questions:
- Check Railway logs for deployment issues
- Review test output for functionality problems
- Verify environment variables are correctly set
- Ensure all dependencies are properly installed