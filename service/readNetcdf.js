const fs = require('fs');
const NetCDFReader = require('netcdfjs');
const path = require("path");
const util = require('util');
const readFile = util.promisify(fs.readFile);
const moment = require('moment');
const {printPDF} = require('./printPDF.js');
 
// http://www.unidata.ucar.edu/software/netcdf/examples/files.html

async function readNC(filePath='//10.148.16.19/d/nwp/GiftOcean/201812/',fileName='t2mm.nc',point=26442,varList=['t2mm00'],time=1){
  
  try{
    const ncFile = await readFile(path.resolve(filePath, fileName));
    console.log(fileName);
    var reader = new NetCDFReader(ncFile); // read the header
    //var t2mm000 = reader.getDataVariable('t2mm000'); // go to offset and read it
    //const timeL = t2mm000.length;
    //const t2m = t2mm000[point*time];
    //const offset = 0.01;
    //sst01.length 64800 180*360
    let dataList = []
    for (let name of varList) {
      dataList.push(readPoint(reader, point+(time-1)*51456, name));
    }
    // let t2m = readPoint(reader, point*time, varList[0]);
    return dataList;
  }
  catch(err){
    throw err;
  }
};

function readPoint(reader={}, point=26442,name='t2mm000'){
  console.log(name);
  const data = reader.getDataVariable(name);
  return data[point]
}

let vName = 't2mm'

let suffix = ['000','006','012','018','024','030','036','042','048','054','060','066','072','078','084','090','096','102','108','114','120'];
let day = 28//00 06 12 20 18
let hour = 6;
/* readNC(filePath,fileName,point,varList,time)
.catch(err=>{
  console.error(err);
}); */

function getTime(){
  let nowDate = moment(new Date());
  let nowHour = nowDate.hour();
  let fitDate;
  let fitHour;
  let timeConfig = {
    yearmonth:'201901',
    day:1,
    hour:20,
    fileTime:'2019010108',
  }
  //nowHour = 4;
  if(nowHour>=14&&nowHour<21){
    fitHour = '12:00:00';
    fitDate = nowDate.hour(12);
    timeConfig.yearmonth = fitDate.format('YYYYMM');
    timeConfig.day = fitDate.date();
    timeConfig.hour = fitDate.hours();
    timeConfig.fileTime = fitDate.add(8,'hours').format('YYMMDDHH');
  }
  else if(nowHour>=21){
    fitHour = '00:00:00';
    fitDate = nowDate.add(1,'days').hour(0);
    timeConfig.yearmonth = fitDate.format('YYYYMM');
    timeConfig.day = fitDate.date();
    timeConfig.hour = fitDate.hours();
    timeConfig.fileTime = fitDate.add(8,'hours').format('YYMMDDHH');
  }
  else if(nowHour<9){
    fitHour = '00:00:00';
    fitDate = nowDate.hour(0);
    timeConfig.yearmonth = fitDate.format('YYYYMM');
    timeConfig.day = fitDate.date();
    timeConfig.hour = fitDate.hours();
    timeConfig.fileTime = fitDate.add(8,'hours').format('YYMMDDHH');
  }
  else if(nowHour<14&&nowHour>=9){
    fitHour = '06:00:00';
    fitDate = nowDate.hour(6);
    timeConfig.yearmonth = fitDate.format('YYYYMM');
    timeConfig.day = fitDate.date();
    timeConfig.hour = fitDate.hours();
    timeConfig.fileTime = fitDate.add(8,'hours').format('YYMMDDHH');
  }
  else{
    '';
  }
  return timeConfig;
}

async function main(){
  let timeConfig = getTime();
  console.log(`正在获取UTC ${timeConfig.yearmonth}-${timeConfig.day} ${timeConfig.hour}时的数据`);
  console.log('下载数据量较大，处理数据需要几分钟，请不要关闭窗口');
  let nameList = ['t2mm','visi','u10m','v10m',];
  let suffix = ['000','006','012','018','024','030','036','042','048','054','060','066','072','078','084','090','096','102','108','114','120'];
  let point = (194-1)*201+113-1;//192列,112行   21.3N 115.2E 194列,113行
  let day = timeConfig.day//28//00 06 12 20 18
  let hour = timeConfig.hour//6;
  let time = (day-1)*4+hour/6+1;//
  let filePath = `//10.148.16.19/d/nwp/GiftOcean/${timeConfig.yearmonth}/`;
  let fileList = nameList.map(name=>name + '.nc');
  let varList = nameList.map(name=>suffix.map(v=>name+v));
  try{
    console.log('正在读取');
    let dataAll = await Promise.all(nameList.map((v,i)=>{
      return readNC(filePath,fileList[i],point,varList[i],time);
    }));
    
    let dataFit = dataAll.map(
      data=>data.map(
        (v,i)=>[v,Number.parseInt(suffix[i])]))
    
    let dataWrap = {
      t2m:dataFit[0],
      vis:dataFit[1],
      u10m:dataFit[2],
      v10m:dataFit[3],
      time:timeConfig,
    }
    // console.log('读取完毕');
    console.log(`读取完毕${timeConfig.yearmonth}-${timeConfig.day} ${timeConfig.hour}时的数据`);
    console.log(dataWrap);
    const jsonString = JSON.stringify(dataWrap, null, 2);
    fs.writeFile(path.resolve(__dirname, 'data.json'), jsonString, function (err) {
      if(err) {
       console.error(err);
       } else {
          console.log('写入成功');
          
       }
   });
    printPDF(timeConfig)
    .catch(err=>{
      console.error(err);
      throw err;
    });
  // try {
  //   let dataAll = Promise.all
  //   for(let name of nameList){
  //     const fileName = name + '.nc';
  //     let varList = suffix.map(v=>name+v);
  //     let dataList = await readNC(filePath,fileName,point,varList,time);
  //     console.log(dataList);
  //   }
  } catch (error) {
    throw error
  }
  
}
main()
.catch(err=>console.error(err));