const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/prisma');
const JWT_SECRET = process.env.JWT_SECRET;
const { sendMessage } = require('../../kafka/producer');

const register = async (req, res, next) => {
  try {
    const { name, email, password, roleName = 'Customer', profileImage } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      return res.status(400).json({ message: `Role '${roleName}' does not exist.` });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword, roleId: role.id, profileImage },
    });

    // --- Send Kafka Event with Email ---
    await sendMessage('USER_CREATED', {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      profileImage: newUser.profileImage
    });
    // --- End Kafka Event ---

    const userForToken = await prisma.user.findUnique({
      where: { id: newUser.id },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });

    const permissions = userForToken.role.permissions.map(
      (rolePermission) => rolePermission.permission.name
    );
    const payload = {
      id: userForToken.id,
      email: userForToken.email,
      name: userForToken.name,
      profileImage: userForToken.profileImage,
      role: userForToken.role.name,
      permissions: permissions,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    
    res.status(201).json({ token });

  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Forbidden: Your account has been deactivated.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const permissions = user.role.permissions.map(
      (rolePermission) => rolePermission.permission.name
    );

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      role: user.role.name,
      permissions: permissions,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, profileImage: true, role: { select: { name: true } },
      }
    });
    if (!user) { return res.status(404).json({ message: 'User not found' }); }
    res.json(user);
  } catch (err) { next(err); }
};

const validateToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) { return res.status(400).json({ message: 'Token is required' }); }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) { return res.status(401).json({ valid: false, message: 'Invalid or expired token' }); }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ valid: false, message: 'User no longer exists or is inactive' });
      }

      const permissions = user.role.permissions.map(rp => rp.permission.name);
      const payload = {
        id: user.id, email: user.email, name: user.name, profileImage: user.profileImage, role: user.role.name, permissions: permissions,
      };
      res.json({ valid: true, user: payload });
    });
  } catch (err) { next(err); }
};

module.exports = { register, login, me, validateToken };