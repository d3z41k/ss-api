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

    const mtsSales = require('./ss-scripts/mts-sales');
    ctx.body = await mtsSales();

  })
  .get('/dev-reg', async ctx => {

    const devReg = require('./ss-scripts/dev-reg');
    ctx.body = await devReg();

  })
  .get('/amo', async ctx => {

    const amo = require('./ss-scripts/amo');
    ctx.body = await amo();

  })
  .get('/amo-reg', async ctx => {

    const amoReg = require('./ss-scripts/amo-reg');
    ctx.body = await amoReg();

  })
  .get('/domain', async ctx => {

    const domain = require('./ss-scripts/domain');
    ctx.body = await domain();

  })
  .get('/profi1', async ctx => {

    const profi1 = require('./ss-scripts/profi1');
    ctx.body = await profi1();

  })
  .get('/profi1/:pre_month/:curr_month', async ctx => {

    let months = [ctx.params.pre_month, ctx.params.curr_month];

    const profi1 = require('./ss-scripts/profi1');
    ctx.body = await profi1(months);

  })
  .get('/profi2', async ctx => {

    const profi2 = require('./ss-scripts/profi2');
    ctx.body = await profi2();

  })
  .get('/profi2/:pre_month/:curr_month', async ctx => {

    let months = [ctx.params.pre_month, ctx.params.curr_month];

    const profi2 = require('./ss-scripts/profi2');
    ctx.body = await profi2(months);
  })
  .get('/fin-state', async ctx => {

    let months = [7, 8, 9, 10, 11, 12];

    const finState = require('./ss-scripts/fin-state');
    ctx.body = await finState(months);

  })
  .get('/fin-state-loan', async ctx => {

    const finStateLoan = require('./ss-scripts/fin-state-loan');
    ctx.body = await finStateLoan();

  })
  .get('/fin-state/:pre_month/:curr_month', async ctx => {

    let months = [ctx.params.pre_month, ctx.params.curr_month];

    const finStatements = require('./ss-scripts/fin-state');
    ctx.body = await finStatements(months);
});


app.use(router.routes());

app.listen(3000, () => {console.log('Server start on port 3000...');});
