## University Grading System Using SBT Tokens

### Setup

Install dependencies
```bash
yarn
```

Run local hardhat node
```bash
yarn dev
```
Then setup your metamask to connect to hardhat network and add hardhat accounts to metamask

Deploy contract to hardhat
```bash
yarn build:contracts
```

Run client
```bash
cd client
npx http-server . -p 3000
```

Run local ipfs (if you have infure ipfs project skip this step and config your infura project in `client/sdk.js`
```bash
ipfs config --json 'API.HTTPHeaders.Access-Control-Allow-Methods' '["PUT", "GET", "POST", "OPTIONS"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
```

Open client in browser http://localhost:3000

### Diploma Demo on OpenSea
As this is SBT token you can not transfer or sell it, only readonly access. But token can be burned by university.
![Token in OpenSea](https://github.com/var77/university-sbt/blob/main/demo.png?raw=true)
