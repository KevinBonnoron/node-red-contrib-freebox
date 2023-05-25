'use strict';

const BaseNode = require('../../common/base.node');

module.exports = (RED) => {
  class PollNode extends BaseNode {
    constructor(config) {
      super(config, RED);

      const node = this;
      const intervalId = setInterval(() => node.emit('input', { ...config }), config.interval || 10000);
      node.on('close', () => clearInterval(intervalId));
    }
  }

  RED.nodes.registerType('poll', PollNode);
};
