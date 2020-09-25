const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();
const bodyParser = require('body-parser');
const multer  = require('multer');
const fs = require('fs');
const shell = require('shelljs');
const https = require('https');

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
    res.sendFile(path.join(__dirname + '/index.html'));
});

router.get('/services/listModels',function(req, res) {
    res.sendFile(path.join(__dirname + '/models.json'));
});

// Route for uploading .wavfile and running inference
router.post('/services/uploadAudioFile', upload.single('wavfile'), function(req, res) {
    const { model, scorer } = req.body;
    const uploadedFile = req.file.path;
    
    // Runs inference
    const { stdout, stderr } = shell.exec(`bash /home/server/run_inference.sh ${model} ${scorer} ${uploadedFile}`);

    shell.exec(`ffmpeg -i ${uploadedFile} -c:a pcm_f32le -ar 16000 -y ${uploadedFile}`);

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
app.use('/public', express.static(__dirname + '/public'));
app.use('/.well-known', express.static(__dirname + '/.well-known'));
app.use(bodyParser.urlencoded({ extended: true }));

const httpsOptions = {
	cert: fs.readFileSync('/etc/letsencrypt/live/deepspeech.ddns.net/cert.pem', 'utf8'),
	ca: fs.readFileSync('/etc/letsencrypt/live/deepspeech.ddns.net/chain.pem', 'utf8'),
	key: fs.readFileSync('/etc/letsencrypt/live/deepspeech.ddns.net/privkey.pem', 'utf8')
}

https.createServer(httpsOptions, app)
.listen(5000, function () {
	console.log('Running');
});
