# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json /app

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . /app

# Expose the port the app runs on
EXPOSE 8080

# Run the application
CMD ["node", "server.js"]
