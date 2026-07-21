import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Ticket extends Model {
    static associate(models) {
      // Ticket belongs to Company
      Ticket.belongsTo(models.Company, {
        foreignKey: "companyId",
        as: "company",
        onDelete: "CASCADE",
      });

      // Ticket belongs to Conversation
      Ticket.belongsTo(models.Conversation, {
        foreignKey: "conversationId",
        as: "conversation",
        onDelete: "CASCADE",
      });

      // Ticket belongs to User (assigned employee)
      Ticket.belongsTo(models.User, {
        foreignKey: "assignedEmployeeId",
        as: "assignedEmployee",
        onDelete: "SET NULL",
      });

      // Ticket belongs to User (customer)
      Ticket.belongsTo(models.User, {
        foreignKey: "customerId",
        as: "customer",
        onDelete: "SET NULL",
      });
    }
  }

  Ticket.init(
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
      conversationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "AI Support Handoff",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      priority: {
        type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "URGENT"),
        defaultValue: "MEDIUM",
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"),
        defaultValue: "OPEN",
        allowNull: false,
      },
      assignedEmployeeId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Ticket",
      tableName: "tickets",
      timestamps: true,
    }
  );

  return Ticket;
};
