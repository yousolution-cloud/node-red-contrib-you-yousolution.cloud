const axios = require('axios');
const Support = require('./support');

module.exports = function (RED) {
  function ProducerNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    // let baseUrl = `https://api.yousolution.cloud`;

    // reset status
    node.status({});

    if (!config.entity || !node.credentials.token || !config.sourceNode) {
      node.status({ fill: 'gray', shape: 'ring', text: 'Missing configuration' });
    }

    node.on('input', async (msg, send, done) => {
      // reset status
      node.status({});

      try {
        const result = await Support.sendRequest(node, msg, config, axios);
        msg.payload = result;
        msg.statusCode = result.status;
        node.status({ fill: 'green', shape: 'dot', text: 'success' });
        node.send(msg);
      } catch (error) {
        node.status({ fill: 'red', shape: 'dot', text: 'Error' });
        done(error);
      }
    });
  }
  RED.nodes.registerType('producer', ProducerNode, {
    credentials: {
      token: { type: 'password' },
    },
  });
};
