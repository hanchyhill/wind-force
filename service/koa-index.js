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
    let hourlyElements = splitElements(elements);
    if(modelid == 'ecmwf_s2s' || modelid == 'ecmwfthin' || modelid == 'ecmwf_s2d'){

    }else if(modelid == 'giftoceanzd'){
      hourlyElements = splitElements('u10m v10m t2mm visi rain clct');
      url = `http://172.22.1.175/di/grid.action?userId=${ideaConfig.username}&pwd=${ideaConfig.password}&dataFormat=json&interfaceId=intGetMultElesDataTimeSerial&modelid=${modelid}&element=u10m v10m t2mm visi rain clct&level=1000&starttime=${starttime}&endtime=${endtime}&lon=${lon}&lat=${lat}`;
    }else if(modelid == 'gtrams3km_cnec' || modelid == 'gtrams3km_ec' || modelid == 'gtrams3km_cngragfs' || modelid ==  'gtrams3km_ncep'){
      hourlyElements = splitElements('u10m v10m t2mm visi cpre tcdc');
      url = `http://172.22.1.175/di/grid.action?userId=${ideaConfig.username}&pwd=${ideaConfig.password}&dataFormat=json&interfaceId=intGetMultElesDataTimeSerial&modelid=${modelid}&element=u10m v10m t2mm visi cpre tcdc&level=0&starttime=${starttime}&endtime=${endtime}&lon=${lon}&lat=${lat}`;
    }
    console.log(url);
    const res = await axios.get(url);
    
    let info = res.data;
    if(['ecmwfthin','ecmwf_s2d','gtrams3km_cngragfs','gtrams3km_ncep','giftoceanzd'].includes(modelid)){
      if(info.DATA) info.DATA = interploteData(info.DATA, hourlyElements);
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

function splitElements(elements) {
  if (!elements) return [];
  return elements.split(/\s+/).filter(Boolean);
}

function isValidValue(value, index) {
  if (value === null || value === undefined || value === '') return false;
  const numericValue = Number(value);
  if (index === 0 && numericValue === 0) return false;
  return Number.isFinite(numericValue) && numericValue > -999.0;
}

function interploteData(data, elements = []) {
  if(data.length==0) return data;// 无数据直接返回原值

  if(elements.length > 1) {
    const singleElementLength = data.length / elements.length;
    if(Number.isInteger(singleElementLength)) {
      return elements.reduce((acc, element, index) => {
        const start = index * singleElementLength;
        const end = start + singleElementLength;
        return acc.concat(interploteSingleSeries(data.slice(start, end)));
      }, []);
    }
  }

  return interploteSingleSeries(data);
}

function interploteSingleSeries(data) {
  let dataPair = [];
  for (let i = 0; i < data.length; i++) {
    if (isValidValue(data[i], i)) {// 找出所有的有效数字
      dataPair.push({ index: i, value: Number(data[i]) });
    }
  }
  if(dataPair.length==0) return data;// 无数据直接返回原值

  for (let i = 0; i < data.length; i++) {
    if (!isValidValue(data[i], i)) {
      const nextIndex = dataPair.findIndex((pair) => pair.index > i);
      const prevPair = nextIndex > 0 ? dataPair[nextIndex - 1] : null;
      const nextPair = nextIndex > -1 ? dataPair[nextIndex] : null;

      if (prevPair && nextPair) {
        data[i] = (prevPair.value * (nextPair.index - i) + nextPair.value * (i - prevPair.index)) / (nextPair.index - prevPair.index);
      }else{
        data[i] = nextPair ? nextPair.value : dataPair[dataPair.length-1].value;// 头尾缺测找最近值补充
      }
    }
  }
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


