const config = require('./config.json');
const Web3 = require('web3');
const web3 = new Web3('ws://localhost:8546');


function _getTimestampForId(id, regio) {
    let abi = config.contractABI;
    let contractAddress = config.contractAddress;
    let contract = web3.eth.contract(abi);
    let contractInstance = contract.at(contractAddress);

    return new Promise(function (resolve, reject) {
        contractInstance.tickets(regio, id, function (error, value) {
            if (error) {
                reject(error);
            } else {
                resolve(value);
            }
        });
    });
}

module.exports = {
    getTimestampForId: (id, regio) => {
        return _getTimestampForId(id, regio);
    }
}