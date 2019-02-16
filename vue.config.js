module.exports = {
  lintOnSave: false,

  chainWebpack: config => {
    config.module
      .rule('pb')
      .test(/\.(pb)(\?.*)?$/)
      .use('file-loader')
      .loader('file-loader')
      .options({
        name: 'pb/[name].[hash:8].[ext]',
      });
  },
};
