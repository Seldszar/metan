# metan

> Yet another WebSocket client for Open Broadcaster

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Author](#author)
- [License](#license)

# Install

```bash
$ npm install metan
```

# Usage

```javascript
const { Client } = require("metan");

const client = new Client();

client.on("connected", () => {
  console.log("Connected to OBS");
});

client.on("ready", () => {
  console.log("Client is ready to use");

  client.request("GetVersion").then(({ requestType, responseData }) => {
    console.log("Received %s response: %s", requestType, responseData);
  });
});

client.on("disconnected", () => {
  console.log("Disconnected from OBS");
});

client.on("event", ({ eventName, eventData }) => {
  console.log("New %s event received: %s", eventName, eventData);
});

client.connect({
  address: "ws://localhost:4444",
});
```

## API

See the [declaration file](./index.d.ts).

## Author

Alexandre Breteau - [@0xSeldszar](https://twitter.com/0xSeldszar)

## License

MIT © [Alexandre Breteau](https://seldszar.fr)
