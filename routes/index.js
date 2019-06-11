const express = require('express')
const router = express.Router()
const path = require('path')
const multer = require('multer')
const multerS3 = require('multer-s3')
const mongoose = require('mongoose')
const AWS = require('aws-sdk')
const jwt = require('jsonwebtoken')

const bcrypt = require('bcrypt')
const saltRounds = 10

const fileModel = require('../modals/file')
const postModel = require('../modals/post')
const practiceModel = require('../modals/practiceModel')
const userModel = require('../modals/user')
const DownloadZip = require('./../helpers/downloadZip')
const sendMail = require('./../helpers/nodeMailer')
const {AWSConfig, AWSRegion} = require('./../helpers/AWSConfig')
const {S3Download} = require('./../helpers/s3Download')
const signInModel = require('../modals/sign-in')

const uploadDir = path.join(__dirname, '..', 'public', 'images')

//  connecting to mLab
mongoose.connect('mongodb://neeraj:pontiac633725@ds135207.mlab.com:35207/file-sharing-app', {useNewUrlParser: true })

//  initializing the AWS s3
AWS.config.update(AWSConfig)
AWS.config.region = AWSRegion

const s3 = new AWS.S3({signatureVersion: 'v4'})
const secret = 'shhhhhhh'   //  secret for jwt

//  putting s3 in router
router.s3 = s3

/**
 * The following lines in the comments is for the local storage of media by Multer
 */
//  MULTER storage config
// const storageConfig = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, uploadDir)
//     },
//     filename: function (req, file, cb) {
//         // console.log(path.basename(file.originalname, ''))
//
//         cb(null, Date.now() + path.extname(file.originalname))
//         // cb(null, file.fieldname + '-' + Date.now())
//     }
// })

//  this would help upload multiple photos
/**
 * Use name "photos" as key name while sending the photos from the front end
 * It's for the local upload
 */
// const upload = multer({storage: storageConfig}).array('photos')


//  MULTER-S3 for upload on S3
const multerConfig = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'filesharingapp',
        acl: 'public-read',
        metadata: function (req, file, cb) {
            cb(null, {
                fieldName: file.fieldname,
                filename: Date.now() + path.extname(file.originalname),
            })
        },
        key: function (req, file, cb) {
            cb(null, Date.now() + path.extname(file.originalname))
        }
    })
})
const upload = multerConfig.array('photos')


//  GET /
router.get('/', function (req, res) {
    res.send('Home route')
})

//  POST /
router.post('/', (req, res) => {
    res.send('From POST /')
})

//  POST upload-file
/**
 * To upload file locally or to S3
 */
router.post('/upload-file', (req, res) => {

    upload(req, res, function (err) {
        let to = '', from = '', message = ''

        // checking for any errors
        if (err instanceof multer.MulterError) {
            return console.log(`Error: from Multer ==> ${err}`)
        } else if (err) {
            console.log(`Error: ==> ${err}`)
            return res.json(err)
        }

        //  getting the files from the req(from front end)
        /*console.log('index.js req ==> ', req)*/
        const files = req.files
        console.log('index.js files from multer s3 files ==> ', files)

        /*const location = req.file.location
        console.log('index.js multer location ==> ', location)*/
        //  getting fields from the frontend
        //  may not be present on sending files from Postman
        try {
            to = req.body.to
            from = req.body.from
            message = req.body.message
        } catch (err) {
            console.log(err)
        }

        if (files.length >= 1) { //  array of photos
            let fileArray = []
            files.forEach(file => {
                const
                    {
                        fieldname = '',
                        originalname = '',
                        mimetype = '',
                        size = 0,
                        metadata = '',
                        etag = ''
                    } = file
                const filename = file.metadata.filename
                const createdAt = metadata.filename.split('.')[0]

                fileArray.push({
                    fieldname,
                    originalname,
                    mimetype,
                    filename,
                    size,
                    createdAt,
                    etag
                })
            })

            //  saving details of files in "File" document
            fileModel.insertMany(fileArray).then((response) => {
                // console.log(`res after saving the files ==> ${response}`)

                //  getting the file ids and storing them into an array
                let fileIds = []
                response.forEach((file) => {
                    fileIds.push(file.id)
                })

                let postObject = {
                    to,
                    from,
                    message,
                    fileIds
                }

                //  inserting data in "posts" document
                postModel.insertMany(postObject).then((res1) => {
                    console.log('posts document insertMany res1 ==> ', res1)

                    const postId = res1[0]._id
                    const to = res1[0].to
                    const from = res1[0].from
                    const message = res1[0].message

                    // console.log(`index.js postId ==> ${postId} \t to ==> ${to} \t from ==> ${from} \t message ==> ${message}`)

                    //  sending the mail to the user
                    sendMail(postId, to, from, message)
                        .then((response) => console.log('sendmail response ==> ', response))
                        .catch((err) => {
                            console.log(err)
                            return res.json(err)
                        })

                    //  sending this to the frontend
                    return res.json({
                        file: res1
                    })
                }).catch((err) => {
                    console.log(err)
                })
            }).catch((err) => {
                console.log(err)
            })
        }
    })
})

//  GET /upload-file
router.get('/upload-file', (req, res) => {
    // console.log(`Inside GET upload-file ==> `, res)
})

//  GET /download/:id
/**
 * To download an individual file
 */
router.get('/download/:id', (req, res) => {
    const idOfFile = req.params.id

    //  finding the file by its id
    fileModel.findById(idOfFile).then((result) => {
        console.log('GET /download/id \n result ==> ', result)

        const filename = result.filename
        const filePath = path.join(uploadDir, filename)


        /*//  to download the file
        res.download(filePath, (err) => {
            if (err) {
                return res.status(404).json({
                    error: {
                        message: 'File not found'
                    }
                })
            }
        })*/

        const downloader = new S3Download(router, res)
        let url = downloader.downloadFaster(result)
        console.log('index.js downloadFaster url ==> ', url)
        res.attachment(result.filename)
        res.redirect(url.toString())
    }).catch((err) => {
        console.log(err)
    })
})

//  GET /share/:id
router.get('/share/:id', (req, res) => {
    const postId = req.params.id
    getPostById(postId, (err, result) => {
        if (err)
            return res.json(err)

        res.json(result)
    })
})

//  GET downloadAllFiles/:id
router.get('/downloadAllFiles/:id', (req, res) => {
    const postId = req.params.id
    getPostById(postId, (err, result) => {
        if (err)
            return res.json(err)

        //  downloading the files
        const downloadZip = new DownloadZip(result, res, router)
        downloadZip.download()
    })
})

//  POST /create_user
/**
 * This is used to send details of the user from "createUser.js" in React
 */
router.post('/create_user', (req, res) => {
    console.log('this log is from /crate_user')

    let doesUserExists = false
    const body = req.body

    if (body) {
        const checkUserStatus = new userModel().doesUserExists(body.email)
        checkUserStatus.then((response) => {

            doesUserExists = response != null

            if (doesUserExists) {
                //  if user already exists then rejecting a promise which would call catch block
                //  and a response would be sent
                return Promise.reject("User already exists")
            }

            //  else creating the user
            //  first hashing the

            return bcrypt.hash(body.password, saltRounds)

        }).then((hash) => {
            return userModel.insertMany({
                name: body.name,
                email: body.email,
                password: hash,
                createdAt: new Date().getTime(),
            })
        }).then((response) => {
            if (response) {
                res.json({
                    message: 'User created'
                })
            }

        }).catch(err => {
            //  when user already exists
            if (err === "User already exists")
                res.status(403).json({
                    message: 'User already exists'
                })
            else  //    if there is some trouble in saving the data in the mongoDB or otherwise
                res.json({
                    message: "Internal server error. User can not be created"
                })
        })
    }
})


//  POST /sign-in
router.post('/sign-in', async (req, res) => {
    const body = req.body
    const email = body.email
    const password = body.password

    //  checking whether email exists and if it does then checking whether password is correct or not
    const response = await userModel.findOne({email: email})
    if (response) {
        //  checking the password for correctness
        const hashedPassword = response.password
        let isPasswordCorrect = false
        try {
            isPasswordCorrect = await bcrypt.compare(password, hashedPassword)
        } catch (err) {
            console.log(err)
        }

        //  when password is incorrect
        if (!isPasswordCorrect) {
            return res.status(403).json({
                'message': 'Password does not match'
            })
        } else {    //  when password is correct, logging in the user
            //  generating the token which would expire in 1 hour
            const token = jwt.sign({
                email,
                password,
                exp: Math.floor(Date.now() / 1000) + 5
            }, secret)

            //  store values in signIn model
            signInModel.insertMany({
                email,
                password,
                logged_in_at: new Date(),
                token
            }).then(response => {

                //  on successful log-in sending the id, token and message back to the front-end
                res.status(200).json({
                    userId: response[0]._id,
                    token: response[0].token,
                    message: 'You are now logged-in. Session is valid for 60 mins.'
                })
            }).catch(console.log)
        }
    } else {
        return res.status(403).json({
            'message': 'Email does not exist'
        })
    }
})

//  GET /check-validation
/**
 * making a request to this in every x seconds from "home.js" from the front-end
 */
router.post('/check-validation', (req, res) => {
    const userId = req.body.userId
    signInModel.findById(userId).then(response => {
        const token = response.token

        jwt.verify(token, secret).catch(err => {
            //  sending a response back when the session expires
            res.status(401).json({
                message: 'User session has expired'
            })
        })
    }).catch(err => {
        if (err.name === 'TokenExpiredError') {
            //  sending response back to the front-end and the changing the home page to "authentication.js"
            res.status(401).json({
                message: 'Session Expired. Sign-in again.'
            })
        } else {
            console.log(err)
        }
    })
})

//  HELPER methods
function getPostById(postId, callback = () => {
}) {

    let allDetails = {}

    //  checking if the "postId" is a valid ObjectID or not
    const isPostIdValid = mongoose.Types.ObjectId.isValid(postId)
    if (!isPostIdValid)
        callback('Error: postId is not valid', null)

    //  lean().exec() is needed to convert mongodb document to plain JS object
    postModel.findById({_id: postId}).lean().exec().then((res1) => {
        allDetails = res1

        return fileModel.find({'_id': {$in: res1.fileIds}})
    }).then((result) => {
        allDetails.files = result

        return callback(null, allDetails)
    }).catch((err) => {
        callback(err, null)
    })
}

module.exports = router
