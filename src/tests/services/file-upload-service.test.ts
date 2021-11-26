import FileUploadService from "../../services/file-upload-service";
import express from "express";
import request from "supertest";
import ApiRouter, {MOST_FREQUENT_WORDS_ENDPOINT} from "../../routes/api-router";
import {BusboyConfig} from "busboy";

describe('Tests for file upload service', () => {
    const COMPLETE_ENDPOINT = '/v1' + MOST_FREQUENT_WORDS_ENDPOINT
    let app
    let service
    let apiRouter

    beforeAll(() => {
        app = express();
        service = new FileUploadService();
        apiRouter = new ApiRouter(service);
        app.use('/v1', apiRouter.getRouter())
    });

    test('Test static method convertDictToArrayAndReturnNGreater', () => {
        const dict = {
            "one": 5,
            "another": 10,
            "greater": 20,
        }
        const arr = FileUploadService.convertDictToArrayAndReturnNGreater(dict, 1);
        expect(arr).toStrictEqual([["greater", 20]]);
        const arr2 = FileUploadService.convertDictToArrayAndReturnNGreater(dict, 2);
        expect(arr2).toStrictEqual([["greater", 20], ["another", 10]]);
        const arr3 = FileUploadService.convertDictToArrayAndReturnNGreater(dict, 10);
        expect(arr3).toStrictEqual([["greater", 20], ["another", 10], ["one", 5]]);
    });

    test('Test static method buildResponse', () => {
        const dict = {
            "one": 5,
            "another": 10,
            "greater": 20,
        }
        const arr = FileUploadService.convertDictToArrayAndReturnNGreater(dict, 2);
        expect(FileUploadService.buildResponse(arr)).toStrictEqual({
            frequencies: [
                {
                    "count": 20,
                    "word": "greater"
                },
                {
                    "count": 10,
                    "word": "another"
                }
            ]
        });
    });

    test('Test static method buildResponse', () => {
        let buffer: string = "uno dos dos tres";
        expect(FileUploadService.bufferToWords(buffer)).toStrictEqual(["uno", "dos", "dos", "tres"]);

        buffer = "uno/ dos, dos# tres";
        expect(FileUploadService.bufferToWords(buffer)).toStrictEqual(["uno", "dos", "dos", "tres"]);

        buffer = "uno/ dos, dos#\n tres";
        expect(FileUploadService.bufferToWords(buffer)).toStrictEqual(["uno", "dos", "dos", "tres"]);
    });

    test('n is not a number', async () => {
        const NOT_A_NUMBER = 'NaN';

        let buffer = Buffer.from('one one two three');

        await request(app)
            .post(COMPLETE_ENDPOINT)
            .set({
                'content-type': 'application/json'
            })
            .type('form')
            .field('n', NOT_A_NUMBER)
            .attach('fileupload', buffer, 'custom_file_name.txt')
            .expect(400)
            .expect({ status: 400, message: 'n is not a number' });
    });

    test('not expected field name', async () => {
        const NOT_A_NUMBER = 'NaN';

        let buffer = Buffer.from('one one two three');

        await request(app)
            .post(COMPLETE_ENDPOINT)
            .set({
                'content-type': 'application/json'
            })
            .type('form')
            .field('no_expected', NOT_A_NUMBER)
            .attach('fileupload', buffer, 'custom_file_name.txt')
            .expect(400)
            .expect({ status: 400, message: 'not expected field name' });
    });

    test('Test fail n is greater than number of words', async () => {
        let buffer = Buffer.from('one one two two two three three four');

        await request(app)
            .post(COMPLETE_ENDPOINT)
            .set({
                'content-type': 'application/json'
            })
            .type('form')
            .field('n', '100')
            .attach('fileupload', buffer, 'custom_file_name.txt')
            .expect(400)
            .expect({
                status: 400,
                message: 'n is greater than the amount of words in the file'
            });
    });

    test('Test no file is being uploaded', async () => {
        await request(app)
            .post(COMPLETE_ENDPOINT)
            .set({
                'content-type': 'application/json'
            })
            .type('form')
            .field('n', '100')
            .expect(400)
            .expect({
                status: 400,
                message: 'no file being uploaded'
            });
    });

    test('Test filesize exceeded', async () => {
        let app = express();
        let service = new FileUploadService({
            limits: {
                files: 1,
                fileSize: 10
            }
        } as BusboyConfig);

        let apiRouter = new ApiRouter(service);
        app.use('/v1', apiRouter.getRouter())

        let buffer = Buffer.from('this is a very tiny buffer, but huge at the same time');

        await request(app)
            .post(COMPLETE_ENDPOINT)
            .set({
                'content-type': 'application/json'
            })
            .type('form')
            .field('n', '2')
            .attach('fileupload', buffer, 'file-name.txt')
            .expect(400)
            .expect({ status: 400, message: 'file size limit exceeded' });
    });

    test('Test words frequency ok with simple buffer', async () => {
        let buffer = Buffer.from('one one two two two three three four');

        await request(app)
            .post(COMPLETE_ENDPOINT)
            .set({
                'content-type': 'application/json'
            })
            .type('form')
            .field('n', '3')
            .attach('fileupload', buffer, 'custom_file_name.txt')
            .expect(200)
            .expect({
                frequencies: [
                    { word: 'two', count: 3 },
                    { word: 'one', count: 2 },
                    { word: 'three', count: 2 }
                ]
            });
    });

    test('Test last chunk left in buffer', async () => {
        let buffer = Buffer.from('one one two two two three\n three four');

        await request(app)
            .post(COMPLETE_ENDPOINT)
            .set({
                'content-type': 'application/json'
            })
            .type('form')
            .field('n', '3')
            .attach('fileupload', buffer, 'custom_file_name.txt')
            .expect(200)
            .expect({
                frequencies: [
                    { word: 'two', count: 3 },
                    { word: 'one', count: 2 },
                    { word: 'three', count: 2 }
                ]
            });
    });

    test('words frequency ok with punctuation characters', async () => {
        let buffer = Buffer.from('one. one two two, two three/ three four');

        await request(app)
            .post(COMPLETE_ENDPOINT)
            .set({
                'content-type': 'application/json'
            })
            .type('form')
            .field('n', '3')
            .attach('fileupload', buffer, 'custom_file_name.txt')
            .expect(200)
            .expect({
                frequencies: [
                    { word: 'two', count: 3 },
                    { word: 'one', count: 2 },
                    { word: 'three', count: 2 }
                ]
            });
    });

    test('Test words frequency ok (file provided for testing)', async () => {
        let buffer = Buffer.from(`Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer id purus imperdiet, condimentum enim a, volutpat nisi. Donec ut egestas tellus, sed dignissim lorem. Phasellus tristique ex eu mollis rutrum. Sed interdum eget sapien in placerat. Quisque eu neque euismod, scelerisque mauris at, bibendum tellus. Pellentesque non sem nec dui feugiat posuere. Vivamus ac diam auctor, commodo enim sed, lobortis magna. Nullam nunc risus, hendrerit sed augue ac, imperdiet facilisis libero. Quisque non mollis purus. Nullam vitae ornare lectus, at pellentesque justo. Duis ultrices sem in mi luctus finibus. Ut id ligula ante.

Donec sit amet lacus turpis. Praesent vitae erat ac elit scelerisque faucibus nec sed dui. Suspendisse in imperdiet sapien. Donec efficitur ex lorem, a faucibus urna luctus sit amet. Pellentesque elementum euismod lorem, ac vulputate mauris iaculis quis. Ut in dolor sit amet leo ornare sagittis. Aliquam tincidunt mi vel lacus sodales, in placerat lorem gravida. Maecenas blandit mi auctor fringilla venenatis.

Sed eros justo, tincidunt non ornare at, auctor ut urna. Aliquam pharetra pulvinar sodales. Sed id purus id metus dapibus dignissim quis accumsan eros. Vestibulum et felis quis ex molestie condimentum. Proin ut diam feugiat, elementum felis sit amet, vulputate erat. Nullam quis cursus diam. Sed sit amet feugiat nulla, at semper orci. Suspendisse quis viverra magna. Donec eu tempor lacus. Suspendisse potenti. Quisque a magna non libero finibus accumsan imperdiet eget augue. Nulla elementum vestibulum dolor, ac porttitor dolor congue et. Aliquam cursus tempor erat vel vestibulum.

Quisque tempus velit ac congue porta. Proin sagittis tellus id gravida condimentum. Duis eu efficitur magna. Proin molestie tristique ex, quis rhoncus magna ornare ac. Curabitur et felis id enim pharetra pretium. Integer quis quam sodales, maximus magna id, porttitor mi. Nullam viverra magna sem, ut laoreet dolor mollis sit amet.

Phasellus vel dolor nibh. Nam ut efficitur quam, sed mattis turpis. Curabitur congue id mauris ut vulputate. Donec malesuada lectus at lorem blandit, nec facilisis mauris tincidunt. Suspendisse eget nibh eget elit sodales ullamcorper vitae a nunc. Morbi blandit viverra erat, sit amet fringilla lorem pellentesque id. Etiam sapien nulla, imperdiet vel sem vel, dignissim dapibus nisi. Aliquam erat volutpat. Duis bibendum nisl vitae tristique luctus. Nunc fringilla orci at urna sodales feugiat. Nam id diam auctor est mollis tempor at vitae risus. Nulla posuere mattis nibh, in viverra risus facilisis et. Suspendisse sed posuere mi, sed dictum sem. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Curabitur tristique ex vitae metus ornare, nec feugiat nunc rutrum. Donec commodo vehicula odio, sed faucibus ex tincidunt et.
`)

        await request(app)
            .post(COMPLETE_ENDPOINT)
            .set({
                'content-type': 'application/json'
            })
            .type('form')
            .field('n', '3')
            .attach('fileupload', buffer, 'custom_file_name.txt')
            .expect(200)
            .expect({
                frequencies: [
                    { word: 'sed', count: 12 },
                    { word: 'id', count: 10 },
                    { word: 'sit', count: 8 }
                ]
            });
    });
});