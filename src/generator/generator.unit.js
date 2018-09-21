'use strict';

const errors = require('../errors');
const { request, mockVmaas, getSandbox } = require('../test');

test('generates a simple playbook', () => {
    const data = {
        issues: [{
            id: 'test:ping',
            systems: ['68799a02-8be9-11e8-9eb6-529269fb1459']
        }]
    };

    return request
    .post('/v1/playbook')
    .send(data)
    .expect(200)
    .then(res => expect(res.text).toMatchSnapshot());
});

test('generates a simple playbook with reboot', () => {
    const data = {
        issues: [{
            id: 'test:reboot',
            systems: ['68799a02-8be9-11e8-9eb6-529269fb1459', '936ef48c-8f05-11e8-9eb6-529269fb1459']
        }]
    };

    return request
    .post('/v1/playbook')
    .send(data)
    .expect(200)
    .then(res => expect(res.text).toMatchSnapshot());
});

test('generates an erratum-based playbook', () => {
    mockVmaas();

    const data = {
        issues: [{
            id: 'vulnerabilities:RHSA-2018:0502',
            systems: ['68799a02-8be9-11e8-9eb6-529269fb1459']
        }]
    };

    return request
    .post('/v1/playbook')
    .send(data)
    .expect(200)
    .then(res => expect(res.text).toMatchSnapshot());
});

test('sorts the hosts line', () => {
    mockVmaas();

    const data = {
        issues: [{
            id: 'vulnerabilities:RHSA-2018:0502',
            systems: ['d2c8db4e-bd6a-11e8-a355-529269fb1459', '68799a02-8be9-11e8-9eb6-529269fb1459']
        }]
    };

    return request
    .post('/v1/playbook')
    .send(data)
    .expect(200)
    .then(res => expect(res.text).toMatchSnapshot());
});

test('adds diagnosis play', () => {
    mockVmaas();

    const data = {
        issues: [{
            id: 'vulnerabilities:CVE_2017_6074_kernel|KERNEL_CVE_2017_6074',
            systems: ['68799a02-8be9-11e8-9eb6-529269fb1459'],
            resolution: 'selinux_mitigate'
        }, {
            id: 'advisor:bond_config_issue|BOND_CONFIG_ISSUE',
            systems: ['4109fa1a-9a3f-11e8-9eb6-529269fb1459']
        }, {
            id: 'vulnerabilities:RHSA-2018:0502',
            systems: ['11931d66-9a3f-11e8-9eb6-529269fb1459']
        }]
    };

    return request
    .post('/v1/playbook')
    .send(data)
    .expect(200)
    .then(res => expect(res.text).toMatchSnapshot());
});

test('400s on invalid body parameters', () => {
    return request
    .post('/v1/playbook')
    .send({})
    .expect(400)
    .then(({ body }) => {
        body.should.have.property('error', {
            code: 'OBJECT_MISSING_REQUIRED_PROPERTY',
            message: 'Missing required property: issues'
        });
    });
});

test('400s on empty issue list', () => {
    return request
    .post('/v1/playbook')
    .send({
        issues: []
    })
    .expect(400)
    .then(({ body }) => {
        body.should.have.property('error', {
            code: 'ARRAY_LENGTH_SHORT',
            message: 'Array is too short (0), minimum 1'
        });
    });
});

test('400s on empty system list', () => {
    return request
    .post('/v1/playbook')
    .send({
        issues: [{
            id: 'vulnerabilities:CVE_2017_5461_nss|CVE_2017_5461_NSS_2',
            systems: []
        }]
    })
    .expect(400)
    .then(({ body }) => {
        body.should.have.property('error', {
            code: 'ARRAY_LENGTH_SHORT',
            message: 'Array is too short (0), minimum 1'
        });
    });
});

test('400s on unknown issue id', () => {
    return request
    .post('/v1/playbook')
    .send({
        issues: [{
            id: 'test:nonExistentId',
            systems: ['68799a02-8be9-11e8-9eb6-529269fb1459']
        }]
    })
    .expect(400)
    .then(({ body }) => {
        body.should.have.property('error', {
            code: 'UNSUPPORTED_ISSUE',
            message: 'Issue "test:nonExistentId" does not have Ansible support'
        });
    });
});

test('400s on unknown system id', () => {
    return request
    .post('/v1/playbook')
    .send({
        issues: [{
            id: 'vulnerabilities:CVE_2017_5461_nss|CVE_2017_5461_NSS_2',
            systems: ['non-existent-system']
        }]
    })
    .expect(400)
    .then(({ body }) => {
        body.should.have.property('error', {
            code: 'UNKNOWN_SYSTEM',
            message: 'Unknown system identifier "non-existent-system"'
        });
    });
});

test('detects missing variable in template', async () => {
    const spy = getSandbox().spy(errors.internal, 'invalidTemplate');

    await request
    .post('/v1/playbook')
    .send({
        issues: [{
            id: 'test:missingVariable',
            systems: ['68799a02-8be9-11e8-9eb6-529269fb1459']
        }]
    })
    .expect(500);

    spy.callCount.should.equal(1);
});
