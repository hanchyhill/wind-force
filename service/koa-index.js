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
const privateConfig = require('./config/private.config.json');
const ideaConfig = {
  username:'',
  password:'',
}
if (process.env.NODE_ENV === 'production') {
  ideaConfig.username = privateConfig.production.IDEA.username;
  ideaConfig.password = privateConfig.production.IDEA.password;
  } else {
  ideaConfig.username = privateConfig.development.IDEA.username;
  ideaConfig.password = privateConfig.development.IDEA.password;
}
console.log(ideaConfig);

router.get('/api',async(ctx,next)=>{
  //ctx.body = 'hello world';
  if(ctx.query.interface=='getWind'){
    const elemnet = ctx.query.element;
    const starttime = ctx.query.starttime;
    const endtime = ctx.query.endtime;
    const lon = ctx.query.lon;
    const lat = ctx.query.lat;
    const modelid = ctx.query.modelid;
    const url = `http://172.22.1.175/di/grid.action?userId=${ideaConfig.username}&pwd=${ideaConfig.password}&dataFormat=json&interfaceId=intGetDataTimeSerial&modelid=${modelid}&element=${elemnet}&level=1000&starttime=${starttime}&endtime=${endtime}&lon=${lon}&lat=${lat}`;
    // http://172.22.1.175/di/grid.action?userId=sqxt&pwd=shengqxt123&dataFormat=json&interfaceId=intGetMultElesDataTimeSerial&modelid=ecmwf_s2s&element=u10m v10m t2mm visi tppm tcco&level=0&starttime=2020-06-15 12:00:00&endtime=2020-06-17 12:00:00&lon=112.25&lat=21.5
    console.log(url);
    const res = await axios.get(url);
    
    ctx.body = res.data;
  }if(ctx.query.interface=='getHourlyElems'){// 逐小时预报数据获取
    const elements = ctx.query.elements;
    const starttime = ctx.query.starttime;
    const endtime = ctx.query.endtime;
    const lon = ctx.query.lon;
    const lat = ctx.query.lat;
    const modelid = ctx.query.modelid;
    let url = `http://172.22.1.175/di/grid.action?userId=${ideaConfig.username}&pwd=${ideaConfig.password}&dataFormat=json&interfaceId=intGetMultElesDataTimeSerial&modelid=${modelid}&element=${elements}&level=0&starttime=${starttime}&endtime=${endtime}&lon=${lon}&lat=${lat}`;
    if(modelid == 'ecmwf_s2s' || modelid == 'ecmwfthin' ){

    }else if(modelid == 'giftoceanzd'){
      url = `http://172.22.1.175/di/grid.action?userId=${ideaConfig.username}&pwd=${ideaConfig.password}&dataFormat=json&interfaceId=intGetMultElesDataTimeSerial&modelid=${modelid}&element=u10m v10m t2mm visi rain clct&level=1000&starttime=${starttime}&endtime=${endtime}&lon=${lon}&lat=${lat}`;
    }else if(modelid == 'gtrams3km_cnec' || modelid == 'gtrams3km_ec' || modelid == 'gtrams3km_cngragfs' || modelid ==  'gtrams3km_ncep'){
      url = `http://172.22.1.175/di/grid.action?userId=${ideaConfig.username}&pwd=${ideaConfig.password}&dataFormat=json&interfaceId=intGetMultElesDataTimeSerial&modelid=${modelid}&element=u10m v10m t2mm visi cpre tcdc&level=0&starttime=${starttime}&endtime=${endtime}&lon=${lon}&lat=${lat}`;
    }
    console.log(url);
    const res = await axios.get(url);
    
    let info = res.data;
    if(['ecmwfthin','gtrams3km_cngragfs','gtrams3km_ncep','giftoceanzd'].includes(modelid)){
      if(info.DATA) info.DATA = interploteData(info.DATA);
      ctx.body = res.data = info;
    }else{
      ctx.body = res.data;
    }
  }else if(ctx.query.interface=='getDes'){// 获取词条描述
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

function interploteData(data) {
  if(data.length==0) return data;// 无数据直接返回原值

  let dataPair = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i] > -999.0) {// 找出所有的有效数字
      dataPair.push({ index: i, value: data[i] });
    }
  }
  if(dataPair.length==0) return data;// 无数据直接返回原值

  for (let i = 1; i < data.length - 1; i++) {// 不处理第一个元素和最后一个元素，单独处理
    if (data[i] < -999.0) {
      let betweenIndex = dataPair.findIndex((pair, cIndex) => {
        if (cIndex + 1 < dataPair.length) {// 防止越界 
          return pair.index < i && dataPair[cIndex + 1].index > i;
        } else {
          return false;
        }
      });
      if (betweenIndex > -1) {
        data[i] = (dataPair[betweenIndex].value * (dataPair[betweenIndex + 1].index - i) + dataPair[betweenIndex + 1].value * (i - dataPair[betweenIndex].index)) / (dataPair[betweenIndex + 1].index - dataPair[betweenIndex].index);
      }else{
        i<dataPair[0].index? data[i] = dataPair[0].value:data[i] = dataPair[dataPair.length-1].value;// 头尾缺测找最近值补充
      }
    }
  }
  if(data[0] < -999.0) data[0] = dataPair[0].value;
  if(data[data.length-1] < -999.0) data[data.length-1] = dataPair[dataPair.length-1].value;
  return data;
}

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


