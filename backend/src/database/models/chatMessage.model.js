import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class ChatMessage extends Model {
    static associate(models) {
      // ChatMessage belongs to Conversation
      ChatMessage.belongsTo(models.Conversation, {
        foreignKey: "conversationId",
        as: "conversation",
        onDelete: "CASCADE",
      });
      // ChatMessage belongs to User (optional support agent sender)
      ChatMessage.belongsTo(models.User, {
        foreignKey: "senderId",
        as: "sender",
        onDelete: "SET NULL",
      });
    }
  }

  ChatMessage.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      conversationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      senderType: {
        type: DataTypes.STRING, // 'visitor', 'bot', 'agent'
        allowNull: false,
      },
      senderId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ChatMessage",
      tableName: "chat_messages",
      timestamps: true,
    }
  );

  return ChatMessage;
};
