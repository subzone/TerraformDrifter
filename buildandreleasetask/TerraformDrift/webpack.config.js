module.exports = {
    entry: './terraform-drift.js',
    output: {
      filename: 'terraform-drift.bundle.js',
      path: __dirname
    },
    target: 'node'
  };