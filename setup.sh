#!/bin/bash

# NeuraMaint Master Setup Script
# Initializes the entire development environment
# Compatible with Windows (Git Bash/WSL) and Unix systems

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${PURPLE}============================================${NC}"
    echo -e "${PURPLE}     NeuraMaint Development Setup${NC}"
    echo -e "${PURPLE}============================================${NC}"
}

print_section() {
    echo -e "${BLUE}--- $1 ---${NC}"
}

print_step() {
    echo -e "${YELLOW}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check requirements
check_requirements() {
    print_section "Checking Requirements"
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node -v | sed 's/v//')
        REQUIRED_VERSION="18.0.0"
        
        if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
            print_success "Node.js $NODE_VERSION is compatible (>= $REQUIRED_VERSION)"
        else
            print_error "Node.js $NODE_VERSION is not compatible. Required >= $REQUIRED_VERSION"
            exit 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js >= 18.0.0"
        exit 1
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm -v)
        print_success "npm $NPM_VERSION found"
    else
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check Git (optional but recommended)
    if command_exists git; then
        GIT_VERSION=$(git --version | cut -d' ' -f3)
        print_success "Git $GIT_VERSION found"
    else
        print_info "Git not found (optional but recommended for development)"
    fi
}

# Setup backend
setup_backend() {
    print_section "Setting up Backend"
    
    if [ -d "backend" ]; then
        cd backend
        
        print_step "Running backend setup..."
        if [ -f "setup.sh" ]; then
            chmod +x setup.sh
            ./setup.sh
        else
            print_error "Backend setup script not found"
            exit 1
        fi
        
        cd ..
        print_success "Backend setup completed"
    else
        print_error "Backend directory not found"
        exit 1
    fi
}

# Setup frontend
setup_frontend() {
    print_section "Setting up Frontend"
    
    if [ -d "frontend" ]; then
        cd frontend
        
        print_step "Running frontend setup..."
        if [ -f "setup.sh" ]; then
            chmod +x setup.sh
            ./setup.sh
        else
            print_error "Frontend setup script not found"
            exit 1
        fi
        
        cd ..
        print_success "Frontend setup completed"
    else
        print_error "Frontend directory not found"
        exit 1
    fi
}

# Setup ML service
setup_ml_service() {
    print_section "Setting up ML Service"
    
    if [ -d "ml-service" ]; then
        cd ml-service
        
        # Check if Python is installed
        if command_exists python3; then
            PYTHON_CMD="python3"
        elif command_exists python; then
            PYTHON_CMD="python"
        else
            print_error "Python is not installed. ML Service setup skipped."
            cd ..
            return
        fi
        
        PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | cut -d' ' -f2)
        print_info "Found Python $PYTHON_VERSION"
        
        # Create virtual environment if it doesn't exist
        if [ ! -d "venv" ]; then
            print_step "Creating Python virtual environment..."
            $PYTHON_CMD -m venv venv
            print_success "Virtual environment created"
        fi
        
        # Activate virtual environment
        if [ -f "venv/bin/activate" ]; then
            source venv/bin/activate
        elif [ -f "venv/Scripts/activate" ]; then
            source venv/Scripts/activate
        fi
        
        # Install requirements if requirements.txt exists
        if [ -f "requirements.txt" ]; then
            print_step "Installing Python dependencies..."
            pip install -r requirements.txt
            print_success "Python dependencies installed"
        else
            print_info "requirements.txt not found, skipping Python dependencies"
        fi
        
        deactivate 2>/dev/null || true
        cd ..
        print_success "ML Service setup completed"
    else
        print_info "ML Service directory not found, skipping"
    fi
}

# Create development configuration
create_dev_config() {
    print_section "Creating Development Configuration"
    
    # Create .vscode workspace settings
    if [ ! -f ".vscode/settings.json" ]; then
        mkdir -p .vscode
        cat > .vscode/settings.json << EOF
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "files.associations": {
    "*.env*": "properties"
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true,
    "**/.git": true,
    "**/venv": true,
    "**/__pycache__": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true,
    "**/venv": true,
    "**/__pycache__": true
  }
}
EOF
        print_success "VS Code workspace settings created"
    fi
    
    # Create README for development
    if [ ! -f "DEVELOPMENT.md" ]; then
        cat > DEVELOPMENT.md << EOF
# NeuraMaint - Development Guide

## Quick Start

1. **Setup All Services:**
   \`\`\`bash
   ./setup.sh
   \`\`\`

2. **Start Development Servers:**
   
   **Backend:**
   \`\`\`bash
   cd backend
   npm run start:dev
   \`\`\`
   
   **Frontend:**
   \`\`\`bash
   cd frontend
   npm run dev
   \`\`\`
   
   **ML Service:**
   \`\`\`bash
   cd ml-service
   source venv/bin/activate  # or venv\\Scripts\\activate on Windows
   python app.py
   \`\`\`

3. **Access Services:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api-docs
   - ML Service: http://localhost:5000

## Default Test Users

- **Admin:** admin@neuramaint.com / admin123
- **Technician:** joao.silva@neuramaint.com / tech123
- **Manager:** maria.santos@neuramaint.com / manager123

## Database

Run seed script to populate with test data:
\`\`\`bash
cd backend
npm run seed
\`\`\`

## Useful Commands

- \`npm run build\` - Build for production
- \`npm run test\` - Run tests
- \`npm run lint\` - Check code style
- \`npx prisma studio\` - Open database browser
EOF
        print_success "Development guide created"
    fi
}

# Main setup function
main() {
    print_header
    
    print_info "Initializing NeuraMaint development environment..."
    print_info "Working directory: $(pwd)"
    echo
    
    check_requirements
    echo
    
    setup_backend
    echo
    
    setup_frontend
    echo
    
    setup_ml_service
    echo
    
    create_dev_config
    echo
    
    print_success "🎉 Development environment setup completed!"
    echo
    print_info "📚 Next steps:"
    print_info "1. Read DEVELOPMENT.md for detailed instructions"
    print_info "2. Configure database connection in backend/.env"
    print_info "3. Run database migrations and seed data"
    print_info "4. Start development servers"
    echo
    print_info "🚀 Happy coding!"
}

# Execute if run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi