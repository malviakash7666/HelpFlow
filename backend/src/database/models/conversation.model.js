import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Conversation extends Model {
    static associate(models) {
      // Conversation belongs to Company
      Conversation.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
        onDelete: "CASCADE",
      });
      // Conversation has many ChatMessages
      Conversation.hasMany(models.ChatMessage, {
        foreignKey: "conversationId",
        as: "messages",
      });
    }
  }

  Conversation.init(
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
      status: {
        type: DataTypes.STRING,
        defaultValue: "active",
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Conversation",
      tableName: "conversations",
      timestamps: true,
    }
  );

  return Conversation;
};
