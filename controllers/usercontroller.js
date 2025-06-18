import Users from "../models/UserModel.js"
import Keys from "../models/KeyModel.js"
import Organizations from "../models/OrganizationModel.js"
import Users_Locations from "../models/UserLocationModel.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { Op } from "sequelize"
import sgMail from "@sendgrid/mail"
import crypto from "crypto"


const sendErrorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};


const sendSuccessResponse = (res, data, message = "Success") => {
  return res.json({
    success: true,
    message,
    data
  });
};


const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const getUser = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;
    
    const user = await Users.findByPk(userId, {
      attributes: { exclude: ['password', 'salt', 'refresh_token', 'resetPasswordToken', 'resetPasswordExpires'] }
    });

    if (!user) {
      return sendErrorResponse(res, 404, "User not found");
    }

    sendSuccessResponse(res, user);
  } catch (error) {
    console.error('Get user error:', error);
    sendErrorResponse(res, 500, "Internal server error");
  }
};

export const getAllUser = async (req, res) => {
  try {
    const users = await Users.findAll({
      attributes: ["id", "username", "firstname", "lastname", "file", "email", "role", "manager"],
      order: [['createdAt', 'DESC']]
    });
    
    sendSuccessResponse(res, users);
  } catch (error) {
    console.error('Get all users error:', error);
    sendErrorResponse(res, 500, "Internal server error");
  }
};

export const Register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      userName,
      email,
      password,
      confirmPassword,
      organization,
    } = req.body;


    if (!firstName || !lastName || !userName || !email || !password || !confirmPassword || !organization) {
      return sendErrorResponse(res, 400, "All fields are required");
    }

    if (!validateEmail(email)) {
      return sendErrorResponse(res, 400, "Invalid email format");
    }

    if (!validatePassword(password)) {
      return sendErrorResponse(res, 400, "Password must be at least 6 characters long");
    }

    if (password !== confirmPassword) {
      return sendErrorResponse(res, 400, "Password and Confirm Password do not match");
    }


    const existingUser = await Users.findOne({
      where: {
        [Op.or]: [{ email }, { username: userName }],
      },
    });

    if (existingUser) {
      return sendErrorResponse(res, 400, "This username or email is already taken");
    }


    const salt = await bcrypt.genSalt(12);
    const hashPassword = await bcrypt.hash(password, salt);


    const newOrganization = await Organizations.create({
      name: organization,
    });


    const newUser = await Users.create({
      username: userName,
      email,
      password: hashPassword,
      salt,
      firstname: firstName,
      lastname: lastName,
      organization_id: newOrganization.id,
    });


    const userResponse = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      organization_id: newUser.organization_id
    };

    sendSuccessResponse(res, userResponse, "User registered successfully");
  } catch (error) {
    console.error('Registration error:', error);
    sendErrorResponse(res, 500, "Internal server error");
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;


    if (!email || !password) {
      return sendErrorResponse(res, 400, "Email and password are required");
    }

    if (!validateEmail(email)) {
      return sendErrorResponse(res, 400, "Invalid email format");
    }

    const user = await Users.findOne({
      where: { email },
      attributes: ['id', 'username', 'email', 'password', 'role', 'manager', 'organization_id']
    });

    if (!user) {
      return sendErrorResponse(res, 400, "Invalid email or password");
    }

    // Verify password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return sendErrorResponse(res, 400, "Invalid email or password");
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30d" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "30d" }
    );

    // Update refresh token in database
    await Users.update(
      { refresh_token: refreshToken },
      { where: { id: user.id } }
    );

    // Set refresh token cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Return response
    sendSuccessResponse(res, {
      accessToken,
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      manager: user.manager
    }, "Login successful");

  } catch (error) {
    console.error('Login error:', error);
    sendErrorResponse(res, 500, "Internal server error");
  }
};

export const Logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      // Clear refresh token from database
      await Users.update(
        { refresh_token: null },
        { where: { refresh_token: refreshToken } }
      );
    }

    // Clear cookie
    res.clearCookie("refreshToken");
    
    sendSuccessResponse(res, null, "Logout successful");
  } catch (error) {
    console.error('Logout error:', error);
    sendErrorResponse(res, 500, "Internal server error");
  }
};

export const ForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return sendErrorResponse(res, 400, "Valid email is required");
    }

    const user = await Users.findOne({ where: { email } });
    
    if (!user) {
      return sendErrorResponse(res, 404, "User not found");
    }

    // Generate reset token
    const resetPasswordToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordExpires = Date.now() + 3600000; // 1 hour

    // Update user with reset token
    await Users.update(
      {
        resetPasswordToken,
        resetPasswordExpires,
      },
      { where: { email } }
    );

    // Send email
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetPasswordToken}`;
    
    const msg = {
      to: email,
      from: "ryan@nabl.ai",
      subject: "Password Recovery",
      html: `
        <body>
          <p>Dear ${user.firstname || 'User'}</p>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </body>
      `
    };

    await sgMail.send(msg);

    sendSuccessResponse(res, null, "Password reset email sent");
  } catch (error) {
    console.error('Forgot password error:', error);
    sendErrorResponse(res, 500, "Internal server error");
  }
};

export const Update = async (req, res) => {
  try {
    const { firstname, lastname, username } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (firstname) updateData.firstname = firstname;
    if (lastname) updateData.lastname = lastname;
    if (username) updateData.username = username;

    if (Object.keys(updateData).length === 0) {
      return sendErrorResponse(res, 400, "No fields to update");
    }

    // Check if username is already taken
    if (username) {
      const existingUser = await Users.findOne({
        where: { 
          username,
          id: { [Op.ne]: userId }
        }
      });
      
      if (existingUser) {
        return sendErrorResponse(res, 400, "Username is already taken");
      }
    }

    await Users.update(updateData, { where: { id: userId } });

    sendSuccessResponse(res, null, "Profile updated successfully");
  } catch (error) {
    console.error('Update profile error:', error);
    sendErrorResponse(res, 500, "Internal server error");
  }
};

export const ChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return sendErrorResponse(res, 400, "All password fields are required");
    }

    if (!validatePassword(newPassword)) {
      return sendErrorResponse(res, 400, "New password must be at least 6 characters long");
    }

    if (newPassword !== confirmPassword) {
      return sendErrorResponse(res, 400, "New password and confirm password do not match");
    }

    // Get current user
    const user = await Users.findByPk(userId);
    if (!user) {
      return sendErrorResponse(res, 404, "User not found");
    }

    // Verify current password
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return sendErrorResponse(res, 400, "Current password is incorrect");
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await Users.update(
      { password: hashPassword, salt },
      { where: { id: userId } }
    );

    sendSuccessResponse(res, null, "Password changed successfully");
  } catch (error) {
    console.error('Change password error:', error);
    sendErrorResponse(res, 500, "Internal server error");
  }
};

export const ResetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return sendErrorResponse(res, 400, "All fields are required");
    }

    if (!validatePassword(newPassword)) {
      return sendErrorResponse(res, 400, "Password must be at least 6 characters long");
    }

    if (newPassword !== confirmPassword) {
      return sendErrorResponse(res, 400, "Passwords do not match");
    }

    // Find user with reset token
    const user = await Users.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return sendErrorResponse(res, 400, "Invalid or expired reset token");
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    await Users.update(
      {
        password: hashPassword,
        salt,
        resetPasswordToken: null,
        resetPasswordExpires: null
      },
      { where: { id: user.id } }
    );

    sendSuccessResponse(res, null, "Password reset successfully");
  } catch (error) {
    console.error('Reset password error:', error);
    sendErrorResponse(res, 500, "Internal server error");
  }
};

export const saveAgencyKey = async (req, res) => {
  try {
    const { key } = req.body;
    const userId = req.user.id;

    if (!key) {
      return sendErrorResponse(res, 400, "Key is required");
    }

    await Keys.create({
      key,
      user_id: userId
    });

    sendSuccessResponse(res, null, "Agency key saved successfully");
  } catch (error) {
    console.error('Save agency key error:', error);
    sendErrorResponse(res, 500, "Internal server error");
  }
};

export const saveUserType = async (req, res) => {
  try {
    const { user_type } = req.body;
    const userId = req.user.id;

    if (!user_type) {
      return sendErrorResponse(res, 400, "User type is required");
    }

    await Users.update(
      { user_type },
      { where: { id: userId } }
    );

    sendSuccessResponse(res, null, "User type saved successfully");
  } catch (error) {
    console.error('Save user type error:', error);
    sendErrorResponse(res, 500, "Internal server error");
  }
};

export const getUserType = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await Users.findByPk(userId, {
      attributes: ['user_type']
    });

    if (!user) {
      return sendErrorResponse(res, 404, "User not found");
    }

    sendSuccessResponse(res, { user_type: user.user_type });
  } catch (error) {
    console.error('Get user type error:', error);
    sendErrorResponse(res, 500, "Internal server error");
  }
};

export const addUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      userName,
      email,
      password,
      organization,
      role = "user",
      manager = false
    } = req.body;

    // Input validation
    if (!firstName || !lastName || !userName || !email || !password || !organization) {
      return sendErrorResponse(res, 400, "All required fields must be provided");
    }

    if (!validateEmail(email)) {
      return sendErrorResponse(res, 400, "Invalid email format");
    }

    if (!validatePassword(password)) {
      return sendErrorResponse(res, 400, "Password must be at least 6 characters long");
    }

    // Check if user already exists
    const existingUser = await Users.findOne({
      where: {
        [Op.or]: [{ email }, { username: userName }],
      },
    });

    if (existingUser) {
      return sendErrorResponse(res, 400, "This username or email is already taken");
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashPassword = await bcrypt.hash(password, salt);

    // Create organization
    const newOrganization = await Organizations.create({
      name: organization,
    });

    // Create user
    const newUser = await Users.create({
      username: userName,
      email,
      password: hashPassword,
      salt,
      firstname: firstName,
      lastname: lastName,
      organization_id: newOrganization.id,
      role,
      manager
    });

    // Return user without sensitive data
    const userResponse = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      organization_id: newUser.organization_id,
      role: newUser.role,
      manager: newUser.manager
    };

    sendSuccessResponse(res, userResponse, "User added successfully");
  } catch (error) {
    console.error('Add user error:', error);
    sendErrorResponse(res, 500, "Internal server error");
  }
};
