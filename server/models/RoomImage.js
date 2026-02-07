const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class RoomImage extends Model {}

RoomImage.init(
  {
    image_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'image_id',
    },
    room_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'room_id',
      references: {
        model: 'rooms',
        key: 'room_id',
      },
      onDelete: 'CASCADE',
    },
    image_path: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'image_path',
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_primary',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    sequelize,
    modelName: 'RoomImage',
    tableName: 'room_images',
    timestamps: false, // Using manual created_at field instead
    underscored: true,
  }
);

// Define associations
RoomImage.associate = function(models) {
  RoomImage.belongsTo(models.Room, {
    foreignKey: 'room_id',
    targetKey: 'room_id',
    as: 'room'
  });
};

module.exports = RoomImage;
