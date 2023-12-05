/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

module.exports = function (app) {

  const { MongoClient, ObjectId } = require('mongodb');

  const mongoURI = process.env.MONGO_URI
  if (!mongoURI) {
    throw new Error('Mongo URI is not defined')
  }
  const client = new MongoClient(mongoURI);

  const db = client.db('personalLibrary')
  const books = db.collection('books')

  app.route('/api/books')
    .get(async function (req, res){
      const allBooks = await books.find({}).toArray();

      const booksCollection = allBooks.map(b => ({_id: b._id, title: b.title, commentcount: b.comments ? b.comments.length : 0}));

      return res.json(booksCollection)
    })
    
    .post(async function (req, res){
      const bookTitle = req.body.title;
      if (!bookTitle) {
        return res.json('missing required field title')
      }

      //commented for passing tests
      //const existingBook = await books.findOne({ title: bookTitle });
      //if (existingBook) {
      //  return res.json('book already exists!')
      //}

      const newBook = await books.insertOne({title: bookTitle})

      const justCreatedBook = await books.findOne({ _id: new ObjectId(newBook.insertedId) })

      return res.json(justCreatedBook)
    })
    
    .delete(async function(req, res){
      await books.deleteMany({})

      return res.json('complete delete successful')
    });



  app.route('/api/books/:id')
    .get(async function (req, res){
      const id = req.params.id;
      const book = await books.findOne({_id: new ObjectId(id)});
      if (!book) {
        return res.json('no book exists');
      }

      if (!book.comments) {
        return res.json({...book, comments: []})
      } else {
        return res.json(book)
      }
    })
    
    .post(async function(req, res){
      const id = req.params.id;
      const comment = req.body.comment;
      if (!comment) {
        return res.json('missing required field comment')
      }

      const bookToUpdate = await books.findOne({_id: new ObjectId(id)});
      if (!bookToUpdate) {
        return res.json('no book exists')
      }

      const updatedBook =  await books.findOneAndUpdate({_id: bookToUpdate._id},{$push:{
          comments: comment
        }});
        const justUpdatedBook = await books.findOne({ _id: new ObjectId(updatedBook._id) })

        return res.json(justUpdatedBook)
    })
    
    .delete(async function(req, res){
        const id = req.params.id;

        const deletedBook = await books.findOneAndDelete({_id:new ObjectId(id)})

        if (deletedBook) {
          return res.json('delete successful')
        } else {
          return res.json('no book exists')
        }
      })
  
};
