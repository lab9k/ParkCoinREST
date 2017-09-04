const express = require('express');
const app = express();

app.get('/', function (req, res) {
    res.send('Hello world!!!!');
});

app.get('/:plate', (req, res) => {
    let plate = req.params['plate'];
    res.send(plate);
});

app.post('/new', (req, res) => {
    res.send(req);
});

app.listen(3000, function () {
    console.log('App listening on port 3000');
}); 