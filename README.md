# Basic Uniswap Wrapper API

A simple API wrapper for Uniswap that provides endpoints for getting token swap amounts and gas prices.

## Features

- Get amount out for token swaps
- Get current gas prices
- Built with NestJS and Fastify
- TypeScript support
- Swagger API documentation

## Prerequisites

- Node.js (v20 or higher)
- Yarn package manager
- Ethereum RPC node URL

## Installation

1. Clone the repository:
```bash
git clone https://github.com/truehazker/basic-uniswap-wrapper-api
cd basic-uniswap-wrapper-api
```

2. Install dependencies:
```bash
yarn install
```

> Note that we're using yarn v4. To use this yarn version you should enable corepack first

3. Create a `.env` file in the root directory with the following variables:
```env
# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=9090
NODE_ENV=development

# Ethereum Configuration
RPC_URL=<your-ethereum-rpc-url>

# Optional Configuration
LOG_LEVEL=log,error,warn,debug,verbose
GAS_MONITORING_INTERVAL=1000
UNISWAP_FACTORY_ADDRESS=0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f
PAIR_CACHE_TTL=3600000
```

## Available Commands

- `yarn start` - Start the application
- `yarn start:dev` - Start the application in development mode with hot-reload
- `yarn start:debug` - Start the application in debug mode
- `yarn start:prod` - Start the application in production mode
- `yarn build` - Build the application
- `yarn format` - Format code using Prettier
- `yarn lint` - Lint code using ESLint
- `yarn test` - Run all tests
- `yarn test:watch` - Run tests in watch mode
- `yarn test:cov` - Run tests with coverage
- `yarn test:unit` - Run unit tests
- `yarn test:integration` - Run integration tests
- `yarn test:e2e` - Run end-to-end tests

## API Endpoints

### Get Amount Out
```
GET /return/:fromTokenAddress/:toTokenAddress/:amountIn
```
Get the expected amount of tokens you'll receive for a swap.

**Parameters:**
- `fromTokenAddress` - Address of the token you're swapping from
- `toTokenAddress` - Address of the token you're swapping to
- `amountIn` - Amount of tokens you're swapping (in wei)

**Response:**
```json
{
  "amountOut": "1000000000000000000" // Amount in wei
}
```

### Get Gas Price
```
GET /gasPrice
```
Get the current gas price on the Ethereum network.

**Response:**
```json
{
  "gasPrice": "20000000000" // Gas price in wei
}
```

## API Documentation

Once the application is running, you can access the Swagger API documentation at:
```
http://localhost:9090/api
```

> Make sure you're running in development mode, as Swagger documentation is only available while running with NODE_ENV = development
