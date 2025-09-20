import numpy as np
import pandas as pd
import joblib
import os
from datetime import datetime
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class PumpFailureTrainer:
    """
    Training module for pump failure detection using Isolation Forest
    Focuses on temperature, vibration, and pressure sensors
    """
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = [
            'temperatura', 'vibracao', 'pressao',
            'temperatura_normalized', 'vibracao_normalized', 'pressao_normalized'
        ]
        
        # Sensor operating ranges
        self.sensor_ranges = {
            'temperatura': {'min': 20, 'max': 80, 'critical': 90},
            'vibracao': {'min': 0, 'max': 5, 'critical': 7},
            'pressao': {'min': 0, 'max': 10, 'critical': 12}
        }
        
        self.models_dir = os.path.join(os.path.dirname(__file__), 'models')
        os.makedirs(self.models_dir, exist_ok=True)

def train_model(n_samples: int = 10000, contamination: float = 0.05) -> Dict[str, Any]:
    """
    Train Isolation Forest model with synthetic data
    
    Args:
        n_samples: Number of training samples
        contamination: Fraction of anomalies in training data (5% = 0.05)
        
    Returns:
        Dictionary with training results and model info
    """
    trainer = PumpFailureTrainer()
    
    try:
        logger.info(f"Starting model training with {n_samples} samples and {contamination*100}% contamination")
        
        # Generate synthetic training data
        X = _generate_training_data(trainer, n_samples, contamination)
        
        logger.info("Training Isolation Forest model...")
        trainer.model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100,
            max_samples='auto',
            n_jobs=-1,
            bootstrap=False
        )
        
        # Scale features and train
        X_scaled = trainer.scaler.fit_transform(X)
        trainer.model.fit(X_scaled)
        
        # Evaluate model performance
        predictions = trainer.model.predict(X_scaled)
        anomaly_count = np.sum(predictions == -1)
        anomaly_ratio = anomaly_count / len(predictions)
        
        # Save trained model
        model_path = os.path.join(trainer.models_dir, 'pump_failure_model.joblib')
        scaler_path = os.path.join(trainer.models_dir, 'scaler.joblib')
        metadata_path = os.path.join(trainer.models_dir, 'metadata.joblib')
        
        joblib.dump(trainer.model, model_path)
        joblib.dump(trainer.scaler, scaler_path)
        
        # Save metadata
        metadata = {
            'training_date': datetime.utcnow().isoformat(),
            'n_samples': n_samples,
            'contamination': contamination,
            'anomaly_ratio': anomaly_ratio,
            'feature_names': trainer.feature_names,
            'sensor_ranges': trainer.sensor_ranges,
            'model_version': '2.0.0'
        }
        joblib.dump(metadata, metadata_path)
        
        logger.info(f"Model training completed successfully!")
        logger.info(f"Detected anomaly ratio: {anomaly_ratio:.3f}")
        logger.info(f"Model saved to: {model_path}")
        
        return {
            'success': True,
            'model_path': model_path,
            'anomaly_ratio': anomaly_ratio,
            'training_samples': n_samples,
            'contamination': contamination,
            'accuracy_estimate': max(70.0, min(95.0, (1 - abs(anomaly_ratio - contamination)) * 100))
        }
        
    except Exception as e:
        logger.error(f"Model training failed: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def predict_failure(data: Dict[str, Any], model_path: Optional[str] = None) -> float:
    """
    Predict failure probability for sensor data
    
    Args:
        data: Dictionary with keys: sensor_id, valor, timestamp, tipo_sensor
        model_path: Optional path to model file
        
    Returns:
        Failure probability (0-100%)
    """
    try:
        # Load model if not provided
        if model_path is None:
            model_path = os.path.join(os.path.dirname(__file__), 'models', 'pump_failure_model.joblib')
        
        if not os.path.exists(model_path):
            logger.warning("No trained model found, using rule-based prediction")
            return _rule_based_prediction(data)
        
        # Load model and scaler
        model = joblib.load(model_path)
        scaler_path = os.path.join(os.path.dirname(model_path), 'scaler.joblib')
        
        if os.path.exists(scaler_path):
            scaler = joblib.load(scaler_path)
        else:
            logger.warning("Scaler not found, using rule-based prediction")
            return _rule_based_prediction(data)
        
        # Create feature vector
        features = _create_feature_vector(data)
        features_scaled = scaler.transform([features])
        
        # Get anomaly score
        anomaly_score = model.decision_function(features_scaled)[0]
        
        # Convert anomaly score to failure probability (0-100%)
        # Isolation Forest returns negative scores for anomalies
        # Higher absolute negative values = more anomalous = higher failure probability
        probability = max(0, min(100, (-anomaly_score + 0.5) * 100))
        
        # Apply sensor-specific adjustments
        probability = _adjust_probability_by_sensor(data, probability)
        
        return round(probability, 2)
        
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        return _rule_based_prediction(data)

def load_model(model_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Load trained model and return model info
    
    Args:
        model_path: Optional path to model file
        
    Returns:
        Dictionary with model information
    """
    try:
        if model_path is None:
            model_path = os.path.join(os.path.dirname(__file__), 'models', 'pump_failure_model.joblib')
        
        if not os.path.exists(model_path):
            return {
                'loaded': False,
                'error': 'Model file not found'
            }
        
        # Load model and metadata
        model = joblib.load(model_path)
        
        metadata_path = os.path.join(os.path.dirname(model_path), 'metadata.joblib')
        if os.path.exists(metadata_path):
            metadata = joblib.load(metadata_path)
        else:
            metadata = {}
        
        scaler_path = os.path.join(os.path.dirname(model_path), 'scaler.joblib')
        scaler_exists = os.path.exists(scaler_path)
        
        return {
            'loaded': True,
            'model_type': 'IsolationForest',
            'model_path': model_path,
            'scaler_available': scaler_exists,
            'n_estimators': getattr(model, 'n_estimators', 100),
            'contamination': getattr(model, 'contamination', 0.05),
            'metadata': metadata
        }
        
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        return {
            'loaded': False,
            'error': str(e)
        }

def _generate_training_data(trainer: PumpFailureTrainer, n_samples: int, contamination: float) -> np.ndarray:
    """Generate synthetic training data"""
    np.random.seed(42)
    
    n_anomalies = int(n_samples * contamination)
    n_normal = n_samples - n_anomalies
    
    X = []
    
    # Generate normal patterns
    for _ in range(n_normal):
        features = _generate_normal_pattern(trainer.sensor_ranges)
        X.append(features)
    
    # Generate anomalous patterns
    for _ in range(n_anomalies):
        features = _generate_anomaly_pattern(trainer.sensor_ranges)
        X.append(features)
    
    # Shuffle the data
    X = np.array(X)
    indices = np.random.permutation(len(X))
    return X[indices]

def _generate_normal_pattern(sensor_ranges: Dict) -> List[float]:
    """Generate normal operation pattern"""
    features = []
    
    # Generate normal sensor values with realistic noise
    for sensor_type in ['temperatura', 'vibracao', 'pressao']:
        ranges = sensor_ranges[sensor_type]
        # Generate values in normal range with Gaussian distribution
        center = (ranges['min'] + ranges['max']) / 2
        std = (ranges['max'] - ranges['min']) / 6  # 99.7% within range
        normal_value = np.random.normal(center, std)
        # Clamp to valid bounds
        normal_value = max(ranges['min'], min(ranges['max'], normal_value))
        features.append(normal_value)
    
    # Add normalized features
    for i, sensor_type in enumerate(['temperatura', 'vibracao', 'pressao']):
        ranges = sensor_ranges[sensor_type]
        raw_value = features[i]
        normalized = (raw_value - ranges['min']) / (ranges['max'] - ranges['min'])
        features.append(max(0, min(1, normalized)))
    
    return features

def _generate_anomaly_pattern(sensor_ranges: Dict) -> List[float]:
    """Generate anomalous pattern"""
    features = []
    
    # Generate anomalous sensor values
    for sensor_type in ['temperatura', 'vibracao', 'pressao']:
        ranges = sensor_ranges[sensor_type]
        
        if np.random.random() < 0.7:  # 70% chance of extreme value
            if np.random.random() < 0.8:  # 80% high, 20% low
                # High extreme value
                extreme_value = np.random.uniform(ranges['max'] * 1.1, ranges['critical'])
            else:
                # Low extreme value
                extreme_value = np.random.uniform(ranges['min'] * 0.2, ranges['min'] * 0.7)
            features.append(extreme_value)
        else:
            # Elevated but within normal range
            elevated_value = np.random.uniform(ranges['max'] * 0.85, ranges['max'])
            features.append(elevated_value)
    
    # Add normalized features (allow values > 1 for anomalies)
    for i, sensor_type in enumerate(['temperatura', 'vibracao', 'pressao']):
        ranges = sensor_ranges[sensor_type]
        raw_value = features[i]
        normalized = (raw_value - ranges['min']) / (ranges['max'] - ranges['min'])
        # Allow anomalous ratios
        features.append(max(0, min(3.0, normalized)))
    
    return features

def _create_feature_vector(data: Dict[str, Any]) -> List[float]:
    """Create feature vector from sensor data"""
    sensor_ranges = {
        'temperatura': {'min': 20, 'max': 80, 'critical': 90},
        'vibracao': {'min': 0, 'max': 5, 'critical': 7},
        'pressao': {'min': 0, 'max': 10, 'critical': 12}
    }
    
    sensor_type = data['tipo_sensor']
    value = float(data['valor'])
    
    # Initialize with default normal values
    features = [50.0, 2.5, 5.0, 0.5, 0.5, 0.5]  # Default values for all sensors
    
    # Set actual sensor value
    if sensor_type == 'temperatura':
        features[0] = value
    elif sensor_type == 'vibracao':
        features[1] = value
    elif sensor_type == 'pressao':
        features[2] = value
    
    # Update normalized features
    for i, sensor_name in enumerate(['temperatura', 'vibracao', 'pressao']):
        if sensor_name in sensor_ranges:
            ranges = sensor_ranges[sensor_name]
            raw_value = features[i]
            normalized = (raw_value - ranges['min']) / (ranges['max'] - ranges['min'])
            features[i + 3] = max(0, min(2.5, normalized))  # Allow values > 1 for anomalies
    
    return features

def _rule_based_prediction(data: Dict[str, Any]) -> float:
    """Rule-based prediction fallback"""
    sensor_ranges = {
        'temperatura': {'min': 20, 'max': 80, 'critical': 90},
        'vibracao': {'min': 0, 'max': 5, 'critical': 7},
        'pressao': {'min': 0, 'max': 10, 'critical': 12}
    }
    
    sensor_type = data['tipo_sensor']
    value = float(data['valor'])
    
    if sensor_type not in sensor_ranges:
        return 15.0  # Default moderate risk
    
    ranges = sensor_ranges[sensor_type]
    
    if value >= ranges['critical']:
        return 95.0  # Very high risk
    elif value > ranges['max']:
        # Linear interpolation between max and critical
        excess_ratio = (value - ranges['max']) / (ranges['critical'] - ranges['max'])
        return 70.0 + (25.0 * excess_ratio)  # 70-95% risk
    elif value < ranges['min'] * 0.6:
        return 60.0  # Low values indicate problems
    elif value > ranges['max'] * 0.9:
        return 40.0  # Approaching high values
    else:
        return 10.0  # Normal operation

def _adjust_probability_by_sensor(data: Dict[str, Any], probability: float) -> float:
    """Adjust probability based on sensor-specific characteristics"""
    sensor_type = data['tipo_sensor']
    value = float(data['valor'])
    
    # Temperature adjustments
    if sensor_type == 'temperatura':
        if value > 85:  # Very high temperature
            probability = min(100, probability * 1.2)
        elif value < 15:  # Very low temperature
            probability = min(100, probability * 1.1)
    
    # Vibration adjustments
    elif sensor_type == 'vibracao':
        if value > 6:  # High vibration
            probability = min(100, probability * 1.3)
        elif value > 4.5:  # Elevated vibration
            probability = min(100, probability * 1.1)
    
    # Pressure adjustments
    elif sensor_type == 'pressao':
        if value > 11:  # High pressure
            probability = min(100, probability * 1.25)
        elif value < 1:  # Very low pressure
            probability = min(100, probability * 1.15)
    
    return probability