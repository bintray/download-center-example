// We need this to build our post string
var querystring = require('querystring');
var request = require('request');
var config = require('./conf/config.json');

var urls = new Array();

function getAuth() {
    var bintrayAuth = config.bintrayUser + ":"  + config.bintrayKey;
    return "Basic " + new Buffer(bintrayAuth).toString("base64");
}

function getBintrayUrl(path) {
    return "https://api.bintray.com" + path;
}

function getSignedUrlRequestData(userName) {
    var time = new Date().getTime() + 2 * 60 * 60 * 1000 - 10 * 60 * 1000;
    var data = "{" +
        "\"expiry\":" + time + "," +
        "\"callback_id\": \"" + userName + "\"," +
        "\"callback_email\": \"" + config.callbackEmail + "\"" +
        "}";
    console.log('data: ' + data);
    return data;
}

function createSignedUrlForFile(path, repoName, packageName, userName) {
    console.log("Creating signed URL for file ", path);
    var path = '/signed_url/' + config.subject + '/' + repoName + '/' + path;

    request.post({
        headers: {'Authorization' : getAuth()},
        url: getBintrayUrl(path),
        body: getSignedUrlRequestData(userName)
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

function fetchVersionFilesUrls(repoName, packageName, userName, version) {
    console.log('Fetching files for package: ' + packageName + " and version: " + version);
    var path = '/packages/' + config.subject + '/'  + repoName + '/' + packageName + '/versions/' + version + '/files';

    request.get({
        headers: {'Authorization' : getAuth()},
        url: getBintrayUrl(path)
    }, function(error, response, body) {
        if (error == null) {
            console.log('Files fetched: ' + body);
            var json = JSON.parse(body);
            createSignedUrlForFile(json[0].path, repoName, packageName, userName);
        } else {
            console.log('Error: ' + error);
        }
    }.bind(this));
}

function fetchPackageLatestVersion(repoName, packageName, userName) {
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
            fetchVersionFilesUrls(repoName, packageName, userName, packageVersion)
        } else {
            console.log('Error: ' + error);
        }
    }.bind(this) );
}

// Initiate the asynchronous process of creating download URLs from Bintray.
// After invoking this function, the getUrls method should be invoked to get the download URLs.
module.exports.create = function (repoName, packageName, userName) {
    console.log("Bintray user: ", config.bintrayUser);

    // To initiate the process, we first fetch from Bintray the latest version of the configured package:
    fetchPackageLatestVersion(repoName, packageName, userName);
}

// Returns a signed URL.
// This function should be invoked after invoking the create function.
// Since the process of creating the URLs is asynchronous, the method can return an undefined value,
// in case the process is not yet finished.
// In that case, the function should be invoked again after a wait period.
module.exports.getUrl = function (packageName) {
    return urls[packageName];
}