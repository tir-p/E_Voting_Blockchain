# Docker Setup Summary

This document summarizes all Docker-related changes made to the E-Voting Blockchain application.

## Files Created

### 1. **Dockerfile** - Multi-stage Docker image

- **Purpose**: Build and run the Next.js application
- **Stages**:
  - Builder: Installs dependencies and builds the app
  - Runtime: Optimized production image with `dumb-init` for proper signal handling
- **Features**:
  - Uses Node.js 22 Alpine (slim image)
  - Installs both frontend and blockchain dependencies
  - Includes contract artifacts in final image
  - Exposes port 3000

### 2. **docker-compose.yml** - Service orchestration

- **Services**:
  - `hardhat-node`: Local Ethereum test node (optional, for development)
  - `app`: Next.js application
- **Features**:
  - Network isolation (voting-network)
  - Environment variable configuration
  - Volume mounts for data persistence
  - Service health checks
  - Dependency management

### 3. **docker-compose.override.yml** - Local development configuration

- **Purpose**: Automatically enables development mode when running `docker-compose up`
- **Features**:
  - Sets chain ID to 31337 (local Hardhat)
  - Uses local RPC URL (http://hardhat-node:8545)
  - Enables hot-reload with `npm run dev`
  - Dev dependencies included in builder stage

### 4. **.env.example** - Environment variable template

- **Purpose**: Documentation for required environment variables
- **Variables**:
  - Network configuration (RPC URLs, Chain IDs)
  - Contract configuration (address, gas limits)
  - Deployment credentials (private key for Sepolia)
  - Node environment settings

### 5. **.dockerignore** - Docker build optimization

- **Purpose**: Exclude unnecessary files from Docker build context
- **Excludes**: git files, node_modules, logs, build artifacts

### 6. **DOCKER.md** - Complete Docker documentation

- **Content**:
  - Quick start guide
  - Environment variable reference
  - Common tasks and commands
  - Troubleshooting guide
  - Security best practices
  - Local vs Production setup

### 7. **docker-helper.sh** - Helper script for common operations

- **Purpose**: Simplify Docker operations for developers
- **Commands**:
  - `up`: Start services with auto-reload
  - `up-prod`: Production mode (Sepolia)
  - `down`: Stop services
  - `logs`: View application logs
  - `deploy-local/sepolia`: Deploy contracts
  - `test`: Run contract tests
  - `lint`: Lint frontend code
  - And more...

## Files Modified

### 1. **lib/blockchain.js** - Environment variable configuration

- **Changed**:
  - `CONTRACT_ADDRESS`: Now reads from `process.env.NEXT_PUBLIC_CONTRACT_ADDRESS` with fallback to artifact
  - `CHAIN_ID`: Now reads from `process.env.NEXT_PUBLIC_CHAIN_ID` with fallback to 11155111
  - `RPC_URL`: Now reads from `process.env.NEXT_PUBLIC_RPC_URL`
  - `LOCAL_RPC_URL`: Now reads from `process.env.NEXT_PUBLIC_LOCAL_RPC_URL`
  - `CONTRACT_TRANSACTION_GAS_LIMIT`: Now reads from `process.env.NEXT_PUBLIC_CONTRACT_GAS_LIMIT`

### 2. **blockchain/hardhat.config.js** - Hardhat configuration

- **Changed**:
  - `SEPOLIA_RPC_URL`: Now reads from environment variable with fallback
  - `SEPOLIA_PRIVATE_KEY`: Now reads from environment variable (empty by default)
  - Added `LOCAL_RPC_URL` environment variable support
  - `localhost` network now uses `LOCAL_RPC_URL` environment variable

### 3. **scripts/wait-for-contract-artifact.mjs** - Contract waiting script

- **Changed**:
  - `RPC_URL`: Now reads from `process.env.NEXT_PUBLIC_RPC_URL` with fallback

### 4. **.gitignore** - Git configuration

- **Added**:
  - `.env` - Prevent committing environment variables
  - `.env.local` - Prevent committing local overrides
  - `.env.*.local` - Prevent committing environment-specific files

## Environment Variables (All Externalized)

| Variable                         | Location                 | Purpose            | Default                  |
| -------------------------------- | ------------------------ | ------------------ | ------------------------ |
| `NEXT_PUBLIC_CHAIN_ID`           | .env, docker-compose.yml | Network ID         | 11155111                 |
| `NEXT_PUBLIC_RPC_URL`            | .env, docker-compose.yml | Read RPC endpoint  | Sepolia Alchemy          |
| `NEXT_PUBLIC_LOCAL_RPC_URL`      | .env, docker-compose.yml | Local RPC endpoint | http://hardhat-node:8545 |
| `NEXT_PUBLIC_CONTRACT_ADDRESS`   | .env, docker-compose.yml | Contract address   | (from artifact)          |
| `NEXT_PUBLIC_CONTRACT_GAS_LIMIT` | .env, docker-compose.yml | Gas limit          | 0x493e0                  |
| `SEPOLIA_RPC_URL`                | .env, docker-compose.yml | Deployment RPC     | Sepolia Alchemy          |
| `SEPOLIA_PRIVATE_KEY`            | .env, docker-compose.yml | Deployment key     | (empty)                  |
| `NODE_ENV`                       | .env, docker-compose.yml | Node environment   | production               |

## Quick Start

1. **Copy environment template**:

   ```bash
   cp .env.example .env
   ```

2. **Edit .env with your values**:
   - Add your Alchemy API key to RPC URLs
   - Add your private key for Sepolia deployments

3. **Start development with local node**:

   ```bash
   docker-compose up --build
   ```

   Or use helper script:

   ```bash
   ./docker-helper.sh up-build
   ```

4. **For production (Sepolia)**:
   ```bash
   docker-compose -f docker-compose.yml up --build
   ```

## Security Improvements

✅ **Hardcoded credentials removed** from source code
✅ **All configuration externalized** to environment variables
✅ **Private keys never committed** (added to .gitignore)
✅ **.env files documented** with .env.example
✅ **Multi-stage build** reduces attack surface
✅ **dumb-init** ensures proper signal handling and zombie process cleanup

## Architecture Benefits

- **Development**: Can use local Hardhat node without Sepolia setup
- **Production**: Connects to Sepolia or any configured network
- **CI/CD Ready**: Easy to inject secrets via environment variables
- **Scalable**: Easy to add more services (database, cache, etc.)
- **Portable**: Runs consistently across local, CI/CD, and production
- **Optimized**: Multi-stage build results in minimal image size

## Next Steps

1. Copy `.env.example` to `.env`
2. Add your Alchemy API key and Sepolia private key
3. Run `./docker-helper.sh up-build` for local development
4. Or use `docker-compose up` for standard Docker Compose experience
5. Visit http://localhost:3000

See [DOCKER.md](DOCKER.md) for comprehensive documentation.
