// First: https://webpack.js.org/guides/getting-started/
const webpack = require('webpack')

module.exports = {
    /*
    plugins: [
        // fix "process is not defined" error:        
        new webpack.ProvidePlugin({
            process: 'process/browser.js',
        }),
    ],
    */
    resolve: {
        fallback: {
            process: require.resolve("process"), // https://github.com/react-dnd/react-dnd/issues/3425#issuecomment-1214554950
            path: require.resolve("path-browserify"), // before: const path = require('path')
        }
    }
}