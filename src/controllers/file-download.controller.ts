import {inject} from '@loopback/core';
import {get, oas, param, Response, RestBindings} from '@loopback/rest';
import path from 'path';
/**
 * A controller to handle file downloads using multipart/form-data media type
 */
export class FileDownloadController {
      constructor() {}

      @get('/files/{filename}')
      @oas.response.file()
      downloadFile(
            @param.path.string('filename') fileName: string,
            @inject(RestBindings.Http.RESPONSE) response: Response,
      ): Promise<object> {
            return new Promise<object>((resolve, reject) => {
                  // const fileStream = fs.createWriteStream(
                  //       path.join(__dirname, `../../public/${fileName}.mp3`),
                  // );
                  // response.pipe(fileStream);
                  // fileStream.on('finish', () => {
                  //       fileStream.close();
                  //       resolve({
                  //             msg: 'Download Completed',
                  //       });
                  // });

                  // fileStream.on('error', () => {
                  //       reject({
                  //             msg: 'lỗi',
                  //       });
                  // });

                  response.sendFile(
                        path.join(__dirname, `../../public/${fileName}.mp3`),
                        err => {
                              if (err) reject(err);
                              resolve({
                                    msg: 'success',
                              });
                        },
                  );
            });
      }

      /**
       * Validate file names to prevent them goes beyond the designated directory
       * @param fileName - File name
       */
}
