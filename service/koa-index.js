// TODO 设置机构
const Koa = require('koa');
const logger = require('koa-logger');
const {resolve} = require('path');
const Router = require('koa-router');
const router = new Router();
const koaBody   = require('koa-body');
const cors = require('koa2-cors');
const axios = require('axios');

router.get('/api',async(ctx,next)=>{
  //ctx.body = 'hello world';
  const elemnet = ctx.query.element;
  const starttime = ctx.query.starttime;
  const endtime = ctx.query.endtime;
  const lon = ctx.query.lon;
  const lat = ctx.query.lat;
  const modelid = ctx.query.modelid;
  const url = `http://172.22.1.175/di/grid.action?userId=sqxt&pwd=shengqxt123&dataFormat=json&interfaceId=intGetDataTimeSerial&modelid=${modelid}&element=${elemnet}&level=1000&starttime=${starttime}&endtime=${endtime}&lon=${lon}&lat=${lat}`
  const res = await axios.get(url);
  console.log(url);
  ctx.body = res.data;
  await next();
});

main = async (ctx,next)=>{
  ctx.set('Access-Control-Allow-Origin', '*');
  // console.log('main');
  await next();
};

(async()=>{
  const app = new Koa();
  app.keys = ['some secret hurr'];

  app.use(logger());
  // 
  app.use(cors({
    origin: function(ctx) {
      if (ctx.url === '/test') {
        return false;
      }
      return '*';
    },
    exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
    maxAge: 5,
    credentials: true,
    allowMethods: ['GET', 'POST', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
  }));

  app.use(main);
  app.use(router.routes())
     .use(router.allowedMethods());
  
  app.listen(10078);
  console.log('监听端口 10078');
})()


