import jwt from 'jsonwebtoken';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).json('Access denied');
    jwt.verify(token, process.env.ACCESS_TOKEN_KEY,(error, user)=>{
        if (error) return res.status(403).json('Invalid token');
        req.user = user;
        next();
    });
}

export {authenticateToken};