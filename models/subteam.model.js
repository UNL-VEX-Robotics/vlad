export default function (sequelize, DataTypes) {
    return sequelize.define(
        "subteam",
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
            },
            team_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "team",
                    key: "id",
                },
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
            tableName: "subteam",
            schema: "public",
            timestamps: false,
            indexes: [
                {
                    name: "idx_subteam_team",
                    fields: [{ name: "team_id" }],
                },
                {
                    name: "subteam_pkey",
                    unique: true,
                    fields: [{ name: "id" }],
                },
            ],
        }
    );
}
