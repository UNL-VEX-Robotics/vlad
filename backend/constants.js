export const ROLES = {
    PENDING: 0,
    MEMBER: 1,
    LEAD: 2,
    ADMIN: 3,
    OWNER: 4,
};

export const SALT_ROUNDS = 12;
export const EMAIL_REGEX = /\w*@(?:\w*.)+/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
