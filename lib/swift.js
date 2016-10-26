var request = require('request');
var Promise = require('bluebird');
var _ = require('lodash');
var EXPIRE = 10 * 60 * 1000;
class Swift {
    constructor(user, password, host, port) {
        this.user = user;
        this.password = password;
        this.host = host;
        this.port = port;
        this.timestamp = new Date().getTime();
    }

    error(statusCode, body) {
        var e = new Error(body);
        e.status = statusCode;
        return e;
    }

    auth() {
        return new Promise((resolve, reject) => {
            if (this.timestamp > new Date().getTime() - EXPIRE && this.account && this.token) {
                resolve(true);
            } else {
                var options = {
                    url: `/auth/v1.0`,
                    baseUrl: `http://${this.host}:${this.port}`,
                    method: 'GET',
                    headers: {
                        'X-Storage-User': this.user,
                        'X-Storage-Pass': this.password
                    }
                };
                request(options, (err, resp) => {
                    if (err) {
                        reject(this.error(500, err.message));
                    } else if (resp.headers['x-storage-url'] && resp.headers['x-auth-token']) {
                        this.account = resp.headers['x-storage-url'].split('v1/')[1];
                        this.token = resp.headers['x-auth-token'];
                        this.timestamp = new Date().getTime();
                        resolve(true);
                    } else {
                        reject(this.error(resp.statusCode, resp.statusMessage));
                    }
                });
            }
        });
    }

    request(options, pipe) {
        var ops = {
            url: `/${this.account}`,
            baseUrl: `http://${this.host}:${this.port}/v1.0`,
            method: 'GET',
            qs: { format: 'json' },
            headers: {
                'X-Auth-Token': this.token,
                'X-Storage-Token': this.token
            }
        };
        _.extend(ops, options);
        return new Promise((resolve, reject) => {
            if (pipe && pipe.res) {
                request(ops, (err) => {
                    if (err) {
                        reject(this.error(500, err.message));
                    } else {
                        resolve(true);
                    }
                }).pipe(pipe.res);
            } else if (pipe && pipe.req) {
                if (_.isString(pipe.req)) {
                    var url = ops.baseUrl + ops.url;
                    var options = {
                        qs: ops.qs,
                        headers: ops.headers
                    };
                    var x;
                    var callback = (err, resp) => {
                        if (err) {
                            reject(this.error(500, err.message));
                        } else {
                            if (resp.statusCode > 400) {
                                reject(this.error(resp.statusCode, resp.statusMessage));
                            } else {
                                resolve(true);
                            }
                        }
                    };
                    var req = () => {
                        if (ops.method == 'POST') {
                            return request.post(url, options, callback);
                        } else {
                            return request.put(url, options, callback);
                        }
                    };

                    if (pipe.req.substr(0, 4) == 'http') {
                        request(pipe.req).on('error', (err) => {
                            reject(this.error(500, err.message));
                        }).on('response', (resp) => {
                            if (resp.statusCode > 400) {
                                reject(this.error(resp.statusCode, resp.statusMessage));
                            }
                        }).pipe(req());
                    } else {
                        var fs = require('fs');
                        fs.createReadStream(pipe.req).on('error', (err) => {
                            reject(this.error(500, err.message));
                        }).pipe(req());
                    }
                } else {
                    pipe.req.pipe(request(options)).on('error', (err) => {
                        reject(err);
                    }).on('response', (resp) => {
                        if (resp.statusCode > 400) {
                            reject(this.error(resp.statusCode, resp.statusMessage));
                        } else {
                            resolve(true);
                        }
                    });
                }
            } else {
                request(ops, (err, resp, body) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (resp.statusCode > 400) {
                            reject(this.error(resp.statusCode, resp.statusMessage));
                        } else {
                            resolve(body);
                        }
                    }
                });
            }
        });
    }
    listContainers(prefix) {
        return this.auth().then(() => {
            return this.request({
                qs: { format: 'json', prefix: prefix }
            });
        });
    }
    retrieveAccountMetadata() {
        return this.auth().then(() => {
            return this.request({
                method: 'HEAD'
            });
        });
    }
    listObjects(container, prefix) {
        return this.auth().then(() => {
            var options = {
                url: `/${this.account}/${container}`,
                qs: { format: 'json', prefix: prefix },
            };
            return this.request(options);
        });
    }
    createContainer(container) {
        return this.auth().then(() => {
            var options = {
                url: `/${this.account}/${container}`,
                method: 'PUT'
            };
            return this.request(options);
        });
    }
    deleteContainer(container) {
        return this.auth().then(() => {
            var options = {
                url: `/${this.account}/${container}`,
                method: 'DELETE'
            };
            return this.request(options);
        });
    }
    retrieveContainerMetadata(container) {
        return this.auth().then(() => {
            var options = {
                url: `/${this.account}/${container}`,
                method: 'HEAD'
            };
            return this.request(options);
        });
    }
    getObject(container, object, pipeRes) {
        return this.auth().then(() => {
            var options = {
                url: `/${this.account}/${container}/${object}`
            };
            return this.request(options, { res: pipeRes });
        });
    }
    retrieveObjectMetadata(container, object) {
        return this.auth().then(() => {
            var options = {
                url: `/${this.account}/${container}/${object}`,
                method: 'HEAD'
            };
            return this.request(options);
        });
    }
    createObject(container, object, pipeReq) {
        return this.createContainer(container).then(() => {
            var options = {
                url: `/${this.account}/${container}/${object}`,
                method: 'PUT'
            };
            return this.request(options, { req: pipeReq });
        });
    }
    deleteObject(container, object) {
        return this.auth().then(() => {
            var options = {
                url: `/${this.account}/${container}/${object}`,
                method: 'DELETE'
            };
            return this.request(options);
        });
    }
    copyObject(container, object, fromContainer, sourceObject) {
        return this.auth().then(() => {
            var options = {
                url: `/${this.account}/${container}/${object}`,
                method: 'PUT',
                headers: {
                    'X-Auth-Token': this.token,
                    'X-Copy-From': fromContainer + '/' + sourceObject
                }
            };
            return this.request(options);
        });
    }
}

module.exports = Swift;