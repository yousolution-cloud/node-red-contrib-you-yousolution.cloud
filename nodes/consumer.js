module.exports = function (RED) {
  let bodyParser = require('body-parser');
  let multer = require('multer');
  let cookieParser = require('cookie-parser');
  let getBody = require('raw-body');
  let cors = require('cors');
  let onHeaders = require('on-headers');
  let typer = require('content-type');
  let mediaTyper = require('media-typer');
  let isUtf8 = require('is-utf8');
  let hashSum = require('hash-sum');

  function rawBodyParser(req, res, next) {
    if (req.skipRawBodyParser) {
      next();
    } // don't parse this if told to skip
    if (req._body) {
      return next();
    }
    req.body = '';
    req._body = true;

    let isText = true;
    let checkUTF = false;

    if (req.headers['content-type']) {
      let contentType = typer.parse(req.headers['content-type']);
      if (contentType.type) {
        let parsedType = mediaTyper.parse(contentType.type);
        if (parsedType.type === 'text') {
          isText = true;
        } else if (parsedType.subtype === 'xml' || parsedType.suffix === 'xml') {
          isText = true;
        } else if (parsedType.type !== 'application') {
          isText = false;
        } else if (parsedType.subtype !== 'octet-stream' && parsedType.subtype !== 'cbor' && parsedType.subtype !== 'x-protobuf') {
          checkUTF = true;
        } else {
          // application/octet-stream or application/cbor
          isText = false;
        }
      }
    }

    getBody(
      req,
      {
        length: req.headers['content-length'],
        encoding: isText ? 'utf8' : null,
      },
      function (err, buf) {
        if (err) {
          return next(err);
        }
        if (!isText && checkUTF && isUtf8(buf)) {
          buf = buf.toString();
        }
        req.body = buf;
        next();
      }
    );
  }

  let corsSetup = false;

  function createRequestWrapper(node, req) {
    // This misses a bunch of properties (eg headers). Before we use this function
    // need to ensure it captures everything documented by Express and HTTP modules.
    let wrapper = {
      _req: req,
    };
    let toWrap = [
      'param',
      'get',
      'is',
      'acceptsCharset',
      'acceptsLanguage',
      'app',
      'baseUrl',
      'body',
      'cookies',
      'fresh',
      'hostname',
      'ip',
      'ips',
      'originalUrl',
      'params',
      'path',
      'protocol',
      'query',
      'route',
      'secure',
      'signedCookies',
      'stale',
      'subdomains',
      'xhr',
      'socket', // TODO: tidy this up
    ];
    toWrap.forEach(function (f) {
      if (typeof req[f] === 'function') {
        wrapper[f] = function () {
          node.warn(RED._('consumer.errors.deprecated-call', { method: 'msg.req.' + f }));
          let result = req[f].apply(req, arguments);
          if (result === req) {
            return wrapper;
          } else {
            return result;
          }
        };
      } else {
        wrapper[f] = req[f];
      }
    });

    return wrapper;
  }
  function createResponseWrapper(node, res) {
    let wrapper = {
      _res: res,
    };
    let toWrap = [
      'append',
      'attachment',
      'cookie',
      'clearCookie',
      'download',
      'end',
      'format',
      'get',
      'json',
      'jsonp',
      'links',
      'location',
      'redirect',
      'render',
      'send',
      'sendfile',
      'sendFile',
      'sendStatus',
      'set',
      'status',
      'type',
      'vary',
    ];
    toWrap.forEach(function (f) {
      wrapper[f] = function () {
        node.warn(RED._('httpin.errors.deprecated-call', { method: 'msg.res.' + f }));
        let result = res[f].apply(res, arguments);
        if (result === res) {
          return wrapper;
        } else {
          return result;
        }
      };
    });
    return wrapper;
  }

  let corsHandler = function (req, res, next) {
    next();
  };

  if (RED.settings.httpNodeCors) {
    corsHandler = cors(RED.settings.httpNodeCors);
    RED.httpNode.options('*', corsHandler);
  }

  function ConsumerNode(config) {
    RED.nodes.createNode(this, config);

    if (RED.settings.httpNodeRoot !== false) {
      if (!config.url) {
        this.warn(RED._('consumer.errors.missing-path'));
        return;
      }
      this.url = config.url;
      if (this.url[0] !== '/') {
        this.url = '/' + this.url;
      }
      this.method = 'post';
      this.upload = config.upload;
      this.swaggerDoc = config.swaggerDoc;

      let node = this;

      this.errorHandler = function (err, req, res, next) {
        node.warn(err);
        res.sendStatus(500);
      };

      this.callback = function (req, res) {
        let msgid = RED.util.generateId();
        res._msgid = msgid;
        if (node.method.match(/^(post|delete|put|options|patch)$/)) {
          const data = req.body.data;
          const topic = req.body.entity;
          node.send({ _msgid: msgid, req: req, res: createResponseWrapper(node, res), payload: data, topic: topic, operation: req.body.operation });
        } else if (node.method == 'get') {
          node.send({ _msgid: msgid, req: req, res: createResponseWrapper(node, res), payload: req.query });
        } else {
          node.send({ _msgid: msgid, req: req, res: createResponseWrapper(node, res) });
        }
      };

      let httpMiddleware = function (req, res, next) {
        next();
      };

      if (RED.settings.httpNodeMiddleware) {
        if (typeof RED.settings.httpNodeMiddleware === 'function' || Array.isArray(RED.settings.httpNodeMiddleware)) {
          httpMiddleware = RED.settings.httpNodeMiddleware;
        }
      }

      let maxApiRequestSize = RED.settings.apiMaxLength || '5mb';
      let jsonParser = bodyParser.json({ limit: maxApiRequestSize });
      let urlencParser = bodyParser.urlencoded({ limit: maxApiRequestSize, extended: true });

      let metricsHandler = function (req, res, next) {
        next();
      };
      if (this.metric()) {
        metricsHandler = function (req, res, next) {
          let startAt = process.hrtime();
          onHeaders(res, function () {
            if (res._msgid) {
              let diff = process.hrtime(startAt);
              let ms = diff[0] * 1e3 + diff[1] * 1e-6;
              let metricResponseTime = ms.toFixed(3);
              let metricContentLength = res.getHeader('content-length');
              //assuming that _id has been set for res._metrics in HttpOut node!
              node.metric('response.time.millis', { _msgid: res._msgid }, metricResponseTime);
              node.metric('response.content-length.bytes', { _msgid: res._msgid }, metricContentLength);
            }
          });
          next();
        };
      }

      let multipartParser = function (req, res, next) {
        next();
      };
      if (this.upload) {
        let mp = multer({ storage: multer.memoryStorage() }).any();
        multipartParser = function (req, res, next) {
          mp(req, res, function (err) {
            req._body = true;
            next(err);
          });
        };
      }

      if (this.method == 'get') {
        RED.httpNode.get(this.url, cookieParser(), httpMiddleware, corsHandler, metricsHandler, this.callback, this.errorHandler);
      } else if (this.method == 'post') {
        RED.httpNode.post(
          this.url,
          cookieParser(),
          httpMiddleware,
          corsHandler,
          metricsHandler,
          jsonParser,
          urlencParser,
          multipartParser,
          rawBodyParser,
          this.callback,
          this.errorHandler
        );
      } else if (this.method == 'put') {
        RED.httpNode.put(
          this.url,
          cookieParser(),
          httpMiddleware,
          corsHandler,
          metricsHandler,
          jsonParser,
          urlencParser,
          rawBodyParser,
          this.callback,
          this.errorHandler
        );
      } else if (this.method == 'patch') {
        RED.httpNode.patch(
          this.url,
          cookieParser(),
          httpMiddleware,
          corsHandler,
          metricsHandler,
          jsonParser,
          urlencParser,
          rawBodyParser,
          this.callback,
          this.errorHandler
        );
      } else if (this.method == 'delete') {
        RED.httpNode.delete(
          this.url,
          cookieParser(),
          httpMiddleware,
          corsHandler,
          metricsHandler,
          jsonParser,
          urlencParser,
          rawBodyParser,
          this.callback,
          this.errorHandler
        );
      }

      this.on('close', function () {
        let node = this;
        RED.httpNode._router.stack.forEach(function (route, i, routes) {
          if (route.route && route.route.path === node.url && route.route.methods[node.method]) {
            routes.splice(i, 1);
          }
        });
      });
    } else {
      this.warn(RED._('consumer.errors.not-created'));
    }
  }

  RED.nodes.registerType('consumer', ConsumerNode);
};
