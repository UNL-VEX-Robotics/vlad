export default function (sequelize, DataTypes) {
    return sequelize.define(
        "project",
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            subteam_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "subteam",
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
            lead_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: "user_account",
                    key: "id",
                },
            },
        },
        {
            sequelize,
            tableName: "project",
            schema: "public",
            timestamps: false,
            indexes: [
                {
                    name: "idx_project_subteam",
                    fields: [{ name: "subteam_id" }],
                },
                {
                    name: "project_pkey",
                    unique: true,
                    fields: [{ name: "id" }],
                },
            ],
        }
    );
}
