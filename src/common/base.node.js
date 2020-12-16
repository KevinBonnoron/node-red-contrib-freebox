'use strict';
const prettyDate = require('../helpers/date.helper');

const STATUSES = {
  NOT_CONNECTED: { fill: 'red', shape: 'ring', text: 'not connected' },
  CONNECTED: { fill: 'green', shape: 'dot', text: 'connected' },
  SERVER_VALIDATION_PENDING: { fill: 'yellow', shape: 'dot', text: 'server validation pending' },
  SERVER_VALIDATION_TIMEOUT: { fill: 'orange', shape: 'dot', text: 'server validation timeout' },
  INVALID_CONFIGURATION: { fill: 'red', shape: 'dot', text: 'invalid configuration' },
  DISCONNECTED: { fill: 'red', shape: 'ring', text: 'disconnected' }
}

/**
 * Base class for all operations
 */
class BaseNode {
  constructor(config, RED) {
    RED.nodes.createNode(this, config);
    const node = this;

    // Retrieve the server config node
    const serverNode = RED.nodes.getNode(config.server);
    if (!serverNode) {
      RED.log.error('Server not configured');
      node.status(STATUSES.NOT_CONNECTED);
    } else {
      serverNode.statusChanged.on('application.granted', () => node.status(STATUSES.CONNECTED));
      serverNode.statusChanged.on('application.pending', () => node.status(STATUSES.SERVER_VALIDATION_PENDING));
      serverNode.statusChanged.on('application.timeout', () => node.status(STATUSES.SERVER_VALIDATION_TIMEOUT));
      serverNode.statusChanged.on('application.error', () => node.status(STATUSES.INVALID_CONFIGURATION));
      serverNode.statusChanged.on('disconnected', () => node.status(STATUSES.DISCONNECTED));
    }

    node.on('input', (msg, send, done) => {
      send = send || function () { node.send.apply(node, arguments) };
      if (!serverNode || !serverNode.freebox) {
        RED.log.info('Freebox server is not configured');
        return done();
      }

      const { url, payload } = this.getData(msg);

      // Call the api
      serverNode.apiCall(url, payload).then((payload) => {
        node.send({ payload });
        node.status({ fill: 'green', shape: 'dot', text: `called at: ${prettyDate()}` })
        done();
      });
    });
  }

  getData(msg) {
    return {
      url: msg.url,
      payload: msg.payload
    }
  }
}

module.exports = BaseNode;
