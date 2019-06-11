/**
 * This model keeps track of the details related to the entire post that is supposed to send
 * to an end user
 * @type {Mongoose}
 */
const mongoose = require('mongoose')

const Schema = mongoose.Schema

const postSchema = new Schema({
    to: {
        required: true,
        type: String
    },
    from: {
        required: true,
        type: String
    },
    message: {
        type: String
    },
    fileIds: {
        required: true,
        type: Array
    }
})

module.exports = mongoose.model('Post', postSchema)