export default function (sequelize, DataTypes) {
    return sequelize.define(
        "team",
        {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
            },
            name: {
                type: DataTypes.TEXT,
                allowNull: false,
                unique: "team_name_key",
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
            tableName: "team",
            schema: "public",
            timestamps: false,
            indexes: [
                {
                    name: "team_name_key",
                    unique: true,
                    fields: [{ name: "name" }],
                },
                {
                    name: "team_pkey",
                    unique: true,
                    fields: [{ name: "id" }],
                },
            ],
        }
    );
}
