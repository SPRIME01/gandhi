'use strict';

require('../../../init.js');

var li = require('li');
var r = require('rethinkdb');
var _ = require('lodash');
var jwt = require('jsonwebtoken');

var assert = require('chai').assert;
var request, fixtures;

var blacklist = ['password', 'recovery_token'];
var whitelist = ['id', 'email', 'name', 'href', 'admin', 'created','updated'];

before(function(){
	request = global.setup.api;
	fixtures = global.setup.fixtures.db.projects;
});

describe('Assignments', function(){
	var adminToken, adminId, userToken, userId;

	before(function(done){
		request
			.post('/api/tokens')
			.send({
				email: 'mike.marcacci@test.gandhi.io',
				password: 'mike1234'
			})
			.expect(201)
			.end(function(err, res){
				if(err) return done(err);
				assert.isString(res.body.token);
				adminToken = res.body.token;
				adminId = jwt.decode(adminToken).sub;
				done();
			});
	});

	before(function(done){
		request
			.post('/api/tokens')
			.send({
				email: 'tim.marcacci@test.gandhi.io',
				password: 'tim1234'
			})
			.expect(201)
			.end(function(err, res){
				if(err) return done(err);
				assert.isString(res.body.token);
				userToken = res.body.token;
				userId = jwt.decode(userToken).sub;
				done();
			});
	});

	describe('#list', function(){
		it('rejects an anonymous request', function(done){
			request
				.get('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments')
				.expect(401)
				.end(function(err, res){
					if(err) return done(err);
					assert.isNotArray(res.body);
					done();
				});
		});
		it('returns 404 for nonexistant project', function(done){
			request
				.get('/api/projects/foo/assignments')
				.set('Authorization', 'Bearer ' + adminToken)
				.expect(404)
				.end(done);
		});
		it('shows all assignments to an admin user', function(done){
			request
				.get('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments')
				.set('Authorization', 'Bearer ' + adminToken)
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					assert.lengthOf(Object.keys(res.body), 3);
					done();
				});
		});
		it('shows all assignments to a non-admin user', function(done){
			request
				.get('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments')
				.set('Authorization', 'Bearer ' + userToken)
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					assert.lengthOf(Object.keys(res.body), 3);
					done();
				});
		});
		it.skip('hides non-allowed assignments from a non-admin user');
	});

	describe('#get', function(){
		it('rejects an anonymous request', function(done){
			request
				.get('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments/5a3cf444-9d87-4125-8026-2d5ffb834676')
				.expect(401)
				.end(done);
		});
		it('returns 404 for nonexistant project', function(done){
			request
				.get('/api/projects/foo/assignments/5a3cf444-9d87-4125-8026-2d5ffb834676')
				.set('Authorization', 'Bearer ' + adminToken)
				.expect(404)
				.end(done);
		});
		it('returns 404 for nonexistant project assignment', function(done){
			request
				.get('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments/foo')
				.set('Authorization', 'Bearer ' + adminToken)
				.expect(404)
				.end(done);
		});
		it('returns 404 for nonexistant project assignment', function(done){
			request
				.get('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments/foo')
				.set('Authorization', 'Bearer ' + adminToken)
				.expect(404)
				.end(done);
		});
		it('shows an assignment to an admin user', function(done){
			request
				.get('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments/5a3cf444-9d87-4125-8026-2d5ffb834676')
				.set('Authorization', 'Bearer ' + adminToken)
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					assert.equal(res.body.id, '5a3cf444-9d87-4125-8026-2d5ffb834676');
					done();
				});
		});
		it('shows an assignment to a non-admin user', function(done){
			request
				.get('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments/5a3cf444-9d87-4125-8026-2d5ffb834676')
				.set('Authorization', 'Bearer ' + userToken)
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					assert.equal(res.body.id, '5a3cf444-9d87-4125-8026-2d5ffb834676');
					done();
				});
		});
		it.skip('hides a non-allowed assignment from a non-admin user');
	});

	describe('#put', function(){
		it('rejects an anonymous put', function(done){
			request
				.put('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments/3cd2dc98-e280-4e72-a437-9a916d98b636')
				.send({id:'3cd2dc98-e280-4e72-a437-9a916d98b636',role:'advisor'})
				.expect(401)
				.end(done);
		});

		it('rejects a put by a non-admin user', function(done){
			request
				.put('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments/3cd2dc98-e280-4e72-a437-9a916d98b636')
				.set('Authorization', 'Bearer ' + userToken)
				.send({id:'3cd2dc98-e280-4e72-a437-9a916d98b636',role:'advisor'})
				.expect(403)
				.end(done);
		});
		it('rejects an invalid put', function(done){
			request
				.put('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments/3cd2dc98-e280-4e72-a437-9a916d98b636')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({foo:'bar'})
				.expect(400)
				.end(done);
		});
		it('returns 404 for nonexistant project', function(done){
			request
				.put('/api/projects/foo/assignments/5a3cf444-9d87-4125-8026-2d5ffb834676')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({id:'3cd2dc98-e280-4e72-a437-9a916d98b636',role:'advisor'})
				.expect(404)
				.end(done);
		});
		it('allows a new put by an admin user', function(done){
			request
				.put('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments/3cd2dc98-e280-4e72-a437-9a916d98b636')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({id:'3cd2dc98-e280-4e72-a437-9a916d98b636',role:'advisor'})
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					assert.equal(res.body.id, '3cd2dc98-e280-4e72-a437-9a916d98b636');
					done();
				});
		});
		it('allows an existing put by an admin user', function(done){
			request
				.put('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments/3cd2dc98-e280-4e72-a437-9a916d98b636')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({id:'3cd2dc98-e280-4e72-a437-9a916d98b636',role:'applicant'})
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					assert.equal(res.body.id, '3cd2dc98-e280-4e72-a437-9a916d98b636');
					assert.equal(res.body.role, 'applicant');
					done();
				});
		});
	});

	describe('#patch', function(){
		it('rejects an anonymous put', function(done){
			request
				.patch('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments/3cd2dc98-e280-4e72-a437-9a916d98b636')
				.send({role:'applicant'})
				.expect(401)
				.end(done);
		});
		it('rejects a patch by a non-admin user', function(done){
			request
				.patch('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments/3cd2dc98-e280-4e72-a437-9a916d98b636')
				.set('Authorization', 'Bearer ' + userToken)
				.send({role:'applicant'})
				.expect(403)
				.end(done);
		});
		it('rejects an invalid patch', function(done){
			request
				.patch('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments/3cd2dc98-e280-4e72-a437-9a916d98b636')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({foo:'bar'})
				.expect(400)
				.end(done);
		});
		it('rejects a new patch by an admin user', function(done){
			request
				.patch('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments/foo')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({role:'applicant'})
				.expect(404)
				.end(function(err, res){
					if(err) return done(err);
					done();
				});
		});
		it('returns 404 for nonexistant project', function(done){
			request
				.patch('/api/projects/foo/assignments/5a3cf444-9d87-4125-8026-2d5ffb834676')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({id:'3cd2dc98-e280-4e72-a437-9a916d98b636',role:'advisor'})
				.expect(404)
				.end(done);
		});
		it('allows an existing patch by an admin user', function(done){
			request
				.patch('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments/3cd2dc98-e280-4e72-a437-9a916d98b636')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({role:'applicant'})
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					assert.equal(res.body.role, 'applicant');
					done();
				});
		});
	});

	describe('#delete', function(){
		it('rejects an anonymous delete', function(done){
			request
				.delete('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments/3cd2dc98-e280-4e72-a437-9a916d98b636')
				.expect(401)
				.end(done);
		});
		it('rejects a delete by a non-admin user', function(done){
			request
				.delete('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments/3cd2dc98-e280-4e72-a437-9a916d98b636')
				.set('Authorization', 'Bearer ' + userToken)
				.expect(403)
				.end(done);
		});
		it('returns 404 for nonexistant project', function(done){
			request
				.delete('/api/projects/foo/assignments/5a3cf444-9d87-4125-8026-2d5ffb834676')
				.set('Authorization', 'Bearer ' + adminToken)
				.send({id:'3cd2dc98-e280-4e72-a437-9a916d98b636',role:'advisor'})
				.expect(404)
				.end(done);
		});
		it('returns 404 for nonexistant project assignment', function(done){
			request
				.delete('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments/foo')
				.set('Authorization', 'Bearer ' + adminToken)
				.expect(404)
				.end(done);
		});
		it('deletes an assignment for an admin user', function(done){
			request
				.delete('/api/projects/b37e83a5-d613-4d64-8873-fdcc8df0a009/assignments/3cd2dc98-e280-4e72-a437-9a916d98b636')
				.set('Authorization', 'Bearer ' + adminToken)
				.expect(200)
				.end(function(err, res){
					if(err) return done(err);
					assert.equal(res.body.id, '3cd2dc98-e280-4e72-a437-9a916d98b636');
					done();
				});
		});
	});

});
