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
        console.log("Email send Successfully")
    } catch (error) {
        console.log("Email not send")
        console.log(error)
    }
}
module.exports = SendEmail;