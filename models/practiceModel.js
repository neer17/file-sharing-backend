const mongoose = require('mongoose')

const Schema = mongoose.Schema

const practiceSchema = new Schema({
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
})

module.exports = mongoose.model('Practice', practiceSchema)