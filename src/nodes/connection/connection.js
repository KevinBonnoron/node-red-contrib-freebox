'use strict';

const BaseNode = require('../../common/base.node');

module.exports = (RED) => {
  class ConnectionNode extends BaseNode {
    constructor(config) {
      super(config, RED);
    }

    getData() {
      return {
        url: '/connection',
        method: 'GET'
      }
    }
  }

  RED.nodes.registerType('connection', ConnectionNode);
};
