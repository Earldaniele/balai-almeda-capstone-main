const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  booking_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'booking_id'
  },
  guest_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for walk-in bookings
    field: 'guest_id'
  },
  room_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'room_id'
  },
  reference_code: {
    type: DataTypes.STRING(20),
    unique: true,
    field: 'reference_code'
  },
  checkout_session_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'checkout_session_id'
  },
  check_in_time: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'check_in_time'
  },
  check_out_time: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'check_out_time'
  },
  duration_hours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'duration_hours'
  },
  adults_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'adults_count'
  },
  children_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'children_count'
  },
  child_ages: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'child_ages'
  },
  source: {
    type: DataTypes.ENUM('Web', 'Walk_in'),
    defaultValue: 'Web'
  },
  status: {
    type: DataTypes.ENUM('Pending_Payment', 'Confirmed', 'Checked_In', 'Completed', 'Cancelled'),
    defaultValue: 'Pending_Payment'
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_amount'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'bookings',
  timestamps: false,
  underscored: true
});

// Define associations
Booking.associate = function(models) {
  Booking.belongsTo(models.Room, {
    foreignKey: 'room_id',
    targetKey: 'room_id',
    as: 'room'
  });
  Booking.belongsTo(models.User, {
    foreignKey: 'guest_id',
    targetKey: 'user_id',
    as: 'guest'
  });
};

module.exports = Booking;
