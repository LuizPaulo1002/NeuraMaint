export default {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current'
      },
      modules: 'auto' // Let Babel decide how to handle modules based on environment
    }]
  ],
  plugins: [
    'babel-plugin-transform-import-meta'
  ]
};