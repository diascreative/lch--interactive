'use strict';

export default function(sequelize, DataTypes) {
  return sequelize.define('Quickbase', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    date: {
      allowNull: false,
      type: DataTypes.DATE
    },
    incremental: DataTypes.INTEGER,
    meterReading: DataTypes.INTEGER,
    type: DataTypes.ENUM('generation', 'export'),
    performanceRatio:DataTypes.FLOAT
  }, {
    indexes: [{
      unique: true,
      fields: ['InstallationId', 'date', 'type']
    }],
    timestamps: false
  });
}
