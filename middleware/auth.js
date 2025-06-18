import jwt from 'jsonwebtoken';
import Users from '../models/usermodel.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token is required' 
      });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    

    const user = await Users.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }


    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      manager: user.manager,
      organization_id: user.organization_id
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    console.error('Token verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};


export const requireManager = (req, res, next) => {
  if (!req.user.manager) {
    return res.status(403).json({ 
      success: false, 
      message: 'Manager access required' 
    });
  }
  next();
};


export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
  next();
};


export const optionalToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await Users.findByPk(decoded.userId);
      
      if (user) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          manager: user.manager,
          organization_id: user.organization_id
        };
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional token verification error:', error);
    next();
  }
}; 