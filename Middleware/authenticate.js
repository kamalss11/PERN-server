const jwt = require('jsonwebtoken')
const User = require('../Schemas/register')

const Authenticate = async (req,res,next) =>{
    try{
        const token = req.cookies.jwtoken
        const verifyToken = jwt.verify(token,process.env.SECRET_KEY)

        const rootUser = await User.findOne({_id:verifyToken._id,"tokens.token":token})
        // const all = await User.find()

        if(!rootUser){
            throw new Error('User not found')
        }

        req.token = token
        req.rootUser = rootUser
        req.userID = rootUser._id
        // req.all = all

        next()

    }catch(err){
        res.status(401).send('Unauthorized : No token provided')
        console.log(err)
    }
}

module.exports = Authenticate
