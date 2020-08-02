'use strict';
const crypto = require('crypto');
const axios = require('axios');
const util = require('util');

module.exports = function (RED) {
  class FreeboxServerNode {
    constructor(config) {
      RED.nodes.createNode(this, config);
      const node = this;
      // Freebox informations
      node.freebox = {
        baseUrl: '',
        uid: '',
        deviceName: '',
        deviceType: '',
      };

      // Application informtions
      node.app = {
        app_id: 'node-red-contrib-freebox',
        app_name: 'node-red Freebox API',
        app_version: '0.0.1',
        device_name: 'Node-red',

        app_token: '',
        track_id: '',

        status: '',
        logged_in: false,

        challenge: '',
        password: '',
        session_token: '',

        permissions: {},
      };

      this.on('close', function () {
        node.sessionClose();
      });

      this.connected = this.connect(config);
    }

    /**
       * sessionClose method
       *
       * logout.
       *
       * @return void
       */
    async sessionClose() {
      const app = this.app;
      const node = this;

      //Asking a new challenge
      await node._freebox_api_request('login/logout', {});
      app.logged_in = false; //Update login status
      node.status({ fill: 'green', shape: 'dot', text: 'session open' });
      RED.log.info('Session Close');
    }

    /**
     * connect method
     * Update freebox information
     * @return Promise
     */
    connect(config) {
      const { freebox, app } = this;
      const node = this;

      app.app_token = this.credentials.app_token;
      app.track_id = this.credentials.track_id;

      const freeboxUrl = `http://${config.host}:${config.port}`;
      RED.log.info(`Connecting to freebox at ${freeboxUrl}`);
      return axios({ url: `${freeboxUrl}/api_version` })
        .then(({ data }) => {
          if (!('uid' in data)) {
            throw 'No uid in response';
          }

          freebox.uid = data.uid;
          freebox.deviceName = data.device_name;
          freebox.deviceType = data.device_type;

          const apiVersion = `v${data.api_version.substr(0, data.api_version.indexOf('.'))}`;
          freebox.baseUrl = `${freeboxUrl}${data.api_base_url}${apiVersion}`;
          node.status({ fill: 'green', shape: 'dot', text: 'connected' });

          if (app.app_token === '' && app.status === 'granted') {
            return this.session();
          } else {
            return this.authorize();
          }
        })
        .catch((response) => {
          if (response.config) {
            RED.log.error(`Freebox ${response.config.url} error: ${util.inspect(response)}`);
          } else {
            RED.log.error(`Freebox error: ${util.inspect(response)}`);
          }

          node.status({ fill: 'red', shape: 'ring', text: 'bad reply' });
          return response;
        })
        ;
    }

    /**
     * authorize
     * Register the app to the Freebox
     * A message will be displayed on the Freebox LCD asking the user to grant/deny access to the requesting app.
     *
     * @return void
     */
    authorize() {
      const { app } = this;
      const node = this;

      // Do we already register the app before ?
      if (app.track_id) {
        return this.call(`/login/authorize/${app.track_id}`).then(({ status, challenge }) => {
          app.status = status; // Should be pending until the app is accepted

          // The user must accept the app on the box
          switch (status) {
            case 'pending':
              if (challenge !== app.challenge) {
                app.challenge = challenge;
                RED.log.error('The app is not accepted. You must register it.');
              }
              return this.authorize();

            case 'granted':
              app.challenge = challenge;

              node.credentials.app_token = app.app_token;
              node.credentials.track_id = app.track_id;
              RED.nodes.addCredentials(node.id, node.credentials);
              return this.session();

            default:
              RED.log.error('Register app failed.', 'info');
          }
        });
      } else {
        const data = {
          app_id: app.app_id,
          app_name: app.app_name,
          app_version: app.app_version,
          device_name: app.device_name,
        };

        return this.call('/login/authorize', data).then(({ app_token, track_id }) => {
          app.app_token = app_token;
          app.track_id = track_id;
          RED.log.info('Register app token ' + app.app_token);
          return this.authorize();
        });
      }
    }

    /**
     * session method
     *
     * Update login status and challenge.
     * If needed log the app = Ask for a session token.
     *
     * @return void
     */
    session() {
      const { app } = this;
      const node = this;

      //Asking a new challenge
      this.call('/login').then(({ logged_in, challenge }) => {
        app.logged_in = logged_in; //Update login status
        app.challenge = challenge; //Update challenge

        //Update password
        app.password = crypto
          .createHmac('sha1', app.app_token)
          .update(app.challenge)
          .digest('hex')
          ;

        //If we're not logged_in
        if (!app.logged_in) {
          //POST app_id & password
          const data = {
            app_id: app.app_id,
            app_version: app.app_version,
            password: app.password,
          };

          this.call('/login/session', data).then(({ challenge, session_token, permissions }) => {
            app.logged_in = true; //Update login status
            app.challenge = challenge; //Update challenge

            app.session_token = session_token; //Save session token
            app.permissions = permissions;

            node.status({
              fill: 'green',
              shape: 'dot',
              text: 'session open',
            });
            RED.log.info(`Session Opened permissions: ${JSON.stringify(app.permissions)}`);
          });
        }
      });
    }

    call(url, data) {
      const { app, freebox } = this;

      const options = {
        url: `${freebox.baseUrl}${url}`,
        data,
        method: data ? 'POST' : 'GET',
        headers: {
          'X-Fbx-App-Auth': app.session_token
        }
      };


      RED.log.info(`Calling ${options.method} ${options.url} ${app.session_token}...`);
      return axios(options)
        .then(({ data }) => data.result)
        .catch((response) => {
          RED.log.error(`FreeboxApiReq ${response.config.url} response error: ${util.inspect(response.toJSON())}`);
          app.logged_in = false; //Update login status
          return response;
        })
        ;
    }
  }

  RED.nodes.registerType('freebox-server', FreeboxServerNode, {
    credentials: {
      app_token: { type: 'password' },
      track_id: { type: 'password' },
    },
  });

  /**
   * Abstract class for all operations
   */
  class FreeboxNode {
    constructor(config, endPoint) {
      RED.nodes.createNode(this, config);
      const node = this;

      // Retrieve the config node
      const serverNode = RED.nodes.getNode(config.server);
      if (!serverNode) {
        RED.log.error('Server not configured');
        node.status({ fill: 'red', shape: 'ring', text: 'not connected' });
      } else {
        node.status({ fill: 'green', shape: 'dot', text: 'connected' });
      }

      node.on('input', (msg) => {
        if (serverNode && serverNode.freebox) {
          serverNode.call(endPoint, msg.payload).then((data) => node.send({
            payload: data
          }));
        } else {
          RED.log.info('Freebox server is not configured');
        }
      });

      node.on('close', () => {
        // tidy up any async code here - shutdown connections and so on.
      });
    }
  }

  class FreeboxConnectedDevicesNode extends FreeboxNode {
    constructor(config) {
      super(config, '/lan/browser/pub');
    }
  }

  RED.nodes.registerType('freebox-connected-devices', FreeboxConnectedDevicesNode);
};
