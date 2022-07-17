const { json } = require('body-parser');
const nodemailer = require('nodemailer');

const SendEmail = async (email,subject,data) =>{
    try {
        const transporter = nodemailer.createTransport({
            host:process.env.HOST,
            service:process.env.SERVICE,
            port:Number(process.env.EMAIL_PORT),
            secure:Boolean(process.env.SECURE),
            auth:{
                user:process.env.USER,
                pass:process.env.PASS
            }

        });

        await transporter.sendMail({
            from:process.env.USER,
            to:email,
            subject:subject,
            html:data,
        });
        return {success:true,status:"sent",message:"Email Sent Successfully,Plz Check Your Email for further Processes"}
    } catch (error) {
        console.log(error)
        return {success:false,status:"not sent",message:"Email not Sent,due to may be some network issue"}
    }
}
module.exports = SendEmail;