import express from 'express';
import ApiRouter from "./routes/api-router";
import FileUploadService from "./services/file-upload-service";

const app = express();
const port = 3000;

// Instantiate v1 router
let fileUploadService: FileUploadService = new FileUploadService();
let apiRouter = new ApiRouter(fileUploadService);

// V1 Routes
app.use('/v1', apiRouter.getRouter());

app.listen(port, () => {
    console.log(`Most repeated words API running on port ${port}.`);
});


