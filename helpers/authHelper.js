import bcrypt from "bcrypt";

export const hashPassword = async (password) => {
    // Check if password is provided and is valid type
    if (password === null || password === undefined || password === "") {
        throw new Error("Password cannot be null, undefined, or an empty string");
    }
    
    // Only allow strings and numbers as passwords
    const passwordType = typeof password;
    if (passwordType !== 'string' && passwordType !== 'number') {
        throw new Error("Password must be a string or number");
    }

    // Convert to string if not already
    const passwordString = String(password);

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(passwordString, saltRounds);
        return hashedPassword;

    } catch (error) {
        console.error("Error hashing password:", error.message);
        throw new Error("Password hashing failed");
    }
};

export const comparePassword = async (password, hashedPassword) => {
    // Check if password is provided and is valid type
    if (password === null || password === undefined || password === "") {
        throw new Error("Password cannot be null, undefined, or an empty string");
    }
    
    // Only allow strings and numbers as passwords
    const passwordType = typeof password;
    if (passwordType !== 'string' && passwordType !== 'number') {
        throw new Error("Password must be a string or number");
    }

    // Convert to string if not already
    const passwordString = String(password);
    
    if (!hashedPassword || typeof hashedPassword !== "string") {
        throw new Error("Invalid hashed password provided for comparison");
    }

    try {
        return await bcrypt.compare(passwordString, hashedPassword);
    } catch (error) {
        console.error("Error comparing passwords:", error.message);
        throw new Error("Password comparison failed");
    }
}
