# node-red-contrib-freebox

This package add nodes to get data from freebox API.
The documentation for all freebox api are available [here](https://dev.freebox.fr/sdk/os/) : 

Included nodes :
 - connected-devices
	 Make a call /lan/browser/pub/

## Installation
```
cd $HOME/.node-red
npm install node-red-contrib-freebox
```
On the first usage of the node you'll need to add a connection to the server. When done, it will ask for application authorization on the freebox server. You'll have 30 seconds to authorize the application.