const puppeteer = require('puppeteer');

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
  path: 'page.pdf',
  format:'A4',
  printBackground: true,
  //width:'21cm'
  //scale 0.1到2之间
  //headerTemplate
};

(async () => {
  try{
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
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
    await page.pdf(pdfConfig);
    await browser.close();
  }
  catch(err){
    console.error(err);
  }
})();