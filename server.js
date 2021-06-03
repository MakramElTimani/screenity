const express = require('express');
const cors = require('cors');
const app = express();
const server = require('http').Server(app)
const io = require('socket.io')(server)
const fs = require('fs');
const path = require('path');
var util = require('fluent-ffmpeg-util');
const webmToMp4 = require('webm-to-mp4');

app.use(cors())
app.use(express.json());

server.listen(3000, () => {
    console.log('Server started on port 3000')
});


var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
var ffmpeg = require('fluent-ffmpeg');
const { SSL_OP_EPHEMERAL_RSA } = require('constants');
ffmpeg.setFfmpegPath(ffmpegPath);
var command = ffmpeg();

io.on('connection', client => {
    console.log('client connected of id ' + client.id);

    client.on('disconnect', ()=>{
        console.log('disconnected')
    })

    client.on('fileStream', (data) => {
        console.log(data);
    })


    //let fileWriter = fs.createWriteStream('demo.webm')
    let blobs = 0;

    // const spawn = require('child_process').spawn;
    // const ffmpegSpawn = spawn('ffmpeg', [ '-y', '-hide_banner', '-f mpegts', '-i', 'pipe:', 'demo.webm', '-codec', 'copy', '-f', 'mpegts', 'pipe:', 'demo2.mp4']);

    // ffmpegSpawn.stdout.on('data', chunk => {
    //     // upload a transcoded chunk
    //     console.log(chunk)
    // });

    let startedRecording = false;
    let seconds = 0, duration = 5;

    let counter = 1;
    let shouldPause = true;
    let isPaused = false;

    // let counterFW = fs.createWriteStream('recordings/file' + counter + '.webm');
    let chunks = [];
    client.on('fileData', (data) => {
        console.log('received data');
        fs.appendFile('demo.webm', data, null, (err) => {
            if(err){
                console.log(err);
            }
            if(blobs % 10 == 0){
                fs.readFile('demo.webm', (error, data) =>{
                    if(error){
                        console.log(error);
                    }
                    fs.writeFile('recordings/demo'+counter+'.mp4', Buffer.from(webmToMp4(data)), (err, data) => {
                        if(!err){
                            if(fs.existsSync('demo.webm')){
                                fs.unlinkSync('demo.webm')
                            }    
                        }
                        counter++;
                    });
                    
                })
                //fs.writeFile('recordings/demo.mp4', Buffer.)
                // if(fs.existsSync('demo'+counter+'.webm')){
                //     fs.unlinkSync('demo'+counter+'.webm')
                // }
            }
        });
        blobs ++;
        
        // chunks.push(data);
        // // counterFW.write(data);
        // if(blobs % 10 == 0){
        //     fs.unlinkSync('demo.webm');
        //     //fileWriter = fs.createWriteStream('demo.webm')
        //     // counterFW.close();
        //     // convertTOMp4Every10Seconds(counter);
        //     // counter++;
        //     // counterFW = fs.createWriteStream('recordings/file' + counter + '.webm');
        //     // chunks = [];
        // }
    })

    convertTOMp4Every10Seconds = async (index) => {
        // const fw = fs.createWriteStream('file.webm');
        const ss = await fs.readFileSync('recordings/file' + index + '.webm');
        fs.writeFileSync('recordings/file'+index+'.mp4', Buffer.from(webmToMp4(ss)));
    }

    writeDataEvery10Seconds = (chunks) => {
        let done = false;
        const demoFileWriter = fs.createWriteStream('recordings/demo1.webm');
        for(var i = 0; i < chunks.length; i++){
            console.log('writing')
            demoFileWriter.write(chunks[i], (err) => {
                console.log('done chunk number ' + i)
                if(i == chunks.length - 1) done = true;
            })
        }

        

        const webmPath = 'recordings/demo1.webm'
        const mp4Path = 'recordings/demo' + counter + '.mp4';
        var command = ffmpeg({ source: webmPath })
        .on('error', function(err) {
            console.log(err);
            console.log('An error occurred: ' + err.message);
        })
        .on('end', function() {
            try{
                fs.unlink(webmPath);
            }
            catch(err){

            }
            console.log('new mp4 created ' + mp4Path + '!');
        })
        .saveToFile(mp4Path);

        counter++;
    }

    transformFile = (index) => {
        console.log(index);
        // let inStream = fs.createReadStream('recordings/demo' + index + '.webm')
        
        const webmPath = 'recordings/demo' + 1 + '.webm'
        const mp4Path = 'recordings/demo' + index + '.mp4';
        var command = ffmpeg({ source: webmPath })
            .on('error', function(err) {
                console.log(err);
                console.log('An error occurred: ' + err.message);
            })
            .on('end', function() {
                try{
                    fs.unlink(webmPath);
                }
                catch(err){

                }
                console.log('new mp4 created ' + mp4Path + '!');
                fileWriterCounter = fs.createWriteStream('recordings/demo' + 1 + '.webm');
            })
            .saveToFile(mp4Path);
    }


    client.on('stopRecording', (data) => {
        // fileWriter.close();
        // shouldPause = false;
        // //convert video to mp4

        // const webmPath = "demo.webm";
        // const mp4Path = 'demo.mp4';

        // const filePath = path.join(__dirname, 'demo.mp4');

        // var outStream = fs.createWriteStream(mp4Path);
        // var inStream = fs.createReadStream(webmPath);

        // var command = ffmpeg({ source: inStream })
        //     .on('error', function(err) {
        //         console.log(err);
        //         console.log('An error occurred: ' + err.message);
        //     })
        //     .on('end', function() {
        //         console.log('Processing finished !');
        //          client.emit('finalVideo', filePath, blobs);
        //     })
        //     .saveToFile(mp4Path);

    });
})