import {inject} from '@loopback/core';
import {
      get,
      param,
      post,
      Request,
      requestBody,
      Response,
      RestBindings,
} from '@loopback/rest';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import {Worker} from 'worker_threads';
import {FILE_UPLOAD_SERVICE} from '../keys';
import {FileUploadHandler} from '../types';
const type = [
      {
            file: 'image/png',
            type: 'png',
      },
      {
            file: 'image/jpeg',
            type: 'jpg',
      },
      {
            file: 'image/jpg',
            type: 'jpg',
      },
      {
            file: 'audio/mpeg',
            type: 'mp3',
      },
];
const checkFile = (mimetype: string) => {
      const file = type.filter(_ => _.file === mimetype);
      if (file.length === 0) {
            const extension = mimetype.split('/');
            return extension[extension.length - 1];
      }
      return file[0].type;
};

export class FileUploadController {
      /**
       * Constructor
       * @param handler - Inject an express request handler to deal with the request
       */
      constructor(
            @inject(FILE_UPLOAD_SERVICE) private handler: FileUploadHandler,
      ) {}

      @get('/stream/{folder}/{filename}', {
            responses: {
                  200: {
                        content: {
                              'application/vnd.apple.mpegurl': {
                                    schema: {
                                          type: 'object',
                                    },
                              },
                        },
                        description: 'Stream audio',
                  },
            },
      })
      async streamFile(
            @param.path.string('folder')
            folder: string,
            @param.path.string('filename')
            filename: string,
            @inject(RestBindings.Http.RESPONSE) response: Response,
      ): Promise<object> {
            return new Promise<object>((resolve, reject) => {
                  const fileStream = fs.createReadStream(
                        path.join(
                              __dirname,
                              `../../public/${folder}/${filename}`,
                        ),
                  );

                  fileStream.on('open', () => {
                        resolve(fileStream.pipe(response));
                  });

                  fileStream.on('error', err => {
                        reject(err);
                  });
            });
      }

      @post('/mp3', {
            responses: {
                  200: {
                        content: {
                              'application/json': {
                                    schema: {
                                          type: 'object',
                                    },
                              },
                        },
                        description: 'Files and fields',
                  },
            },
      })
      async fileUpload(
            @requestBody.file()
            request: Request,
            @inject(RestBindings.Http.RESPONSE) response: Response,
      ): Promise<object> {
            const destination = path.join(__dirname, '../../public');

            let checkTypeFile = false;
            let fileNameRes = '';
            let fileNameSave = '';

            const multerOptions: multer.Options = {
                  storage: multer.diskStorage({
                        destination,
                        filename: (req, file, cb) => {
                              const extArray = file.mimetype;
                              const extension = checkFile(extArray);

                              fileNameRes =
                                    file.originalname.split('.')[0] +
                                    '-' +
                                    Date.now();
                              fileNameSave =
                                    file.originalname.split('.')[0] +
                                    '-' +
                                    Date.now() +
                                    '.' +
                                    extension;
                              fileNameRes = fileNameRes.replace(/\s/g, '');
                              fileNameSave = fileNameSave.replace(/\s/g, '');
                              checkTypeFile =
                                    extension !== 'mp3' ? true : false;
                              cb(null, fileNameSave);
                        },
                  }),
            };

            const upload = multer(multerOptions).any();

            return new Promise<object>((resolve, reject) => {
                  upload(request, response, err => {
                        if (checkTypeFile)
                              return reject({
                                    error: 'File not type Mp3.',
                              });
                        if (err) return reject(err);
                        resolve(
                              FileUploadController.getFilesAndFields(
                                    request,
                                    fileNameRes,
                                    fileNameSave,
                              ),
                        );
                  });
            });
      }

      /**
       * Get files and fields for the request
       * @param request - Http request
       */
      private static async getFilesAndFields(
            request: Request,
            fileNameRes: string,
            fileNameSave: string,
      ) {
            const uploadedFiles = request.files;
            const mapper = (f: globalThis.Express.Multer.File) => ({
                  fieldname: f.fieldname,
                  originalname: f.originalname,
                  encoding: f.encoding,
                  mimetype: f.mimetype,
                  size: f.size,
            });
            let files: object[] = [];
            if (Array.isArray(uploadedFiles)) {
                  files = uploadedFiles.map(mapper);
            } else {
                  for (const filename in uploadedFiles) {
                        files.push(...uploadedFiles[filename].map(mapper));
                  }
            }

            const worker = new Worker(
                  path.join(__dirname, '../../src/hashAudio.ts'),
                  {
                        workerData: {
                              fileNameRes,
                              fileNameSave,
                        },
                  },
            );
            worker.on('message', () => {
                  console.log('message');
            });

            return {
                  files,
                  fields: request.body,
                  path: fileNameRes,
                  filename: fileNameSave,
            };
      }

      @post('/image', {
            responses: {
                  200: {
                        content: {
                              'application/json': {
                                    schema: {
                                          type: 'object',
                                    },
                              },
                        },
                        description: 'Files and fields',
                  },
            },
      })
      async imageUpload(
            @requestBody.file()
            request: Request,
            @inject(RestBindings.Http.RESPONSE) response: Response,
      ): Promise<object> {
            const destination = path.join(__dirname, '../../public/image');

            let fileNameSave = '';

            const multerOptions: multer.Options = {
                  storage: multer.diskStorage({
                        destination,
                        filename: (req, file, cb) => {
                              const extArray = file.mimetype;
                              const extension = checkFile(extArray);
                              fileNameSave =
                                    file.originalname.split('.')[0] +
                                    '-' +
                                    Date.now() +
                                    '.' +
                                    extension;
                              fileNameSave = fileNameSave.replace(/\s/g, '');
                              cb(null, fileNameSave);
                        },
                  }),
            };

            const upload = multer(multerOptions).any();

            return new Promise<object>((resolve, reject) => {
                  upload(request, response, err => {
                        if (err) return reject(err);
                        resolve(
                              FileUploadController.getFilesImage(
                                    request,
                                    fileNameSave,
                              ),
                        );
                  });
            });
      }
      private static async getFilesImage(
            request: Request,
            fileNameSave: string,
      ) {
            const uploadedFiles = request.files;
            const mapper = (f: globalThis.Express.Multer.File) => ({
                  fieldname: f.fieldname,
                  originalname: f.originalname,
                  encoding: f.encoding,
                  mimetype: f.mimetype,
                  size: f.size,
            });
            let files: object[] = [];
            if (Array.isArray(uploadedFiles)) {
                  files = uploadedFiles.map(mapper);
            } else {
                  for (const filename in uploadedFiles) {
                        files.push(...uploadedFiles[filename].map(mapper));
                  }
            }
            return {
                  files,
                  fields: request.body,
                  filename: fileNameSave,
            };
      }
}
