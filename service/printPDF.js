const puppeteer = require('puppeteer');
const fs = require('fs');
const moment = require('moment');
const path = require("path");
// const util = require('util');
const { spawn } = require('child_process');
const ejsHTML = require("./ejs-generator-promise.js").ejsHTML;
const axios = require('axios');
// const readFile = util.promisify(fs.readFile);
// const writeFile = util.promisify(fs.writeFile);

function timeout(delay) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
          resolve(1)
      } catch (e) {
          reject(0)
      }
    }, delay)
  })
}

const baseUrl = 'http://10.148.16.20:10077';

function getTime(){
  let nowDate = moment(new Date());
  let nowHour = nowDate.hour();
  let fitDate;
  let fitHour;
  let modelInitDate, modelFcHour;
  let timeConfig = {
    yearmonth:'201901',
    day:1,
    hour:20,
    fileTime:'2019010108',
  }
  //nowHour = 4;
  if(nowHour>=14&&nowHour<21){
    fitHour = '12:00:00';
    fitDate = moment(nowDate).hour(12);
    timeConfig.yearmonth = fitDate.format('YYYYMM');
    timeConfig.day = fitDate.date();
    timeConfig.hour = fitDate.hours();
    timeConfig.fileTime = fitDate.add(8,'hours').format('YYMMDDHH');
    modelInitDate = moment(nowDate).add(-1, "days").format("YYYY-MM-DD");
    modelFcHour = "12:00:00";
  }
  else if(nowHour>=21){
    fitHour = '00:00:00';
    fitDate = moment(nowDate).add(1,'days').hour(0);
    timeConfig.yearmonth = fitDate.format('YYYYMM');
    timeConfig.day = fitDate.date();
    timeConfig.hour = fitDate.hours();
    timeConfig.fileTime = fitDate.add(8,'hours').format('YYMMDDHH');
    modelInitDate = moment(nowDate).format("YYYY-MM-DD");
    modelFcHour = "00:00:00";
  }
  else if(nowHour<9){
    fitHour = '00:00:00';
    fitDate = moment(nowDate).hour(0);
    timeConfig.yearmonth = fitDate.format('YYYYMM');
    timeConfig.day = fitDate.date();
    timeConfig.hour = fitDate.hours();
    timeConfig.fileTime = fitDate.add(8,'hours').format('YYMMDDHH');
    modelInitDate = moment(nowDate).add(-1, "days").format("YYYY-MM-DD");
    modelFcHour = "12:00:00";
  }
  else if(nowHour<14&&nowHour>=9){
    fitHour = '06:00:00';
    fitDate = moment(nowDate).hour(6);
    timeConfig.yearmonth = fitDate.format('YYYYMM');
    timeConfig.day = fitDate.date();
    timeConfig.hour = fitDate.hours();
    timeConfig.fileTime = fitDate.add(8,'hours').format('YYMMDDHH');
    modelInitDate = moment(nowDate).add(-1, "days").format("YYYY-MM-DD");
    modelFcHour = "12:00:00";
  }
  else{
    '';
  }
  timeConfig.fitHour = fitHour;
  timeConfig.fitDate = fitDate;
  timeConfig.modelInitDate = modelInitDate;
  timeConfig.modelFcHour = modelFcHour;
  timeConfig.initTime = fitDate;
  timeConfig.lat = 21.5;
  timeConfig.lon = 112.25;
  timeConfig.selectedModel = "ecmwf_s2s";
  timeConfig.fcHour = fitHour;
  return timeConfig;
}



async function main (timeConfig=getTime()) {
  try{
    let sDate = timeConfig.modelInitDate;
    let sTime = timeConfig.modelFcHour;
    // let fcHrLenth = moment(`${this.modelInitDate} `)
    let eDate = moment(timeConfig.initTime, "YYYY-MM-DD")
      .add(1, "days")
      .format("YYYY-MM-DD");
    let eTime = timeConfig.fcHour;
    let iLon = timeConfig.lon;
    let iLat = timeConfig.lat;
    let iModel = timeConfig.selectedModel;
    let params = `starttime=${sDate}%20${sTime}&endtime=${eDate}%20${eTime}&lon=${iLon}&lat=${iLat}&modelid=${iModel}`;
    let urlGetHourlyFc = `${baseUrl}/api?interface=getHourlyElems&elements=u10m v10m t2mm visi tppm tcco&${params}`;
    // const elems = ["u10m", "v10m", "t2mm", "visi", "tppm", "tcco"];
    let res = await axios.get(urlGetHourlyFc);
    let data = res.data;
    if (data.DATA.length == 0) {

      throw new Error('此时次模式数据为空,请等待更新');
    }else{
      console.log('数据中心数据接口测试完成，准备生成数据');
    }
  }catch(err){
    console.log('数据中心数据接口异常，请注意是否有数据生成');
    console.error(err);
  }
  try{
    //const timeConfig = getTime();
    const fitName = 'YJFD-nanpeng-hourly';
    const fileName = `${fitName}-${timeConfig.fileTime}.pdf`;
    const imgName = `${fitName}-${timeConfig.fileTime}.jpg`;
    
    const pdfConfig = {
      //displayHeaderFooter: true,
      // headerTemplate: '<p class="pageNumber">GDMO</p>',
      //footerTemplate:'<span class="pageNumber"></span>',
      margin: { 
        top: "10px", 
        bottom: "20px",
        left:'30px',
        right:'30px',
      },
      path: path.resolve(__dirname,'pdf/'+fileName),
      format:'A4',
      printBackground: true,
      //width:'21cm'
      //scale 0.1到2之间
      //headerTemplate
    };
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    console.log('正在打开网页');
    console.log(`${baseUrl}/`);
    await page.goto(`${baseUrl}/`);
    await page.emulateMedia('screen');
    // await page._emulationManager._client.send(
    //   'Emulation.setDefaultBackgroundColorOverride',
    //   { color: { r: 0, g: 0, b: 0, a: 0 } }
    // );
    await page.setViewport({
      width: 900,//1024,
      height: 768,
    });
    console.log('喝杯茶，等待20秒数据中心接口回传');
    await timeout(20000);
    
    console.log('正在生成PDF '+fileName);
    await page.pdf(pdfConfig);
    // 外链
    pdfConfig.path = '//10.148.16.32/e/ssow/email/'+fileName;
    await page.pdf(pdfConfig);
    console.log('PDF生成完成');

    // await page.setViewport({
    //   width: 1920, height: 1080,
    // });
    console.log('正在生成HTML '+imgName);

    await page.screenshot({path: path.resolve(__dirname,'html/'+imgName),fullPage: true});
    await page.screenshot({path: path.resolve(__dirname,'html/'+fitName+'.jpg'),fullPage: true});
    //await page.screenshot({path: path.resolve(__dirname,`html/ENI${timeConfig.fileTime}.jpg`),fullPage: true});
    
    ejsHTML({imgSrc:fitName+'.jpg'})
    .then(html=>{
      fs.writeFile(path.resolve(__dirname,'html/'+fitName+'.html'), html, (err)=>{if (err) {
        return console.error(err);
      }});
    });
    ejsHTML({imgSrc:imgName})
    .then(html=>{
      fs.writeFile(path.resolve(__dirname,`html/${fitName}${timeConfig.fileTime}.html`), html, (err)=>{if (err) {
        return console.error(err);
      }});
    });
    //外链

    await page.screenshot({path: '//10.148.16.32/e/ssow/html/'+imgName,fullPage: true});
    await page.screenshot({path:  '//10.148.16.32/e/ssow/html/'+fitName+'.jpg',fullPage: true});
    ejsHTML({imgSrc:fitName+'.jpg'})
    .then(html=>{
      fs.writeFile('//10.148.16.32/e/ssow/html/'+`${fitName}.html`, html, (err)=>{if (err) {
        return console.error(err);
      }});
    });
    ejsHTML({imgSrc:imgName})
    .then(html=>{
      fs.writeFile('//10.148.16.32/e/ssow/html/'+`${fitName}${timeConfig.fileTime}.html`, html, (err)=>{if (err) {
        return console.error(err);
      }});
    });
    
    let openDir = path.dirname(path.resolve(__dirname,'pdf/'+fileName));
    console.log(openDir);
    // spawn('explorer.exe', [openDir]);
    spawn('explorer.exe', ['\\\\10.148.16.32\\e\\ssow\\html\\']);
    console.log('打开资源管理器'); 
    
    await browser.close();
  }
  catch(err){
    throw err;
  }
}

exports.printPDF = main;

if (require.main === module) {
  console.log('called directly');
  main()
  .catch(err=>{
    console.error(err);
  });
} else {
  console.log('required as a module');
}
