const URL_SERVER_PROD = 'https://api.yousolution.cloud';
const URL_SERVER_DEV = 'http://api.yousolution.local';

async function sendRequest(node, msg, config, axios) {
  const requestOptions = generateRequest(node, msg, config);
  try {
    return await axios(requestOptions);
  } catch (error) {
    if (error.response && error.response.data) {
      msg.statusCode = error.response.status;
      msg.payload = error.response.data;
      node.send(msg);
      throw new Error(JSON.stringify(error.response.data));
    }
    throw error;
  }
}

function generateRequest(node, msg, config) {
  let baseUrl = URL_SERVER_PROD;

  const entity = config.entity;
  const sourceNode = config.sourceNode;
  const token = node.credentials.token;

  if (!entity || !token || !sourceNode) {
    throw new Error('Missing configuration');
  }

  if (!msg.payload) {
    throw new Error('Missing payload');
  }

  baseUrl = process.env.NODE_ENV === 'dev' ? URL_SERVER_DEV : baseUrl;

  const url = `${baseUrl}/messages?sourceNode=${sourceNode}&entity=${entity}`;
  const data = Array.isArray(msg.payload) ? msg.payload : [msg.payload];
  const optionsRequest = {
    method: 'post',
    url: url,
    headers: { Authorization: `Bearer ${token}` },
    data: data,
  };
  return optionsRequest;
}

module.exports = {
  sendRequest: sendRequest,
  generateRequest: generateRequest,
};
