import jwt from 'jsonwebtoken';

const adminAuth = async (req,res,next) => {
    try {
        const { token } = req.headers
        console.log('Token received:', token); // Debug log
        
        if (!token) {
            return res.json({success:false, message:"Not Authorized Login Again"})
        }
        
        const token_decode = jwt.verify(token,process.env.JWT_SECRET);
        console.log('Decoded token:', token_decode); // Debug log
        
        // Fix: Check the email from the decoded token against ADMIN_EMAIL
        if (token_decode.email !== process.env.ADMIN_EMAIL) {
            return res.json({success:false, message:"Not Authorized Login Again"})
        }
        
        next()
    } catch (error) {
        console.log(error);
        res.json({success:false, message:"Not Authorized Login Again"})
    }
}

export default adminAuth