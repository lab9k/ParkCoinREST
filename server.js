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
                // Wait for each promise to resolve before sending the response
                Promise.all(promises).then(function (values) {
                    for (let i = 0; i < values.length; i++) {
                        if (parseInt(values[i].timestamp.valueOf()) !== 0) {
                            result.regions[values[i].regio].timestamps.push(parseInt(values[i].timestamp.valueOf()));
                        }
                    }
                    // Assign valid for each region
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
    let licensePlate = req.params['plate'];
    let regio = req.params['regio'];
    MongoClient.connect(url, (err, db) => {
        let licensePlates = db.collection('licensePlates');
        licensePlates.find({ "licensePlate": licensePlate }).toArray((err, docs) => {
            if (docs.length === 0) {
                res.send({
                    licensePlate: licensePlate,
                    timestamps: [],
                    valid: false
                });
            } else {
                let result = {
                    licensePlate: licensePlate,
                    timestamps: []
                };
                // Loop through each key of the license plate
                for (let i = 0; i < docs.length; i++) {
                    contract.getTimestampForKey(regio, docs[i].key).then(function (value) {
                        if (value !== 0) {
                            result.timestamps.push(value);
                        }
                    }).catch(function (error) {
                        res.send(error);
                    });
                }
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
