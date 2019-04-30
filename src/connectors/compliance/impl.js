'use strict';

const assert = require('assert');
const _ = require('lodash');
const cls = require('../../util/cls');
const {host, insecure, revalidationInterval} = require('../../config').compliance;

const Connector = require('../Connector');
const metrics = require('../metrics');

module.exports = new class extends Connector {
    constructor () {
        super(module);
        this.metrics = metrics.createConnectorMetric(this.getName());
    }

    async getRule (id, refresh = false) {
        id = id.replace(/\./g, '-'); // compliance API limitation

        const req = cls.getReq();

        const uri = this.buildUri(host, 'compliance', 'rules', id);
        const result = await this.doHttp({
            uri: uri.toString(),
            method: 'GET',
            json: true,
            rejectUnauthorized: !insecure,
            headers: {
                ...this.getForwardedHeaders()
            }
        },
        {
            key: `remediations|http-cache|compliance|${req.user.account_number}|${id}`,
            refresh,
            revalidationInterval
        },
        this.metrics);

        return _.get(result, 'data.attributes', null);
    }

    async ping () {
        const result = await this.getRule('xccdf_org.ssgproject.content_rule_sshd_disable_root_login', true);
        assert(result !== null);
    }
}();

