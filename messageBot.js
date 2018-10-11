const request = require('request');

exports.pushNewAd = async function(ad) {
    const reqOptions = {
        uri: 'https://botic.glitch.me/r/pushNewAd',
        method: 'POST',
        json: true,
        body: ad
    };
    request(reqOptions);
}

exports.pushAdUpdate = async function(ad) {
    const reqOptions = {
        uri: 'https://botic.glitch.me/r/pushAdUpdate',
        method: 'POST',
        json: true,
        body: ad
    };
    request(reqOptions);
}
exports.clearDB = async function(){
    const reqOptions = {
        uri: 'https://botic.glitch.me/r/clearDB',
        method: 'GET'
    };
    request(reqOptions);
}

exports.customMessage = async function(msg) {
    const reqOptions = {
        uri: 'https://botic.glitch.me/r/errorMessage',
        method: 'POST',
        json: true,
        body: msg
    };
    request(reqOptions);
}

exports.captchaMsg = async function(img) {
    const reqOptions = {
        uri: 'https://botic.glitch.me/r/captchaMsg',
        method: 'POST',
        json: true,
        body: {img}
    };
    request(reqOptions);
}