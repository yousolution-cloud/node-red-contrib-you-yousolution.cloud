const should = require('should');
const expect = require('chai').expect;
const sinon = require('sinon');
const Support = require('../nodes/support');
// import * as Support from '../nodes/support';

describe('support library', () => {
  describe('generateRequest() ', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'dev';
    });

    it('should generate a correct request', () => {
      const node = {
        credentials: {
          token: 'jwtToken',
        },
      };

      const config = {
        entity: 'businessPartner',
        sourceNode: 'sourceNode',
      };
      const msg1 = {
        payload: {
          key: 'key',
          data: 'data',
        },
      };

      const expectedValue1 = {
        method: 'post',
        headers: { Authorization: `Bearer jwtToken` },
        url: 'http://api.yousolution.local/messages?sourceNode=sourceNode&entity=businessPartner',
        data: [
          {
            key: 'key',
            data: 'data',
          },
        ],
      };
      should.deepEqual(Support.generateRequest(node, msg1, config), expectedValue1);

      const msg2 = {
        payload: [
          {
            key: 'key1',
            data: 'data1',
          },
          {
            key: 'key2',
            data: 'data2',
          },
        ],
      };

      const expectedValue2 = {
        method: 'post',
        headers: { Authorization: `Bearer jwtToken` },
        url: 'http://api.yousolution.local/messages?sourceNode=sourceNode&entity=businessPartner',
        data: [
          {
            key: 'key1',
            data: 'data1',
          },
          {
            key: 'key2',
            data: 'data2',
          },
        ],
      };
      should.deepEqual(Support.generateRequest(node, msg2, config), expectedValue2);
    });

    it('should have error missing configuration', () => {
      const node = {
        credentials: {
          token: 'jwtToken',
        },
      };

      const config1 = {
        entity: 'businessPartner',
      };
      const msg1 = {};

      expect(() => {
        Support.generateRequest(node, msg1, config1);
      }).to.throw('Missing configuration');

      const config2 = {
        sourceNode: 'sourceNode',
      };
      const msg2 = {};

      expect(() => {
        Support.generateRequest(node, msg2, config2);
      }).to.throw('Missing configuration');

      const config3 = {};
      const msg3 = {};

      expect(() => {
        Support.generateRequest(node, msg3, config3);
      }).to.throw('Missing configuration');

      const node1 = {
        credentials: {},
      };
      const config4 = {
        entity: 'businessPartner',
        sourceNode: 'sourceNode',
      };
      const msg4 = {};

      expect(() => {
        Support.generateRequest(node1, msg4, config4);
      }).to.throw('Missing configuration');
    });

    it('should have error missing data', () => {
      const node = {
        credentials: {
          token: 'jwtToken',
        },
      };

      const config1 = {
        entity: 'businessPartner',
        sourceNode: 'sourceNode',
      };
      const msg1 = {};

      expect(() => {
        Support.generateRequest(node, msg1, config1);
      }).to.throw('Missing payload');

      const msg2 = [];

      expect(() => {
        Support.generateRequest(node, msg2, config1);
      }).to.throw('Missing payload');

      const msg3 = [{}];

      expect(() => {
        Support.generateRequest(node, msg3, config1);
      }).to.throw('Missing payload');
    });
  });

  describe('sendRequest()', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'dev';
    });
    it('should send a correct request', async () => {
      const node = {
        credentials: {
          token: 'jwtToken',
        },
      };

      const config = {
        entity: 'businessPartner',
        sourceNode: 'sourceNode',
      };
      const msg = {
        payload: {
          key: 'key',
          data: 'data',
        },
      };

      const axios = async () => {
        return true;
      };

      const actual = await Support.sendRequest(node, msg, config, axios);

      should.equal(actual, true);
    });

    it('should send a generic error', async () => {
      const node = {
        credentials: {
          token: 'jwtToken',
        },
      };

      const config = {
        entity: 'businessPartner',
        sourceNode: 'sourceNode',
      };
      const msg = {
        payload: {
          key: 'key',
          data: 'data',
        },
      };
      const axios = async () => {
        return Promise.reject(new Error('Custom error'));
      };

      let actual = null;
      try {
        await Support.sendRequest(node, msg, config, axios);
      } catch (error) {
        actual = error;
      }

      should.deepEqual(actual, new Error('Custom error'));
    });
  });
});
