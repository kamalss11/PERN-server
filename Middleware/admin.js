const jwt = require('jsonwebtoken')
const User = require('../Schemas/register')

const admin = async (req,res,next) =>{
    try{
        const rootUser = await User.find({department : 'B.Sc(CT)'})

        if(!rootUser){
            throw new Error('User not found')
        }
        req.rootUser = rootUser
        // req.all = all

        next()

    }catch(err){
        res.status(401).send('Unauthorized : No token provided')
        console.log(err)
    }
}

module.exports = admin