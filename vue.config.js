module.exports = {
  configureWebpack: () => {},
  devServer: {
    proxy: {
      '/api': {
          target: 'http://localhost:10078',
          secure: false
      }
    },
   },
}