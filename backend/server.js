import { config } from "dotenv";


config();



const { connectDb } = await import("./src/config/db.js");

const { default: app } = await import("./src/app.js");


await connectDb()


const PORT=process.env.PORT || 4000;
const server=app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})



process.on("unhandledRejection",(err)=>{
    console.error(`UnhandledRejection:${err.message} `);
    server.close(()=>process.exit(1));

}); 



process.on("uncaughtException",(err)=>{
    console.error(`UncaughtException:${err.message} `);
    process.exit(1);

}); //server ekdum se hi bnd ho jaaega, concurrent servers ka wait ni krega to complete

export default server;