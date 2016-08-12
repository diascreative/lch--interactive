'use strict';

var app = require('../..');
import request from 'supertest';

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
});
