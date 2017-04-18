'use strict';

const koa = require('koa');
const app = new koa();

const path = require('path');
const fs = require('fs');
const handlers = fs.readdirSync(path.join(__dirname, 'handlers')).sort();

handlers.forEach(handler => require('./handlers/' + handler).init(app));

// ------------------------------------------

// can be split into files too
const Router = require('koa-router');

const router = new Router({prefix: '/api'});

router.get('/sales', async ctx => {

  const sales = require('./ss-scripts-2017-1/sales');
  ctx.body = await sales();

}).get('/serv', async ctx => {

  const serv = require('./ss-scripts-2017-1/serv');
  ctx.body = await serv();

}).get('/context', async ctx => {

  const context = require('./ss-scripts-2017-1/context');
  ctx.body = await context();

}).get('/seo', async ctx => {

  const seo = require('./ss-scripts-2017-1/seo');
  ctx.body = await seo();

}).get('/dev', async ctx => {

  const dev = require('./ss-scripts-2017-1/dev');
  ctx.body = await dev();

}).get('/dev-reg', async ctx => {

  const devReg = require('./ss-scripts-2017-1/dev-reg');
  ctx.body = await devReg();

}).get('/dev-result', async ctx => {

  const devRes = require('./ss-scripts-2017-1/dev-result');
  ctx.body = await devRes();

}).get('/extra', async ctx => {

  const extra = require('./ss-scripts-2017-1/extra');
  ctx.body = await extra();

}).get('/extra-reg', async ctx => {

  const extraReg = require('./ss-scripts-2017-1/extra-reg');
  ctx.body = await extraReg();

}).get('/amo', async ctx => {

  const amo = require('./ss-scripts-2017-1/amo');
  ctx.body = await amo();

}).get('/amo-reg', async ctx => {

  const amoReg = require('./ss-scripts-2017-1/amo-reg');
  ctx.body = await amoReg();

}).get('/domain', async ctx => {

  const domain = require('./ss-scripts-2017-1/domain');
  ctx.body = await domain();

}).get('/dds_mon/:mon', async ctx => {

  const dds_mon = require('./ss-scripts-2017-1/dds_mon');
  let mon = [ctx.params.mon];
  ctx.body = await dds_mon(mon);

}).get('/dds_mon-salary/:mon', async ctx => {

  const dds_monSalary = require('./ss-scripts-2017-1/dds_mon-salary');
  let mon = [ctx.params.mon];
  ctx.body = await dds_monSalary(mon);

}).get('/dds_mon-indirect/:mon', async ctx => {

  const dds_monIndirect = require('./ss-scripts-2017-1/dds_mon-indirect');
  let mon = [ctx.params.mon];
  ctx.body = await dds_monIndirect(mon);

}).get('/profi_kz', async ctx => {

  const profi_kz = require('./ss-scripts-2017-1/profi_kz');
  ctx.body = await profi_kz();

}).get('/profi1', async ctx => {

  const profi1 = require('./ss-scripts-2017-1/profi1');
  ctx.body = await profi1();

}).get('/_profi1', async ctx => {

  const profi1 = require('./ss-scripts-2017-1/_profi1');
  ctx.body = await profi1();

}).get('/_profi1/:pre_month/:curr_month', async ctx => {

  let months = [ctx.params.pre_month, ctx.params.curr_month];

  const profi1 = require('./ss-scripts-2017-1/_profi1');
  ctx.body = await profi1(months);

}).get('/profi1/:pre_month/:curr_month', async ctx => {

  let months = [ctx.params.pre_month, ctx.params.curr_month];

  const profi1 = require('./ss-scripts-2017-1/profi1');
  ctx.body = await profi1(months);

}).get('/profi2', async ctx => {

  const profi2 = require('./ss-scripts-2017-1/profi2');
  ctx.body = await profi2();

}).get('/profi2/:pre_month/:curr_month', async ctx => {

  let months = [ctx.params.pre_month, ctx.params.curr_month];

  const profi2 = require('./ss-scripts-2017-1/profi2');
  ctx.body = await profi2(months);
}).get('/inflow/:month', async ctx => {

  const inflow = require('./ss-scripts-2017-1/inflow');
  ctx.body = await inflow(ctx.params.month);

}).get('/salary/:month', async ctx => {

  const salary = require('./ss-scripts-2017-1/salary');
  ctx.body = await salary([ctx.params.month]);

}).get('/salary', async ctx => {
  const salary = require('./ss-scripts-2017-1/salary');
  ctx.body = await salary();

}).get('/salary-distrib', async ctx => {
  const salaryDistrib = require('./ss-scripts-2017-1/salary-distrib');
  ctx.body = await salaryDistrib();

}).get('/indirect/:month', async ctx => {

  const indirect = require('./ss-scripts-2017-1/indirect');
  ctx.body = await indirect([ctx.params.month]);

}).get('/indirect', async ctx => {

  const indirect = require('./ss-scripts-2017-1/indirect');
  ctx.body = await indirect();

}).get('/fin-state/', async ctx => {

  const finState = require('./ss-scripts-2017-1/fin-state');
  ctx.body = await finState();

}).get('/fin-state/:curr_month', async ctx => {

  let months = ctx.params.curr_month;

  const finState = require('./ss-scripts-2017-1/fin-state');
  ctx.body = await finState(months);
}).get('/fin-state-loan', async ctx => {

  const finStateLoan = require('./ss-scripts/fin-state-loan');
  ctx.body = await finStateLoan();

}).get('/fin-model-balance', async ctx => {

  const finModelBalance = require('./ss-scripts-2017-1/fin-model-balance');
  ctx.body = await finModelBalance();

});

app.use(router.routes());

app.listen({
  port: 3030
}, () => {
  console.log('Dev server start on port 3030...');
});
