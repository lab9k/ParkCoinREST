const express = require('express');
const app = express();
var bodyParser = require('body-parser')
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

const contract = require('./contract.js');

app.get('/', function (req, res) {
    res.send(contract.print());
});

app.get('/:plate', (req, res) => {
    let plate = req.params['plate'];
    res.send(plate);
});

app.post('/new', (req, res) => {
    let plate = req.body.plate;
    res.send(plate); 
});

app.listen(3000, function () {
    console.log('App listening on port 3000');
  
});
