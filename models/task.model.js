export default function (sequelize, DataTypes) {
    return sequelize.define(
        "task",
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            project_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "project",
                    key: "id",
                },
            },
            title: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            status: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            duedate: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: "task",
            schema: "public",
            timestamps: false,
            indexes: [
                {
                    name: "idx_task_project",
                    fields: [{ name: "project_id" }],
                },
                {
                    name: "task_pkey",
                    unique: true,
                    fields: [{ name: "id" }],
                },
            ],
        }
    );
}
