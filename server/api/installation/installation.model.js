'use strict';

export default function(sequelize, DataTypes) {
  return sequelize.define('Installation', {
    // meter serial
    _id: {
      type: DataTypes.INTEGER,
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
    annualPredictedGeneration: DataTypes.FLOAT,
    capacity: DataTypes.FLOAT,
    energyType: DataTypes.STRING,
    source: DataTypes.STRING,

    // Installation metadata
    info: DataTypes.STRING,
    url: DataTypes.STRING,
    commissioned: DataTypes.STRING
  });
}
