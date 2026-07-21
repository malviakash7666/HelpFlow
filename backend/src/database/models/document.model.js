import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Document extends Model {
    static associate(models) {
      // Document belongs to Company
      Document.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
        onDelete: "CASCADE",
      });
    }
  }

  Document.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      originalName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      storagePath: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      companyId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      fileSize: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      mimeType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      processingStatus: {
        type: DataTypes.STRING, // 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
        defaultValue: "PENDING",
        allowNull: false,
      },
      error: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Document",
      tableName: "documents",
      timestamps: true,
    }
  );

  return Document;
};
