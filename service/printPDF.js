const puppeteer = require('puppeteer');
const fs = require('fs');
const moment = require('moment');
const path = require("path");
const util = require('util');
const { spawn } = require('child_process');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

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



async function main (timeConfig=getTime()) {
  try{
    //const timeConfig = getTime();
    const fileName = `HZ25-10-1-${timeConfig.fileTime}.pdf`;
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
    console.log('http://localhost:8080/');
    await page.goto('http://localhost:8080/');
    await page.emulateMedia('screen');
    // await page._emulationManager._client.send(
    //   'Emulation.setDefaultBackgroundColorOverride',
    //   { color: { r: 0, g: 0, b: 0, a: 0 } }
    // );
    await page.setViewport({
      width: 1024,
      height: 768,
    });
    await timeout(6000);
    await page.screenshot({path: 'example.png'});
    console.log('正在生成PDF '+fileName);
    await page.pdf(pdfConfig);
    pdfConfig.path = '//10.148.16.32/e/ssow/email/'+fileName;
    await page.pdf(pdfConfig);
    console.log('PDF生成完成');
    let openDir = path.dirname(path.resolve(__dirname,'pdf/'+fileName));
    console.log(openDir);
    spawn('explorer.exe', [openDir]);
    // openDir = path.dirname('\\\\10.148.16.32\\e\\ssow\\email\\'+fileName);
    spawn('explorer.exe', ['\\\\10.148.16.32\\e\\ssow\\email\\']);
    console.log('打开资源管理器');
    await browser.close();
  }
  catch(err){
    throw err;
  }
};

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
