#!/bin/bash

# Enhanced Messenger Bot - Quick Installation Script
# This script automates the initial setup process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_color() {
    printf "${2}${1}${NC}\n"
}

print_header() {
    echo ""
    print_color "================================" $BLUE
    print_color "$1" $BLUE
    print_color "================================" $BLUE
}

print_success() {
    print_color "✅ $1" $GREEN
}

print_warning() {
    print_color "⚠️  $1" $YELLOW
}

print_error() {
    print_color "❌ $1" $RED
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("Node.js 18+")
    else
        node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -lt 18 ]; then
            missing_deps+=("Node.js 18+ (current: $(node --version))")
        else
            print_success "Node.js $(node --version)"
        fi
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    else
        print_success "npm $(npm --version)"
    fi
    
    if ! command_exists git; then
        missing_deps+=("git")
    else
        print_success "git $(git --version | cut -d' ' -f3)"
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_error "Missing dependencies:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        echo ""
        print_warning "Please install missing dependencies and run this script again."
        echo "Visit: https://nodejs.org/ for Node.js installation"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    print_color "Installing npm packages..." $YELLOW
    npm install
    print_success "Dependencies installed"
    
    # Install TypeScript globally if not present
    if ! command_exists tsc; then
        print_color "Installing TypeScript globally..." $YELLOW
        npm install -g typescript tsx
        print_success "TypeScript installed globally"
    else
        print_success "TypeScript already available"
    fi
}

# Setup environment
setup_environment() {
    print_header "Setting Up Environment"
    
    if [ ! -f .env ]; then
        print_color "Creating environment file..." $YELLOW
        cp .env.example .env
        print_success "Environment file created from template"
        print_warning "Please edit .env file with your API keys and configuration"
    else
        print_warning ".env file already exists, skipping..."
    fi
    
    # Create necessary directories
    print_color "Creating necessary directories..." $YELLOW
    mkdir -p logs uploads data temp
    print_success "Directories created"
}

# Build project
build_project() {
    print_header "Building Project"
    
    print_color "Compiling TypeScript..." $YELLOW
    npm run build
    print_success "Project built successfully"
}

# Setup database (optional)
setup_database() {
    print_header "Database Setup"
    
    if command_exists docker; then
        read -p "Do you want to start MongoDB and Redis using Docker? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_color "Starting database services with Docker..." $YELLOW
            docker-compose up -d mongodb redis
            print_success "Database services started"
            print_color "MongoDB: localhost:27017" $BLUE
            print_color "Redis: localhost:6379" $BLUE
        fi
    else
        print_warning "Docker not found. You'll need to install MongoDB and Redis manually."
        print_color "MongoDB: https://docs.mongodb.com/manual/installation/" $BLUE
        print_color "Redis: https://redis.io/download" $BLUE
    fi
}

# Generate random secrets
generate_secrets() {
    print_header "Generating Security Keys"
    
    if [ -f .env ]; then
        # Generate random strings for security
        jwt_secret=$(openssl rand -hex 32 2>/dev/null || echo "$(date +%s)_$(whoami)_jwt_secret_change_me")
        encryption_key=$(openssl rand -hex 32 2>/dev/null || echo "$(date +%s)_$(whoami)_encryption_key_change_me")
        session_secret=$(openssl rand -hex 32 2>/dev/null || echo "$(date +%s)_$(whoami)_session_secret_change_me")
        
        # Update .env file with generated secrets
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/JWT_SECRET=your_jwt_secret_here/JWT_SECRET=$jwt_secret/" .env
            sed -i '' "s/ENCRYPTION_KEY=your_encryption_key_here/ENCRYPTION_KEY=$encryption_key/" .env
            sed -i '' "s/SESSION_SECRET=your_session_secret_here/SESSION_SECRET=$session_secret/" .env
        else
            # Linux
            sed -i "s/JWT_SECRET=your_jwt_secret_here/JWT_SECRET=$jwt_secret/" .env
            sed -i "s/ENCRYPTION_KEY=your_encryption_key_here/ENCRYPTION_KEY=$encryption_key/" .env
            sed -i "s/SESSION_SECRET=your_session_secret_here/SESSION_SECRET=$session_secret/" .env
        fi
        
        print_success "Security keys generated and updated in .env"
    fi
}

# Show next steps
show_next_steps() {
    print_header "Installation Complete! 🎉"
    
    print_color "Next steps:" $GREEN
    echo "1. Edit the .env file with your API keys:"
    echo "   - TELEGRAM_BOT_TOKEN (get from @BotFather on Telegram)"
    echo "   - OPENAI_API_KEY (get from OpenAI Platform)"
    echo ""
    echo "2. Start the bot:"
    echo "   npm run dev    # Development mode with auto-reload"
    echo "   npm start      # Production mode"
    echo ""
    echo "3. Or use Docker:"
    echo "   docker-compose up -d"
    echo ""
    echo "4. Access the dashboard:"
    echo "   http://localhost:3000/dashboard"
    echo "   Username: admin"
    echo "   Password: (check your .env file)"
    echo ""
    print_color "Documentation:" $BLUE
    echo "- Setup Guide: SETUP_GUIDE.md"
    echo "- Improvements: IMPROVEMENTS_SUMMARY.md"
    echo "- Main README: ENHANCED_BOT_README.md"
    echo ""
    print_success "Happy coding! 🚀"
}

# Main installation process
main() {
    clear
    print_color "🚀 Enhanced Messenger Bot - Installation Script" $BLUE
    print_color "This script will set up your enhanced messenger bot" $BLUE
    echo ""
    
    read -p "Continue with installation? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_color "Installation cancelled." $YELLOW
        exit 0
    fi
    
    check_prerequisites
    install_dependencies
    setup_environment
    generate_secrets
    build_project
    setup_database
    show_next_steps
}

# Run main function
main "$@"