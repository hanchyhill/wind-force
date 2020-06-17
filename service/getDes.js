const PromiseFtp = require('promise-ftp');
  
const ftpConfig = {
  host:'10.148.16.19',
  user:'Item',
  password:'Item',
}
async function main(date='201812270800'){
  const ftp = new PromiseFtp();
  const serverMessage =  await ftp.connect(ftpConfig);
  console.log('serverMessage ',serverMessage);
  const list =  await ftp.list('/');
  // const  tyFile = date + '+special_edition_description+East_Typhoon_Info+EN.txt';
  const  tyFile = date + '+special_edition_description+West_Typhoon_Info+CN.txt';
  // const  enFile = date + '+special_edition_description+East_Oil_Weather+EN.txt';
  const coastFile = date + '+special_edition_description+Coast_Weather+CN.txt';
  let nameList = list.map(v=>v.name);
  // console.log(nameList);
  const hasTY = nameList.includes(tyFile);
  // const hasEN = nameList.includes(enFile);
  const hasCoast = nameList.includes(coastFile);
  // console.log(hasEN);
  let tyString;
  // let enString;
  let coastString;
  if(hasTY){
    let tyStram = await ftp.get(tyFile);
    tyStram.setEncoding('UTF8');
    // console.log(tyStram);
    tyString = await promiseStream(tyStram);
    //console.log(tyString);
    // for await (const chunk of tyStram) {
    //   console.log('>>> '+chunk);
    // }
  }
  // if(hasEN){
  //   await ftp.get(enFile);
  //   let enStram = await ftp.get(enFile);
  //   enStram.setEncoding('UTF8');
  //   enString = await promiseStream(enStram);
  //   //console.log(enString);
  // }
  if(hasCoast){
    await ftp.get(coastFile);
    let coastStram = await ftp.get(coastFile);
    coastStram.setEncoding('UTF8');
    coastString = await promiseStream(coastStram);
    //console.log(enString);
  }
  //console.dir(list);
  ftp.end();
  // return {enString:enString?enString:'',tyString:tyString?tyString:'', coastString:coastString?coastString:'',};
  return {tyString:tyString?tyString:'', coastString:coastString?coastString:'',};
}

function promiseStream(readerStream){
  return new Promise((resolve,reject)=>{
    let data = '';
    
    readerStream.on('data', function(chunk) {
      // console.log(data);
      data += chunk;
    });
    readerStream.on('end',function(){
      // console.log(data);
      resolve(data);
    });
    readerStream.on('error', function(err){
      reject(err.stack);
    });
    readerStream.resume();
  })
}

/* main()
.then(str=>{
  console.log(str);
})
.catch(err=>{
  console.log(err);
  throw err;
}); */
exports.getDes = main;