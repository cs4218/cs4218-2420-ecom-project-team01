import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Protected routes token base
export const requireSignIn = async (req, res, next) => {
    try {
        // Check if authorization header exists
        if (!req.headers.authorization || req.headers.authorization.trim() === '') {
            return res.status(401).send({
                success: false,
                message: "Authentication required"
            });
        }

        // Validate token format (Bearer token)
        const authHeader = req.headers.authorization;
        const tokenRegex = /^Bearer\s+([A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*)$/;
        const match = authHeader.match(tokenRegex);
        
        if (!match) {
            return res.status(401).send({
                success: false,
                message: "Invalid token format"
            });
        }

        const token = match[1];
        
        // Verify the JWT token
        const decode = JWT.verify(token, process.env.JWT_SECRET);
        req.user = decode;
        
        // Set axios authorization header for client requests
        if (!req.headers.internal) {
            // Only set this for non-internal requests to prevent circular dependencies
            req.headers.authorization = `Bearer ${token}`;
        }
        
        next();
    } catch (error) {
        console.error(error);
        
        // Handle specific JWT errors
        if (error.name === 'TokenExpiredError') {
            return res.status(401).send({
                success: false,
                message: "Token has expired, please login again"
            });
        }
        
        return res.status(401).send({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

//admin access
export const isAdmin = async (req, res, next) => {
    try {
        // Check if user object exists from requireSignIn middleware
        if (!req.user || !req.user._id) {
            return res.status(401).send({
                success: false,
                message: "Authentication required"
            });
        }
        
        const user = await userModel.findById(req.user._id);
        
        // Handle case when user is not found
        if (!user) {
            return res.status(404).send({
                success: false,
                message: "User not found"
            });
        }
        
        // Check admin role (role === 1 means admin)
        if (user.role !== 1) {
            return res.status(403).send({
                success: false,
                message: "Forbidden: Admin privileges required"
            });
        } 
        
        next();
    } catch (error) {
        console.error(error);
        
        // Handle specific error types
        if (error.name === 'CastError') {
            return res.status(400).send({
                success: false,
                message: "Invalid user ID format"
            });
        }
        
        res.status(500).send({
            success: false,
            message: "Server error during authorization check",
            error: error.message
        });
    }
};
