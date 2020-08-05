RED.nodes.registerType('lan-browser', {
  category: 'freebox',
  color: '#a6bbcf',
  inputs: 1,
  outputs: 1,
  defaults: {
    name: { value: '' },
    server: { value: '', type: 'server', required: true },
  },
  icon: 'freebox.png',
  paletteLabel: 'lan browser',
  label: function () { return this.name || 'lan browser'; }
});
