'use strict';

const BaseNode = require('../../common/base.node');

module.exports = (RED) => {
  class ApiNode extends BaseNode {
    constructor(config) {
      super(config, RED);
    }
  }

  RED.nodes.registerType('api', ApiNode);
};
