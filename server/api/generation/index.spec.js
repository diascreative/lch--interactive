'use strict';

var proxyquire = require('proxyquire').noPreserveCache();

var generationCtrlStub = {
  index: 'generationCtrl.index',
  show: 'generationCtrl.show',
  create: 'generationCtrl.create',
  update: 'generationCtrl.update',
  destroy: 'generationCtrl.destroy'
};

var routerStub = {
  get: sinon.spy(),
  put: sinon.spy(),
  patch: sinon.spy(),
  post: sinon.spy(),
  delete: sinon.spy()
};

// require the index with our stubbed out modules
var generationIndex = proxyquire('./index.js', {
  'express': {
    Router: function() {
      return routerStub;
    }
  },
  './generation.controller': generationCtrlStub
});

describe('Generation API Router:', function() {

  it('should return an express router instance', function() {
    generationIndex.should.equal(routerStub);
  });

  describe('GET /api/generations', function() {

    it('should route to generation.controller.index', function() {
      routerStub.get
        .withArgs('/', 'generationCtrl.index')
        .should.have.been.calledOnce;
    });

  });

  describe('GET /api/generations/:id', function() {

    it('should route to generation.controller.show', function() {
      routerStub.get
        .withArgs('/:id', 'generationCtrl.show')
        .should.have.been.calledOnce;
    });

  });

  describe('POST /api/generations', function() {

    it('should route to generation.controller.create', function() {
      routerStub.post
        .withArgs('/', 'generationCtrl.create')
        .should.have.been.calledOnce;
    });

  });

  describe('PUT /api/generations/:id', function() {

    it('should route to generation.controller.update', function() {
      routerStub.put
        .withArgs('/:id', 'generationCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('PATCH /api/generations/:id', function() {

    it('should route to generation.controller.update', function() {
      routerStub.patch
        .withArgs('/:id', 'generationCtrl.update')
        .should.have.been.calledOnce;
    });

  });

  describe('DELETE /api/generations/:id', function() {

    it('should route to generation.controller.destroy', function() {
      routerStub.delete
        .withArgs('/:id', 'generationCtrl.destroy')
        .should.have.been.calledOnce;
    });

  });

});
