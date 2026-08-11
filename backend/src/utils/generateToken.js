export const generateToken = (user, statusCode, message, res) => {
    const token = user.generateToken();

    const cookieOptions = {
        expires: new Date(
            Date.now() +
            Number(process.env.COOKIE_EXPIRE) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };

    res
        .status(statusCode)
        .cookie("token", token, cookieOptions)
        .json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                
                workspaces: user.workspaces,
                avatar: user.avatar,
                ownedDocuments: user.ownedDocuments,
            },
            message,
            
        });
};