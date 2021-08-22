'use strict';

const BaseNode = require('../../common/base.node');

module.exports = (RED) => {
  class LanBrowserNode extends BaseNode {
    constructor(config) {
      super(config, RED);
    }

    getData(msg) {
      return {
        ...msg,
        url: '/lan/browser/pub',
        method: 'GET',
        payload: undefined
      };
    }
  }

  RED.nodes.registerType('lan-browser', LanBrowserNode);
};
