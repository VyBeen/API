
import ytdl from 'ytdl-core';
import fs from 'fs';

interface StreamResult {
    filepath: string
    size: number
}

export async function getOrCreateStream (id: string): Promise<StreamResult> {
    return new Promise((resolve, reject) => {
        const filepath = `./tmp/${id}.mp3`;
        fs.stat(filepath, (err, stats) => {
            if (err !== null) {
                ytdl.getInfo(id).then(infos => {
                    const formats = ytdl.filterFormats(infos.formats, 'audioonly');
                    const format = ytdl.chooseFormat(formats, { quality: 'lowestaudio' });

                    const file = fs.createWriteStream(filepath);
                    const stream = ytdl.downloadFromInfo(infos, { format });
                    let size = 0;
                    stream.pipe(file);
                    stream.on('data', chunk => { size += chunk.length as number; });
                    stream.on('end', () => { resolve({ filepath, size }); });
                }).catch(err => {
                    reject(err);
                });
                return;
            }
            if (!stats.isFile()) {
                reject(new Error('not found'));
                return;
            }

            resolve({ filepath, size: stats.size });
        });
    });
}
