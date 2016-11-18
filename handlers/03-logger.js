// request/response logger

const convert = require('koa-convert');
const logger = require('koa-logger');

exports.init = app => app.use(convert(logger()));