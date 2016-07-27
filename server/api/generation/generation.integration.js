'use strict';

var app = require('../..');
import request from 'supertest';

var newGeneration;

describe('Generation API:', function() {

  describe('GET /api/generations', function() {
    var generations;

    beforeEach(function(done) {
      request(app)
        .get('/api/generations')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          generations = res.body;
          done();
        });
    });

    it('should respond with JSON array', function() {
      generations.should.be.instanceOf(Array);
    });

  });

  describe('POST /api/generations', function() {
    beforeEach(function(done) {
      request(app)
        .post('/api/generations')
        .send({
          name: 'New Generation',
          info: 'This is the brand new generation!!!'
        })
        .expect(201)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          newGeneration = res.body;
          done();
        });
    });

    it('should respond with the newly created generation', function() {
      newGeneration.name.should.equal('New Generation');
      newGeneration.info.should.equal('This is the brand new generation!!!');
    });

  });

  describe('GET /api/generations/:id', function() {
    var generation;

    beforeEach(function(done) {
      request(app)
        .get('/api/generations/' + newGeneration._id)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          generation = res.body;
          done();
        });
    });

    afterEach(function() {
      generation = {};
    });

    it('should respond with the requested generation', function() {
      generation.name.should.equal('New Generation');
      generation.info.should.equal('This is the brand new generation!!!');
    });

  });

  describe('PUT /api/generations/:id', function() {
    var updatedGeneration;

    beforeEach(function(done) {
      request(app)
        .put('/api/generations/' + newGeneration._id)
        .send({
          name: 'Updated Generation',
          info: 'This is the updated generation!!!'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          updatedGeneration = res.body;
          done();
        });
    });

    afterEach(function() {
      updatedGeneration = {};
    });

    it('should respond with the updated generation', function() {
      updatedGeneration.name.should.equal('Updated Generation');
      updatedGeneration.info.should.equal('This is the updated generation!!!');
    });

  });

  describe('DELETE /api/generations/:id', function() {

    it('should respond with 204 on successful removal', function(done) {
      request(app)
        .delete('/api/generations/' + newGeneration._id)
        .expect(204)
        .end((err, res) => {
          if (err) {
            return done(err);
          }
          done();
        });
    });

    it('should respond with 404 when generation does not exist', function(done) {
      request(app)
        .delete('/api/generations/' + newGeneration._id)
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
