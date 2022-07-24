
export const MIN_PASSWORD_LENGTH = 8;
export const MIN_USERNAME_LENGTH = 4;
export const MAX_PASSWORD_LENGTH = 256;
export const MAX_USERNAME_LENGTH = 16;
export const NUM_PASSWORD_SOFT_REQS = 2;

export function validatePassword(password: string, annoying: boolean) : string {
    if (!annoying && password.length === 0) {
        //don't want to annoy the user, they know an empty password is invalid
        return '';
    } else if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    } else if (password.length > MAX_PASSWORD_LENGTH) {
        return `Password must be at most ${MAX_PASSWORD_LENGTH} characters`
    } else {
        //must meet NUM_PASSWORD_SOFT_REQS of 4 requirements
        var hasLower = /[a-z]/.test(password);
        var hasUpper = /[A-Z]/.test(password);
        var hasDigit = /\d/.test(password);
        var hasSpecial = /[^a-zA-Z\d]/.test(password);
        var softReqsMet = 0;
        if (hasLower) softReqsMet++
        if (hasUpper) softReqsMet++
        if (hasDigit) softReqsMet++
        if (hasSpecial) softReqsMet++
        if (softReqsMet < NUM_PASSWORD_SOFT_REQS) {
            return `Password must have at least ${NUM_PASSWORD_SOFT_REQS} of the following:
            at least 1 lower case letter
            at least 1 upper case letter
            at least 1 number
            at least 1 special character.`;
        } else {
            return ''
        }
    }
}   

export function validateUsername(username: string, annoying: boolean) : string {
    if (!annoying && username.length === 0) {
        //don't want to annoy the user, they know an empty password is invalid
        return '';
    } else if (username.length < MIN_USERNAME_LENGTH) {
        return `Username must be at least ${MIN_USERNAME_LENGTH} characters`
    } else if (username.length > MAX_USERNAME_LENGTH) {
        return `Username must be at most ${MAX_USERNAME_LENGTH} characters`
    } else {
        if (!/^(?!.*[_\-\.]{2}).*$/.test(username)) {
            return `Username must not contain consecutive dashes, periods, or underscores`;
        } else {
            return ''
        }
    }
}

export function validateEmail(email: string, annoying: boolean) : string {
    return '';
}


