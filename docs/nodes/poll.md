# Poll

This node provides a way to poll api via the url parameter (or msg.url if passed). The poll is triggered every _interval_ parameter.

## Configuration

### Name
- Type: `string`
the name of the node

### Url
Optionnal (default msg.url)
- Type: `string`
the url to make the call

### Interval
Optionnal (default 1000)
- Type: `string`
the number of milliseconds between each poll

### Server
- Type: `freebox-server`
the freebox server instance
