const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

const bundleOutputDir = "./v3";

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        contentBase: bundleOutputDir,
        port: 9000,
    },
});