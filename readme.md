# Orban Optimod SNMP to EmberPlus Gateway

This project is a Node.js–based gateway that polls an Orban Optimod (this is built for 8700i) device via SNMP and publishes its status and monitoring data to EmberPlus clients. The EmberPlus tree includes:

- **Device Info**: Firmware version and station name.
- **Monitoring**: Input statuses (analog, digital, silent, error, power supply).
- **Status**: A flag indicating if the device is connected and a timestamp for the last successful SNMP poll.

## Features

- **SNMP Polling**: Regularly polls the Optimod using SNMP to retrieve key device parameters.
- **EmberPlus Tree**: Uses the `emberplus-connection` library to build and update an EmberPlus tree.
- **Status Indicators**: Provides immediate feedback on connection status and data freshness.
- **Docker Support**: Easily containerize the application using the provided Dockerfile and docker-compose configuration.

## Prerequisites

- Node.js (v16 or later)
- npm

## Installation

1. **Clone the Repository:**
   ```bash
   git clone <repository-url>
   cd optimod-emberplus-gateway
2. **Install Dependencies:**
    ```
    npm install
    ```
# Configuration
Configure the application using environment variables. You can create a .env file in the project root:


```
OPTIMOD_ADDRESS=192.168.1.100
SNMP_COMMUNITY=public
POLL_INTERVAL_MS=5000
EMBERPLUS_PORT=9000
```

# Running the Application
## Locally
Start the gateway with:
```
npm start
```

## Using Docker
A Dockerfile and docker-compose.yml are provided. To build and run with Docker Compose:


```
docker-compose up --build
```

# License
This project is licensed under the MIT License.
