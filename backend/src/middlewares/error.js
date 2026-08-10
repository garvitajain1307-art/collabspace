class ErrorHandler extends Error{
    constructor(message,statusCode){
        super(message);
        this.statusCode=statusCode;
    }
}

export const errorMiddleware=(err,req,res,next)=>{
    err.statusCode=err.statusCode||500;
    err.message=err.message||"Internal Server Error";

    if(err.code===11000){
        const field = Object.keys(err.keyValue)[0];
        err = new ErrorHandler(`Duplicate ${field} entered`, 400);
    }
    if(err.name==="CastError"){
        
        err=new ErrorHandler(`Resource not found.Invalid ${err.path}`,400);
    }
    if(err.name==="JsonWebTokenError"){
        
        err=new ErrorHandler("JSON Web Token is Invalid,try again",400);
    }
    if(err.name==="TokenExpiredError"){

        err=new ErrorHandler("JSON Web Token is Expired,try again",400);
    }
    const errorMessages=err.errors? Object.values(err.errors).map((value)=>value.message).join(", "):err.message;
    return res.status(err.statusCode).json({
        success:false,
        message:errorMessages
    })


}

export default ErrorHandler;