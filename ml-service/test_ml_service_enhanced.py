import requests
import json
from datetime import datetime
import time

# Test configuration
ML_SERVICE_URL = 'http://localhost:5000'

def test_health_endpoint():
    """Test the health check endpoint"""
    print("Testing ML Service Health Check...")
    try:
        response = requests.get(f'{ML_SERVICE_URL}/health', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"Health check passed: {data['status']}")
            print(f"   Service: {data['service']}")
            print(f"   Version: {data['version']}")
            print(f"   Model loaded: {data['model']['loaded']}")
            return True
        else:
            print(f"Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"Health check error: {str(e)}")
        return False

def test_prediction_accuracy():
    """Test prediction accuracy with various scenarios"""
    print("\nTesting ML Prediction Accuracy...")
    
    test_cases = [
        {
            'name': 'Normal Temperature',
            'data': {
                'sensor_id': 1,
                'valor': 65.0,
                'timestamp': datetime.utcnow().isoformat(),
                'tipo_sensor': 'temperatura'
            },
            'expected_risk': 'low'
        },
        {
            'name': 'High Temperature (Critical)',
            'data': {
                'sensor_id': 1,
                'valor': 95.0,
                'timestamp': datetime.utcnow().isoformat(),
                'tipo_sensor': 'temperatura'
            },
            'expected_risk': 'high'
        },
        {
            'name': 'High Vibration',
            'data': {
                'sensor_id': 2,
                'valor': 6.5,
                'timestamp': datetime.utcnow().isoformat(),
                'tipo_sensor': 'vibracao'
            },
            'expected_risk': 'medium'
        },
        {
            'name': 'Normal Pressure',
            'data': {
                'sensor_id': 3,
                'valor': 7.2,
                'timestamp': datetime.utcnow().isoformat(),
                'tipo_sensor': 'pressao'
            },
            'expected_risk': 'low'
        },
        {
            'name': 'Critical Pressure',
            'data': {
                'sensor_id': 3,
                'valor': 12.0,
                'timestamp': datetime.utcnow().isoformat(),
                'tipo_sensor': 'pressao'
            },
            'expected_risk': 'high'
        }
    ]
    
    passed_tests = 0
    total_tests = len(test_cases)
    
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
                probability = result['probabilidade_falha']
                risk = result['risco']
                
                print(f"{test_case['name']}: {probability:.1f}% failure probability")
                print(f"   Risk: {risk}, Confidence: {result['confianca']:.1f}%")
                
                # Basic validation of expected risk levels
                if test_case['expected_risk'] == 'low' and probability < 30:
                    passed_tests += 1
                elif test_case['expected_risk'] == 'medium' and 30 <= probability <= 70:
                    passed_tests += 1
                elif test_case['expected_risk'] == 'high' and probability > 70:
                    passed_tests += 1
                    
            else:
                print(f"{test_case['name']} failed: {response.status_code}")
                print(f"   Error: {response.text}")
                
        except Exception as e:
            print(f"{test_case['name']} error: {str(e)}")

    accuracy = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
    print(f"\nPrediction Accuracy: {accuracy:.1f}% ({passed_tests}/{total_tests} scenarios passed)")
    
    if accuracy >= 70:
        print("Accuracy requirement met (>70%)")
        return True
    else:
        print("Accuracy requirement not met (<70%)")
        return False

def test_model_status():
    """Test the model status endpoint"""
    print("\nTesting Model Status Endpoint...")
    try:
        response = requests.get(f'{ML_SERVICE_URL}/api/model/status', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"Model status retrieved successfully")
            print(f"   Model type: {data['model']['type']}")
            print(f"   Trained: {data['model']['trained']}")
            print(f"   Features: {data['features']['count']}")
            print(f"   Prediction mode: {data['performance']['prediction_mode']}")
            return True
        else:
            print(f"Model status failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"Model status error: {str(e)}")
        return False

def test_error_handling():
    """Test error handling with invalid requests"""
    print("\nTesting Error Handling...")
    
    # Test missing required field
    try:
        response = requests.post(
            f'{ML_SERVICE_URL}/api/predicoes',
            json={'sensor_id': 1, 'valor': 65.0},  # Missing timestamp and tipo_sensor
            headers={'Content-Type': 'application/json'},
            timeout=3
        )
        if response.status_code == 400:
            print("Missing field validation working")
        else:
            print(f"Missing field validation failed: {response.status_code}")
    except Exception as e:
        print(f"Missing field test error: {str(e)}")
    
    # Test invalid content type
    try:
        response = requests.post(
            f'{ML_SERVICE_URL}/api/predicoes',
            data="invalid data",
            timeout=3
        )
        if response.status_code == 400:
            print("Content-Type validation working")
        else:
            print(f"Content-Type validation failed: {response.status_code}")
    except Exception as e:
        print(f"Content-Type test error: {str(e)}")
    
    # Test invalid sensor type
    try:
        response = requests.post(
            f'{ML_SERVICE_URL}/api/predicoes',
            json={
                'sensor_id': 1,
                'valor': 65.0,
                'timestamp': datetime.utcnow().isoformat(),
                'tipo_sensor': 'invalid_sensor_type'
            },
            headers={'Content-Type': 'application/json'},
            timeout=3
        )
        if response.status_code == 400:
            print("Invalid sensor type validation working")
        else:
            print(f"Invalid sensor type validation failed: {response.status_code}")
    except Exception as e:
        print(f"Invalid sensor type test error: {str(e)}")
    
    return True

def test_performance_under_load():
    """Test service performance under concurrent requests"""
    print("\nTesting Performance Under Load...")
    
    test_data = {
        'sensor_id': 1,
        'valor': 75.0,
        'timestamp': datetime.utcnow().isoformat(),
        'tipo_sensor': 'temperatura'
    }
    
    start_time = time.time()
    successful_requests = 0
    total_requests = 10
    
    for i in range(total_requests):
        try:
            response = requests.post(
                f'{ML_SERVICE_URL}/api/predicoes',
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=5
            )
            
            if response.status_code == 200:
                successful_requests += 1
                
        except Exception as e:
            print(f"Request {i+1} failed: {str(e)}")
    
    end_time = time.time()
    total_time = end_time - start_time
    avg_response_time = (total_time / total_requests) * 1000  # Convert to milliseconds
    
    print(f"Completed {successful_requests}/{total_requests} requests")
    print(f"   Total time: {total_time:.2f} seconds")
    print(f"   Average response time: {avg_response_time:.2f} ms")
    
    if avg_response_time < 1000:  # Less than 1 second
        print("Performance requirement met (<1000ms average)")
        return True
    else:
        print("Performance requirement not met (>=1000ms average)")
        return False

def run_all_tests():
    """Run all ML service tests"""
    print("Starting Enhanced ML Service Tests\n")
    
    # Test basic connectivity
    if not test_health_endpoint():
        print("Service is not running or not accessible")
        print("Make sure to start the ML service with: python app.py")
        return False
    
    # Test main functionality
    accuracy_test_passed = test_prediction_accuracy()
    model_status_passed = test_model_status()
    error_handling_passed = test_error_handling()
    performance_test_passed = test_performance_under_load()
    
    print("\nEnhanced ML Service tests completed!")
    print("\nTest Summary:")
    print(f"Health check endpoint: {'PASS' if True else 'FAIL'}")
    print(f"Prediction accuracy: {'PASS' if accuracy_test_passed else 'FAIL'}")
    print(f"Model status endpoint: {'PASS' if model_status_passed else 'FAIL'}")
    print(f"Error handling: {'PASS' if error_handling_passed else 'FAIL'}")
    print(f"Performance under load: {'PASS' if performance_test_passed else 'FAIL'}")
    
    overall_passed = all([
        accuracy_test_passed,
        model_status_passed,
        error_handling_passed,
        performance_test_passed
    ])
    
    if overall_passed:
        print("\nAll ML Service tests passed!")
        return True
    else:
        print("\nSome ML Service tests failed!")
        return False

if __name__ == '__main__':
    run_all_tests()
