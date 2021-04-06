/**
 * This model keeps track of the details related to the files that are selected
 * @type {Mongoose}
 */
const mongoose = require('mongoose')

const db = mongoose.connection
//  in case of any error
db.on('error', console.error.bind(console, 'Connection Error'))
//  in case of successful connection
db.once('open', () => {
  console.log('successfully connected to the database')
})

const Schema = mongoose.Schema

const fileSchema = new Schema({
  fieldname: {
    type: String,
    required: true,
  },
  originalname: {
    type: String,
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  etag: {
    type: String,
  },
})

module.exports = mongoose.model('File', fileSchema)
