const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const config = require('./config.json');

const url = 'mongodb://' + config.dburl;

app.get('/', function (req, res) {
    MongoClient.connect(url, function (err, db) {
        console.log("Connected to parking db");
        let collection = db.collection('licensePlates');
        collection.find({}).toArray(function (err, docs) {
            res.send(docs);
            db.close();
        });
    });
});

app.get('/:plate', (req, res) => {
    let plate = req.params['plate'];
    res.send(plate);
});

app.post('new', (req, res) => {

});

app.listen(3000, function () {
    console.log('App listening on port 3000');
}); 