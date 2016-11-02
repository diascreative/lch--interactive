'use strict';

export default function(sequelize, DataTypes) {
  return sequelize.define('Installation', {
    // meter serial
    _id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },

    // project name (we will group by these)
    name: DataTypes.STRING,

    // Geographical data
    lat: DataTypes.FLOAT,
    lng: DataTypes.FLOAT,
    localAuthority: DataTypes.STRING,

    // Ownership
    owner: DataTypes.STRING,
    ownershipType: DataTypes.STRING,

    // Installation details
    lastIndex: {
      type: DataTypes.FLOAT,
      default: 0
    },

    annualPredictedGeneration: DataTypes.FLOAT,
    capacity: DataTypes.FLOAT,
    energyType: DataTypes.STRING,
    source: DataTypes.STRING,

    // Installation metadata
    commissioned: DataTypes.STRING,
    info: DataTypes.STRING,
    location: DataTypes.STRING,
    url: DataTypes.STRING,

    // quickbase
    quickbase: {
      type: DataTypes.STRING,
      get: function() {
        if (this.getDataValue('quickbase') && this.getDataValue('quickbase') !== '') {
          return JSON.parse(this.getDataValue('quickbase'));
        } else {
          return {};
        }
      }
    }
  });
}
