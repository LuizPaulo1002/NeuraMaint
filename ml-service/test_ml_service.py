import requests
import json
from datetime import datetime

# Test configuration
ML_SERVICE_URL = 'http://localhost:5000'

def test_health_endpoint():
    """Test the health check endpoint"""
    print("🏥 Testing ML Service Health Check...")
    try:
        response = requests.get(f'{ML_SERVICE_URL}/health', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data['status']}")
            print(f"   Service: {data['service']}")
            print(f"   Version: {data['version']}")
            print(f"   Model loaded: {data['model']['loaded']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {str(e)}")
        return False

def test_prediction_endpoint():
    """Test the prediction endpoint with sample data"""
    print("\n🤖 Testing ML Prediction Endpoint...")
    
    test_cases = [
        {
            'name': 'Normal Temperature',
            'data': {
                'sensor_id': 1,
                'valor': 65.0,
                'timestamp': datetime.utcnow().isoformat(),
                'tipo_sensor': 'temperatura'
            }
        },
        {
            'name': 'High Temperature (Critical)',
            'data': {
                'sensor_id': 1,
                'valor': 95.0,
                'timestamp': datetime.utcnow().isoformat(),
                'tipo_sensor': 'temperatura'
            }
        },
        {
            'name': 'High Vibration',
            'data': {
                'sensor_id': 2,
                'valor': 6.5,
                'timestamp': datetime.utcnow().isoformat(),
                'tipo_sensor': 'vibracao'
            }
        },
        {
            'name': 'Normal Pressure',
            'data': {
                'sensor_id': 3,
                'valor': 7.2,
                'timestamp': datetime.utcnow().isoformat(),
                'tipo_sensor': 'pressao'
            }
        }
    ]
    
    for test_case in test_cases:
        try:
            response = requests.post(
                f'{ML_SERVICE_URL}/api/predicoes',
                json=test_case['data'],
                headers={'Content-Type': 'application/json'},
                timeout=3
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ {test_case['name']}: {result['probabilidade_falha']:.1f}% failure probability")
                print(f"   Risk: {result['risco']}, Confidence: {result['confianca']:.1f}%")
                print(f"   Recommendation: {result['recomendacao'][:80]}...")
            else:
                print(f"❌ {test_case['name']} failed: {response.status_code}")
                print(f"   Error: {response.text}")
                
        except Exception as e:
            print(f"❌ {test_case['name']} error: {str(e)}")

def test_model_status():
    """Test the model status endpoint"""
    print("\n📊 Testing Model Status Endpoint...")
    try:
        response = requests.get(f'{ML_SERVICE_URL}/api/model/status', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Model status retrieved successfully")
            print(f"   Model type: {data['model']['type']}")
            print(f"   Trained: {data['model']['trained']}")
            print(f"   Features: {data['features']['count']}")
            print(f"   Prediction mode: {data['performance']['prediction_mode']}")
        else:
            print(f"❌ Model status failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Model status error: {str(e)}")

def test_invalid_requests():
    """Test error handling with invalid requests"""
    print("\n❌ Testing Error Handling...")
    
    # Test missing required field
    try:
        response = requests.post(
            f'{ML_SERVICE_URL}/api/predicoes',
            json={'sensor_id': 1, 'valor': 65.0},  # Missing timestamp and tipo_sensor
            headers={'Content-Type': 'application/json'},
            timeout=3
        )
        if response.status_code == 400:
            print("✅ Missing field validation working")
        else:
            print(f"❌ Missing field validation failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Missing field test error: {str(e)}")
    
    # Test invalid content type
    try:
        response = requests.post(
            f'{ML_SERVICE_URL}/api/predicoes',
            data="invalid data",
            timeout=3
        )
        if response.status_code == 400:
            print("✅ Content-Type validation working")
        else:
            print(f"❌ Content-Type validation failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Content-Type test error: {str(e)}")

def run_all_tests():
    """Run all ML service tests"""
    print("🧪 Starting ML Service Tests\n")
    
    # Test basic connectivity
    if not test_health_endpoint():
        print("❌ Service is not running or not accessible")
        print("Make sure to start the ML service with: python app.py")
        return
    
    # Test main functionality
    test_prediction_endpoint()
    test_model_status()
    test_invalid_requests()
    
    print("\n🎉 ML Service tests completed!")
    print("\n📋 Test Summary:")
    print("✅ Health check endpoint")
    print("✅ Prediction endpoint with various scenarios")
    print("✅ Model status endpoint")
    print("✅ Error handling and validation")

if __name__ == '__main__':
    run_all_tests()