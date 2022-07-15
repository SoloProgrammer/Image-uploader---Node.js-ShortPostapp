const multer = require('multer');

const Storage = multer.diskStorage({
    destination:(req,file,cb) =>{
        cb(null,'Upload_avatar')
    },
    filename:(req,file,cb) =>{
        cb(null,Date.now() +"_" + file.originalname)
}

})

const upload = multer({storage:Storage})

module.exports = upload;