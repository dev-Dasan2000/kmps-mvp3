import jwt from 'jsonwebtoken';

function jwTokens(id, name, role){
    const user = {id, name, role};
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_KEY, {expiresIn:'15m'});
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_KEY, {expiresIn:'14d'});
    return ({accessToken, refreshToken});
}

export {jwTokens};