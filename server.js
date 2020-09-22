const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const bodyParser = require('body-parser');
const multer  = require('multer');
const fs = require('fs');
const shell = require('shelljs');

// Uses multer to store audio files
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now();
      cb(null, file.fieldname + '-' + uniqueSuffix + '.wav');
    }
});

// Define upload variable for multer
const upload = multer({ storage: storage });

// Main route
router.get('/',function(req, res){
    res.sendFile(path.join(__dirname + '/inference_application.html'));
});

// Route for uploading .wavfile and running inference
router.post('/services/uploadAudioFile', upload.single('wavfile'), function(req, res) {
    const { model, scorer } = req.body;
    const uploadedFile = req.file.path;
    
    // Runs inference
    const { stdout, stderr } = shell.exec(`bash /home/pedronogs/Desktop/teste.sh ${model} ${scorer} audio.wav`);

    // Delete uploaded file after inference ran
    fs.unlink(uploadedFile, function (err) {
        if (err) {
            console.log('Error when deleting file: ' + err);
        }
    }); 

    // Return json with inference output
    res.json({ "output": stdout, "description_or_error": stderr });
});

// Add the router
app.use('/', router);
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(process.env.port || 3000);

console.log('Running at Port 3000');