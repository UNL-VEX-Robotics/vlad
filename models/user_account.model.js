export default function (sequelize, DataTypes) {
    return sequelize.define(
        "user_account",
        {
            team_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "team",
                    key: "id",
                },
            },
            user_name: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            email: {
                type: DataTypes.TEXT,
                allowNull: true,
                unique: "user_account_email_key",
            },
            password_hash: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            reset_token: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            reset_expiry: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            role: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0,
            },
            id: {
                type: DataTypes.UUID,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            pending_email: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            email_verification_token: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            email_token_expiry: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            require_password_reset: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                defaultValue: false,
            },
        },
        {
            sequelize,
            tableName: "user_account",
            schema: "public",
            hasTrigger: true,
            timestamps: false,
            indexes: [
                {
                    name: "idx_user_team",
                    fields: [{ name: "team_id" }],
                },
                {
                    name: "user_account_email_key",
                    unique: true,
                    fields: [{ name: "email" }],
                },
                {
                    name: "user_account_pkey",
                    unique: true,
                    fields: [{ name: "id" }],
                },
            ],
        }
    );
}
