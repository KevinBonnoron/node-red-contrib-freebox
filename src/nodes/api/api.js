'use strict';

const BaseNode = require('../../../lib/base.node');

module.exports = (RED) => {
  class APINode extends BaseNode {
    constructor(config) {
      super(config, RED);
    }
  }

  RED.nodes.registerType('api', APINode);
};
