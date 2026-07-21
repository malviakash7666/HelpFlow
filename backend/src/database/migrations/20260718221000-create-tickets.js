/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("tickets", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    companyId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "companies",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    conversationId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "conversations",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    customerId: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    subject: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "AI Support Handoff",
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    priority: {
      type: Sequelize.ENUM("LOW", "MEDIUM", "HIGH", "URGENT"),
      defaultValue: "MEDIUM",
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM("OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"),
      defaultValue: "OPEN",
      allowNull: false,
    },
    assignedEmployeeId: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "users", // Points to users!
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("tickets");
  
  // Drop enum type left behind in Postgres
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tickets_priority";');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tickets_status";');
}
