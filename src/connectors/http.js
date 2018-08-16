'use strict';

const request = require('../util/request');
const errors = require('../errors');

module.exports = function (uri, options) {
    return request(uri, options).catch(e => {
        if (e.name === 'StatusCodeError' && e.statusCode === 404) {
            return null;
        }

        throw errors.internal.dependencyFailureHttp(e);
    });
};