import express, {Router} from "express";
import {IFileUploadService} from "../services/file-upload-service";
import {APIErrors} from "../domain/error";

export const MOST_FREQUENT_WORDS_ENDPOINT = '/most-frequent-words';

export default class ApiRouter {
    theRouter: Router;
    fileUploadService: IFileUploadService;

    constructor(service: IFileUploadService) {
        this.theRouter = express.Router();
        this.fileUploadService = service;
        this.setupRoutes();
    }

    setupRoutes = () => {
        this.theRouter.post(MOST_FREQUENT_WORDS_ENDPOINT, this.uploadFile);
    }

    uploadFile = (req, res) => {
        if (req.headers['content-type'] === undefined) {
            res.status(APIErrors.NoContentTypeHeader.status).json(APIErrors.NoContentTypeHeader);
            return;
        }
        if (req.headers['content-type'].lastIndexOf('multipart/form-data; boundary=') === -1) {
            res.status(APIErrors.NoExpectedContentTypeHeader.status).json(APIErrors.NoExpectedContentTypeHeader);
            return;
        }
        this.fileUploadService.handler(req, res)
    }

    getRouter = () => {
        return this.theRouter;
    }
}