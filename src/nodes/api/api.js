'use strict';

module.exports = (RED) => {
  class ApiNode {
    constructor(config) {
      RED.nodes.createNode(this, config);
      const node = this;
  
      // Retrieve the server config node
      const serverNode = RED.nodes.getNode(config.server);
      if (!serverNode) {
        RED.log.error('Server not configured');
        node.status({ fill: 'red', shape: 'ring', text: 'not connected' });
      } else {
        serverNode.statusChanged.on('application.granted', () => node.status({ fill: 'green', shape: 'dot', text: 'connected' }));
        serverNode.statusChanged.on('application.pending', () => node.status({ fill: 'yellow', shape: 'dot', text: 'server validation pending' }));
        serverNode.statusChanged.on('application.timeout', () => node.status({ fill: 'orange', shape: 'dot', text: 'server validation timeout' }));
        serverNode.statusChanged.on('application.error', () => node.status({ fill: 'red', shape: 'dot', text: 'invalid configuration' }));
        serverNode.statusChanged.on('disconnected', () => node.status({ fill: 'red', shape: 'ring', text: 'disconnected' }));
      }
  
      node.on('input', (msg, send, done) => {
        send = send || function () { node.send.apply(node) };
        if (!serverNode || !serverNode.freebox) {
          RED.log.info('Freebox server is not configured');
          return done();
        }
  
        // Call the api
        serverNode.apiCall(msg.url, msg.payload).then((payload) => {
          node.send({ payload });
          node.status({ fill: 'green', shape: 'dot', text: `called at: ${prettyDate()}` })
          done();
        });
      });
    }
  }

  RED.nodes.registerType('api', ApiNode);
};
