// First: https://webpack.js.org/guides/getting-started/
// THANKS TO: https://github.com/jgraph/drawio-nextcloud/blob/main/webpack.config.js
const path = require('path')
const webpack = require('webpack')

module.exports = {
    plugins: [
        // fix "process is not defined" error:        
        new webpack.ProvidePlugin({
            process: 'process/browser.js',
        }),
    ]
}