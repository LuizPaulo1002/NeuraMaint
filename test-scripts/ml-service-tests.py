#!/usr/bin/env python3

"""
ML Service Tests Execution Script
Run with: python ml-service-tests.py
"""

import subprocess
import sys
import os

def run_command(command, cwd=None):
    """Run a command and return the result"""
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            cwd=cwd,
            check=True, 
            capture_output=True, 
            text=True
        )
        return result.stdout, result.stderr, 0
    except subprocess.CalledProcessError as e:
        return e.stdout, e.stderr, e.returncode

def main():
    print("🧪 Starting ML Service Tests")
    print("============================")
    
    # Navigate to ml-service directory
    ml_service_dir = "../ml-service"
    
    # Check if requirements are installed
    print("📦 Checking Python dependencies...")
    stdout, stderr, returncode = run_command("pip install -r requirements.txt", ml_service_dir)
    if returncode != 0:
        print(f"❌ Failed to install dependencies: {stderr}")
        return 1
    
    # Run unit tests
    print("🚀 Running ML service unit tests...")
    stdout, stderr, returncode = run_command("python -m pytest test_ml_service.py -v", ml_service_dir)
    print(stdout)
    if stderr:
        print(stderr)
    
    if returncode != 0:
        print("❌ ML service unit tests failed")
        return 1
    else:
        print("✅ ML service unit tests completed successfully")
    
    # Run enhanced tests
    print("🚀 Running enhanced ML service tests...")
    stdout, stderr, returncode = run_command("python test_ml_service_enhanced.py", ml_service_dir)
    print(stdout)
    if stderr:
        print(stderr)
    
    if returncode != 0:
        print("❌ Enhanced ML service tests failed")
        return 1
    else:
        print("✅ Enhanced ML service tests completed successfully")
    
    # Run isolation forest tests
    print("🚀 Running isolation forest tests...")
    stdout, stderr, returncode = run_command("python -m pytest test_isolation_forest.py -v", ml_service_dir)
    print(stdout)
    if stderr:
        print(stderr)
    
    if returncode != 0:
        print("❌ Isolation forest tests failed")
        return 1
    else:
        print("✅ Isolation forest tests completed successfully")
    
    print("🎉 All ML service tests completed!")
    return 0

if __name__ == "__main__":
    sys.exit(main())