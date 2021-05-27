const express = require('express');
const cors = require('cors');
const app = express();
const server = require('http').Server(app)
const io = require('socket.io')(server)
const fs = require('fs');
const path = require('path');
var util = require('fluent-ffmpeg-util');

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


    const fileWriter = fs.createWriteStream('demo.webm')
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
    client.on('fileData', (data) => {
         console.log('received data');
        fileWriter.write(data);

        // if(!startedRecording){
            startedRecording = true;
            setTimeout(function(){
                const reader = fs.createReadStream('demo.webm');
                var command = ffmpeg({source: reader})
                .inputFormat('webm')
                .on('start', function(commandLine) {
                    
                    
                    
                })
                .on('progress', function(progress) {
                    if(shouldPause){
                        setTimeout(function(){
                            util.pause(command);
                            isPaused = true;
                        }, 300)
                        
                        setTimeout(function(){
                            util.resume(command);
                            isPaused = false;
                        }, 1000)
                    }
                    else{
                        if(isPaused)  util.resume(command);
                    }
                    console.log('In Progress !! ' + Date());
                    console.log('is paused : ' + isPaused);
                    console.log('should Pause !! ' + shouldPause);
                })
                .on('error', function(err){
                    client.disconnect();
                    console.log(err);
                })
                .on('end', function(){
                    seconds += 5;
                    startedRecording = false;
                    counter++;
                })
                .outputFormat('mp4')
                // .output('recordings/demo' + counter + '.mp4')
                .saveToFile('recordings/demo.mp4');
                // .saveToFile('recordings/demo' + counter + '.mp4')
                // .outputFormat("mp4")
                // .output('demo.mp4')
                // .output(mp4FileReader, {end: false})s
                // .on('end', function(){ console.log( "stream done" )})
                // .run();
            }, 3000);
        // }
    })




    client.on('stopRecording', (data) => {
        fileWriter.close();
        shouldPause = false;
        //convert video to mp4

        const webmPath = "demo.webm";
        const mp4Path = 'demo.mp4';

        const filePath = path.join(__dirname, 'demo.mp4');

        var outStream = fs.createWriteStream(mp4Path);
        var inStream = fs.createReadStream(webmPath);

        var command = ffmpeg({ source: inStream })
            .on('error', function(err) {
                console.log(err);
                console.log('An error occurred: ' + err.message);
            })
            .on('end', function() {
                console.log('Processing finished !');
                 client.emit('finalVideo', filePath, blobs);
            })
            .saveToFile(mp4Path);

    });
})