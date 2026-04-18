#!/bin/bash
# Helper script for Docker operations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}ℹ${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Check if .env exists
check_env() {
    if [ ! -f .env ]; then
        print_warn ".env file not found"
        print_info "Creating .env from .env.example..."
        cp .env.example .env
        print_warn "Please update .env with your actual values, especially:"
        print_warn "  - SEPOLIA_RPC_URL (with your API key)"
        print_warn "  - SEPOLIA_PRIVATE_KEY (if deploying to Sepolia)"
        print_error "Update .env and run again"
        exit 1
    fi
}

# Help text
show_help() {
    cat << EOF
E-Voting Blockchain Docker Helper

Usage: ./docker-helper.sh [COMMAND]

Commands:
    up              Start all services (with auto-reload in development)
    up-prod         Start services in production mode (Sepolia)
    up-build        Rebuild images and start services
    down            Stop all services
    logs            View logs from all services
    logs-app        View logs from Next.js app only
    logs-node       View logs from Hardhat node only
    shell           Open shell in app container
    deploy-local    Deploy contract to local Hardhat node
    deploy-sepolia  Deploy contract to Sepolia testnet
    test            Run contract tests
    lint            Run ESLint on frontend code
    clean           Remove containers and volumes
    help            Show this help message

Examples:
    # Local development with live reload
    ./docker-helper.sh up

    # Production setup (Sepolia)
    ./docker-helper.sh up-prod

    # View all logs
    ./docker-helper.sh logs

    # Deploy to Sepolia
    ./docker-helper.sh deploy-sepolia
EOF
}

# Main commands
case "${1:-help}" in
    up)
        print_info "Starting services in development mode..."
        check_env
        docker-compose up
        ;;
    up-prod)
        print_info "Starting services in production mode (Sepolia)..."
        check_env
        docker-compose -f docker-compose.yml up
        ;;
    up-build)
        print_info "Rebuilding images and starting services..."
        check_env
        docker-compose up --build
        ;;
    down)
        print_info "Stopping all services..."
        docker-compose down
        print_success "Services stopped"
        ;;
    logs)
        print_info "Showing logs from all services (Press Ctrl+C to exit)..."
        docker-compose logs -f
        ;;
    logs-app)
        print_info "Showing logs from Next.js app (Press Ctrl+C to exit)..."
        docker-compose logs -f app
        ;;
    logs-node)
        print_info "Showing logs from Hardhat node (Press Ctrl+C to exit)..."
        docker-compose logs -f hardhat-node
        ;;
    shell)
        print_info "Opening shell in app container..."
        check_env
        docker-compose exec app bash
        ;;
    deploy-local)
        print_info "Deploying contract to local Hardhat node..."
        check_env
        docker-compose exec app bash -c "cd blockchain && npx hardhat run scripts/setup-election.js --network hardhat"
        ;;
    deploy-sepolia)
        print_info "Deploying contract to Sepolia testnet..."
        check_env
        docker-compose exec app bash -c "cd blockchain && npx hardhat run scripts/setup-election.js --network sepolia"
        ;;
    test)
        print_info "Running contract tests..."
        check_env
        docker-compose exec app bash -c "cd blockchain && npm test"
        ;;
    lint)
        print_info "Running ESLint on frontend code..."
        check_env
        docker-compose exec app npm run lint
        ;;
    clean)
        print_warn "Removing containers, networks, and volumes..."
        docker-compose down -v
        print_success "Cleanup complete"
        ;;
    help)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
