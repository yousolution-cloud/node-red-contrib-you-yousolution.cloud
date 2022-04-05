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

      // const entity = config.entity;
      // const sourceNode = config.sourceNode;
      // const token = node.credentials.token;

      // if (!entity || !token || !sourceNode) {
      //   node.status({ fill: 'red', shape: 'dot', text: 'Missing configuration' });
      //   done(new Error('Missing configuration'));
      //   return;
      // }

      // if (!msg.payload) {
      //   node.status({ fill: 'red', shape: 'dot', text: 'Missing payload' });
      //   done(new Error('Missing payload'));
      //   return;
      // }

      // baseUrl = process.env.NODE_ENV === 'dev' ? 'http://api.yousolution.local' : baseUrl;

      // const url = `${baseUrl}/messages?sourceNode=${sourceNode}&entity=${entity}`;
      // const config = {
      //   headers: { Authorization: `Bearer ${token}` },
      // };

      // const data = Array.isArray(msg.payload) ? msg.payload : [msg.payload];

      // try {
      //   const result = await axiosLibrary.post(url, data, config);
      //   msg.payload = result;
      //   msg.statusCode = result.status;
      //   node.status({ fill: 'green', shape: 'dot', text: 'Success' });
      //   node.send(msg);
      // } catch (error) {
      //   msg.payload = error;
      //   if (error.response && error.response.data) {
      //     msg.statusCode = error.response.status;
      //     msg.payload = error.response.data;
      //   }
      //   node.send(msg);
      //   node.status({ fill: 'red', shape: 'dot', text: 'Error' });
      //   done(error);
      // }
    });
  }
  RED.nodes.registerType('producer', ProducerNode, {
    credentials: {
      token: { type: 'password' },
    },
  });
};
