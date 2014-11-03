var config = require('./config'),
    routes = require('./routes'),
    http = require('http'),
    Mustache = require('mustache'),
    Promise = Promise || require('native-promise-only'),
    fs = require('fs');

function getTemplate (routeData) {
    return new Promise(function (resolve, reject) {
        fs.readFile(routeData.templateUrl, 'utf-8', function (err, tpl) {
            if (err) {
                reject(new Error(err));
            } else {
                resolve({
                    "routeData": routeData,
                    "template": tpl
                });
            }
        });
    });
}

function addDataSourceData (obj) {
    return new Promise(function (resolve, reject) {
        var promises = [];

        if (Array.isArray(obj.routeData.dataSources)) {
            obj.routeData.dataSources.forEach(function (dataSourceObj) {
                promises.push(
                    new Promise(function (resolve, reject) {
                        /* TODO: http request instead of fs readFile */
                        fs.readFile(dataSourceObj.url, 'utf-8', function (err, data) {
                            if (err) {
                                reject(new Error(err));
                            } else {
                                /* TODO pass GETable/POSTable object, not just the raw data, but that's nice for tpling */
                                resolve({
                                    "name": dataSourceObj.name,
                                    "data": JSON.parse(data.toString())
                                });
                            }
                        });
                    })
                );
            });
        }

        return Promise.all(promises)
            .then(function (dataSources) {
                dataSources.forEach(function (dataSourceObj) {
                    obj.data = obj.data || {};
                    obj.data.api = obj.data.api || {};
                    obj.data.api[dataSourceObj.name] = dataSourceObj.data;
                });
                resolve(obj);
            // }, function (err) {
                // reject(new Error(err)); // TODO necessary?
            });
    });
}

function defaultCtrl (data) {
    /*
        data = {
            api: {
                user: {
                    firstName: "Michael",
                    lastName: "Puckett"
                }
            }
        }
    */
    data = data || {};
    data.ctrlName = 'myFirstCtrl';
    return data; // TODO
}

function addController (resolvedRouteData) {
    return new Promise(function (resolve, reject) {
        resolvedRouteData.ctrl = require('./' + resolvedRouteData.routeData.controllerUrl) || defaultCtrl;
        resolve(resolvedRouteData);
    });
}

function render (resolvedRouteData) {
    return Mustache.render(resolvedRouteData.template, resolvedRouteData.ctrl(resolvedRouteData.data));
}

http.createServer(function(req, res) {
    var routeData = routes[req.url];

    res.writeHead(200, {
        'Content-Type': 'text/html'
    });

    getTemplate(routeData)
        .then(addDataSourceData)
        .then(addController)
        .then(render)
        .then(function serve (body) {
            res.end(body);
        })
        .catch(function (err) {
            console.error(err);
            res.end('Error');
        });

}).listen(config.port, config.ip);
