FROM node:10-alpine

# update packages
RUN apk update

# create root application folder
WORKDIR /app

# copy configs to /app folder
COPY package*.json ./
COPY tsconfig.json ./
COPY jest.config.js ./
# APP code
RUN mkdir src
COPY src/app.ts ./src
ADD src/routes ./src/routes
ADD src/domain ./src/domain
ADD src/services ./src/services
ADD src/logger ./src/logger

# check files list
RUN ls -a

RUN npm install
RUN npm run build

EXPOSE 3000

CMD [ "node", "./dist/app.js" ]

