'use strict';
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const axios = require('axios');
const util = require('util');
const { EventEmitter } = require('events');

const APPLICATION = {
  appId: 'node-red-contrib-freebox',
  appName: 'node-red Freebox API',
  appVersion: '0.0.1',
  deviceName: 'Node-red'
};

module.exports = function (RED) {
  https.globalAgent.options.ca = [];
  https.globalAgent.options.ca.push(fs.readFileSync(`${__dirname}/ssl/Freebox ECC Root CA.pem`));

  class ConfigServerNode {
    constructor(config) {
      RED.nodes.createNode(this, config);
      const node = this;

      // Freebox informations
      this.freebox = {
        uid: '',
        deviceName: '',
        deviceType: '',
        baseUrl: ''
      };

      // Application informations
      this.application = {
        token: this.credentials.token || '',
        trackId: this.credentials.trackId || '',
        status: ''
      };

      // Session informations
      this.session = {
        token: '',
        permissions: {}
      };

      this._statusChanged = new EventEmitter();
      node.on('close', () => this.logout());

      this.init(config);
    }

    /**
     * init
     * Update freebox informations
     * @return void
     */
    init(config) {
      const freeboxUrl = `${config.host}:${config.port}`;
      RED.log.info(`Connecting to freebox at ${freeboxUrl}`);
      axios({ url: `${freeboxUrl}/api_version` }).then(({ data }) => {
        if (!('uid' in data)) {
          throw 'No uid in response';
        }

        this.freebox = {
          uid: data.uid,
          deviceName: data.device_name,
          deviceType: data.device_type,
          baseUrl: `${freeboxUrl}${data.api_base_url}${`v${data.api_version.substr(0, data.api_version.indexOf('.'))}`}`
        };

        if (this.application.status !== 'granted') {
          this.registerApplication();
        }
      }).catch((response) => {
        if (response.config) {
          RED.log.error(`Freebox ${response.config.url} error: ${util.inspect(response)}`);
        } else {
          RED.log.error(`Freebox error: ${util.inspect(response)}`);
        }

        this._statusChanged.emit('application.error');
      });
    }

    /**
     * registerApplication
     * 
     * Register the app to the Freebox
     * A message will be displayed on the Freebox LCD asking the user to grant/deny access to the requesting app.
     *
     * @return void
     */
    registerApplication() {
      const node = this;

      // Do we already register the app before ?
      if (this.application.trackId) {
        return this._internalApiCall(`/login/authorize/${this.application.trackId}`).then(({ status }) => {
          this.application.status = status; // Should be pending until the app is accepted

          // The user must accept the app on the box
          switch (status) {
            case 'pending':
              RED.log.info('The app is not accepted. You must register it.');
              this._statusChanged.emit('application.pending');

              this.registerApplication();
              break;

            case 'granted':
              RED.log.info('Application registered');
              this._statusChanged.emit('application.granted');

              this.credentials = {
                token: this.application.token,
                trackId: this.application.trackId
              };
              RED.nodes.addCredentials(node.id, this.credentials);
              break;

            case 'timeout':
              RED.log.info('Application not registered in time. Sending another request...');
              this._statusChanged.emit('application.timeout');

              RED.nodes.deleteCredentials(node.id);
              this.credentials = {};
              this.application = {};
              this.session = {};
              this.registerApplication();
              break;


            default:
              RED.log.error(`Register application failed. Status is ${status}. Deleting credentials`);
              this._statusChanged.emit('application.unknown');

              RED.nodes.deleteCredentials(node.id);
              this.credentials = {};
              this.application = {};
              this.session = {};
          }
        });
      } else {
        const data = {
          app_id: APPLICATION.appId,
          app_name: APPLICATION.appName,
          app_version: APPLICATION.appVersion,
          device_name: APPLICATION.deviceName,
        };

        return this._internalApiCall('/login/authorize', data).then(({ app_token, track_id }) => {
          RED.log.info('Register app token ' + app_token);
          this.application.token = app_token;
          this.application.trackId = track_id;
          this.application.status = '';
          return this.registerApplication();
        });
      }
    }

    /**
     * refreshToken
     * 
     * Check if session is valid or generate a new one
     *
     * @return Promise
     */
    refreshSession() {
      return this._internalApiCall('/login').then(({ logged_in, challenge }) => {
        //If we're not logged_in
        if (!logged_in) {
          const data = {
            app_id: APPLICATION.appId,
            app_version: APPLICATION.appVersion,
            password: crypto.createHmac('sha1', this.application.token).update(challenge).digest('hex')
          };

          // Requesting new session
          return this._internalApiCall('/login/session', data).then(({ session_token, permissions }) => {
            RED.log.info(`Session opened`);
            this._statusChanged.emit('session.opened');

            this.session = {
              token: session_token,
              permissions
            }
          });
        }
      });
    }

    /**
     * logout
     *
     * @return void
     */
    logout() {
      this.call('/login/logout', {}).then(() => {
        RED.log.info('Session closed');
        this._statusChanged.emit('session.closed');
      });
    }

    /**
     * 
     * @param {string} url 
     * @param {object | undefined} data 
     */
    apiCall(url, data) {
      RED.log.info(`${data ? 'POST' : 'GET'} ${url}`);
      return this.refreshSession().then(() => this._internalApiCall(url, data, { 'X-Fbx-App-Auth': this.session.token }));
    }

    /**
     * Make call to api with url, data and headers. Use internally to call api with or without session token.
     * @private
     * 
     * @param {string} url 
     * @param {object | undefined} data 
     * @param {object} headers 
     */
    _internalApiCall(url, data = undefined, headers = {}) {
      const { freebox } = this;
      const options = {
        url: `${freebox.baseUrl}${url}`,
        data,
        method: data ? 'POST' : 'GET',
        headers
      };

      return axios(options)
        .then(({ data }) => data.result)
        .catch((response) => {
          RED.log.error(`${response.config.method} ${response.config.url} error: ${util.inspect(response)}`);
          return response;
        });
    }

    get statusChanged() {
      return this._statusChanged;
    }
  }

  RED.nodes.registerType('server', ConfigServerNode, {
    credentials: {
      token: { type: 'password' },
      trackId: { type: 'password' },
    },
  });
}