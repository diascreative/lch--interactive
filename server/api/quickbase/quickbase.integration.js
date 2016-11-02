'use strict';

var app = require('../..');
import request from 'supertest';

var newQuickbase;

describe('Quickbase API:', function() {

  describe('GET /api/quickbases', function() {
    var quickbases;

    beforeEach(function(done) {
      request(app)
        .get('/api/quickbases')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          quickbases = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      quickbases.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/quickbases', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/quickbases')
        .send({
          name: 'New Quickbase',
          info: 'This is the brand new quickbase!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          newQuickbase = res.body;
          done();
        });
    });

    it('should respond with the newly created quickbase', function() {
      newQuickbase.name.should.equal('New Quickbase');
      newQuickbase.info.should.equal('This is the brand new quickbase!!!');
    });

  });

  describe('GET /api/quickbases/:id', function() {
    var quickbase;

    beforeEach(function(done) {
      request(app)
        .get('/api/quickbases/' + newQuickbase._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          quickbase = res.body;
          done();
        });
    });

    afterEach(function() {
      quickbase = {};
    });

    it('should respond with the requested quickbase', function() {
      quickbase.name.should.equal('New Quickbase');
      quickbase.info.should.equal('This is the brand new quickbase!!!');
    });

  });

  describe('PUT /api/quickbases/:id', function() {
    var updatedQuickbase;

    beforeEach(function(done) {
      request(app)
        .put('/api/quickbases/' + newQuickbase._id)
        .send({
          name: 'Updated Quickbase',
          info: 'This is the updated quickbase!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedQuickbase = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedQuickbase = {};
    });

    it('should respond with the updated quickbase', function() {
      updatedQuickbase.name.should.equal('Updated Quickbase');
      updatedQuickbase.info.should.equal('This is the updated quickbase!!!');
    });

  });

  describe('DELETE /api/quickbases/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/quickbases/' + newQuickbase._id)
        .expect(204)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when quickbase does not exist', function(done) {
      request(app)
        .delete('/api/quickbases/' + newQuickbase._id)
        .expect(404)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

  });

});
