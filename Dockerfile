FROM node:16

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Use environment variables for configuration
# Set default environment variables (can be overridden at runtime)
ENV OPTIMOD_ADDRESS=192.168.1.100
ENV SNMP_COMMUNITY=public
ENV POLL_INTERVAL_MS=5000

CMD ["node", "index.js"]
