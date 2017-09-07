const config = require('./config.json');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(config.provider));
const NodeRSA = require('node-rsa');
const MongoClient = require('mongodb').MongoClient;

let privateKey = new NodeRSA(config.privateKey, { 'encryptionScheme': 'pkcs1' });
let url = "mongodb://" + config.dburl;

let contract = web3.eth.contract(config.contractABI).at(config.contractAdress);

// Upon booting up, go over all previous events and add all license plates to the db if they
// haven't been added yet
contract.Park({}, { fromBlock: 0, toBlock: 'latest' }).get(function (err, events) {
    if (err) {
        console.log(err);
    }
    else {
        MongoClient.connect(url, (err, db) => {
            let licensePlates = db.collection('licensePlates');
            licensePlates.find({}, { _id: false }).toArray((err, docs) => {
                let toInsert = [];
                for (let i = 0; i < events.length; i++) {
                    let eventArgs = events[i].args;
                    let licensePlate = privateKey.decrypt(eventArgs.nummerplaatEncrypted, 'utf8');
                    let key = eventArgs.key;
                    if (docs.filter(function (obj) { return obj.licensePlate === licensePlate && obj.key === key }).length === 0) {
                        toInsert.push({ licensePlate: licensePlate, key: key });
                    }
                }
                if (toInsert.length !== 0) {
                    licensePlates.insertMany(toInsert, function (err, result) {
                        if (err) {
                            console.log(err);
                        }
                        db.close();
                    });
                } else {
                    db.close();
                }
            });
        });
    }
});

// On each new event, add to db
contract.Park().watch(function (err, event) {
    if (err) {
        console.log(err);
    }
    else {
        MongoClient.connect(url, (err, db) => {
            let licensePlates = db.collection('licensePlates');
            let eventArgs = event.args;
            let licensePlate = privateKey.decrypt(eventArgs.nummerplaatEncrypted, 'utf8');
            let key = eventArgs.key;
            let doc = { licensePlate: licensePlate, key: key };
            licensePlates.findOne(doc, (err, fDoc) => {
                if (fDoc === null) {
                    licensePlates.insertOne(doc, function (err, result) {
                        if (err) {
                            console.log(err);
                        }
                        db.close();
                    });
                } else {
                    db.close();
                }
            });
        });
    }
});

function _getTimestampForKey(regio, key) {
    return new Promise(function (resolve, reject) {
        contract.tickets(regio, key, function (err, value) {
            if (err) {
                reject(err);
            } else {
                resolve(value);
            }
        })
    })
}

module.exports = {
    getTimestampForKey: function (regio, key) {
        return _getTimestampForKey(regio, key);
    }
}