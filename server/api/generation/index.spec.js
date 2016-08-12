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
  get: sinon.spy()
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
});
