# Docker Setup for E-Voting Blockchain Application

This guide explains how to run the E-Voting Blockchain application using Docker and Docker Compose.

## Prerequisites

- Docker Desktop installed ([download](https://www.docker.com/products/docker-desktop))
- Docker Compose (included with Docker Desktop)

## Quick Start

### 1. Create environment configuration

Copy the example environment file and update it with your configuration:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

- `SEPOLIA_RPC_URL`: Your Alchemy or Infura RPC endpoint for Sepolia
- `SEPOLIA_PRIVATE_KEY`: Private key of wallet that will deploy the contract
- `NEXT_PUBLIC_CONTRACT_ADDRESS`: Contract address after deployment

### 2. Local Development (with Hardhat Node)

For local testing with a local Hardhat blockchain:

```bash
docker-compose up --build
```

This will:

- Start a local Hardhat node on `http://localhost:8545`
- Build and start the Next.js app on `http://localhost:3000`
- Auto-reload on code changes

Visit http://localhost:3000 to access the application.

The `docker-compose.override.yml` automatically configures the app to use the local hardhat node (chain ID 31337).

### 3. Production Setup (with Sepolia)

To run against Sepolia testnet:

```bash
# Ensure .env has your Sepolia credentials
docker-compose -f docker-compose.yml up --build
```

This will:

- Start the Next.js app on `http://localhost:3000`
- Connect to Sepolia via your configured RPC URL
- Use your private key for deployments

## Environment Variables

All environment variables are defined in `.env` file. Key variables:

| Variable                         | Purpose                                               | Default                     |
| -------------------------------- | ----------------------------------------------------- | --------------------------- |
| `NEXT_PUBLIC_CHAIN_ID`           | Blockchain network ID (11155111=Sepolia, 31337=Local) | `11155111`                  |
| `NEXT_PUBLIC_RPC_URL`            | RPC endpoint for read operations                      | Sepolia Alchemy             |
| `NEXT_PUBLIC_LOCAL_RPC_URL`      | Local Hardhat node URL                                | `http://hardhat-node:8545`  |
| `NEXT_PUBLIC_CONTRACT_ADDRESS`   | Deployed contract address                             | Empty (set after deploy)    |
| `NEXT_PUBLIC_CONTRACT_GAS_LIMIT` | Gas limit in hex                                      | `0x493e0`                   |
| `SEPOLIA_RPC_URL`                | Sepolia RPC for deployments                           | Sepolia Alchemy             |
| `SEPOLIA_PRIVATE_KEY`            | Private key for contract deployment                   | Empty (required for deploy) |
| `NODE_ENV`                       | Node environment                                      | `production`                |

## Docker Compose Services

### hardhat-node

- **Purpose**: Local Hardhat Ethereum node for development
- **Port**: 8545
- **Used for**: Local testing without requiring Sepolia testnet ETH
- **Only runs**: When using `docker-compose up` (local development)

### app

- **Purpose**: Next.js frontend application
- **Port**: 3000
- **Environment**: Configured via `.env` file
- **Volumes**:
  - Maps `./data` for persistent vote records
  - Maps `./contracts` for contract artifacts

## Common Tasks

### Deploy Contract to Sepolia

```bash
# First, ensure hardhat-node service is running or adjust .env to skip it
docker-compose exec app npm run deploy:sepolia
```

Or manually:

```bash
docker-compose up -d  # Start services
docker-compose exec app bash
cd blockchain
npx hardhat run scripts/setup-election.js --network sepolia
```

### Stop Services

```bash
docker-compose down
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f hardhat-node
```

### Rebuild Images

```bash
docker-compose up --build
```

### Development with Hot Reload

The `docker-compose.override.yml` enables development mode with:

- Hot module reloading via `npm run dev`
- Rebuilt builder stage with devDependencies
- Automatic code reloading on file changes

## Environment-Specific Usage

### Local Development

```bash
# Uses docker-compose.override.yml automatically
# Connects to local hardhat node (chain ID 31337)
docker-compose up
```

### Production like (Sepolia)

```bash
# Ignore docker-compose.override.yml
# Connect to Sepolia testnet
docker-compose -f docker-compose.yml up
```

## Security Notes

⚠️ **IMPORTANT**:

- **Never commit `.env` file** to version control - it contains private keys
- Use `cp .env.example .env` to create a local copy
- Git is configured to ignore `.env` files (see `.gitignore`)
- Keep `SEPOLIA_PRIVATE_KEY` secret - use environment variable injection in CI/CD
- For production, use Docker secrets or environment variable encryption

## Troubleshooting

### "Cannot connect to Hardhat node"

- Ensure `hardhat-node` service started: `docker-compose logs hardhat-node`
- Check port 8545 is not in use: `lsof -i :8545`
- Wait for healthcheck to pass (takes ~10 seconds)

### "Contract address not found"

- Update `.env` with correct `NEXT_PUBLIC_CONTRACT_ADDRESS`
- Run deployment script: `npm run deploy:sepolia` or `npm run deploy:local`

### "MetaMask connection issues"

- Verify browser RPC URL in `.env` is accessible
- For local hardhat: Add custom network in MetaMask (Chain ID: 31337)
- For Sepolia: Switch to Sepolia network in MetaMask

### Port already in use

- Change ports in `docker-compose.yml`
- Or kill existing process: `lsof -i :3000` and `kill -9 <PID>`

## Build Configuration

The Dockerfile uses multi-stage build:

1. **Builder stage**: Installs all dependencies and builds Next.js
2. **Runtime stage**: Minimal production image with only necessary files

Benefits:

- Smaller final image size
- Production-optimized image
- Faster deployments

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment/docker)
- [Hardhat Testing Guide](https://hardhat.org/testing.html)
