import express from 'express';
import { verifyToken, requireManager, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/my-locations', verifyToken, async (req, res) => {
  try {
    const Users_Locations = (await import('../models/UserLocationModel.js')).default;
    const locations = await Users_Locations.findAll({
      where: { 
        user_id: req.user.id,
        is_active: true
      },
      order: [
        ['is_primary', 'DESC'],
        ['created_at', 'DESC']
      ]
    });
    
    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Get my locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.get('/', verifyToken, requireManager, async (req, res) => {
  try {
    const Users_Locations = (await import('../models/UserLocationModel.js')).default;
    const Users = (await import('../models/UserModel.js')).default;
    
    const locations = await Users_Locations.findAll({
      include: [{
        model: Users,
        as: 'user',
        attributes: ['id', 'username', 'email', 'firstname', 'lastname']
      }],
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Get all locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.get('/primary/location', verifyToken, async (req, res) => {
  try {
    const Users_Locations = (await import('../models/UserLocationModel.js')).default;
    
    const primaryLocation = await Users_Locations.findOne({
      where: { 
        user_id: req.user.id,
        is_primary: true,
        is_active: true
      }
    });
    
    res.json({
      success: true,
      data: primaryLocation
    });
  } catch (error) {
    console.error('Get primary location error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.get('/type/:locationType', verifyToken, async (req, res) => {
  try {
    const { locationType } = req.params;
    const Users_Locations = (await import('../models/UserLocationModel.js')).default;
    
    const locations = await Users_Locations.findAll({
      where: { 
        user_id: req.user.id,
        location_type: locationType,
        is_active: true
      },
      order: [
        ['is_primary', 'DESC'],
        ['created_at', 'DESC']
      ]
    });
    
    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Get locations by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const Users_Locations = (await import('../models/UserLocationModel.js')).default;
    const Users = (await import('../models/UserModel.js')).default;
    
    const location = await Users_Locations.findByPk(req.params.id, {
      include: [{
        model: Users,
        as: 'user',
        attributes: ['id', 'username', 'email', 'firstname', 'lastname']
      }]
    });
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    if (location.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new location
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      location_name,
      address,
      city,
      state,
      country,
      postal_code,
      latitude,
      longitude,
      location_type = 'other',
      is_primary = false,
      phone,
      email,
      notes
    } = req.body;
    
    if (!location_name) {
      return res.status(400).json({
        success: false,
        message: 'Location name is required'
      });
    }
    
    const Users_Locations = (await import('../models/UserLocationModel.js')).default;
    
    if (is_primary) {
      await Users_Locations.update(
        { is_primary: false },
        { 
          where: { 
            user_id: req.user.id,
            is_primary: true
          }
        }
      );
    }
    
    const newLocation = await Users_Locations.create({
      user_id: req.user.id,
      location_name,
      address,
      city,
      state,
      country,
      postal_code,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      location_type,
      is_primary,
      phone,
      email,
      notes
    });
    
    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: newLocation
    });
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update location
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const {
      location_name,
      address,
      city,
      state,
      country,
      postal_code,
      latitude,
      longitude,
      location_type,
      is_primary,
      phone,
      email,
      notes
    } = req.body;
    
    const Users_Locations = (await import('../models/UserLocationModel.js')).default;
    
    const location = await Users_Locations.findByPk(req.params.id);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    // Check if user has permission to update this location
    if (location.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    if (is_primary && !location.is_primary) {
      await Users_Locations.update(
        { is_primary: false },
        { 
          where: { 
            user_id: req.user.id,
            is_primary: true,
            id: { [require('sequelize').Op.ne]: req.params.id }
          }
        }
      );
    }
    
    await location.update({
      location_name: location_name || location.location_name,
      address: address !== undefined ? address : location.address,
      city: city !== undefined ? city : location.city,
      state: state !== undefined ? state : location.state,
      country: country !== undefined ? country : location.country,
      postal_code: postal_code !== undefined ? postal_code : location.postal_code,
      latitude: latitude !== undefined ? parseFloat(latitude) : location.latitude,
      longitude: longitude !== undefined ? parseFloat(longitude) : location.longitude,
      location_type: location_type || location.location_type,
      is_primary: is_primary !== undefined ? is_primary : location.is_primary,
      phone: phone !== undefined ? phone : location.phone,
      email: email !== undefined ? email : location.email,
      notes: notes !== undefined ? notes : location.notes
    });
    
    res.json({
      success: true,
      message: 'Location updated successfully',
      data: location
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete location
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const Users_Locations = (await import('../models/UserLocationModel.js')).default;
    
    const location = await Users_Locations.findByPk(req.params.id);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    if (location.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    await location.destroy();
    
    res.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Set location as primary
router.patch('/:id/set-primary', verifyToken, async (req, res) => {
  try {
    const Users_Locations = (await import('../models/UserLocationModel.js')).default;
    
    const location = await Users_Locations.findByPk(req.params.id);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    if (location.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    await Users_Locations.update(
      { is_primary: false },
      { 
        where: { 
          user_id: req.user.id,
          is_primary: true,
          id: { [require('sequelize').Op.ne]: req.params.id }
        }
      }
    );
    
    await location.update({ is_primary: true });
    
    res.json({
      success: true,
      message: 'Location set as primary successfully'
    });
  } catch (error) {
    console.error('Set primary location error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router; 