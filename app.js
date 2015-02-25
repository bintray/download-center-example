var root = __dirname + '/'

console.log('ROOT: ' + root);

var express = require('express');
var fs = require('fs');
var url = require('url');
var bintrayDownload = require(root + 'bintrayDownload');

var app = express()

app.get('/', function (req, res) {
    res.sendFile(root + 'index.html')
})

app.get('/createRpmUrl', function (req, res) {
    bintrayDownload.create("download-center-example-rpm", "rpm", req.query.userName);
    res.send("<script>window.parent.setRpmUrl('" + bintrayDownload.getUrl("rpm") + "');</script>");
})
app.get('/createDebianUrl', function (req, res) {
    bintrayDownload.create("download-center-example-debian", "debian", req.query.userName);
    res.send("<script>window.parent.setDebianUrl('" + bintrayDownload.getUrl("debian") + "');</script>");
})
app.get('/createDockerUrl', function (req, res) {
    bintrayDownload.create("download-center-example-generic", "generic", req.query.userName, 60);
    res.send("<script>window.parent.setDockerUrl('" + bintrayDownload.getUrl("generic") + "');</script>");
})

app.get('/rpmUrl', function (req, res) {
    res.send("<script>window.parent.setRpmUrl('" + bintrayDownload.getUrl("rpm") + "');</script>");
})
app.get('/debianUrl', function (req, res) {
    res.send("<script>window.parent.setDebianUrl('" + bintrayDownload.getUrl("debian") + "');</script>");
})
app.get('/dockerUrl', function (req, res) {
    res.send("<script>window.parent.setDockerUrl('" + bintrayDownload.getUrl("generic") + "');</script>");
})

app.get('/images/*', function(req, res, next){
    var img = fs.readFileSync('./images/' + req.params[0]);
    res.writeHead(200, {'Content-Type': 'image/png' });
    res.end(img, 'binary');
});
app.get('/css/*', function(req, res, next){
    var html = fs.readFileSync('./css/' + req.params[0]);
    res.writeHead(200, {'Content-Type': 'text/css' });
    res.write(html, 'utf8');
    res.end();
});
app.get('/js/*', function(req, res, next){
    var js = fs.readFileSync('./js/' + req.params[0]);
    res.writeHead(200, {'Content-Type': 'text/js' });
    res.write(js, 'utf8');
    res.end();
});

var server = app.listen(3000, function () {
    var host = server.address().address
    var port = server.address().port
    console.log('Example app listening at http://%s:%s', host, port)
})