RED.nodes.registerType('poll', {
  category: 'freebox',
  color: '#a6bbcf',
  inputs: 0,
  outputs: 1,
  defaults: {
    name: { value: '' },
    url: { value: '' },
    interval: { value: 1000 },
    server: { value: '', type: 'freebox-server', required: true },
  },
  icon: 'freebox.png',
  paletteLabel: 'poll',
  label: function () { return this.name || 'poll'; }
});
