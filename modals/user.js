const mongoose = require('mongoose')

const UserSchema = mongoose.Schema

const userSchema = new UserSchema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    },
    updatedAt: {
        type: Date,
        default: null
    }
})

userSchema.methods.doesUserExists = function (email) {
    return this.model('user').findOne({email})
}

module.exports = mongoose.model("user", userSchema)