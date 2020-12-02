const prettyData = require('../helpers/date.helper');

/**
 * Base class for all operations
 */
class BaseNode {
  constructor(config, RED, apiCallOptions = { url: '', withPayload: false }) {
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
      send = send || function () { node.send.apply(node, arguments) };
      if (!serverNode || !serverNode.freebox) {
        RED.log.info('Freebox server is not configured');
        return done();
      }

      // Call the api
      const { url, withPayload } = apiCallOptions;
      serverNode.apiCall(url, withPayload ? msg.payload : undefined).then((payload) => {
        node.send({ payload });
        node.status({ fill: 'green', shape: 'dot', text: `called at: ${prettyDate()}` })
        done();
      });
    });
  }
}

module.exports = BaseNode;
