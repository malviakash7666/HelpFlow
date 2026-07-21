/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("documents", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    originalName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    storagePath: {
      type: Sequelize.STRING,
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
    fileSize: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    mimeType: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    processingStatus: {
      type: Sequelize.STRING,
      defaultValue: "PENDING",
      allowNull: false,
    },
    error: {
      type: Sequelize.TEXT,
      allowNull: true,
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
  await queryInterface.dropTable("documents");
}
