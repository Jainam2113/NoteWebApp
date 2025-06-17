# Simple development Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Create basic static files if they don't exist
RUN mkdir -p static/.well-known/appspecific && \
    echo '{"customNetworkConditions": [], "customUserAgents": []}' > static/.well-known/appspecific/com.chrome.devtools.json

# Expose the development port
EXPOSE 5173

# Run development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]