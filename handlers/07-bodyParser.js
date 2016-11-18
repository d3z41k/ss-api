// Parse application/json, application/x-www-form-urlencoded
// NOT form/multipart!

const convert = require('koa-convert');
const bodyParser = require('koa-bodyparser');

exports.init = app => app.use(convert(bodyParser({
  jsonLimit: '56kb'
})));
