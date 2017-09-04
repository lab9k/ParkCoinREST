function printContract() {
    return "Hello World!";
}

function _getTimestampForId(id) {
    return new Date().valueOf();
}

module.exports = {
    print: function () {
        return printContract();
    },
    getTimestampForId: (id) => {
        return _getTimestampForId(id);
    }
}