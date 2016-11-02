'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var quickbaseCtrlStub = {
  index: 'quickbaseCtrl.index',
  show: 'quickbaseCtrl.show',
  create: 'quickbaseCtrl.create',
  update: 'quickbaseCtrl.update',
  destroy: 'quickbaseCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var quickbaseIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './quickbase.controller': quickbaseCtrlStub
});

describe('Quickbase API Router:', function() {

  it('should return an express router instance', function() {
    quickbaseIndex.should.equal(routerStub);
  });

  describe('GET /api/quickbases', function() {

    it('should route to quickbase.controller.index', function() {
      routerStub.get
        .withArgs('/', 'quickbaseCtrl.index')
        .should.have.been.calledOnce;
    });

  });

  describe('GET /api/quickbases/:id', function() {

    it('should route to quickbase.controller.show', function() {
      routerStub.get
        .withArgs('/:id', 'quickbaseCtrl.show')
        .should.have.been.calledOnce;
    });

  });

  describe('POST /api/quickbases', function() {

    it('should route to quickbase.controller.create', function() {
      routerStub.post
        .withArgs('/', 'quickbaseCtrl.create')
        .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/quickbases/:id', function() {

    it('should route to quickbase.controller.update', function() {
      routerStub.put
        .withArgs('/:id', 'quickbaseCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/quickbases/:id', function() {

    it('should route to quickbase.controller.update', function() {
      routerStub.patch
        .withArgs('/:id', 'quickbaseCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/quickbases/:id', function() {

    it('should route to quickbase.controller.destroy', function() {
      routerStub.delete
        .withArgs('/:id', 'quickbaseCtrl.destroy')
        .should.have.been.calledOnce;
    });

  });

});
