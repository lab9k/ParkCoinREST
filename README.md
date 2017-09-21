# ParkCoinREST

REST API for the [lab9k ParkCoin ethereum application](https://github.com/lab9k/Parking)

## Deployment on server

### prerequisites

* nodejs
* npm
* geth client

### Installation

    $ git clone https://github.com/lab9k/ParkCoinREST.git

    $ cd ParkCoinREST

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

### Create bash file in order to automate the geth client startup
```
cd /usr/local/bin
touch startgeth.sh
vim startgeth.sh
```
Voeg het onderstaande toe aan geth.sh
```
#!/bin/bash
geth --networkid=4 --datadir=/root/.rinkeby --cache=512 --ethstats='yournode:Respect my authoritah!@stats.rinkeby.io' --             bootnodes=enode://a24ac7c5484ef4ed0c5eb2d36620ba4e4aa13b8c84684e1b4aab0cebea2ae45cb4d375b77eab56516d34bfbd3c1a833fc512
96ff084b770b94fb9028c4d25ccf@52.169.42.101:30303 --rpc --rpcapi="personal,eth,network"
exit 0;
```

### Configure bash file as a service
```
 cd /etc/systemd/system
 touch geth.service
 vim geth.service 
```
Voeg het onderstaande toe aan geth.service 
```
[Service]
ExecStart=/usr/local/bin/startgeth.sh
[Install]
WantedBy=default.target
```
Start de geth.service om de service permanent te laten draaien
```
systemctl daemon-reload
systemctl enable geth.service
```
    
### Configure parkcoinAPI as a service
```
cd /etc/systemd/system
touch parkCoinAPI.service
vim parkCoinAPI.service
```
Voeg het onderstaande toe aan parkCoinAPI.service 

```
    [Unit]
    Description= parkcoin API

    [Service]
    ExecStart=/usr/bin/node /root/ParkingREST/server.js
    Restart=always
    RestartSec=10
    StandardOutput=syslog
    StandardError=syslog
    SyslogIdentifier=parkcoin API
    Environment=NODE_ENV=production PORT=3001

    [Install]
    WantedBy=multi-user.target
```
Start de parkCoinAPI.service om de service permanent te laten draaien 
```
systemctl daemon-reload
systemctl enable parkCoinAPI.service.service
```

### Configure proxy
    cd /etc/apache2/sites-available
    touch verenigingen.conf
    vim verenigingen.conf
    
    <VirtualHost *:80>
        Servername apiparkcoin.lab9k.gent
        ProxyPass / http://localhost:8080/
    </VirtualHost>
    
## Implementation

Each 'Park' event added to the contract will be caught by the API. The encrypted license plate will then be 
decrypted using the specified private key from the config. The decrypted plate will be stored alongside of it's key
in a MongoDB database.

Each GET request to /check/{plate} will return all timestamps for all regions for the given plate.

Each GET request to /check/{plate}/{region} will return all timestamp for the given region for the given plate.
