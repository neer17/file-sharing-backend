const mongoose = require('mongoose')

const SignInSchema = mongoose.Schema

const signInSchema = new SignInSchema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    logged_in_at: {
        type: Date,
        required: true
    }, token: {
        type: String,
        required: true
    }
})


module.exports = mongoose.model("signIn", signInSchema)