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

const router = new Router({
  prefix: '/api'
});

router
  .get('/mts-sales', async ctx => {

    const mtsSales = require('./ss-scripts-2017-1/mts-sales');
    ctx.body = await mtsSales();

  })
  .get('/dev-reg', async ctx => {

    const devReg = require('./ss-scripts/dev-reg');
    ctx.body = await devReg();

  })
  .get('/extra', async ctx => {

    const extra = require('./ss-scripts-2017-1/extra');
    ctx.body = await extra();

  })
  .get('/extra-reg', async ctx => {

    const extraReg = require('./ss-scripts-2017-1/extra-reg');
    ctx.body = await extraReg();

  })
  .get('/amo', async ctx => {

    const amo = require('./ss-scripts-2017-1/amo');
    ctx.body = await amo();

  })
  .get('/amo-reg', async ctx => {

    const amoReg = require('./ss-scripts-2017-1/amo-reg');
    ctx.body = await amoReg();

  })
  .get('/domain', async ctx => {

    const domain = require('./ss-scripts-2017-1/domain');
    ctx.body = await domain();

  })
  .get('/profi1', async ctx => {

    const profi1 = require('./ss-scripts-2017-1/profi1');
    ctx.body = await profi1();

  })
  .get('/profi1/:pre_month/:curr_month', async ctx => {

    let months = [ctx.params.pre_month, ctx.params.curr_month];

    const profi1 = require('./ss-scripts-2017-1/profi1');
    ctx.body = await profi1(months);

  })
  .get('/profi2', async ctx => {

    const profi2 = require('./ss-scripts-2017-1/profi2');
    ctx.body = await profi2();

  })
  .get('/profi2/:pre_month/:curr_month', async ctx => {

    let months = [ctx.params.pre_month, ctx.params.curr_month];

    const profi2 = require('./ss-scripts-2017-1/profi2');
    ctx.body = await profi2(months);
  })
  .get('/inflow/:month', async ctx => {

    const inflow = require('./ss-scripts-2017-1/inflow');
    ctx.body = await inflow(ctx.params.month);

  })
  .get('/salary/:month', async ctx => {

    const salary = require('./ss-scripts-2017-1/salary');
    ctx.body = await salary(ctx.params.month);

  })
  .get('/indirect/:month', async ctx => {

    const indirect = require('./ss-scripts-2017-1/indirect');
    ctx.body = await indirect(ctx.params.month);

  })
  .get('/fin-state', async ctx => {

    let months = [7, 8, 9, 10, 11, 12];

    const finState = require('./ss-scripts-2017-1/fin-state');
    ctx.body = await finState(months);

  })
  .get('/fin-state-loan', async ctx => {

    const finStateLoan = require('./ss-scripts/fin-state-loan');
    ctx.body = await finStateLoan();

  })
  .get('/fin-state/:pre_month/:curr_month', async ctx => {

    let months = [ctx.params.pre_month, ctx.params.curr_month];

    const finState = require('./ss-scripts-2017-1/fin-state');
    ctx.body = await finState(months);
});

app.use(router.routes());

app.listen({ port: 3030 }, () => {console.log('Dev server start on port 3030...');});
