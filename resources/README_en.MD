# node-red-contrib-freebox

This package add nodes to get data from freebox API.
The documentation for all freebox api are available [here](https://dev.freebox.fr/sdk/os/).

Included nodes :
 - ## [lan browser](/examples/nodes/en/lan_browser.md) (call /lan/browser/pub)
 - ## [connection](/examples/nodes/en/connection.md) (call /connection)
 - ## [api](/examples/nodes/en/api.md) (used to make a call to any endpoint with the _parameter url_ **or** _msg.url_)
 - ## [poll](/examples/nodes/en/poll.md) (used to make a call every x milliseconds to any endpoint)

## Installation
```
cd ~/.node-red
npm install node-red-contrib-freebox
```
On the first run of the node you'll need to add a connection to the server. When done, it will ask for application authorization on the freebox server. You'll have 30 seconds to authorize the application. In case of timeout, another request will be done.

## Credits
Based on :
- [ltoinel/node-red-contrib-freebox](https://github.com/ltoinel/node-red-contrib-freebox)
- [FrColin/node-red-contrib-freebox](https://github.com/FrColin/node-red-contrib-freebox)
- [zachowj/node-red-contrib-home-assistant-websocket](https://github.com/zachowj/node-red-contrib-home-assistant-websocket)
