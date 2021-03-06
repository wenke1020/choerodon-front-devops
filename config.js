process.env.NODE_ENV = 'development';
let env;
switch (process.env.NODE_ENV) {
  case ('development'):
    env = {
      'process.env.DEVOPS_HOST': JSON.stringify(process.env.DEVOPS_HOST || 'devops-service.staging.saas.hand-china.com'),
    };
    break;
  case ('production'):
    env = {
      'process.env.DEVOPS_HOST': JSON.stringify(process.env.DEVOPS_HOST || 'devops-service.staging.saas.hand-china.com'),
    };
    break;
  default:
    break;
}

const config = {
  port: 9090,
  output: './dist',
  htmlTemplate: 'index.template.html',
  devServerConfig: {},
  webpackConfig(configs) {
    const webpack = require('./devops/node_modules/webpack');
    configs.plugins.push(new webpack.DefinePlugin(env));
    if (configs.node) {
      configs.node.push({ fs: 'empty' });
    } else {
      configs.node = { fs: 'empty' };
    }
    return configs;
  },
  entryName: 'index',
  root: '/',
  routes: null, // by default, routes use main in package.json
  server: 'http://api.staging.saas.hand-china.com', // api server
  // server: 'http://api.alpha.saas.hand-china.com',
  clientid: 'localhost',
  fileServer: 'http://minio.staging.saas.hand-china.com',
  titlename: 'Choerodon', // html title
  favicon: 'favicon.ico', // page favicon
  theme: { // less/sass modify vars
    'primary-color': '#3F51B5',
    'icon-font-size-base': '16px',
  },
  dashboard: {
    devops: 'src/app/devops/dashboard/*',
  },
};

module.exports = config;
