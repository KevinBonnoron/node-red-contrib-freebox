# API node examples
Here you will find some examples to use the api node. You need to know the endpoint url and the http method. Then just call the node with :
>msg.url

as the endpoint url
>msg.method

as the endpoint method (default is GET)

>msg.payload

as the body of the request (only for POST & PUT request)

_Take care that some endpoint need special permissions you can add in the freebox admin panel_.

## GET /call/log example
>[{"id":"f2130640.4dbc38","type":"inject","z":"3dc6d923.4db346","name":"","props":[{"p":"url","v":"/call/log/","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","x":260,"y":300,"wires":[["7ea484b.d128f7c"]]},{"id":"7ea484b.d128f7c","type":"api","z":"3dc6d923.4db346","name":"","server":"8370352e.9d8178","x":410,"y":300,"wires":[["630e3bc2.f29d34"]]},{"id":"630e3bc2.f29d34","type":"debug","z":"3dc6d923.4db346","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","statusVal":"","statusType":"auto","x":590,"y":300,"wires":[]},{"id":"8370352e.9d8178","type":"freebox-server","host":"https://mafreebox.freebox.fr","port":"443"}]

## PUT /connection/lte/config/
>[{"id":"787d82c4.76eb6c","type":"tab","label":"Flow 1","disabled":false,"info":""},{"id":"c45bc2fe.86ce5","type":"api","z":"787d82c4.76eb6c","name":"","server":"46058a69.3491c4","x":390,"y":260,"wires":[["bd79e9e7.b62af8"]]},{"id":"bd79e9e7.b62af8","type":"debug","z":"787d82c4.76eb6c","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","statusVal":"","statusType":"auto","x":570,"y":260,"wires":[]},{"id":"66d40440.85532c","type":"inject","z":"787d82c4.76eb6c","name":"inject","props":[{"p":"url","v":"/connection/lte/config/","vt":"str"},{"p":"method","v":"PUT","vt":"str"},{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"{\"enabled\":true}","payloadType":"json","x":230,"y":260,"wires":[["c45bc2fe.86ce5"]]},{"id":"46058a69.3491c4","type":"freebox-server","host":"https://mafreebox.freebox.fr","port":"443"}]
