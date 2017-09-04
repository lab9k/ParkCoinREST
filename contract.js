function _getTimestampForId(id) {
    return new Date().valueOf();
}

module.exports = {
    getTimestampForId: (id) => {
        return _getTimestampForId(id);
    }
}