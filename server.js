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

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

const contract = require('./contract.js');

app.get('/', function (req, res) {
    res.send("Use /check/{plate} to check a license plate");
});

app.get('/check/:plate', (req, res) => {
    let licensePlate = req.params['plate'];
    MongoClient.connect(url, (err, db) => {
        let licensePlates = db.collection('licensePlates');
        licensePlates.find({ "licensePlate": licensePlate }).toArray((err, docs) => {
            if (docs.length === 0) {
                res.send({
                    licensePlate: licensePlate,
                    regions: {
                        0: { timestamp: 0, valid: false },
                        1: { timestamp: 0, valid: false },
                        2: { timestamp: 0, valid: false },
                        3: { timestamp: 0, valid: false }
                    }
                });
            } else {
                let result = {
                    licensePlate: licensePlate,
                    regions: {
                        0: { timestamp: 0 },
                        1: { timestamp: 0 },
                        2: { timestamp: 0 },
                        3: { timestamp: 0 }
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
                // Array with the sum of the all the timestamps for each region
                let durations = [0, 0, 0, 0];
                // Wait for each promise to resolve before sending the response
                Promise.all(promises).then(function (values) {
                    for (let i = 0; i < values.length; i++) {
                        let timestamp = parseInt(values[i].timestamp.valueOf());
                        if (timestamp !== 0) {
                            if (timestamp > timestampNow) {
                                durations[values[i].regio] += timestamp - timestampNow;
                            }
                        }
                    }
                    // Assign timestamp and valid for each region
                    for (let i = 0; i < 4; i++) {
                        result.regions[i].timestamp = timestampNow + durations[i];
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
    let licensePlate = req.params['plate'];
    let regio = req.params['regio'];
    MongoClient.connect(url, (err, db) => {
        let licensePlates = db.collection('licensePlates');
        licensePlates.find({ "licensePlate": licensePlate }).toArray((err, docs) => {
            if (docs.length === 0) {
                res.send({
                    licensePlate: licensePlate,
                    timestamps: 0,
                    valid: false
                });
            } else {
                let result = {
                    licensePlate: licensePlate,
                    timestamp: 0
                };
                let promises = [];
                // Loop through each key of the license plate
                for (let i = 0; i < docs.length; i++) {
                    promises.push(contract.getTimestampForKey(regio, docs[i].key));
                }
                let timestampNow = Math.floor(Date.now() / 1000);
                let duration = 0;
                Promise.all(promises).then(function (values) {
                    for (let i = 0; i < values.length; i++) {
                        let timestamp = parseInt(values[i].timestamp.valueOf());
                        if (timestamp !== 0) {
                            if (timestamp > timestampNow) {
                                duration += timestamp - timestampNow;
                            }
                        }
                    }
                    // Assign timestamp and valid for each region
                    for (let i = 0; i < 4; i++) {
                        result.timestamp = timestampNow + duration;
                        result.valid = result.regions[i].timestamps.length !== 0;
                    }
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
