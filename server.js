const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const config = require('./config.json');

const url = "mongodb://" + config.dburl;

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

const contract = require('./contract.js');

app.get('/', function (req, res) {
    contract.getTimestampForId(1, 0).then((value) => {
        res.send(value);
    }).catch((error) => {
        res.send(error.toString());
    })
});

app.get('/check/:plate', (req, res) => {
    let plate = req.params['plate'];
    MongoClient.connect(url, (err, db) => {
        console.log("Connected to parking db, fetching license plate");
        let collection = db.collection('licensePlates');
        collection.find({ "licensePlate": plate }).toArray((err, docs) => {
            if (docs.length === 0) {
                res.send({ valid: false, timestamp: 0, plate: plate });
            } else {
                contract.getTimestampForId(parseInt(docs[0]._id), 1).then((value) => {
                    res.send({
                        valid: Date.now() <= parseInt(value),
                        timestamp: value,
                        plate: plate
                    });
                }).catch((error) => {
                    res.send({
                        valid: false,
                        timestamp: 0,
                        plate: plate,
                        error: error
                    })
                });
            }
        });
        db.close();
    });
});

app.post('/new', (req, res) => {
    let plate = req.body.plate;
    MongoClient.connect(url, (err, db) => {
        console.log("Connected to parking db, inserting license plate");
        let collection = db.collection('licensePlates');
        collection.insertMany([{ "licensePlate": plate }], (err, result) => {
            console.log("Inserted license plate");
            res.send("Added license plate " + plate + result);
        });
        db.close();
    });
});

app.listen(3000, () => {
    console.log('App listening on port 3000');
});
