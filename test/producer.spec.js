const should = require('should');
const helper = require('node-red-node-test-helper');
const producer = require('../nodes/producer');
const Context = require('../node_modules/./@node-red/runtime/lib/nodes/context/index');
const sinon = require('sinon');

helper.init(require.resolve('node-red'));

describe('producer Node', () => {
  beforeEach((done) => {
    helper.startServer(done);
  });

  function initContext(done) {
    Context.init({
      contextStorage: {
        memory0: {
          module: 'memory',
        },
        memory1: {
          module: 'memory',
        },
      },
    });
    Context.load().then(function () {
      done();
    });
  }

  afterEach((done) => {
    helper
      .unload()
      .then(function () {
        return Context.clean({ allNodes: {} });
      })
      .then(function () {
        return Context.close();
      })
      .then(function () {
        helper.stopServer(done);
      });

    // Restore the default sandbox here
    sinon.restore();

    // helper.unload();
    // helper.stopServer(done);
  });

  it('should be loaded', (done) => {
    const flow = [
      {
        id: 'n1',
        type: 'producer',
        name: 'producer',
        wires: [['n2']],
        z: 'flow',
        rules: [{ t: 'set', p: 'payload', to: '#:(memory1)::flowValue', tot: 'flow' }],
      },
    ];

    helper.load(producer, flow, () => {
      initContext(function () {
        const n1 = helper.getNode('n1');
        try {
          n1.should.have.property('name', 'producer');
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  it('should no have credentials', (done) => {
    const flow = [
      {
        id: 'n1',
        type: 'producer',
        name: 'producer',
        wires: [['n2']],
        z: 'flow',
        rules: [{ t: 'set', p: 'payload', to: '#:(memory1)::flowValue', tot: 'flow' }],
      },
    ];
    helper.load(producer, flow, () => {
      initContext(function () {
        const n1 = helper.getNode('n1');

        try {
          should.equal(n1.status.calledWith({ fill: 'gray', shape: 'ring', text: 'Missing configuration' }), true);
          n1.should.have.property('name', 'producer');
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  it('should no have credentials when send message', (done) => {
    process.env.NODE_ENV = 'dev';
    const flow = [
      {
        id: 'n1',
        type: 'producer',
        name: 'producer',
        wires: [['n2']],
        z: 'flow',
        rules: [{ t: 'set', p: 'payload', to: '#:(memory1)::flowValue', tot: 'flow' }],
      },
    ];
    helper.load(producer, flow, () => {
      initContext(function () {
        const n1 = helper.getNode('n1');

        n1.receive({ sourceNode: 'sourceNode' });

        n1.on('call:error', (error) => {
          try {
            // should.equal(n1.status.lastCall.calledWith({ fill: 'red', shape: 'dot', text: 'Missing configuration' }), true);
            error.should.have.property('firstArg', new Error('Missing configuration'));
            done();
          } catch (err) {
            done(err);
          }
        });
      });
    });
  });

  // it('should have with headers connected', (done) => {
  //   const flow = [
  //     {
  //       id: 'n1',
  //       type: 'producer',
  //       name: 'producer',
  //       wires: [['n2']],
  //       z: 'flow',
  //       rules: [{ t: 'set', p: 'payload', to: '#:(memory1)::flowValue', tot: 'flow' }],
  //     },
  //     { id: 'n2', type: 'helper' },
  //   ];
  //   helper.load(producer, flow, () => {
  //     const n2 = helper.getNode('n2');
  //     const n1 = helper.getNode('n1');
  //     n1.credentials.sourceNode = 'sourceNode';
  //     n1.credentials.entity = 'entity';
  //     n1.credentials.token = 'token';

  //     sinon.stub(Support, 'login').resolves({
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Content-Length': 100,
  //       },
  //     });

  //     n1.context().flow.set(`_YOU_SapServiceLayer_${n1.id}.headers`, true, 'memory1', function (error) {
  //       // console.log(error);
  //     });

  //     n1.receive({});

  //     n2.on('input', (msg) => {
  //       try {
  //         msg.should.have.property('_msgid');
  //         done();
  //       } catch (err) {
  //         done(err);
  //       }
  //     });
  //   });
  // });

  // it('should have disconnected', (done) => {
  //   const flow = [
  //     {
  //       id: 'n1',
  //       type: 'authenticateSap',
  //       name: 'authenticateSap',
  //       wires: [['n2']],
  //       z: 'flow',
  //       rules: [{ t: 'set', p: 'payload', to: '#:(memory1)::flowValue', tot: 'flow' }],
  //     },
  //   ];
  //   helper.load(authenticateSap, flow, () => {
  //     // const n2 = helper.getNode('n2');
  //     const n1 = helper.getNode('n1');
  //     n1.credentials.user = 'user';
  //     n1.credentials.password = 'password';
  //     n1.credentials.company = 'company';

  //     sinon.stub(Support, 'login').rejects();

  //     n1.receive({});

  //     n1.on('call:error', (error) => {
  //       try {
  //         error.should.have.property('firstArg', new Error('Error'));
  //         done();
  //       } catch (err) {
  //         done(err);
  //       }
  //     });
  //   });
  // });
});
