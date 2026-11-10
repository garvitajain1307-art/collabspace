
import Activity from "../models/activity.js";

const logActivity = async ({
    workspace,
    user,
    action,
    document = null,
    folder = null,
    targetUser = null,
    metadata = {}
}) => {
    try {
        if (!workspace || !user || !action) {
            console.error("Activity logging skipped: required fields missing");
            return;
        }

        await Activity.create({
            workspace,
            user,
            action,
            document,
            folder,
            targetUser,
            metadata
        });

    } catch (error) {
        // Activity logging should not undo a successful user action.
        console.error("Activity logging failed:", error.message);
    }
};

export default logActivity;
