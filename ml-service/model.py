import numpy as np
import pandas as pd
import joblib
import os
from datetime import datetime, timedelta
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score
import logging
from typing import Dict, List, Any, Tuple

logger = logging.getLogger(__name__)

class PumpFailurePredictionModel:
    """
    Machine Learning model for predicting pump failure probability using Isolation Forest
    Based on industrial sensor data from NeuraMaint system
    Focuses on temperature, vibration, and pressure sensors
    """
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        self.model_version = "2.0.0"
        self.last_training_date = None
        self.feature_names = [
            'temperatura', 'vibracao', 'pressao',
            'temperatura_normalized', 'vibracao_normalized', 'pressao_normalized'
        ]
        
        # Sensor normal operating ranges for the three main sensors
        self.sensor_ranges = {
            'temperatura': {'min': 20, 'max': 80, 'critical': 90},
            'vibracao': {'min': 0, 'max': 5, 'critical': 7},
            'pressao': {'min': 0, 'max': 10, 'critical': 12}
        }
    
    def initialize(self):
        """Initialize the ML model with pre-trained weights or train a new model"""
        try:
            model_path = os.path.join(os.path.dirname(__file__), 'models', 'pump_failure_model.joblib')
            
            if os.path.exists(model_path):
                logger.info("Loading pre-trained model...")
                self.load_model(model_path)
            else:
                logger.info("No pre-trained model found. Training new model with synthetic data...")
                self._train_initial_model()
                
        except Exception as e:
            logger.error(f"Model initialization failed: {str(e)}")
            # Fallback to rule-based system
            self._initialize_fallback_model()
    
    def predict_failure_probability(self, sensor_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict failure probability for given sensor data
        
        Args:
            sensor_data: Dictionary containing sensor_id, valor, timestamp, tipo_sensor
            
        Returns:
            Dictionary with prediction results
        """
        try:
            # Extract and validate sensor data
            sensor_type = sensor_data['tipo_sensor']
            value = float(sensor_data['valor'])
            
            # Create feature vector
            features = self._create_feature_vector(sensor_data)
            
            if self.is_trained and self.model is not None:
                # Use Isolation Forest prediction
                features_scaled = self.scaler.transform([features])
                anomaly_score = self.model.decision_function(features_scaled)[0]
                # Convert anomaly score to probability (0-100%)
                # Isolation Forest returns negative scores for anomalies
                probability = max(0, min(100, (-anomaly_score + 0.5) * 100))
            else:
                # Use rule-based fallback
                probability = self._rule_based_prediction(sensor_type, value)
            
            # Determine risk level and recommendation
            risk_level = self._determine_risk_level(probability)
            recommendation = self._generate_recommendation(sensor_type, value, probability)
            confidence = self._calculate_confidence(sensor_data, probability)
            
            return {
                'probabilidade_falha': round(probability, 2),
                'risco': risk_level,
                'recomendacao': recommendation,
                'confianca': round(confidence, 1)
            }
            
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            # Return conservative prediction on error
            return {
                'probabilidade_falha': 15.0,
                'risco': 'medio',
                'recomendacao': 'Verificação recomendada devido a erro na predição',
                'confianca': 50.0
            }
    
    def _create_feature_vector(self, sensor_data: Dict[str, Any]) -> List[float]:
        """Create feature vector from sensor data for Isolation Forest"""
        sensor_type = sensor_data['tipo_sensor']
        value = float(sensor_data['valor'])
        
        # Initialize feature vector with default values
        features = [25.0, 1.0, 2.0, 0.5, 0.2, 0.2]  # Default normal values
        
        # Set actual sensor value
        if sensor_type == 'temperatura':
            features[0] = value
        elif sensor_type == 'vibracao':
            features[1] = value
        elif sensor_type == 'pressao':
            features[2] = value
        
        # Add normalized features for all three sensors
        for i, sensor_name in enumerate(['temperatura', 'vibracao', 'pressao']):
            if sensor_name in self.sensor_ranges:
                ranges = self.sensor_ranges[sensor_name]
                raw_value = features[i]
                normalized = (raw_value - ranges['min']) / (ranges['max'] - ranges['min'])
                features[i + 3] = max(0, min(2, normalized))  # Allow values above 1 for anomalies
        
        return features
    
    def _rule_based_prediction(self, sensor_type: str, value: float) -> float:
        """Rule-based prediction fallback when ML model is not available"""
        if sensor_type not in self.sensor_ranges:
            return 15.0  # Default moderate risk
        
        ranges = self.sensor_ranges[sensor_type]
        
        if value >= ranges['critical']:
            return 95.0  # Very high risk
        elif value > ranges['max']:
            # Linear interpolation between max and critical
            excess_ratio = (value - ranges['max']) / (ranges['critical'] - ranges['max'])
            return 70.0 + (25.0 * excess_ratio)  # 70-95% risk
        elif value < ranges['min'] * 0.8:
            return 60.0  # Low values can also indicate problems
        elif value > ranges['max'] * 0.9:
            return 40.0  # Approaching high values
        else:
            return 10.0  # Normal operation
    
    def _determine_risk_level(self, probability: float) -> str:
        """Determine risk level based on failure probability"""
        if probability >= 80:
            return 'alto'
        elif probability >= 40:
            return 'medio'
        else:
            return 'baixo'
    
    def _generate_recommendation(self, sensor_type: str, value: float, probability: float) -> str:
        """Generate contextual recommendation based on prediction"""
        sensor_names = {
            'temperatura': 'temperatura',
            'vibracao': 'vibração',
            'pressao': 'pressão',
            'fluxo': 'fluxo',
            'rotacao': 'rotação'
        }
        
        sensor_name = sensor_names.get(sensor_type, sensor_type)
        
        if probability >= 90:
            return f"CRÍTICO: {sensor_name} indica falha iminente. Parada imediata recomendada para inspeção."
        elif probability >= 70:
            return f"ATENÇÃO: {sensor_name} apresenta risco elevado. Agendar manutenção preventiva."
        elif probability >= 40:
            return f"MODERADO: {sensor_name} requer monitoramento. Verificar tendências."
        else:
            return f"NORMAL: {sensor_name} operando dentro dos parâmetros. Continuar monitoramento."
    
    def _calculate_confidence(self, sensor_data: Dict[str, Any], probability: float) -> float:
        """Calculate prediction confidence based on data quality and model certainty"""
        base_confidence = 85.0
        
        # Adjust confidence based on extreme values
        sensor_type = sensor_data['tipo_sensor']
        value = float(sensor_data['valor'])
        
        if sensor_type in self.sensor_ranges:
            ranges = self.sensor_ranges[sensor_type]
            if value > ranges['critical'] or value < ranges['min'] * 0.5:
                base_confidence += 10.0  # More confident in extreme cases
        
        # Adjust based on prediction certainty
        if probability > 90 or probability < 10:
            base_confidence += 5.0  # More confident in extreme predictions
        elif 40 <= probability <= 60:
            base_confidence -= 10.0  # Less confident in middle range
        
        return min(95.0, max(50.0, base_confidence))
    
    def _train_initial_model(self):
        """Train initial Isolation Forest model with synthetic data"""
        try:
            logger.info("Generating synthetic training data...")
            X = self._generate_synthetic_data(10000)
            
            logger.info("Training Isolation Forest model...")
            self.model = IsolationForest(
                contamination=0.05,  # 5% anomalies as requested
                random_state=42,
                n_estimators=100,
                max_samples='auto',
                n_jobs=-1
            )
            
            # Scale features
            X_scaled = self.scaler.fit_transform(X)
            
            # Train model (Isolation Forest is unsupervised)
            self.model.fit(X_scaled)
            
            # Evaluate on test data
            test_predictions = self.model.predict(X_scaled)
            anomaly_ratio = np.sum(test_predictions == -1) / len(test_predictions)
            
            logger.info(f"Isolation Forest trained successfully - Anomaly detection ratio: {anomaly_ratio:.3f}")
            
            self.is_trained = True
            self.last_training_date = datetime.utcnow()
            
            # Save model
            self._save_model()
            
        except Exception as e:
            logger.error(f"Model training failed: {str(e)}")
            self._initialize_fallback_model()
    
    def _generate_synthetic_data(self, n_samples: int) -> np.ndarray:
        """Generate synthetic training data for Isolation Forest (unsupervised)"""
        np.random.seed(42)
        
        X = []
        
        for _ in range(n_samples):
            # Generate 95% normal + 5% anomalous data as requested
            is_anomaly = np.random.random() < 0.05  # 5% anomalies
            
            if is_anomaly:
                # Generate anomalous patterns
                features = self._generate_failure_pattern()
            else:
                # Generate normal operation patterns
                features = self._generate_normal_pattern()
            
            X.append(features)
        
        return np.array(X)
    
    def _generate_normal_pattern(self) -> List[float]:
        """Generate normal operation sensor pattern for temperature, vibration, pressure"""
        features = []
        
        # Normal sensor values with realistic noise
        for sensor_type in ['temperatura', 'vibracao', 'pressao']:
            ranges = self.sensor_ranges[sensor_type]
            # Generate values in normal range with some noise
            center = (ranges['min'] + ranges['max']) / 2
            normal_value = np.random.normal(center, (ranges['max'] - ranges['min']) * 0.1)
            # Clamp to reasonable bounds
            normal_value = max(ranges['min'], min(ranges['max'], normal_value))
            features.append(normal_value)
        
        # Add normalized features (normal operation)
        for sensor_type in ['temperatura', 'vibracao', 'pressao']:
            ranges = self.sensor_ranges[sensor_type]
            raw_value = features[len(features) - 3 + (['temperatura', 'vibracao', 'pressao'].index(sensor_type))]
            normalized = (raw_value - ranges['min']) / (ranges['max'] - ranges['min'])
            features.append(max(0, min(1, normalized)))
        
        return features
    
    def _generate_failure_pattern(self) -> List[float]:
        """Generate failure pattern sensor data for temperature, vibration, pressure"""
        features = []
        
        # Failure patterns - generate extreme values
        for sensor_type in ['temperatura', 'vibracao', 'pressao']:
            ranges = self.sensor_ranges[sensor_type]
            
            if np.random.random() < 0.7:  # 70% chance of extreme value in anomaly
                if np.random.random() < 0.8:  # 80% high values, 20% low values
                    extreme_value = np.random.uniform(ranges['max'] * 1.1, ranges['critical'])
                else:
                    extreme_value = np.random.uniform(ranges['min'] * 0.3, ranges['min'] * 0.8)
                features.append(extreme_value)
            else:
                # Slightly elevated but within range
                elevated_value = np.random.uniform(ranges['max'] * 0.8, ranges['max'])
                features.append(elevated_value)
        
        # Add normalized features (failure patterns show anomalous ratios)
        for i, sensor_type in enumerate(['temperatura', 'vibracao', 'pressao']):
            ranges = self.sensor_ranges[sensor_type]
            raw_value = features[i]
            normalized = (raw_value - ranges['min']) / (ranges['max'] - ranges['min'])
            # Allow values above 1.0 to indicate anomalies
            features.append(max(0, min(2.5, normalized)))
        
        return features
    
    def _initialize_fallback_model(self):
        """Initialize fallback rule-based model"""
        logger.info("Initializing rule-based fallback model...")
        self.model = None
        self.is_trained = False
        logger.info("Fallback model initialized")
    
    def _save_model(self):
        """Save trained model to disk"""
        try:
            os.makedirs(os.path.join(os.path.dirname(__file__), 'models'), exist_ok=True)
            model_path = os.path.join(os.path.dirname(__file__), 'models', 'pump_failure_model.joblib')
            scaler_path = os.path.join(os.path.dirname(__file__), 'models', 'scaler.joblib')
            
            joblib.dump(self.model, model_path)
            joblib.dump(self.scaler, scaler_path)
            
            logger.info(f"Model saved to {model_path}")
        except Exception as e:
            logger.error(f"Failed to save model: {str(e)}")
    
    def load_model(self, model_path: str):
        """Load pre-trained model from disk"""
        try:
            scaler_path = os.path.join(os.path.dirname(model_path), 'scaler.joblib')
            
            self.model = joblib.load(model_path)
            if os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)
            
            self.is_trained = True
            logger.info(f"Model loaded from {model_path}")
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            raise e
    
    def get_model_status(self) -> Dict[str, Any]:
        """Get basic model status"""
        return {
            'loaded': self.model is not None,
            'trained': self.is_trained,
            'version': self.model_version
        }
    
    def get_detailed_status(self) -> Dict[str, Any]:
        """Get detailed model status and metrics"""
        return {
            'model': {
                'loaded': self.model is not None,
                'trained': self.is_trained,
                'version': self.model_version,
                'type': 'IsolationForest' if self.is_trained else 'RuleBased',
                'last_training': self.last_training_date.isoformat() if self.last_training_date else None
            },
            'features': {
                'count': len(self.feature_names),
                'names': self.feature_names
            },
            'sensor_types': list(self.sensor_ranges.keys()),
            'performance': {
                'prediction_mode': 'ml' if self.is_trained else 'rule_based',
                'confidence_range': '50-95%'
            }
        }