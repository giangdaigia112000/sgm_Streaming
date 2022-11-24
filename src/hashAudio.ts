const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const {workerData} = require('worker_threads');

const {fileNameRes, fileNameSave} = workerData;

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

fs.mkdirSync(path.join(__dirname, '../public/' + fileNameRes));

ffmpeg(path.join(__dirname, '../public/' + fileNameSave), {timeout: 432000})
      .noVideo()
      .addOptions([
            '-profile:v baseline', //hỗ trợ các thiết bị cũ
            '-level 3.0',
            '-start_number 0',
            '-hls_time 10',
            '-hls_list_size 0',
            '-f hls',
      ])
      .audioCodec('libmp3lame') //Use libfdk_aac to encode the audio. Or use libmp3lame if you want mp3
      .audioFrequency(44100) // 48000 sample per second. If using mp3, do 44100 for ios
      .audioBitrate('128k')
      .output(
            path.join(
                  __dirname,
                  '../public/' + fileNameRes + '/' + `${fileNameRes}.m3u8`,
            ),
      )
      .on('end', () => {
            console.log('end');
      })
      .run();
