module.exports = process.pid; //to relaunch server.
 
if (!module.parent) {
    indexApp();
} //check if it required -- NOT LAUNCH SCRAPPER
 function yyyy_mm_dd_hh_mm_ss () {
  now = new Date();
  year = "" + now.getFullYear();
  month = "" + (now.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
  day = "" + now.getDate(); if (day.length == 1) { day = "0" + day; }
  hour = "" + now.getHours(); if (hour.length == 1) { hour = "0" + hour; }
  minute = "" + now.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
  second = "" + now.getSeconds(); if (second.length == 1) { second = "0" + second; }
  return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
}
function indexApp() {
    const reload = require('require-reload')(require)
    const fs = require('fs');
    const util = require('util');
    const readFile = util.promisify(fs.readFile);
    const deleteFile = util.promisify(fs.unlink);
    const puppeteer = require('puppeteer');
    //const request = require('request');
    const log = require('./log.js');
    const low = require('lowdb');
    let config = reload('./config.js');
    let WARN_CONFIG = require('./WARN_CONFIG.js');
 
 
    const messageBot = require('./messageBot.js')
 
    messageBot.customMessage({ 'err': 'SCRAPPER STARTED', 'url': 'https://linode.com' });
    log('SCRAPPER STARTED');
 
    // LowDB init 
    // const FileSync = require('lowdb/adapters/FileSync');
    // const adapter = new FileSync('./.data/db.json');
    // const db = low(adapter);
    // db.defaults({ ads: []})
    // .write();
    const FileSync = require('lowdb/adapters/FileSync');
    const adapterAds = new FileSync('./adsDB.json');
    const adsDB = low(adapterAds);
    adsDB.defaults({ ads: [] })
        .write();
 
    // functions
    function delay(mseconds) {
        //log('Pausing for', mseconds / 1000, 'seconds...');
        return new Promise(resolve => {
            setTimeout(() => resolve(), mseconds);
        });
    }
 
    const parseDataUrl = (dataUrl) => {
        const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
        if (matches.length !== 3) {
            throw new Error('Could not parse data URL.');
        }
        return { mime: matches[1], buffer: Buffer.from(matches[2], 'base64') };
    };
 
    const waitForCaptchaInput = () => {
        return new Promise((resolve, reject) => {
            const waitingInterval = setInterval(async () => {
                if (fs.existsSync('./public/captcha.solve')) {
                    log('found captcha');
                    const solution = await readFile('./public/captcha.solve', "utf8");
                    await deleteFile('./public/captcha.solve');
                    clearInterval(waitingInterval);
                    log('delete captcha and resolving..');
                    return resolve(solution);
                }
 
            }, 1000); // two minutes
        });
    }
    const checkForCaptcha = async (content, page) => {
        if (content.indexOf('האם אתה אנושי?') > -1) {
            //log("ERROR CAPTCHA!!!");
            //await sendErrorMessage({ "err": "ERROR CAPTCHA! Waiting for solution..", "url": yad2ResultsURL });
            const captchaImg = await page.evaluate(() => document.querySelector('#captchaImageInline').src);
            const { buffer } = parseDataUrl(captchaImg);
            fs.writeFileSync(publicFolder + 'captcha.png', buffer, 'base64');
            messageBot.captchaMsg(WARN_CONFIG.DOMAIN + '/captcha.png')
            log('ERROR CAPTCHA! Waiting for solution..');
            const solution = await waitForCaptchaInput();
            await page.type('#captchaInput', solution);
            await page.click('#submitObject');
            return true;
        } else {
            return false;
        }
    }
 
 
 
 
 
 
 
    const checkforErrs = async (content, proxyIndex, page) => {
        if (content.indexOf('מתנצלים, המחשב חסום לגישה לאתר.') > -1) {
            throw new Error('Bot')
        }
        if (content.indexOf('האם אתה אנושי?') > -1) {
            throw new Error('captchaExist')
        }
        if (content.indexOf('Loading site please wait') > -1) {
            /*console.log('startWaitfn')
            await page.waitForNavigation({timeout: 60000, waitUntil:"domcontentloaded"})
             console.log('wtd1')
             let ccs =  await page.cookies();
             console.log(JSON.stringify(ccs))*/
            throw new Error('Loading site')
        }
        if (content.indexOf('Bad Gateway') > -1) {
            await page.reload({ waitUntil: "domcontentloaded" });
        }
        if(content.indexOf('HTTP/1.1 400 Bad Request')> -1){
            throw new Error('Bad Request')
        }
    }
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
    fs.writeFileSync('.isServerWakeUpable', "false", 'utf8');
 
    const publicFolder = './public/';
 
 
 
    const main = (async (yad2ResultsURL, browser, isCaptchaHere, proxyIndex, browserOptions, indexOfURL, indexOfAd) => {
        console.log(yyyy_mm_dd_hh_mm_ss() + 'current index of ad is: ', indexOfAd);
 
        let page = await browser.newPage();
 
        await page.setCookie({ "name": "y2018-2-access", "value": "false", "domain": ".yad2.co.il", "path": "/", "expires": -1, "size": 19, "httpOnly": false, "secure": false, "session": false })
 
        const preloadFile = fs.readFileSync('./preload.js', 'utf8');
        await page.evaluateOnNewDocument(preloadFile);
 
        //page.setViewport({width: getRandomInt(600, 1400), height:getRandomInt(600, 1400)})
 
        page.setDefaultNavigationTimeout(180000);
 
 
 
 
        await page.goto(yad2ResultsURL);
        console.info(yyyy_mm_dd_hh_mm_ss() + 'goto')
 
 
        //await delay(30000); //1m delay.
        //await delay(30000);
        const content = await page.content();
        console.info(yyyy_mm_dd_hh_mm_ss() + 'content')
        const cookies = await page.cookies();
 
        await checkforErrs(content, proxyIndex, page);
        await page.screenshot({ path: publicFolder + 'bancheck.png' });
 
        fs.writeFileSync('./public/bancheck.html', content, 'utf8');
        fs.writeFileSync('./public/cookies.html', JSON.stringify(cookies, null, 2), 'utf8');
        console.info(yyyy_mm_dd_hh_mm_ss() + 'content wrote to bancheck.html')
        // check for captcha
        //let captchaExist = await checkForCaptcha(content, page);
 
        //await page.waitFor(1000);
 
        // start scraping
        await page.waitFor("#tiv_main_table", { timeout: 120000 })
 
        //if(captchaExist){
        //messageBot.customMessage({ 'err': 'Captcha solved succesfully!', 'url': 'https://linode.com' });
        //}
        await page.screenshot({ path: publicFolder + 'homepage.png' });
 
        let count = 0;
 
        let skippedDueCaptcha = 0;
        let filteredBySqr = 0;
        let filteredByCity = 0;
        let filteredID = 0;
 
        const parsedAds = await page.evaluate(() => {
            const adsResults = [];
            const ads = $("#tiv_main_table .main_table tr.showPopupUnder");
            console.info(ads);
 
 
            ads.each(function(i, ad) {
                // get the href attribute of each link
                var adResult = {};
                adResult.id = $(ad).attr("id").split("_").splice(-1)[0];
 
                $(ad).find('td').each(function(idx, td) {
                    if (idx === 4) { adResult.type = $(td).text().trim(); }
                     if (idx === 6) { adResult.city = td.innerText.split(' - ')[0] }
                    if (idx === 8) { adResult.address = $(td).text().trim(); }
                    if (idx === 10) { adResult.price = $(td).text().trim(); }
                    if (idx === 12) { adResult.rooms = $(td).text().trim(); }
                    if (idx === 14) { adResult.entranceDate = $(td).text().trim(); }
                    if (idx === 16) { adResult.floor = $(td).text().trim(); }
                    if (idx === 20) { adResult.adDate = $(td).text().trim(); }
                });
                adsResults.push(adResult);
            });
            return adsResults;
        });
 
 
        //checking existing in unacceptable cities
        for (let i in config.unacceptable) {
            for (let o = 0; o < parsedAds.length; o++) {
                //log(parsedAds[o])
                if (config.unacceptable[i] == parsedAds[o].city) {
                    filteredByCity++;
                    parsedAds.splice(o, 1)
                    o--;
                }
            }
        }
 
        //checking existing in unacceptable IDs
 
        for (let i in config.unacceptableIDs) {
            for (let o = 0; o < parsedAds.length; o++) {
 
                if (config.unacceptableIDs[i] == parsedAds[o].id) {
 
 
                    filteredID++;
                    parsedAds.splice(o, 1)
                    i--;
                }
            }
        }
 
 
        ///await delay(5000)
 
 
        for (let i = indexOfAd; i < parsedAds.length; i++) {
            try {
                //await delay(60000); //1m delay.
 
                let ad = parsedAds[i];
                const existingAd = adsDB.get('ads')
                    .find({ id: ad.id })
                    .value();
 
 
                if (!existingAd) {
                    //let incognito = await browser.createIncognitoBrowserContext();
                    //page = await incognito.newPage();
                    //page.setDefaultNavigationTimeout(120000)
                    let curCookies = await page.cookies();
                    await page.deleteCookie(...curCookies);
                    await page.setCookie({ "name": "y2018-2-access", "value": "false", "domain": ".yad2.co.il", "path": "/", "expires": -1, "size": 19, "httpOnly": false, "secure": false, "session": false })
 
                    // new ad
                    count++;
                    //if(count>9)continue;
                    ad.link = "http://www.yad2.co.il/Nadlan/tivrent_info.php?NadlanID=" + ad.id;
                    //log('Fetching', ad.link);
                    console.log('go to ', ad.link);
                    let cookiesAd = await page.cookies();
                    fs.writeFileSync('./public/cookies.html', JSON.stringify(cookiesAd), 'utf8');
                    console.log('cookies wrote to cookies.html', ad.link);
                    //await page.waitFor(50000)
                    //await page.deleteCookie(...cookiesAd)
                    await page.goto(ad.link);
                    const contentAd = await page.content();
 
                     if (contentAd.indexOf('שפרו את חווית הגלישה שלכם!') > -1 && content.indexOf('Loading site please wait') > -1) {
                        i--
                        await incognito.close();
                        continue;
                    }
 
 
 
 
 
                    console.log('got ', ad.link)
 
                    if (contentAd.indexOf('שפרו את חווית הגלישה שלכם!') > -1 && content.indexOf('Loading site please wait') > -1) {
                        i--
                        await incognito.close();
                        continue;
                    }
                    //await delay(20000);
                    //captchaExist = await checkForCaptcha(content, page);
 
                    let error = 0;
                    fs.writeFileSync('./public/bancheck.html', contentAd, 'utf8');
 
                    console.info('contentAD wrote to bancheck.html');
 
                    await checkforErrs(contentAd, proxyIndex, page);
                    await page.waitFor("#mainFrame", { timeout: 80000 })
 
 
 
 
 
                    if (error !== 0) {
                        //log("WAITING FOR 5min:"+ad.link)
                        //delay(60300*5)//wait for 5 mins
                        error = 0;
                        continue;
                    }
 
                    console.log('Waited');
                    const adDetails = await page.evaluate(() => {
                        const data = {};
                        $('.innerDetailsDataGrid').each((index, dataBlock) => {
                            if (index === 0) {
                                $(dataBlock).find('td').each(function(idx, td) {
                                    if (td.textContent.match('ישוב:') !== null) { data.city = td.nextElementSibling.innerText; }
                                    if (td.textContent.match("שכונה:") !== null && td.textContent.match("על השכונה:") === null) { data.hood = td.nextElementSibling.innerText }
                                    if (td.textContent.match("כתובת:") !== null) { data.fullAddress = td.nextElementSibling.innerText }
                                    if (td.textContent.match('גודל במ"ר:') !== null) { data.sqrmeter = parseInt(td.nextElementSibling.innerText) }
                                });
                            };
                            if (index === 1) {
                                data.sqrin = "*";
                                data.sqrgarden = "*";
                                $(dataBlock).find('td').each(function(idx, td) {
                                    if (td.lastChild.textContent.match('מ"ר בנוי') !== null) { data.sqrin = td.nextElementSibling.innerText; }
                                    if (td.lastChild.textContent.match('מ"ר גינה:') !== null) { data.sqrgarden = td.nextElementSibling.innerText }
                                    if (td.lastChild.textContent.match('השכרה לטווח ארוך') !== null) { data.term = td.children[0].classList.value == "v_checked" ? "ארוך" : "קצר!!"; }
                                    if (td.lastChild.textContent.match('משופצת') !== null) { data.renov = td.children[0].classList.value == "v_checked" ? "שופץ" : "לא-שופץ"; }
 
                                });
                                let container = dataBlock.nextElementSibling;
 
                                data.more = container.lastElementChild.innerText;
 
 
 
 
                                data["tax/m"] = "*";
                                data.vaad = "*";
                                for (let i = 0; i < container.children[2].childNodes.length; i++) {
                                    let cell = container.children[2].childNodes[i];
                                    if (cell.textContent.match('ארנונה לחודשיים') !== null) {
                                        data["tax/m"] = cell.nextSibling.innerText.slice(1).replace(",", "") / 2
                                    }
                                    if (cell.textContent.match('תשלום לועד בית') !== null) {
                                        data.vaad = cell.nextSibling.innerText.slice(1)
                                    }
                                }
                            };
                        });
 
                        // remove info divs scrollbars for screenshots
                        $('.details_block_296 .details_block_body div:nth-child(2)').css({ height: 'inherit' });
                        return data;
                    });
 
                    if (!(await sqrFilter(adDetails.sqrmeter))) {
                        filteredBySqr++;
                        continue;
                    }
                    if (!(await cityFilter(adDetails.city, adDetails.hood))) {
                        filteredByCity++;
                        continue;
                    }
                    ad.data = adDetails;
 
                    // screenshot the data
                    const infoElement = await page.$('#mainFrame > div.right_column > div > div > table > tbody > tr:nth-child(1) > td:nth-child(1)');
                    await infoElement.screenshot({ path: `${publicFolder}${ad.id}-info.png` });
                    //log('ad info screenshot created ' + `${publicFolder}${ad.id}-info.png`);
 
                    // get the images and the map location
                    //log('Fetching images and map data');
                    await page.goto(`http://www.yad2.co.il/Nadlan/ViewImage.php?CatID=2&SubCatID=6&RecordID=${ad.id}`, { waitUntil: ['load', 'domcontentloaded', 'networkidle0'] });
                    let adMetaData = {}
                    adMetaData.images = [];
                    try {
                        adMetaData = await page.evaluate(() => {
                            if (ImageArr === undefined) {
                                ImageArr = []
                            }
                            return {
                                images: ImageArr
                            };
                        });
                    } catch (e) {
                        adMetaData = {};
                        adMetaData.images = [];
                        log(e);
                    }
 
 
                    adMetaData.images.unshift(`${WARN_CONFIG.DOMAIN}/${ad.id}-info.png`);
                    ad.meta = adMetaData;
 
                    // write to DB
                    adsDB.get('ads')
                        .push(ad)
                        .write();
 
                    //messenger
 
                    //log('webhook bot data => ', JSON.stringify(ad));
                    //console.info(ad);
                    messageBot.pushNewAd(ad)
                    //await delay(15000);
                    await incognito.close()
                } else {
                    // existing ad, check for price change
                    // if changed update the new price and alert
                    if (existingAd.price != ad.price) {
                        messageBot.pushAdUpdate(ad);
                        log('found existing ad with price change, sending update ');
                        adsDB.get('ads')
                            .find({ id: existingAd.id })
                            .assign({ price: ad.price })
                            .write()
                    }
 
                }
            } catch (err) {
                console.log(err)
 
                throw new Error(`cnt:${i}`)
            }
        }
        log(`URL №${indexOfURL}`);
        log('Total ads on page:', parsedAds.length + filteredID);
        log(`Total skipped-duplicate - due to DB: ${parsedAds.length-count}`);
        log(`Total skipped due captcha: ${skippedDueCaptcha}`)
        log('Total skipped due to city filter: ', filteredByCity);
        log('Total skipped due to SQR filter: ', filteredBySqr);
        log(`Total skipped due specific ad ID filter: ${filteredID}`)
        log('Total msgs: ', count - filteredByCity - filteredBySqr);
    });
    async function sqrFilter(sqr) {
        if (!sqr) return true;
        sqr = parseInt(sqr);
        const filter = config.sqrFilter;
        if (filter.match("all") !== null || filter === "") return true
        try {
            //log(`SQRfilter IS: ${filter}`);
            //log(`SQR IS: ${sqr}`);
            //log(`SQR RESULT IS: ${!!(eval(filter))}`);
            return !!(eval(filter));
        } catch (err) {
            await sendErrorMessage({ err: "ERROR WITH PARSING SQRFILTER!!!" })
            log("ERROR WITH PARSING SQRFILTER!!!");
            log(err);
            return false;
        }
    }
 
    async function cityFilter(city, hood) {
        if (!city) return true;
        const { acceptable, unacceptable, mode } = config.cityFilter;
        //log(`CITIES unacceptable IS: ${unacceptable}`);
        //log(`CITY IS: ${city}`);
        /*{
            [cityName, hoodname, hoodname],
            [cityName, hoodname, hoodname],
            "cityName"
        }*/
 
        if (mode === 0) {
 
            for (let i in acceptable) {
                if (acceptable[i] === city) {
                    return true;
                } //cities without approved hoods will be approved
                if (typeof acceptable[i] !== "object") {
                    continue;
                } //check is this city without hoods or no
                for (let o in acceptable[i]) {
 
                    if (o === 0 && acceptable[i][o] !== city) {
                        break;
                    }
                    if (acceptable[i][o] == hood && acceptable[i][0] === city) {
                        return true
                    }
 
                }
 
            }
            return false
        }
 
        for (let i in unacceptable) {
 
            if (unacceptable[i] == city) {
                //log(`CITY RESULT IS: FALSE`);
                return false
            } //unacceptable cities without acceptable hoods will be rejected
            if (typeof unacceptable[i] !== "object") {
                continue;
            } //if city haven't hoods then
            for (let o in unacceptable[i]) {
                if (o === 0 && unacceptable[i][o] !== city) {
                    break;
                }
                if (unacceptable[i][o] == hood && unacceptable[i][0] === city) {
                    return true
                }
            }
            if (unacceptable[i][0] === city) return false
        }
        return true
    }
 
    async function isServerNeedsToStop() {
        const isStopNeeded = fs.readFileSync('.restartNeeded', 'utf8') === "true" ? true : false
        fs.writeFileSync('.restartNeeded', "false", 'utf8');
        if (isStopNeeded) {
            await messageBot.customMessage({ 'err': 'SCRAPPER STOPPED', 'url': 'https://linode.com' });
            log("SCRAPPER STOPPED");
            fs.writeFileSync('.isServerWakeUpable', "true", 'utf8');
            await delay(getRandomInt(3000, 4000));
 
            //process.on("exit", async function() {});
            process.exit();
        }
    }
 
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
 
 
    async function mainWrapper(yad2ResultsURL) {
        let errorsInARow = 0
        let mobileView = true;
        let lastCount = 0;
 
        for (let i = 0; i < yad2ResultsURL.length; i++) {
            config = reload('./config.js');
            //WARN_CONFIG = reload('./config.js');
 
            await isServerNeedsToStop();
            const browserOptions = {
                headless: true,
                ignoreHTTPSErrors: true,
                userDataDir: './tmp',
                args: ['--no-sandbox',
                    '--incognito',
                    '--disable-setuid-sandbox',
                    '--disable-infobars',
                    '--window-position=0,0',
                    '--ignore-certifcate-errors',
                    '--ignore-certifcate-errors-spki-list',
                    '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"',
 
                    `--proxy-server=${WARN_CONFIG.PROXIES[WARN_CONFIG.LAST_PROXY_INDEX].ipAddress}:${WARN_CONFIG.PROXIES[WARN_CONFIG.LAST_PROXY_INDEX].port}`
                ],
                defaultViewport: {
                    width: mobileView === true ? 400 : 1280,
                    height: mobileView === true ? 600 : 600,
                    deviceScaleFactor: 1,
                    isMobile: mobileView,
                    hasTouch: false,
                    isLandscape: false
                }
            }
            const browser = await puppeteer.launch(browserOptions);
            console.info(`--proxy-server=${WARN_CONFIG.PROXIES[WARN_CONFIG.LAST_PROXY_INDEX].ipAddress}:${WARN_CONFIG.PROXIES[WARN_CONFIG.LAST_PROXY_INDEX].port}`)
            let curUrl = yad2ResultsURL[i];
            //log(`Current scrape for ${curUrl}`);
            let isCaptchaHere = errorsInARow > 0 ? true : false;
 
            /*if (errorsInARow >= 3) {
                if (i == yad2ResultsURL.length - 1) {
                    break;
                }
                for (let i = 0; i < 600; i++) {
                    await delay(getRandomInt(15000, 16000));
                    await isServerNeedsToStop(); //check for stop each 15-16 secs
                } // every 60 min
                i++;
            }*/
 
            await main(curUrl, browser, isCaptchaHere, WARN_CONFIG.LAST_PROXY_INDEX, browserOptions, i + 1, lastCount)
                .then(async () => {
                    log('Successful.');
                    errorsInARow = 0;
                    lastCount = 0;
                })
                .catch((err) => {
                    console.log(yyyy_mm_dd_hh_mm_ss())
                    console.log(err)
                    //log('PROXY CHANGED');
                    errorsInARow++;
                    i--;
                    if (err.message.indexOf('cnt:') > -1) lastCount = parseInt(err.message.match(/cnt:([0-9]*)/)[1]);
                    WARN_CONFIG.LAST_PROXY_INDEX = WARN_CONFIG.LAST_PROXY_INDEX === WARN_CONFIG.PROXIES.length - 1 ? 0 : WARN_CONFIG.LAST_PROXY_INDEX + 1;
                    let WARN_CONFIG_plain = fs.readFileSync('./WARN_CONFIG.js', 'utf8');
                    fs.writeFileSync('./WARN_CONFIG.js', WARN_CONFIG_plain.replace(/LAST_PROXY_INDEX:([0-9].*?)\n/, `LAST_PROXY_INDEX:${WARN_CONFIG.LAST_PROXY_INDEX}\n`), 'utf8');
                    //mobileView = mobileView === true ? false : true;
                    console.info(' WARN_CONFIG.LAST_PROXY_INDEX:', WARN_CONFIG.LAST_PROXY_INDEX)
                });
            await browser.close();
 
            await isServerNeedsToStop();
 
            //await delay(getRandomInt(60000, 120000)); // every 0ne - 2 min
        }
        for (let i = 0; i < 240; i++) {
            await delay(getRandomInt(12000, 13000));
            await isServerNeedsToStop(); //check for stop each 12-13 secs
        } // every 60 min
        //log('calling main again!');
        mainWrapper(yad2ResultsURL);
    }
 
 
 
 
 
    const yad2ResultsURL = config.yad2ResultsURL;
    //log(`Checking for URLs:\n ${yad2ResultsURL.join('\n\n')}`)
    mainWrapper(yad2ResultsURL);
 
    async function sendErrorMessage(err) {
        log(err);
        messageBot.customMessage(err)
    }
 
 
 
}
