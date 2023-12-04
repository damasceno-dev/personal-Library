/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       
*/

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

//suite('Functional Tests', function() {
  /*
  * ----[EXAMPLE TEST]----
  * Each test should completely test the response of the API end-point including response status code!
  */
  //test('#example Test GET /api/books', function(done){
  //chai.request(server)
  //.get('/api/books')
  //.end(function(err, res){
  //assert.equal(res.status, 200);
  //assert.isArray(res.body, 'response should be an array');
  //assert.property(res.body[0], 'commentcount', 'Books in array should contain commentcount');
  //assert.property(res.body[0], 'title', 'Books in array should contain title');
  //assert.property(res.body[0], '_id', 'Books in array should contain _id');
  //done();
  //});
//});
  /*
  * ----[END of EXAMPLE TEST]----
  */

  suite('Routing tests', function() {
  this.timeout(15000);

    suite('POST /api/books with title => create book object/expect book object', function() {
      
      test('Test POST /api/books with title', function(done) {
         chai.request(server)
          .post('/api/books')
           .send({
             "title": "The Unforgettable Master",
           })
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.isObject(res.body, 'response should be an object');
            assert.property(res.body, '_id', 'id is a required property for the response object');
            assert.property(res.body, 'title', 'title is a required property for the response object');
            assert.isNotEmpty(res.body.title)
            assert.isNotEmpty(res.body._id)
            done();
          });
      });
      
      test('Test POST /api/books with no title given', function(done) {
         chai.request(server)
          .post('/api/books')
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, '"missing required field title"');
            done();
          });
      });
      
    });

    suite('GET /api/books => array of books', function(){
      
      test('Test GET /api/books',  function(done){
        chai
          .request(server)
          .get('/api/books/')
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body, 'Response should be an array');

            res.body.forEach(book => {
              assert.isObject(book, 'Each item in the array should be an object');
              assert.property(book, '_id', 'required property for each issue');
              assert.property(book, 'title', 'required property for each issue');
            });
            done();
      });      
      
    });

    })
    
    suite('GET /api/books/[id] => book object with [id]', function(){
      
      test('Test GET /api/books/[id] with id not in db',  function(done){
        const invalidId = "000000000000000000000000"
        chai
          .request(server)
          .keepOpen()
          .get('/api/books/' + invalidId)
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, '"no book exists"');
          });
        done();
      });
      
      test('Test GET /api/books/[id] with valid id in db',  function(done){
        chai
          .request(server)
          .keepOpen()
          .post('/api/books')
           .send({
             "title": "Just created for test",
           })
          .end((err, res) => {
            assert.equal(res.status, 200);
            const justCreatedId = res.body._id;

            chai
              .request(server)
              .get('/api/books/' + justCreatedId)
              .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.equal(res.body._id, justCreatedId);
                done();
              });
          });
      });
      
    });

    suite('POST /api/books/[id] => add comment/expect book object with id', function(){
      
      test('Test POST /api/books/[id] with comment', function(done){
        chai
          .request(server)
          .keepOpen()
          .get('/api/books')
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body, 'Response should be an array');
            const lastElement = res.body[res.body.length - 1];

            chai
              .request(server)
              .post('/api/books/' + lastElement._id)
               .send({
                 "comment": "comment post test",
               })
              .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.isTrue(res.body.comments.includes("comment post test"));
                done();
              });
          });
      });

      test('Test POST /api/books/[id] without comment field', function(done){
        chai
          .request(server)
          .keepOpen()
          .get('/api/books')
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body, 'Response should be an array');
            const lastElement = res.body[res.body.length - 1];

            chai
              .request(server)
              .post('/api/books/' + lastElement._id)
              .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.equal(res.text, '"missing required field comment"');
                done();
              });
          });
      });

      test('Test POST /api/books/[id] with comment, id not in db', function(done){
        const invalidId = "000000000000000000000000"
        chai
          .request(server)
          .keepOpen()
          .post('/api/books/' + invalidId)
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, '"no book exists"');
          });
        done();
      });
      
    });

    suite('DELETE /api/books/[id] => delete book object id', function() {

      test('Test DELETE /api/books/[id] with valid id in db', function(done){
        chai
          .request(server)
          .keepOpen()
          .get('/api/books/')
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body, 'Response should be an array');

            const lastElement = res.body[res.body.length - 1];

            chai
              .request(server)
              .delete('/api/books/' + lastElement._id)
              .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.equal(res.text, '"delete successful"');

                chai
                  .request(server)
                  .get(`/api/books/${lastElement._id}`)
                  .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.equal(res.text, '"no book exists"');
                    done();
                  })
              });
            }); 
          });

      test('Test DELETE /api/books/[id] with id not in db', function(done){
              const invalidId = "000000000000000000000000"
              chai
                .request(server)
                .get(`/api/books/${invalidId}`)
                .end((err, res) => {
                  assert.equal(res.status, 200);
                  assert.equal(res.text, '"no book exists"');
                  done();
                })
          });

    });

  });

