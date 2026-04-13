export default function (sequelize, DataTypes) {
    return sequelize.define(
        "notifications",
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            title: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },
            message: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            type: {
                type: DataTypes.STRING(20),
                allowNull: true,
                defaultValue: "info",
            },
            is_read: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
            user_id: {
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
            tableName: "notifications",
            schema: "public",
            timestamps: true,
            indexes: [
                {
                    name: "notifications_pkey",
                    unique: true,
                    fields: [{ name: "id" }],
                },
            ],
        }
    );
}
