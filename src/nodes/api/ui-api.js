RED.nodes.registerType('api', {
  category: 'freebox',
  color: '#a6bbcf',
  inputs: 1,
  outputs: 1,
  defaults: {
    name: { value: '' },
    url: { value: '' },
    server: { value: '', type: 'freebox-server', required: true },
  },
  icon: 'freebox.png',
  paletteLabel: 'api',
  label: function () { return this.name || 'api'; }
});
