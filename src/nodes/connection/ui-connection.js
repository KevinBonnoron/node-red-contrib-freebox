RED.nodes.registerType('connection', {
  category: 'freebox',
  color: '#a6bbcf',
  inputs: 1,
  outputs: 1,
  defaults: {
    name: { value: '' },
    server: { value: '', type: 'server', required: true },
  },
  icon: 'freebox.png',
  paletteLabel: 'connection',
  label: function () { return this.name || 'connection'; }
});
