# ParkingREST
REST API for the [lab9k Parking ethereum application](https://github.com/lab9k/Parking)

### Installation

    $ git clone https://github.com/lab9k/ParkingREST.git

    $ cd ParkingREST

    $ npm install
    
After installing, a config.json needs to be added, in the following format

    {
      "dburl": "{url}/parking",
      "contractAdress": "",
      "provider": "",
      "contractABI": "",
      "privateKey": ""
    }
    
A simple MongoDB database needs to be set up with a `parking` database containing a `licensePlates` collection.

### Run server

    nodemon ./server.js localhost 3001
    
## Implementation

Each 'Park' event added to the contract will be caught by the API. The encrypted license plate will then be 
decrypted using the specified private key from the config. The decrypted plate will be stored alongside of it's key
in a MongoDB database.

Each GET request to /check/{plate} will return all timestamps for all regions for the given plate.

Each GET request to /check/{plate}/{region} will return all timestamp for the given region for the given plate.