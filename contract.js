const config = require('./config.json');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(config.provider));
const NodeRSA = require('node-rsa');

let key = new NodeRSA(config.privateKey, { 'encryptionScheme': 'pkcs1' });

function _getTimestampForId(id, regio) {
    let abi = config.contractABI;
    let contractAddress = config.contractAddress;
    let contractInstance = new web3.eth.Contract(abi, contractAddress);

    return new Promise((resolve, reject) => {
        contractInstance.methods.tickets(id, regio).call((error, value) => {
            if (error) {
                reject(error);
            } else {
                resolve(value);
            }
        });
    });
}

let contract = web3.eth.contract(config.contractABI).at(config.contractAdress);

contract.Park({}, { fromBlock: 0, toBlock: 'latest' }).get((error, result) => {
    if (error) {
        console.log(error);
    }
    else {
        for (let i = 0; i < result.length; i++) {
            let resArgs = result[i].args;
            console.log("Nummerplaat: ");
            console.log(key.decrypt(resArgs.nummerplaatEncrypted, 'utf8'));
            console.log("Key: ");
            console.log(resArgs.key);
        }
    }
});

module.exports = {
    getTimestampForId: (id, regio) => {
        return _getTimestampForId(id, regio);
    }
};