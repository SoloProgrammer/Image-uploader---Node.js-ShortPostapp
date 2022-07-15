const jwt = require('jsonwebtoken');

require('dotenv').config();

const fetchuser = (req,res,next) =>{

    // geting token from heaers and decoded it for getting the user hidden data in it.

    const token = req.header('auth-token');
    if(!token){
       return res.status(401).json({status:false,msg:"Token is not valid"})
    }

    try {

        const data = jwt.verify(token,process.env.jwt_secret);
        req.user = data.user;
        next()
    } catch (error) {
        res.status(401).send({status:false,msg:"plz authenticate with a valid token.."})
        
    }  
}

module.exports = fetchuser