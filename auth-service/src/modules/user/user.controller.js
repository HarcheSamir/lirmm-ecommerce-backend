const prisma = require('../../config/prisma');
const { sendMessage } = require('../../kafka/producer');

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

    // --- Send Kafka Event with Email ---
    await sendMessage('USER_UPDATED', {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        profileImage: updatedUser.profileImage
    });
    // --- End Kafka Event ---

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

const deactivateUser = async (req, res, next) => {
    try {
        const { id: userIdToDeactivate } = req.params;
        const requestingUserId = req.user.id;

        if (userIdToDeactivate === requestingUserId) {
          return res.status(403).json({ message: 'Forbidden: You cannot deactivate your own account.' });
        }

        const targetUser = await prisma.user.findUnique({ where: { id: userIdToDeactivate }, include: { role: true }});
        if (!targetUser) {
            return res.status(404).json({ message: "User not found." });
        }
        if (targetUser.role.name === 'ADMIN') {
            const adminCount = await prisma.user.count({ where: { role: { name: 'ADMIN' }, isActive: true } });
            if (adminCount <= 1) {
              return res.status(403).json({ message: 'Forbidden: Cannot deactivate the last active administrator.' });
            }
        }

        await prisma.user.update({ where: { id: userIdToDeactivate }, data: { isActive: false } });
        
        await sendMessage('USER_DELETED', { id: userIdToDeactivate });
        
        res.status(204).send();
    } catch (err) {
        if (err.code === 'P2025') { return res.status(404).json({ message: 'User to deactivate not found.' }); }
        next(err);
    }
};

const activateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.user.update({ where: { id }, data: { isActive: true } });
        const user = await prisma.user.findUnique({ where: { id }, select: userSelectDetailed });

        // --- Send Kafka Event with Email ---
        await sendMessage('USER_UPDATED', {
            id: user.id,
            name: user.name,
            email: user.email,
            profileImage: user.profileImage
        });
        // --- End Kafka Event ---
        
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
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  activateUser,
  getTotalUserCount
};