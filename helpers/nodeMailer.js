const nodemailer = require("nodemailer")

// async..await is not allowed in global scope, must use a wrapper
async function sendEmail(postId, to, from, message) {
    console.log(`nodeMailer.js  postId ==> ${postId} \t to ==> ${to} \t from ==> ${from} \t message ==> ${message}`)


    /*// Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let account = await nodemailer.createTestAccount();*/

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'apikey', // generated ethereal user
            pass: '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' // generated ethereal password
        }
    })

    // setup email data with unicode symbols
    let mailOptions = {
        from, // sender address
        to, // list of receivers
        subject: `${from} has sent you some files`, // Subject line
        text: message, // plain text body
        //  redirecting the user to the front end
        html: `<p><a href="http://localhost:3000/share/${postId}">Click here to see the files</a></p>`
    }

    // send mail with defined transport object
    let info = await transporter.sendMail(mailOptions)

    console.log("Message sent: %s", info.messageId)
    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))

    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

module.exports = sendEmail
