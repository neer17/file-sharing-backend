const archiver = require('archiver')
const path = require('path')

const {S3Download} = require('./s3Download')

const uploadDir = path.join(__dirname, '..', 'public', 'images')

class DownloadZip {
    constructor(result, response, router) {
        this.result = result
        this.response = response
        this.router = router
    }

    download() {
        const files = this.result.files
        const zip = archiver('zip', {
            zlib: {level: 9}
        })
        const response = this.response

        //  this would make a file by the name "download.zip" which
        //  would be downloaded as soon as this method is called
        response.attachment('download.zip')
        zip.pipe(response)

        files.forEach((file) => {
            const s3Download = new S3Download(this.router, this.response)
            const fileObject = s3Download.getObject(file)

            zip.append(fileObject, {name: file.originalname})
        })

        zip.finalize()
    }
}

module.exports = DownloadZip
