const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Room = sequelize.define('Room', {
  room_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'room_id'
  },
  room_number: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
    field: 'room_number'
  },
  type: {
    type: DataTypes.ENUM('Value', 'Standard', 'Deluxe', 'Superior', 'Suite'),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  tagline: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  capacity: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  size: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  amenities: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('amenities');
      return rawValue ? (typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue) : [];
    }
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  base_rate_3hr: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'base_rate_3hr'
  },
  base_rate_6hr: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'base_rate_6hr'
  },
  base_rate_12hr: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'base_rate_12hr'
  },
  base_rate_24hr: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'base_rate_24hr'
  },
  status: {
    type: DataTypes.ENUM('Available', 'Occupied', 'Dirty', 'Maintenance'),
    defaultValue: 'Available'
  },
  lock_expiration: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'lock_expiration'
  },
  locked_by_session_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'locked_by_session_id'
  }
}, {
  tableName: 'rooms',
  timestamps: false,
  underscored: true
});

// Define associations
Room.associate = function(models) {
  Room.hasMany(models.Booking, {
    foreignKey: 'room_id',
    sourceKey: 'room_id',
    as: 'bookings'
  });
  
  Room.hasMany(models.RoomImage, {
    foreignKey: 'room_id',
    sourceKey: 'room_id',
    as: 'images'
  });
};

module.exports = Room;
