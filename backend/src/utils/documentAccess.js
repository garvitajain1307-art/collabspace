
const getId = (value) => {
    if (!value) return null;

    return String(value._id || value.id || value);
};

export const getDocumentAccess = (user, document, workspace) => {
    if (!user || !document || !workspace) {
        return "none";
    }

    const userId = getId(user);

    if (!userId) {
        return "none";
    }

    // Workspace owner has full access.
    if (getId(workspace.owner) === userId) {
        return "owner";
    }

    // Document owner has full access.
    if (getId(document.owner) === userId) {
        return "owner";
    }

    // Only explicitly added collaborators get document access.
    const collaborator = (document.collaborators || []).find(
        (item) => getId(item.user) === userId
    );

    if (!collaborator) {
        return "none";
    }

    if (["editor", "viewer"].includes(collaborator.permission)) {
        return collaborator.permission;
    }

    // Fail closed for invalid permissions.
    return "none";
};
