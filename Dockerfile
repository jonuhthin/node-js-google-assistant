# Use an official Node.js runtime as the base image
FROM node:20

# Set the working directory
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the source code
COPY src /usr/src/app/src

# Expose the port the app will run on
EXPOSE ${PORT}

# Run the application
CMD [ "node", "src/index.js" ]
