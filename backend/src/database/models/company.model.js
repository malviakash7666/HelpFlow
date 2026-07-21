import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Company extends Model {
    static associate(models) {
      // Company has many users
      Company.hasMany(models.User, {
        foreignKey: "companyId",
        as: "users",
      });
      // Company has many documents
      Company.hasMany(models.Document, {
        foreignKey: "companyId",
        as: "documents",
      });
      // Company has one widget
      Company.hasOne(models.Widget, {
        foreignKey: "companyId",
        as: "widget",
      });
    }
  }

  Company.init(
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
        validate: {
          isEmail: true,
        },
      },

      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      website: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      logo: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      industry: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      autoAssignmentEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      assignmentMethod: {
        type: DataTypes.STRING,
        defaultValue: "ROUND_ROBIN",
      },

      assignTo: {
        type: DataTypes.STRING,
        defaultValue: "ALL_ACTIVE",
      },

      fallbackEmployeeId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Company",
      tableName: "companies",
      timestamps: true,
    }
  );

  return Company;
};
