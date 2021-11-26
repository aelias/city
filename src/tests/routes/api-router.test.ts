import ApiRouter, {MOST_FREQUENT_WORDS_ENDPOINT} from "../../routes/api-router";
import request from "supertest";
import express, {Request, Response, NextFunction} from "express";

describe('Testing file controller', () => {
    let COMPLETE_ENDPOINT = '/v1' + MOST_FREQUENT_WORDS_ENDPOINT

    test('Test get not allowed', async () => {
        let app = express();
        let mockService = {
            handler: (req:Request, res:Response) => {
                return "";
            }
        }
        let fController = new ApiRouter(mockService)
        app.use('/v1', fController.getRouter());
        let response = await request(app).get(COMPLETE_ENDPOINT);
        expect(response.status).toBe(404);
    });

    test('Test post fails if content-type is not present ', async () => {
        let app = express();
        let mockService = {
            handler: (req:Request, res:Response) => {
                return "";
            }
        }
        let fController = new ApiRouter(mockService)
        app.use('/v1', fController.getRouter());

        let response = await request(app).post(COMPLETE_ENDPOINT);
        expect(response.status).toBe(400);
        expect(response.body.status).toBe(400);
        expect(response.body.message).toBe('No content-type header defined in call')
    });

    test('Test fail no expected content-type header', async () => {
        let app = express();
        let mockService = {
            handler: (req:Request, res:Response) => {
                return "";
            }
        }
        let fController = new ApiRouter(mockService)
        app.use('/v1', fController.getRouter());

        let response = await request(app)
            .post(COMPLETE_ENDPOINT)
            .set({
                'content-type': 'application/json'
            });
        expect(response.status).toBe(400);
        expect(response.body.status).toBe(400);
        expect(response.body.message).toBe('No expected content-type present in call')
    });

    test('Test service handler is called ', async () => {
        let app = express();
        let mockService = {
            handler: (req:Request, res:Response) => {
                res.status(200).json({
                    status: 200,
                    message: 'service handler called'
                });
            }
        }
        let fController = new ApiRouter(mockService)
        app.use('/v1', fController.getRouter());

        await request(app)
            .post(COMPLETE_ENDPOINT)
            .set({
                'content-type': 'multipart/form-data; boundary=-----12348756'
            })
            .expect(200)
            .expect('{"status":200,"message":"service handler called"}');
    });
});


