export default function (sequelize, DataTypes) {
    return sequelize.define(
        "task_assignee",
        {
            task_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                references: {
                    model: "task",
                    key: "id",
                },
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                primaryKey: true,
            },
        },
        {
            sequelize,
            tableName: "task_assignee",
            schema: "public",
            timestamps: false,
            indexes: [
                {
                    name: "task_assignee_pkey",
                    unique: true,
                    fields: [{ name: "task_id" }, { name: "user_id" }],
                },
            ],
        }
    );
}
