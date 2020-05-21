class S3Download {
    constructor(app, response) {
        this.app = app
        this.response = response
    }

    getObject(file) {
        /*
         *  getting the file or object from the bucket and returning it
         */
        const s3 = this.app.s3

        const object = s3.getObject({
            Bucket: 'file-sharing-app',
            Key: file.filename
        }).createReadStream()

        return object
    }

    download(file) {
        const s3 = this.app.s3
        const res = this.response

        //  getObject would fetch the data from the s3 bucket
        //  and read stream would help to fetch the data without getting it stored in the buffer
        const object = s3.getObject({
            Bucket: 'file-sharing-app',
            Key: file.filename
        }).createReadStream()

        //  this would set the content-description and content-type that would help
        //  to get the download dialog open on doing pipe
        res.attachment(file.filename)

        object.pipe(res)
    }

    downloadFaster(file) {
        console.log('===================== downloadFaster ========================')
        const s3 = this.app.s3

        const options = {
            Bucket: 'file-sharing-app',
            Key: file.filename,
            Expires: 3600
        }

        //  synchronous
        const url = s3.getSignedUrl('getObject', options)
        // console.log('s3Download fasterDownload url ==> ', url)

        return url
    }
}

module.exports = {
    S3Download
}