// models/user.js

import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // User belongs to Company
      User.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
      });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      role: {
        type: DataTypes.ENUM(
          "OWNER",
          "ADMIN",
          "SUPPORT_AGENT",
          "CUSTOMER"
        ),
        defaultValue: "CUSTOMER",
      },

      companyId: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true,
    }
  );

  return User;
};