// We need this to build our post string
var querystring = require('querystring');
var request = require('request');
var config = require('./conf/config.json');

var urls = new Array();

function getAuth() {
    var bintrayAuth = process.env.BINTRAY_USER + ":"  + process.env.BINTRAY_KEY;
    return "Basic " + new Buffer(bintrayAuth).toString("base64");
}

function getBintrayUrl(path) {
    return "https://api.bintray.com" + path;
}

function getSignedUrlRequestData(userName, validForSecs) {
    var urlValid = validForSecs == null ? "" : "\"valid_for_secs\":" + validForSecs + ",";
    var email = (config.callbackEmail == null || config.callbackEmail == "") ?
        "" : "\"callback_email\": \"" + config.callbackEmail + "\",";
    var callbackUrl = (config.callbackUrl == null || config.callbackUrl == "")
        ? "" : "\"callback_url\": \"" + config.callbackUrl + "\",";
    var data = "{" +
        urlValid +
        email +
        callbackUrl +
        "\"callback_id\": \"" + userName + "\"" +
        "}";
    console.log('data: ' + data);
    return data;
}

function createSignedUrlForFile(path, repoName, packageName, userName, validForSecs) {
    console.log("Creating signed URL for file ", path);
    var path = '/signed_url/' + config.subject + '/' + repoName + '/' + path;

    request.post({
        headers: {'Authorization' : getAuth()},
        url: getBintrayUrl(path),
        body: getSignedUrlRequestData(userName, validForSecs)
    }, function(error, response, body){
        if (error == null) {
            console.log('Response: ' + body);
            var json = JSON.parse(body);
            urls[packageName] = json.url;
            console.log('Created signed URL: ' + urls[packageName]);
        } else {
            console.log('Error: ' + error);
        }
    }.bind(this));
}

function fetchVersionFilesUrls(repoName, packageName, userName, version, validForSecs) {
    console.log('Fetching files for package: ' + packageName + " and version: " + version);
    var path = '/packages/' + config.subject + '/'  + repoName + '/' + packageName + '/versions/' + version + '/files';

    request.get({
        headers: {'Authorization' : getAuth()},
        url: getBintrayUrl(path)
    }, function(error, response, body) {
        if (error == null) {
            console.log('Files fetched: ' + body);
            var json = JSON.parse(body);
            createSignedUrlForFile(json[0].path, repoName, packageName, userName, validForSecs);
        } else {
            console.log('Error: ' + error);
        }
    }.bind(this));
}

function fetchPackageLatestVersion(repoName, packageName, userName, validForSecs) {
    var path = '/packages/' + config.subject + '/' + repoName + '/' + packageName + '/versions/_latest';

    request.get({
        headers: {'Authorization' : getAuth()},
        url: getBintrayUrl(path)
    }, function(error, response, body){
        if (error == null) {
            console.log('Response: ' + body);
            var json = JSON.parse(body);
            var packageVersion = json.name;
            console.log('Latest version for package: ' + packageVersion);
            fetchVersionFilesUrls(repoName, packageName, userName, packageVersion, validForSecs);
        } else {
            console.log('Error: ' + error);
        }
    }.bind(this) );
}

// Initiate the asynchronous process of creating download URLs from Bintray.
// After invoking this function, the getUrls method should be invoked to get the download URLs.
module.exports.create = function (repoName, packageName, userName, validForSecs) {
    if (process.env.BINTRAY_USER == null || process.env.BINTRAY_KEY == null) {
        console.log("Bintray credentials must be defined as environment variables (BINTRAY_USER and BINTRAY_KEY).");
        process.exit(code=1);
    }

    console.log("Bintray user: ", config.bintrayUser);

    // To initiate the process, we first fetch from Bintray the latest version of the configured package:
    fetchPackageLatestVersion(repoName, packageName, userName, validForSecs);
}

// Returns a signed URL.
// This function should be invoked after invoking the create function.
// Since the process of creating the URLs is asynchronous, the method can return an undefined value,
// in case the process is not yet finished.
// In that case, the function should be invoked again after a wait period.
module.exports.getUrl = function (packageName) {
    return urls[packageName];
}