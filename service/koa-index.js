// TODO 设置机构
const Koa = require('koa');
const logger = require('koa-logger');
const {resolve} = require('path');
const Router = require('koa-router');
const router = new Router();
// const koaBody   = require('koa-body');
const cors = require('koa2-cors');
const axios = require('axios');
const util = require('util');
const fs = require('fs');
const {getDes} = require('./getDes.js')

const readFile = util.promisify(fs.readFile);

router.get('/api',async(ctx,next)=>{
  //ctx.body = 'hello world';
  if(ctx.query.interface=='getWind'){
    const elemnet = ctx.query.element;
    const starttime = ctx.query.starttime;
    const endtime = ctx.query.endtime;
    const lon = ctx.query.lon;
    const lat = ctx.query.lat;
    const modelid = ctx.query.modelid;
    const url = `http://172.22.1.175/di/grid.action?userId=sqxt&pwd=shengqxt123&dataFormat=json&interfaceId=intGetDataTimeSerial&modelid=${modelid}&element=${elemnet}&level=1000&starttime=${starttime}&endtime=${endtime}&lon=${lon}&lat=${lat}`;
    // http://172.22.1.175/di/grid.action?userId=sqxt&pwd=shengqxt123&dataFormat=json&interfaceId=intGetMultElesDataTimeSerial&modelid=ecmwf_s2s&element=u10m v10m t2mm visi tppm tcco&level=0&starttime=2020-06-15 12:00:00&endtime=2020-06-17 12:00:00&lon=112.25&lat=21.5
    const res = await axios.get(url);
    console.log(url);
    ctx.body = res.data;
  }if(ctx.query.interface=='getHourlyElems'){
    const elements = ctx.query.elements;
    const starttime = ctx.query.starttime;
    const endtime = ctx.query.endtime;
    const lon = ctx.query.lon;
    const lat = ctx.query.lat;
    const modelid = ctx.query.modelid;
    const url = `http://172.22.1.175/di/grid.action?userId=sqxt&pwd=shengqxt123&dataFormat=json&interfaceId=intGetMultElesDataTimeSerial&modelid=${modelid}&element=${elements}&level=0&starttime=${starttime}&endtime=${endtime}&lon=${lon}&lat=${lat}`;
    //           http://172.22.1.175/di/grid.action?userId=sqxt&pwd=shengqxt123&dataFormat=json&interfaceId=intGetMultElesDataTimeSerial&modelid=ecmwf_s2s&element=u10m v10m t2mm visi tppm tcco&level=0&starttime=2020-06-15 12:00:00&endtime=2020-06-17 12:00:00&lon=112.25&lat=21.5
    const res = await axios.get(url);
    console.log(url);
    ctx.body = res.data;
  }else if(ctx.query.interface=='getDes'){
    const dateString = ctx.query.dateString;
    //201812270800
    let desString = await getDes(dateString);
    ctx.body = desString;
  }else if(ctx.query.interface=='getFromFile'){
    let data = await readFile(resolve(__dirname,'data.json'));
    ctx.body = JSON.parse(data);
  }else if(ctx.query.interface=='convert2pdf'){
    '';
  }
  else{
    '';
  }
  
  await next();
});

const main = async (ctx,next)=>{
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


