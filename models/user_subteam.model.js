export default function (sequelize, DataTypes) {
    return sequelize.define(
        "user_subteam",
        {
            subteam_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                references: {
                    model: "subteam",
                    key: "id",
                },
            },
            notify: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                primaryKey: true,
            },
        },
        {
            sequelize,
            tableName: "user_subteam",
            schema: "public",
            timestamps: false,
            indexes: [
                {
                    name: "user_subteam_pkey",
                    unique: true,
                    fields: [{ name: "user_id" }, { name: "subteam_id" }],
                },
            ],
        }
    );
}
