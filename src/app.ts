import express, {Express} from 'express';
import ApiRouter from "./routes/api-router";
import FileUploadService from "./services/file-upload-service";
import {logger} from "./logger/winston";

const app: Express = express();
const port = 3000;

// Instantiate v1 router
let fileUploadService: FileUploadService = new FileUploadService();
let apiRouter: ApiRouter = new ApiRouter(fileUploadService);

// V1 Routes
app.use('/v1', apiRouter.getRouter());

logger.info('Starting application');

app.listen(port, () => {
    logger.info(`Most frequent words API running on port ${port}.`);
});


