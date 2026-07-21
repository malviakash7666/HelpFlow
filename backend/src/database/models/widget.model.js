import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Widget extends Model {
    static associate(models) {
      // Widget belongs to Company
      Widget.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
        onDelete: "CASCADE",
      });
    }
  }

  Widget.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      companyId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      widgetKey: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Widget",
      tableName: "widgets",
      timestamps: true,
    }
  );

  return Widget;
};
