# CITY Exercise
NodeJS + Typescript exercise for CITY

### How to start locally?

- Clone this repo: `git clone https://github.com/aelias/city.git`
- Install dependencies: `npm install`
- Run the project: `npm run serve`

### How to execute tests
- Just run `npm test` in the root directory, after installing dependencies

### How to see coverage
- Just run `npx jest --coverage` in the root directory to see the coverage

### How to build the project
After installing dependencies (see previous instructions) you can simply type 
`npm run build` and you will find the project transpiled to plain javascript 
in the `./dist` folder.

### Example requests and responses
#### Request: 
```bash
curl --location --request POST 'localhost:3000/v1/upload' \
--form 'n="3"' \
--form 'file=@"./libro.txt"'
```
#### Response
###### Status: 200
```json
{
      "frequencies": [
            {
                "word": "the",
                "count": 1807
            },
            {
                "word": "of",
                "count": 1068
            },
            {
                "word": "and",
                "count": 1043
            }
      ]
}
```

#### Request:
```bash
curl --location --request POST 'localhost:3000/v1/upload' \
--form 'n="ppp"' \
--form 'file=@"./libro.txt"'
```
#### Response
###### Status: 400
```json
{
    "status": 400,
    "message": "n is not a number"
}
```
#### Request:
```bash
curl --location --request POST 'localhost:3000/v1/upload' \
--form 'n="3"' \
```
#### Response
###### Status: 400
```json
{
    "status": 400,
    "message": "no file being uploaded"
}
```

#### Request:
```bash
curl --location --request POST 'localhost:3000/v1/upload' \
--form 'n="100000000"' \
--form 'file=@"./libro.txt"'
```
#### Response
###### Status: 400
```json
{
    "status": 400,
    "message": "n is greater than the amount of words in the file"
}
```

### Docker support (run)
- Check docker is properly installed in your system
- Build the image: `docker build -t test-city`
- Run the image: `docker run -it -p 3000:3000 test-city`

Now you have the API running in a docker container

### Space to improve
- Work over chunks of received data to process them in an async way
- Improve architecture
- Add load tests to the project

#### Beyond the requirements. Needs to be discussed with stakeholders
- Convert the API to an async API, using message bus (maybe Kafka) and callbacks
  (after consumers) to call the client when the processing of big files finished.
- Also, with this approach we can think in scaling a processor service, and have
  another service processing the responses. Just an idea. One  possibility is to 
  identify each transaction (meaning each file uploaded) with a unique id, 
  and once all chunks are being processed, no matter what instance do the work, 
  the answer service take the "transaction completed message" for this transaction 
  from the message bus and forward results to the client.

