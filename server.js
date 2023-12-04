'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');
require('dotenv').config();

const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');

const { MongoClient, ObjectId } = require('mongodb');

const app = express();

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //USED FOR FCC TESTING PURPOSES ONLY!

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const mongoURI = process.env.MONGO_URI
if (!mongoURI) {
  throw new Error('Mongo URI is not defined')
}
const client = new MongoClient(mongoURI);

const db = client.db('personalLibrary')
const books = db.collection('books')

//Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

app.post('/api/books', async (req, res) => {
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

app.get('/api/books', async (req, res) => {
  const allBooks = await books.find({}).toArray();

  const booksCollection = allBooks.map(b => ({_id: b._id, title: b.title, commentcount: b.comments ? b.comments.length : 0}));

  return res.json(booksCollection)
})

app.get('/api/books/:id', async (req, res) => {
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

app.post('/api/books/:id', async (req, res) => {
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

app.delete('/api/books/:id', async (req, res) => {
  const id = req.params.id;

  const deletedBook = await books.findOneAndDelete({_id:new ObjectId(id)})

  if (deletedBook) {
    return res.json('delete successful')
  } else {
    return res.json('no book exists')
  }
})

app.delete('/api/books/', async (req, res) => {
  await books.deleteMany({})

  return res.json('complete delete successful')
})

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app);  
    
//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch(e) {
          console.log('Tests are not valid:');
          console.error(e);
      }
    }, 3500);
  }
});

module.exports = app; //for unit/functional testing
