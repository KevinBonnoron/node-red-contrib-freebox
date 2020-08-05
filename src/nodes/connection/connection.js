'use strict';

const BaseNode = require('../../../lib/base.node');

module.exports = (RED) => {
  class ConnectionNode extends BaseNode {
    constructor(config) {
      super(config, RED, { url: '/connection', withPayload: false });
    }
  }

  RED.nodes.registerType('connection', ConnectionNode);
};
