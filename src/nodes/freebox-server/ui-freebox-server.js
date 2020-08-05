RED.nodes.registerType('freebox-server', {
  category: 'config',
  defaults: {
    host: { value: 'https://mafreebox.freebox.fr', required: true },
    port: { value: 443, required: true, validate: RED.validators.number() },
  },
  icon: 'font-awesome/fa-home',
  label: function () { return `${this.host}:${this.port}`; }
});
