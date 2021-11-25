import {Request, Response, NextFunction} from "express";
import {APIResponse} from "../domain/api_response";

import Busboy, {BusboyHeaders} from "busboy";
import internal from "stream";
import {APIErrors} from "../domain/error";

export interface IFileUploadService {
    handler(req: Request, res: Response, next: NextFunction);
}

export default class FileUploadService implements IFileUploadService{

    handler = (req: Request, res: Response, next: NextFunction) => {
        let nMostUsedWords = 0;
        let fileUploaded = false;

        let busboy = new Busboy({
            headers: req.headers as BusboyHeaders,
            limits: {
                files: 1,
                fileSize: 1024*1024*1024
            }
        });

        busboy.on('error', (err: unknown) => {
            console.log('busboy error: ' + err);
        });

        busboy.on('field', (name: string, value: string) => {
            if (name === 'n') {
                nMostUsedWords = Number.parseInt(value);
                if (isNaN(nMostUsedWords)) {
                    nMostUsedWords = 0;
                    res.status(APIErrors.NotANumber.status).json(APIErrors.NotANumber);
                }
            }
        });

        busboy.on('file', (field_name, file: internal.Readable, filename: string, encoding: string, mimetype:string) => {
            let buffer = '';
            let wordsMap = {};

            fileUploaded = true;

            file.on('data', (data: any) => {
                buffer += data.toString();
                let toProcessData = buffer.slice(0, buffer.lastIndexOf('\n'));
                buffer = buffer.slice(buffer.lastIndexOf('\n'));
                let regex = /([a-z])\w+/gi;
                let words = toProcessData.match(regex);
                if (!words) {
                    console.log("no words to process after regex");
                    return;
                }
                words.forEach(word => {
                    let key = word.toLowerCase();
                    wordsMap[key] = (wordsMap[key] || 0 ) + 1
                });
            });

            file.on('end', () => {
                // Comprueba error en la lectura del field
                if (nMostUsedWords == 0) {
                    console.log('there was an error reading n field');
                    return;
                }
                // Comprueba que el máximo sea el número de palabras
                let wordsCount = Object.keys(wordsMap).length;
                if (wordsCount < nMostUsedWords) {
                    res.status(APIErrors.NGreaterThanWords.status).json(APIErrors.NGreaterThanWords);
                    return;
                }

                let arr = FileUploadService.convertDictToArrayAndReturnNGreater(wordsMap, nMostUsedWords);
                wordsMap = {};
                res.status(200).json(FileUploadService.buildResponse(arr));
            });

            file.on('error', (err: Error) => {
                console.log('File error: ' + err);
            });
        });

        busboy.on('finish', () => {
            if (!fileUploaded) {
                res.status(APIErrors.NoFileUploaded.status).json(APIErrors.NoFileUploaded);
            }
        });

        req.pipe(busboy);
    }

    static buildResponse = (arr) => {
        let response:APIResponse = {
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
        let items = Object.keys(dict).map(function(key) {
            return [key, dict[key]];
        });

        // Sort the array based on the second element
        items.sort(function(first, second) {
            return second[1] - first[1];
        });

        // Create a new array with only the first nMostFrequent items
        let newArr = items.slice(0, nMostFrequent);
        return newArr;
    }
}