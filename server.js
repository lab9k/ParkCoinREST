const config = require('./config.json');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;

let url = "mongodb://" + config.dburl;

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

const contract = require('./contract.js');

app.get('/', function (req, res) {
    res.send("Use /check/{plate} to check a license plate");
});

app.get('/check/:plate', (req, res) => {
    let licensePlate = req.params['plate'].trim().replace(/[^a-z0-9]/i, '').toUpperCase();
    MongoClient.connect(url, (err, db) => {
        let licensePlates = db.collection('licensePlates');
        licensePlates.find({ "licensePlate": licensePlate }).toArray((err, docs) => {
            if (docs.length === 0) {
                res.send({
                    licensePlate: licensePlate,
                    regions: {
                        0: { timestamps: [], valid: false },
                        1: { timestamps: [], valid: false },
                        2: { timestamps: [], valid: false },
                        3: { timestamps: [], valid: false }
                    }
                });
            } else {
                let result = {
                    licensePlate: licensePlate,
                    regions: {
                        0: { timestamps: [] },
                        1: { timestamps: [] },
                        2: { timestamps: [] },
                        3: { timestamps: [] }
                    }
                };
                let promises = [];
                // Loop through each key of the license plate
                for (let i = 0; i < docs.length; i++) {
                    // Check each region of the license plate
                    for (let j = 0; j < 4; j++) {
                        promises.push(contract.getTimestampForKey(j, docs[i].key));
                    }
                }
                let timestampNow = Math.floor(Date.now() / 1000);
                // Wait for each promise to resolve before sending the response
                Promise.all(promises).then(function (values) {
                    for (let i = 0; i < values.length; i++) {
                        let timestamp = parseInt(values[i].timestamp.valueOf());
                        if (timestamp !== 0 && timestamp > timestampNow) {
                            result.regions[values[i].regio].timestamps.push(timestamp);
                        }
                    }
                    // Assign timestamp and valid for each region
                    for (let i = 0; i < 4; i++) {
                        result.regions[i].valid = result.regions[i].timestamps.length !== 0;
                    }
                    res.send(result);
                }).catch(function (error) {
                    res.send("Error requesting license plate: "+ error);
                });
            }
        });
        db.close();
    });
});

app.get('/check/:plate/:regio', (req, res) => {
    let licensePlate = req.params['plate'].trim().replace(/[^a-z0-9]/i, '').toUpperCase();
    let regio = req.params['regio'];
    MongoClient.connect(url, (err, db) => {
        let licensePlates = db.collection('licensePlates');
        licensePlates.find({ "licensePlate": licensePlate }).toArray((err, docs) => {
            if (docs.length === 0) {
                res.send({
                    licensePlate: req.params['plate'],
                    timestamps: [],
                    valid: false
                });
            } else {
                let result = {
                    licensePlate: req.params['plate'],
                    timestamps: []
                };
                let promises = [];
                // Loop through each key of the license plate
                for (let i = 0; i < docs.length; i++) {
                    promises.push(contract.getTimestampForKey(parseInt(regio), docs[i].key));
                }
                let timestampNow = Math.floor(Date.now() / 1000);
                Promise.all(promises).then(function (values) {
                    for (let i = 0; i < values.length; i++) {
                        let timestamp = parseInt(values[i].timestamp.valueOf());
                        if (timestamp !== 0 && timestamp > timestampNow) {
                             result.timestamps.push(timestamp);
                        }
                    }
                    result.valid = result.timestamps.length !== 0;
                    res.send(result);
                }).catch(function (error) {
                    res.send("Error requesting license plate: "+ error);
                });
                // Assign valid
                for (let i = 0; i < 4; i++) {
                    result.valid = result.timestamps.length !== 0;
                }
                res.send(result);
            }
        });
        db.close();
    });
});

app.listen(3001, () => {
    console.log('App listening on port 3001');
});
