const ejs = require('ejs');
const util = require('util');
const fs = require('fs');

const readFileP = util.promisify(fs.readFile);

const ejsPath = __dirname + '/templeHTML.ejs';
const jsonPath = __dirname + '/fc_data.json';

async function convertHTMLasync(fcArray){
  try{
    let ejsTempl = await readFileP(ejsPath,'utf-8');
    //let jsonRaw = await readFileP(jsonPath,'utf-8');
    //let fcArray = JSON.parse(jsonRaw);
    let html = ejs.render(ejsTempl,fcArray);
    /* fs.writeFile(__dirname + '/bhx.html',html,(err)=>{
      if (err) throw err;
      console.log('It\'s saved!');
    }); */
    return html;
  }
  catch(err){
    throw err;
  }
}



exports.ejsHTML = convertHTMLasync;




