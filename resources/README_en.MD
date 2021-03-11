# node-red-contrib-freebox

This package add nodes to get data from freebox API.
The documentation for all freebox api are available [here](https://dev.freebox.fr/sdk/os/).

Included nodes :
 - lan browser (call /lan/browser/pub)
 - connection (call /connection)
 - api (used to call any endpoint with msg.url parameter)

## Installation
```
cd ~/.node-red
npm install node-red-contrib-freebox
```
On the first usage of the node you'll need to add a connection to the server. When done, it will ask for application authorization on the freebox server. You'll have 30 seconds to authorize the application. In case of timeout, another request will be done.

## Credits
Based on :
- [ltoinel/node-red-contrib-freebox](https://github.com/ltoinel/node-red-contrib-freebox)
- [FrColin/node-red-contrib-freebox](https://github.com/FrColin/node-red-contrib-freebox)
- [zachowj/node-red-contrib-home-assistant-websocket](https://github.com/zachowj/node-red-contrib-home-assistant-websocket)
