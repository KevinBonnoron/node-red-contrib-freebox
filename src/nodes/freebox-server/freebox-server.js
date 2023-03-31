const crypto = require('crypto');
const https = require('https');
const axios = require('axios');
const util = require('util');
const { EventEmitter } = require('events');
const package = require(`${process.cwd()}/package.json`);

const APPLICATION = {
  appId: package.name,
  appName: 'node-red Freebox API',
  appVersion: package.version,
  deviceName: 'Node-red'
};

const REGISTER_APPLICATION_TIMEOUT = 90000 // 1 minute 30
const SESSION_TIMEOUT = 600000; // 10 minutes

module.exports = function (RED) {
  axios.defaults.httpsAgent = new https.Agent({ rejectUnauthorized: false });

  class FreeboxServerNode {
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
        permissions: {},
        lastGenerationTimestamp: new Date(0).getTime()
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
        return this._internalApiCall(`/login/authorize/${this.application.trackId}`).then(({ data }) => {
          this.application.status = data.status; // Should be pending until the app is accepted

          // The user must accept the app on the box
          switch (data.status) {
            case 'pending':
              const currentTimestamp = new Date().getDate();
              if (this._lastPendingCheck === undefined || currentTimestamp > this._lastPendingCheck + REGISTER_APPLICATION_TIMEOUT) {
                RED.log.info('The app is not accepted. You must register it.');
                this._lastPendingCheck = currentTimestamp;
              }

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
              RED.log.error(`Register application failed. Status is ${data.status}. Deleting credentials`);
              this._statusChanged.emit('application.unknown');

              RED.nodes.deleteCredentials(node.id);
              this.credentials = {};
              this.application = {};
              this.session = {};
              this.registerApplication();
          }
        });
      } else {
        const data = {
          app_id: APPLICATION.appId,
          app_name: APPLICATION.appName,
          app_version: APPLICATION.appVersion,
          device_name: APPLICATION.deviceName,
        };

        return this._internalApiCall('/login/authorize', { data }).then(({ data }) => {
          const { app_token, track_id } = data;
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
      if (this.session.lastGenerationTimestamp + SESSION_TIMEOUT > new Date().getTime()) {
        return Promise.resolve();
      }

      return this._internalApiCall('/login').then(({ data }) => {
        const { logged_in, challenge } = data;
        // If we're not logged_in
        if (!logged_in) {
          const data = {
            app_id: APPLICATION.appId,
            app_version: APPLICATION.appVersion,
            password: crypto.createHmac('sha1', this.application.token).update(challenge).digest('hex')
          };

          // Requesting new session
          return this._internalApiCall('/login/session', { data }).then(({ data }) => {
            const { session_token, permissions } = data;

            RED.log.info(`Session opened`);
            this._statusChanged.emit('session.opened');

            this.session = {
              token: session_token,
              permissions
            };
            this.session.lastGenerationTimestamp = new Date().getTime();
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
      this.apiCall('/login/logout', { method: 'POST' }).then(() => {
        RED.log.info('Session closed');
        this._statusChanged.emit('session.closed');
      });
    }

    /**
     * apiCall
     * 
     * @param {string} url 
     * @param {object} options 
     */
    async apiCall(url, options = {}) {
      const { freebox } = this;
      const { method = 'GET' } = options;
      RED.log.info(`${method} ${freebox.baseUrl}${url}`);

      await this.refreshSession();
      
      // Add the needed header for authentication
      
      const { headers = {} } = options;
      headers['X-Fbx-App-Auth'] = this.session.token;
      options.headers = headers;

      return this._internalApiCall(url, options);
    }

    /**
     * Make call to api with url, data and headers. Use internally to call api with or without session token.
     * @private
     * 
     * @param {string} url 
     * @param {object} options 
     */
    _internalApiCall(url, options = {}) {
      const { freebox } = this;
      const { method = options.data ? 'POST' : 'GET' } = options;
      const callOptions = {
        url: `${freebox.baseUrl}${url}`,
        ...options,
        method
      };

      return axios(callOptions)
        .catch((response) => {
          if (response instanceof Error) {
            RED.log.error(response);
          } else {
            RED.log.debug(`error: ${util.inspect(response)}`);
            RED.log.error(`${response.config.method} ${response.config.url}`);
          }

          this._statusChanged.emit('error');
          return { data: { result: {} }, status: 500 };
        })
        .then(({ data, ...rest }) => {
          if (!data.success) {
            return { data: undefined };
          }

          if (data.result) {
            return ({ data: data?.result, ...rest });
          }

          return ({ data, ...rest })
        });
    }

    get statusChanged() {
      return this._statusChanged;
    }
  }

  RED.nodes.registerType('freebox-server', FreeboxServerNode, {
    credentials: {
      token: { type: 'password' },
      trackId: { type: 'password' },
    },
  });
}