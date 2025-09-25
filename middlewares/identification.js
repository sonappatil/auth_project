require('dotenv').config();
const jwt = require("jsonwebtoken");

exports.identifier = (req, res, next)=>{
    
      let token;
      if(req.headers.client === "not-browser"){ 
        token = req.headers.authorization;
        // console.log(token);
      }else{
        token = req.cookies["Authorization"];
      }

      if(!token){
        return res.status(403).json({success: false, message: "Unauthorized Access!"});
      }

     try{
         
        const userToken = token.split(" ")[1];
        // console.log("JWT secret:", process.env.TOKEN_SECRET);

        const jwtVerified = jwt.verify(userToken, process.env.TOKEN_SECRET);
        if(jwtVerified){
            req.user = jwtVerified;
            next();
        }else{
            throw  new Error('error in the token');
        }
    }catch(error){
        console.log(error);
    }
}