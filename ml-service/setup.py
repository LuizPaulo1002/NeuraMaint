#!/usr/bin/env python3
"""
NeuraMaint ML Service Setup Script
Automates the setup process for local development
"""

import os
import sys
import subprocess
import platform

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major == 3 and version.minor >= 10:
        print(f"✅ Python {version.major}.{version.minor} is compatible")
        return True
    else:
        print(f"❌ Python {version.major}.{version.minor} is not compatible. Python 3.10+ required.")
        return False

def setup_virtual_environment():
    """Create and activate virtual environment"""
    if not os.path.exists('venv'):
        if not run_command('python -m venv venv', 'Creating virtual environment'):
            return False
    
    # Determine activation script based on OS
    if platform.system() == 'Windows':
        activate_script = 'venv\\Scripts\\activate'
        pip_command = 'venv\\Scripts\\pip'
    else:
        activate_script = 'source venv/bin/activate'
        pip_command = 'venv/bin/pip'
    
    print(f"✅ Virtual environment ready")
    print(f"💡 To activate manually: {activate_script}")
    
    return pip_command

def install_dependencies(pip_command):
    """Install required Python packages"""
    return run_command(f'{pip_command} install -r requirements.txt', 'Installing dependencies')

def create_env_file():
    """Create .env file from example if it doesn't exist"""
    if not os.path.exists('.env'):
        if os.path.exists('.env.example'):
            run_command('cp .env.example .env', 'Creating .env file')
            print("💡 Please review and update .env file with your configuration")
        else:
            print("⚠️  .env.example not found, skipping .env creation")
    else:
        print("✅ .env file already exists")

def create_models_directory():
    """Create models directory for trained model storage"""
    models_dir = 'models'
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
        print(f"✅ Created {models_dir} directory")
    else:
        print(f"✅ {models_dir} directory already exists")

def test_installation():
    """Test the installation by running a quick import test"""
    print("🧪 Testing installation...")
    
    test_script = """
import flask
import sklearn
import pandas
import numpy
import joblib
print("All required packages imported successfully!")
"""
    
    try:
        # Use the virtual environment Python
        if platform.system() == 'Windows':
            python_cmd = 'venv\\Scripts\\python'
        else:
            python_cmd = 'venv/bin/python'
        
        result = subprocess.run(
            [python_cmd, '-c', test_script],
            capture_output=True,
            text=True,
            check=True
        )
        print("✅ Package import test passed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Package import test failed: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 NeuraMaint ML Service Setup\n")
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Setup virtual environment
    pip_command = setup_virtual_environment()
    if not pip_command:
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies(pip_command):
        sys.exit(1)
    
    # Create configuration files
    create_env_file()
    create_models_directory()
    
    # Test installation
    if not test_installation():
        print("⚠️  Installation test failed, but setup may still work")
    
    print("\n🎉 Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Review and update .env file if needed")
    
    if platform.system() == 'Windows':
        print("2. Activate virtual environment: venv\\Scripts\\activate")
        print("3. Start ML service: python app.py")
    else:
        print("2. Activate virtual environment: source venv/bin/activate")
        print("3. Start ML service: python app.py")
    
    print("4. Test the service: python test_ml_service.py")
    print("5. Service will be available at: http://localhost:5000")
    print("\n🔗 Health check: http://localhost:5000/health")

if __name__ == '__main__':
    main()