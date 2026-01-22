// import nodemailer from 'nodemailer'; // Thư viện gửi email

// const sendEmail = async (email, subject, text) => {
//     try {
//         const transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 user: process.env.EMAIL_USER,
//                 pass: process.env.EMAIL_PASS
//             }
//         });

//         await transporter.sendMail({
//             from: process.env.EMAIL_USER,
//             to: email,
//             subject: subject,
//             text: text
//         });
        
//         console.log("Email sent successfully");
//     } catch (error) {
//         console.log("Email cannot be sent: ", error);
//     }
// }

// export default sendEmail;

import SibApiV3Sdk from 'sib-api-v3-sdk';

const sendEmail = async (email, subject, text) => {
    try {
        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        const apiKey = defaultClient.authentications['api-key'];
        apiKey.apiKey = process.env.BREVO_API_KEY;

        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = `<html><body>${text.replace(/\n/g, '<br>')}</body></html>`;
        sendSmtpEmail.sender = { 
            "name": "Smart Restaurant", 
            "email": "travansy2305@gmail.com" // Mail này PHẢI được verify trên Brevo
        };
        sendSmtpEmail.to = [{ "email": email }];

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log("Email sent successfully. Message ID:", data.messageId);
        return true;
    } catch (error) {
        console.error("Email cannot be sent. Error detail:", error.response ? error.response.body : error);
        return false;
    }
}

    console.log("Email sent successfully");
  } catch (error) {
    console.log("Email cannot be sent: ", error);
  }
};

export default sendEmail;

// Gửi email thông báo cho người dùng qua Gmail SMTP
