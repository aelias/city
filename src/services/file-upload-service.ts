import {Request, Response} from "express";
import {APIResponse} from "../domain/api_response";

import Busboy, {BusboyConfig, BusboyHeaders} from "busboy";
import internal from "stream";
import {APIErrors} from "../domain/error";
import * as Buffer from "buffer";

export interface IFileUploadService {
    handler(req: Request, res: Response);
}

export default class FileUploadService implements IFileUploadService{

    busboyConfig: BusboyConfig

    constructor(busboyConfig: BusboyConfig = null) {
        if (busboyConfig) {
            this.busboyConfig = busboyConfig;
            this.busboyConfig.headers = null;
        } else {
            this.busboyConfig = {
                headers: null,
                    limits: {
                        files: 1,
                        fileSize: 1024*1024*1024
                    }
            }
        }
    }

    handler = (req: Request, res: Response) => {
        let nMostUsedWords = 0;
        let fileUploaded = false;
        let limitExceeded = false;
        let responseSent = false;

        this.busboyConfig.headers = req.headers as BusboyHeaders;

        const busboy = new Busboy(this.busboyConfig);

        busboy.on('error', (err: unknown) => {
            console.log('busboy error: ' + err);
        });

        busboy.on('field', (name: string, value: string) => {
            if (name !== 'n') {
                responseSent = true;
                res.status(APIErrors.NotExpectedFieldName.status).json(APIErrors.NotExpectedFieldName);
                return;
            }

            nMostUsedWords = Number.parseInt(value);
            if (isNaN(nMostUsedWords)) {
                nMostUsedWords = 0;
                responseSent = true;
                res.status(APIErrors.NotANumber.status).json(APIErrors.NotANumber);
            }
        });

        busboy.on('file', (field_name, file: internal.Readable) => {
            let buffer = '';
            let wordsMap = {};

            fileUploaded = true;

            file.on('limit', () => {
                limitExceeded = true;
                responseSent = true;
                res.status(APIErrors.FileSizeLimitExceeded.status).json(APIErrors.FileSizeLimitExceeded);
            });

            file.on('data', (data: Buffer) => {
                buffer += data.toString();
                let lastIndexEOL = buffer.lastIndexOf('\n')
                if (lastIndexEOL == -1) {
                    lastIndexEOL = buffer.length
                }
                const toProcessData = buffer.slice(0, lastIndexEOL);
                buffer = buffer.slice(lastIndexEOL + 1);
                const words = FileUploadService.bufferToWords(toProcessData);
                if (!words) {
                    console.log("no words to process after regex");
                    return;
                }
                words.forEach(word => {
                    const key = word.toLowerCase();
                    wordsMap[key] = (wordsMap[key] || 0 ) + 1
                });
            });

            file.on('end', () => {
                if (limitExceeded) {
                    console.log('ends because limit exceeded. Response already sent');
                    return;
                }
                // Check for field reading error
                if (nMostUsedWords == 0) {
                    console.log('there was an error reading n field');
                    return;
                }

                // Check for last chunk not processed
                if (buffer.length > 0) {
                    const words = FileUploadService.bufferToWords(buffer)
                    if (words) {
                        words.forEach(word => {
                            const key = word.toLowerCase();
                            wordsMap[key] = (wordsMap[key] || 0) + 1
                        });
                    }
                }

                // Check against total number of words in the file
                const wordsCount = Object.keys(wordsMap).length;
                if (wordsCount < nMostUsedWords) {
                    responseSent = true;
                    res.status(APIErrors.NGreaterThanWords.status).json(APIErrors.NGreaterThanWords);
                    return;
                }

                const arr = FileUploadService.convertDictToArrayAndReturnNGreater(wordsMap, nMostUsedWords);
                wordsMap = {};
                res.status(200).json(FileUploadService.buildResponse(arr));
            });

            file.on('error', (err: Error) => {
                console.log('File error: ' + err);
            });
        });

        busboy.on('finish', () => {
            if (!responseSent && !fileUploaded) {
                res.status(APIErrors.NoFileUploaded.status).json(APIErrors.NoFileUploaded);
            }
        });

        req.pipe(busboy);
    }

    static bufferToWords = (buffer:string) => {
        const regex = /([a-z])\w+/gi;
        return buffer.match(regex);
    }

    static buildResponse = (arr) => {
        const response:APIResponse = {
            frequencies: []
        };
        arr.forEach((el) => {
            response.frequencies.push({
                word: el[0],
                count: el[1]
            });
        });
        return response;
    }

    static convertDictToArrayAndReturnNGreater(dict, nMostFrequent) {
        // Create items array
        const items = Object.keys(dict).map(function(key) {
            return [key, dict[key]];
        });

        // Sort the array based on the second element
        items.sort(function(first, second) {
            return second[1] - first[1];
        });

        // Create a new array with only the first nMostFrequent items
        return items.slice(0, nMostFrequent);
    }
}