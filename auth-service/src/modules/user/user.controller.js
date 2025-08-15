const prisma = require('../../config/prisma');
const { sendMessage } = require('../../kafka/producer');
const crypto = require('crypto');

const userSelectDetailed = {
  id: true,
  name: true,
  email: true,
  profileImage: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: {
      id: true,
      name: true,
      description: true,
      permissions: {
        select: {
          permission: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      },
    },
  },
};

const inviteUser = async (req, res, next) => {
  try {
    const { name, email, roleId } = req.body;
    if (!name || !email || !roleId) {
      return res.status(400).json({ message: 'Name, email, and roleId are required.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return res.status(400).json({ message: 'The specified roleId does not exist.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // Token valid for 24 hours

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        roleId,
        isActive: false,
        password: null,
        invitationToken: token,
        invitationExpires: expires,
      },
      select: { id: true, name: true, email: true }
    });

    await sendMessage('USER_INVITED', {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      token: token, // Send the raw token in the event
    });

    res.status(201).json({ message: 'Invitation sent successfully.', userId: newUser.id });
  } catch (err) {
    if (err.code === 'P2003') { // Foreign key constraint failed on roleId
      return res.status(400).json({ message: 'The specified roleId does not exist.' });
    }
    next(err);
  }
};


const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        skip,
        take: limit,
        select: userSelectDetailed,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    const formattedUsers = users.map(user => ({
        ...user,
        role: {
            ...user.role,
            permissions: user.role.permissions.map(p => p.permission)
        }
    }));

    res.json({
      data: formattedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: id },
      select: userSelectDetailed,
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const formattedUser = {
        ...user,
        role: {
            ...user.role,
            permissions: user.role.permissions.map(p => p.permission)
        }
    };

    res.json(formattedUser);
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id: userIdToUpdate } = req.params;
    const { name, roleId, profileImage } = req.body;
    const requestingUserId = req.user.id;

    const dataToUpdate = {};
    if (name) dataToUpdate.name = name;
    if (roleId) dataToUpdate.roleId = roleId;
    if (profileImage) dataToUpdate.profileImage = profileImage;

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ message: 'No fields to update provided (name, roleId).' });
    }

    if (roleId) {
      const targetUser = await prisma.user.findUnique({ where: { id: userIdToUpdate }, include: { role: true } });
      if (!targetUser) return res.status(404).json({ message: "User to update not found."});

      if (userIdToUpdate === requestingUserId) {
        return res.status(403).json({ message: 'Forbidden: You cannot change your own role.' });
      }

      if (targetUser.role.name === 'ADMIN') {
        const adminCount = await prisma.user.count({ where: { role: { name: 'ADMIN' } } });
        if (adminCount <= 1) {
          return res.status(403).json({ message: 'Forbidden: Cannot change the role of the last administrator.' });
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdate },
      data: dataToUpdate,
      select: userSelectDetailed,
    });

    await sendMessage('USER_UPDATED', {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        profileImage: updatedUser.profileImage
    });

    const formattedUser = {
        ...updatedUser,
        role: {
            ...updatedUser.role,
            permissions: updatedUser.role.permissions.map(p => p.permission)
        }
    };

    res.json(formattedUser);
  } catch (err) {
    if (err.code === 'P2003' && err.meta?.field_name.includes('roleId')) {
      return res.status(400).json({ message: 'The specified roleId does not exist.' });
    }
    if (err.code === 'P2025') {
       return res.status(404).json({ message: 'User not found.' });
    }
    next(err);
  }
};

// --- MODIFIED AND IMPROVED FUNCTION ---
const deactivateUser = async (req, res, next) => {
    try {
        const { id: userIdToDelete } = req.params;
        const requestingUserId = req.user.id;

        const targetUser = await prisma.user.findUnique({
            where: { id: userIdToDelete },
            include: { role: true }
        });

        if (!targetUser) {
            return res.status(404).json({ message: "User not found." });
        }

        // Case 1: The user is a pending invite. Hard delete to revoke the invitation.
        if (!targetUser.isActive && targetUser.invitationToken) {
            await prisma.user.delete({ where: { id: userIdToDelete } });
            console.log(`Revoked invitation and hard-deleted pending user: ${userIdToDelete}`);
        }
        // Case 2: The user is an active user. Deactivate them (soft delete).
        else {
            if (userIdToDelete === requestingUserId) {
              return res.status(403).json({ message: 'Forbidden: You cannot deactivate your own account.' });
            }
            if (targetUser.role.name === 'ADMIN') {
                const adminCount = await prisma.user.count({ where: { role: { name: 'ADMIN' }, isActive: true } });
                if (adminCount <= 1) {
                  return res.status(403).json({ message: 'Forbidden: Cannot deactivate the last active administrator.' });
                }
            }
            await prisma.user.update({ where: { id: userIdToDelete }, data: { isActive: false } });
             console.log(`Deactivated (soft-deleted) active user: ${userIdToDelete}`);
        }

        // Send Kafka event for both hard and soft deletes.
        await sendMessage('USER_DELETED', { id: userIdToDelete });

        res.status(204).send();
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'User to delete or deactivate not found.' });
        }
        next(err);
    }
};
// --- END MODIFICATION ---

const activateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.user.update({ where: { id }, data: { isActive: true } });
        const user = await prisma.user.findUnique({ where: { id }, select: userSelectDetailed });

        await sendMessage('USER_UPDATED', {
            id: user.id,
            name: user.name,
            email: user.email,
            profileImage: user.profileImage
        });

        const formattedUser = { ...user, role: { ...user.role, permissions: user.role.permissions.map(p => p.permission) }};
        res.json(formattedUser);
    } catch (err) {
        if (err.code === 'P2025') { return res.status(404).json({ message: 'User to activate not found.' }); }
        next(err);
    }
};

const getTotalUserCount = async (req, res, next) => {
  try {
    const total = await prisma.user.count();
    res.json({ total });
  } catch(err) {
    next(err);
  }
};

module.exports = {
  inviteUser,
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  activateUser,
  getTotalUserCount
};