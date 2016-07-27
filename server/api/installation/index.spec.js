'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var installationCtrlStub = {
  index: 'installationCtrl.index',
  show: 'installationCtrl.show',
  create: 'installationCtrl.create',
  update: 'installationCtrl.update',
  destroy: 'installationCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var installationIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './installation.controller': installationCtrlStub
});

describe('Installation API Router:', function() {

  it('should return an express router instance', function() {
    installationIndex.should.equal(routerStub);
  });

  describe('GET /api/installations', function() {

    it('should route to installation.controller.index', function() {
      routerStub.get
        .withArgs('/', 'installationCtrl.index')
        .should.have.been.calledOnce;
    });

  });

  describe('GET /api/installations/:id', function() {

    it('should route to installation.controller.show', function() {
      routerStub.get
        .withArgs('/:id', 'installationCtrl.show')
        .should.have.been.calledOnce;
    });

  });

  describe('POST /api/installations', function() {

    it('should route to installation.controller.create', function() {
      routerStub.post
        .withArgs('/', 'installationCtrl.create')
        .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/installations/:id', function() {

    it('should route to installation.controller.update', function() {
      routerStub.put
        .withArgs('/:id', 'installationCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/installations/:id', function() {

    it('should route to installation.controller.update', function() {
      routerStub.patch
        .withArgs('/:id', 'installationCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/installations/:id', function() {

    it('should route to installation.controller.destroy', function() {
      routerStub.delete
        .withArgs('/:id', 'installationCtrl.destroy')
        .should.have.been.calledOnce;
    });

  });

});
