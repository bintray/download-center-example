// We need this to build our post string
var querystring = require('querystring');
var request = require('request');
var config = require('./conf/config.json');

var repoName;
var packageName;
var userName;

function getAuth() {
    var bintrayAuth = config.bintrayUser + ":"  + config.bintrayKey;
    return "Basic " + new Buffer(bintrayAuth).toString("base64");
}

function getBintrayUrl(path) {
    return "https://api.bintray.com" + path;
}

function getSignedUrlRequestData() {
    var time = new Date().getTime() + 2 * 60 * 60 * 1000 - 10 * 60 * 1000;
    var data = "{" +
        "\"expiry\":" + time + "," +
        "\"callback_id\": \"" + userName + "\"," +
        "\"callback_email\": \"" + config.callbackEmail + "\"" +
        "}";
    console.log('data: ' + data);
    return data;
}

function createSignedUrlForFile(path) {
    console.log("Creating signed URL for file ", path);
    var path = '/signed_url/' + config.subject + '/' + repoName + '/' + path;

    request.post({
        headers: {'Authorization' : getAuth()},
        url: getBintrayUrl(path),
        body: getSignedUrlRequestData()
    }, function(error, response, body){
        if (error == null) {
            console.log('Response: ' + body);
            var json = JSON.parse(body);
            url = json.url;
            console.log('Created signed URL: ' + url);
        } else {
            console.log('Error: ' + error);
        }
    });
}

function fetchVersionFilesUrls(version) {
    console.log('Fetching files for package: ' + packageName + " and version: " + version);
    var path = '/packages/' + config.subject + '/'  + repoName + '/' + packageName + '/versions/' + version + '/files';

    request.get({
        headers: {'Authorization' : getAuth()},
        url: getBintrayUrl(path)
    }, function(error, response, body){
        if (error == null) {
            console.log('Files fetched: ' + body);
            var json = JSON.parse(body);
            createSignedUrlForFile(json[0].path);
        } else {
            console.log('Error: ' + error);
        }
    });
}

function fetchPackageLatestVersion() {
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
            fetchVersionFilesUrls(packageVersion);
        } else {
            console.log('Error: ' + error);
        }
    });
}

// Initiate the asynchronous process of creating download URLs from Bintray.
// After invoking this function, the getUrls method should be invoked to get the download URLs.
module.exports.create = function () {
    console.log("Bintray user: ", config.bintrayUser);
    url = null;

    // To initiate the process, we first fetch from Bintray the latest version of the configured package:
    fetchPackageLatestVersion();
}

// Returns a signed URL.
// This function should be invoked after invoking the create function.
// Since the process of creating the URLs is asynchronous, the method can return an undefined value,
// in case the process is not yet finished.
// In that case, the function should be invoked again after a wait period.
module.exports.getUrl = function () {
    return url;
}

module.exports.setRepoName = function (name) {
    console.log("Repo name: ", name);
    repoName = name;
}

module.exports.setPackageName = function (name) {
    console.log("Package name: ", name);
    packageName = name;
}

module.exports.setUserName = function (name) {
    console.log("User name: ", name);
    userName = name;
}