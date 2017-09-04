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
        res.send(error);
    })
});

app.get('/check/:plate', (req, res) => {
    let plate = req.params['plate'];
    MongoClient.connect(url, function (err, db) {
        console.log("Connected to parking db, fetching license plate");
        let collection = db.collection('licensePlates');
        collection.find({ "licensePlate": plate }).toArray(function (err, docs) {
            res.send(docs);
            db.close();
        });
    });
});

app.post('/new', (req, res) => {
    let plate = req.body.plate;
    res.send(plate);
});

app.listen(3000, function () {
    console.log('App listening on port 3000');

});
