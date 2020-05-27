const sgMail = require("@sendgrid/mail")

const url = require("./domainConfig")

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

async function sendEmail(postId, to, from, message) {
  const msg = {
    from,
    to,
    subject: `${from} has sent you some files`, // Subject line
    text: message, // plain text body
    //  redirecting the user to the front end
    html: `<p><a href="${url}/downloadAllFiles/${postId}">Click here to download the files</a></p>`,
  }
  const info = await sgMail.send(msg)
  console.info("mail sent info:", info)
}

module.exports = sendEmail
