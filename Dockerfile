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
COPY app.ts ./
ADD routes ./routes
ADD domain ./domain
ADD services ./services

# check files list
RUN ls -a

RUN npm install
RUN npm run build

EXPOSE 3000

CMD [ "node", "./dist/app.js" ]

