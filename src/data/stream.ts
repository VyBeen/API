
import youtubeDl from 'youtube-dl-exec';
import yts from 'yt-search';
import fs from 'fs';

interface StreamResult {
    filepath: string
    size: number
}

export async function getOrCreateStream (id: string): Promise<StreamResult> {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync('./tmp')) {
            fs.mkdirSync('./tmp');
        }

        const filepath = `./tmp/${id}.mp3`;
        fs.stat(filepath, (err, stats) => {
            if (err !== null) {
                console.log('file not found, downloading');
                yts({ videoId: id }).then(res => {
                    console.log('got url = ', res.url);
                    youtubeDl(res.url, {
                        output: filepath,
                        audioFormat: 'mp3',
                        audioQuality: 0,
                        extractAudio: true
                    }).then(output => {
                        resolve(getOrCreateStream(id));
                    }).catch(err => {
                        reject(err);
                    });
                }).catch(err => {
                    console.error(err);
                });
            } else resolve({ filepath, size: stats.size });
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
