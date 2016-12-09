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
  .get('/mts-sales', async function() {

    const mtsSales = require('./ss-scripts/mts-sales');
    this.body = await mtsSales();

  })
  .get('/mts-dev', async function() {

    const mtsDev = require('./ss-scripts/mts-dev');
    this.body = await mtsDev();

  })
  .get('/profi1', async function() {

    const profi1 = require('./ss-scripts/profi1');
    this.body = await profi1();

  })
  .get('/profi1/:pre_month/:curr_month', async function() {

    let months = [this.params.pre_month, this.params.curr_month];

    const profi1 = require('./ss-scripts/profi1');
    this.body = await profi1(months);

  })
  .get('/profi2', async function() {

    const profi2 = require('./ss-scripts/profi2');
    this.body = await profi2();

  })
  .get('/profi2/:pre_month/:curr_month', async function() {

    let months = [this.params.pre_month, this.params.curr_month];

    const profi2 = require('./ss-scripts/profi2');
    this.body = await profi2(months);
  })
  .get('/fin-statements', async function() {

    let months = [7, 8, 9, 10, 11, 12];

    const finStatements = require('./ss-scripts/fin-statements');
    this.body = await finStatements(months);

  })
  .get('/fin-statements/:pre_month/:curr_month', async function() {

    let months = [this.params.pre_month, this.params.curr_month];

    const finStatements = require('./ss-scripts/fin-statements');
    this.body = await finStatements(months);
});

app.use(router.routes());

app.listen(3030, () => {console.log('Dev server start on port 3030...')});
