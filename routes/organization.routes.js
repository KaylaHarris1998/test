import express from 'express';
import { verifyToken, requireManager, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, requireManager, async (req, res) => {
  try {
    const Organizations = (await import('../models/OrganizationModel.js')).default;
    const organizations = await Organizations.findAll({
      order: [['name', 'ASC']]
    });
    
    res.json({
      success: true,
      data: organizations
    });
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const Organizations = (await import('../models/OrganizationModel.js')).default;
    const organization = await Organizations.findByPk(req.params.id);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    res.json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, address, phone, email, website } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Organization name is required'
      });
    }
    
    const Organizations = (await import('../models/OrganizationModel.js')).default;
    
    const existingOrg = await Organizations.findOne({
      where: { name }
    });
    
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        message: 'Organization with this name already exists'
      });
    }
    
    const organization = await Organizations.create({
      name,
      description,
      address,
      phone,
      email,
      website
    });
    
    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: organization
    });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, address, phone, email, website, status } = req.body;
    
    const Organizations = (await import('../models/OrganizationModel.js')).default;
    
    const organization = await Organizations.findByPk(req.params.id);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    if (name && name !== organization.name) {
      const existingOrg = await Organizations.findOne({
        where: { name }
      });
      
      if (existingOrg) {
        return res.status(400).json({
          success: false,
          message: 'Organization with this name already exists'
        });
      }
    }
    
    await organization.update({
      name: name || organization.name,
      description: description !== undefined ? description : organization.description,
      address: address !== undefined ? address : organization.address,
      phone: phone !== undefined ? phone : organization.phone,
      email: email !== undefined ? email : organization.email,
      website: website !== undefined ? website : organization.website,
      status: status || organization.status
    });
    
    res.json({
      success: true,
      message: 'Organization updated successfully',
      data: organization
    });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const Organizations = (await import('../models/OrganizationModel.js')).default;
    const Users = (await import('../models/UserModel.js')).default;
    
    const organization = await Organizations.findByPk(req.params.id);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    const userCount = await Users.count({
      where: { organization_id: req.params.id }
    });
    
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete organization. It has ${userCount} associated users.`
      });
    }
    
    await organization.destroy();
    
    res.json({
      success: true,
      message: 'Organization deleted successfully'
    });
  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router; 