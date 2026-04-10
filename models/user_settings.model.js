export default function (sequelize, DataTypes) {
    return sequelize.define(
        "user_settings",
        {
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                primaryKey: true,
                references: {
                    model: "user_account",
                    key: "id",
                },
            },
            theme: {
                type: DataTypes.STRING(20),
                allowNull: true,
                defaultValue: "system",
            },
            email_notifications: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: true,
            },
            email_digest_mode: {
                type: DataTypes.STRING(20),
                allowNull: true,
                defaultValue: "instant",
            },
            two_factor_enabled: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
        },
        {
            sequelize,
            tableName: "user_settings",
            schema: "public",
            timestamps: true,
            indexes: [
                {
                    name: "user_settings_pkey",
                    unique: true,
                    fields: [{ name: "user_id" }],
                },
            ],
        }
    );
}
