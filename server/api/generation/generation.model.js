'use strict';

export default function(sequelize, DataTypes) {
  return sequelize.define('Generation', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    datetime: {
      allowNull: false,
      type: DataTypes.DATE
    },
    generated: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    timestamps: false
  });
}
