
import youtubeDl from 'youtube-dl-exec';
import fs from 'fs';
import path from 'path';

interface StreamResult {
    filepath: string
    size: number
}

export async function getOrCreateStream (id: string): Promise<StreamResult> {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync('./tmp')) {
            fs.mkdirSync('./tmp');
        }

        fs.stat('/usr/bin/yt-dlp', (err, stats) => {
            let downloader: any;
            if (err !== null) {
                downloader = youtubeDl;
            } else {
                downloader = youtubeDl.create('/usr/bin/yt-dlp');
            }

            const filepath = path.join(__dirname, 'tmp', `${id}.mp3`);
            fs.stat(filepath, (err, stats) => {
                if (err !== null) {
                    console.log('file ' + filepath + ' not found, downloading');
                    downloader('https://youtube.com/watch?v=' + id, {
                        output: filepath,
                        audioFormat: 'mp3',
                        audioQuality: 0,
                        extractAudio: true,
                        addHeader: ['referer:youtube.com', 'user-agent:googlebot']
                    }).then((output: any) => {
                        console.log('Downloaded', output);
                        resolve(getOrCreateStream(id));
                    }).catch((err: any) => {
                        reject(err);
                    });
                } else {
                    console.log('file ' + filepath + ' found');
                    resolve({ filepath, size: stats.size });
                }
            });
        });

        // const filepath = `./tmp/${id}.mp3`;
        // fs.stat(filepath, (err, stats) => {
        //     if (err !== null) {
        //         console.log('file not found, downloading');
        //         ytdl.getInfo(id).then(infos => {
        //             console.log('got infos');
        //             const formats = ytdl.filterFormats(infos.formats, 'audioonly');
        //             const format = ytdl.chooseFormat(formats, { quality: 'lowestaudio' });

        //             console.log('downloading');
        //             const file = fs.createWriteStream(filepath);
        //             const stream = ytdl.downloadFromInfo(infos, { format });
        //             let size = 0;
        //             console.log('Download started');
        //             stream.pipe(file);
        //             stream.on('data', chunk => { size += chunk.length as number; console.log('Downloaded', size, 'ot of ', format.contentLength); });
        //             stream.on('end', () => { console.log('Download done'); resolve({ filepath, size }); });
        //         }).catch(err => {
        //             reject(err);
        //         });
        //         return;
        //     }
        //     if (!stats.isFile()) {
        //         reject(new Error('not found'));
        //         return;
        //     }

        //     resolve({ filepath, size: stats.size });
        // });
    });
}
