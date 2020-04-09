const mongoose = require("mongoose")

const UserTokenSchema = mongoose.Schema

const userTokenSchema = new UserTokenSchema({
  email: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
})


module.exports = mongoose.model("user-token", userTokenSchema)
