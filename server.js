const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const bodyParser = require('body-parser');
const multer  = require('multer');
const spawn = require('child_process').spawnSync
const fs = require('fs');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now();
      cb(null, file.fieldname + '-' + uniqueSuffix + '.wav');
    }
});

const upload = multer({ storage: storage });

router.get('/',function(req, res){
    res.sendFile(path.join(__dirname + '/inference_application.html'));
});

router.post('/services/uploadAudioFile', upload.single('wavfile'), function(req, res) {
    const uploadedFile = req.file.path;

    var consoleOutput = spawn('ls');

    // Delete uploaded file after inference ran
    fs.unlink(uploadedFile, function (err) {
        if (err) {
            console.log('Error when deleting file: ' + err);
        }
    }); 

    res.json({ "console": consoleOutput.output.toString("utf8") });
});

// Add the router
app.use('/', router);
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(process.env.port || 3000);

console.log('Running at Port 3000');