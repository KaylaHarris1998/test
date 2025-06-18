import express from 'express';
import { verifyToken, requireManager, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/my-keys', verifyToken, async (req, res) => {
  try {
    const Keys = (await import('../models/KeyModel.js')).default;
    const keys = await Keys.findAll({
      where: { 
        user_id: req.user.id,
        is_active: true
      },
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: keys
    });
  } catch (error) {
    console.error('Get my keys error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.get('/', verifyToken, requireManager, async (req, res) => {
  try {
    const Keys = (await import('../models/KeyModel.js')).default;
    const Users = (await import('../models/UserModel.js')).default;
    
    const keys = await Keys.findAll({
      include: [{
        model: Users,
        as: 'user',
        attributes: ['id', 'username', 'email', 'firstname', 'lastname']
      }],
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: keys
    });
  } catch (error) {
    console.error('Get all keys error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get key by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const Keys = (await import('../models/KeyModel.js')).default;
    const Users = (await import('../models/UserModel.js')).default;
    
    const key = await Keys.findByPk(req.params.id, {
      include: [{
        model: Users,
        as: 'user',
        attributes: ['id', 'username', 'email', 'firstname', 'lastname']
      }]
    });
    
    if (!key) {
      return res.status(404).json({
        success: false,
        message: 'Key not found'
      });
    }
    
    if (key.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: key
    });
  } catch (error) {
    console.error('Get key error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { key, key_type = 'agency', description, expires_at } = req.body;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Key is required'
      });
    }
    
    const Keys = (await import('../models/KeyModel.js')).default;
    
    const existingKey = await Keys.findOne({
      where: { 
        key,
        user_id: req.user.id
      }
    });
    
    if (existingKey) {
      return res.status(400).json({
        success: false,
        message: 'This key already exists for your account'
      });
    }
    
    const newKey = await Keys.create({
      key,
      user_id: req.user.id,
      key_type,
      description,
      expires_at: expires_at ? new Date(expires_at) : null
    });
    
    res.status(201).json({
      success: true,
      message: 'Key created successfully',
      data: newKey
    });
  } catch (error) {
    console.error('Create key error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update key
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { key, key_type, description, is_active, expires_at } = req.body;
    
    const Keys = (await import('../models/KeyModel.js')).default;
    
    const keyRecord = await Keys.findByPk(req.params.id);
    
    if (!keyRecord) {
      return res.status(404).json({
        success: false,
        message: 'Key not found'
      });
    }
    
    if (keyRecord.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    await keyRecord.update({
      key: key || keyRecord.key,
      key_type: key_type || keyRecord.key_type,
      description: description !== undefined ? description : keyRecord.description,
      is_active: is_active !== undefined ? is_active : keyRecord.is_active,
      expires_at: expires_at ? new Date(expires_at) : keyRecord.expires_at
    });
    
    res.json({
      success: true,
      message: 'Key updated successfully',
      data: keyRecord
    });
  } catch (error) {
    console.error('Update key error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete key
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const Keys = (await import('../models/KeyModel.js')).default;
    
    const key = await Keys.findByPk(req.params.id);
    
    if (!key) {
      return res.status(404).json({
        success: false,
        message: 'Key not found'
      });
    }
    
    if (key.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    await key.destroy();
    
    res.json({
      success: true,
      message: 'Key deleted successfully'
    });
  } catch (error) {
    console.error('Delete key error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router; 