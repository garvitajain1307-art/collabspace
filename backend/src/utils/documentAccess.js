export const getDocumentAccess=(user,document,workspace)=>{
    if(workspace.owner.toString()===user._id.toString()){
        return "owner";
    }

    if(document.owner.toString()===user._id.toString()){
        return "owner";
    }

    const collaborator=document.collaborators.find(collaborator=>collaborator.user.toString()===user._id.toString());
    if(!collaborator){
        return "none"
    }

    return collaborator.permission;
};