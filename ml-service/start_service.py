#!/usr/bin/env python3
"""
Quick startup and test script for NeuraMaint ML Service
"""

import os
import sys
import time
import subprocess
import threading
from datetime import datetime

def start_ml_service():
    """Start the ML service"""
    print("🚀 Starting NeuraMaint ML Service...")
    
    try:
        # Set environment variables
        os.environ['FLASK_ENV'] = 'development'
        os.environ['PORT'] = '5000'
        
        # Start the Flask application
        from app import app
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True,
            threaded=True
        )
        
    except Exception as e:
        print(f"❌ Failed to start ML service: {e}")
        return False

def run_api_tests():
    """Run API tests after service starts"""
    print("\n⏳ Waiting for service to start...")
    time.sleep(3)
    
    print("🧪 Running API tests...")
    try:
        # Import and run tests
        import test_api
        test_api.main()
    except Exception as e:
        print(f"❌ Test execution failed: {e}")

def print_usage():
    """Print usage instructions"""
    print("\n" + "="*60)
    print("🎯 NeuraMaint ML Service - Quick Start")
    print("="*60)
    print("\n📋 Available Commands:")
    print("   python start_service.py              - Start the ML service")
    print("   python start_service.py --test       - Start service and run tests")
    print("   python start_service.py --help       - Show this help")
    
    print("\n🔗 API Endpoints:")
    print("   POST http://localhost:5000/api/predicoes     - Get failure predictions")
    print("   GET  http://localhost:5000/api/model/metrics - Get model accuracy")
    print("   GET  http://localhost:5000/health            - Health check")
    
    print("\n📝 Example Request:")
    print(\"\"\"   curl -X POST http://localhost:5000/api/predicoes \\
        -H "Content-Type: application/json" \\
        -d '{
          "sensor_id": 1,
          "valor": 85.0,
          "timestamp": "2024-01-15T10:30:00.000Z",
          "tipo_sensor": "temperatura"
        }'\"\"\")\n    \n    print(\"\\n📋 Requirements Check:\")\n    print(\"✅ POST /api/predicoes - Failure prediction endpoint\")\n    print(\"✅ GET /api/model/metrics - Model accuracy endpoint\")\n    print(\"✅ Input validation for sensor data\")\n    print(\"✅ Proper HTTP status codes\")\n    print(\"✅ Model loading on initialization\")\n    print(\"✅ No authentication (internal service)\")\n    \ndef main():\n    \"\"\"Main entry point\"\"\"\n    args = sys.argv[1:]\n    \n    if '--help' in args or '-h' in args:\n        print_usage()\n        return\n    \n    if '--test' in args:\n        print(\"🧪 Starting service with automatic testing...\")\n        \n        # Start service in background thread\n        service_thread = threading.Thread(target=start_ml_service, daemon=True)\n        service_thread.start()\n        \n        # Run tests\n        run_api_tests()\n    else:\n        print(\"🚀 Starting ML Service...\")\n        print(\"📍 Service will be available at: http://localhost:5000\")\n        print(\"🛑 Press Ctrl+C to stop\")\n        \n        try:\n            start_ml_service()\n        except KeyboardInterrupt:\n            print(\"\\n\\n🛑 Service stopped by user\")\n\nif __name__ == \"__main__\":\n    main()