FROM --platform=linux/amd64 node:18.16.1-bullseye
WORKDIR /app
COPY . /app
RUN npm ci --only=production
EXPOSE 4000
CMD [ "npm", "start" ]
