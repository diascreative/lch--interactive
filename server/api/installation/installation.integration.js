'use strict';

var app = require('../..');
import request from 'supertest';

var newInstallation;

describe('Installation API:', function() {

  describe('GET /api/installations', function() {
    var installations;

    beforeEach(function(done) {
      request(app)
        .get('/api/installations')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          installations = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      installations.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/installations', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/installations')
        .send({
          name: 'New Installation',
          info: 'This is the brand new installation!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          newInstallation = res.body;
          done();
        });
    });

    it('should respond with the newly created installation', function() {
      newInstallation.name.should.equal('New Installation');
      newInstallation.info.should.equal('This is the brand new installation!!!');
    });

  });

  describe('GET /api/installations/:id', function() {
    var installation;

    beforeEach(function(done) {
      request(app)
        .get('/api/installations/' + newInstallation._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          installation = res.body;
          done();
        });
    });

    afterEach(function() {
      installation = {};
    });

    it('should respond with the requested installation', function() {
      installation.name.should.equal('New Installation');
      installation.info.should.equal('This is the brand new installation!!!');
    });

  });

  describe('PUT /api/installations/:id', function() {
    var updatedInstallation;

    beforeEach(function(done) {
      request(app)
        .put('/api/installations/' + newInstallation._id)
        .send({
          name: 'Updated Installation',
          info: 'This is the updated installation!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedInstallation = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedInstallation = {};
    });

    it('should respond with the updated installation', function() {
      updatedInstallation.name.should.equal('Updated Installation');
      updatedInstallation.info.should.equal('This is the updated installation!!!');
    });

  });

  describe('DELETE /api/installations/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/installations/' + newInstallation._id)
        .expect(204)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when installation does not exist', function(done) {
      request(app)
        .delete('/api/installations/' + newInstallation._id)
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
