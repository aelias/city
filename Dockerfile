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
COPY src/app.ts ./
ADD src/routes ./routes
ADD src/domain ./domain
ADD src/services ./services
ADD src/logger ./logger

# check files list
RUN ls -a

RUN npm install
RUN npm run build

EXPOSE 3000

CMD [ "node", "./dist/app.js" ]

