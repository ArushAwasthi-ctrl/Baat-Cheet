import Mailgen from "mailgen";
import nodemailer from "nodemailer";
const sendEmail = async (options) => {
  try {
    // Mailgen instance
    const mailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: "BaatCheet",
        link: "https://BaatCheet.com",
      },
    });

    // Generate email body
    const emailTextual = mailGenerator.generatePlaintext(
      options.mailGenContent,
    );
    const emailHTML = mailGenerator.generate(options.mailGenContent);

    // Setup transporter (Gmail or other SMTP)
    const port = Number(process.env.SMTP_PORT) || 587;
    const isSecure = port === 465; // Gmail: 465 = SSL, 587 = STARTTLS

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Send mail
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"BaatCheet" <${process.env.SMTP_USER}>`,
      to: options.email,
      subject: options.subject,
      text: emailTextual,
      html: emailHTML,
    });

    console.log("Email sent:", {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
    return info;
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};

// Email content generators
const OTPVerificationMailGenContent = function (username, intro , otp) {
  return {
    body: {
      name: `${username}`,
      intro: `${intro}`,
      action: {
        instructions: "Your One Time Password :",
        button: {
          text: `OTP: ${otp}`,
          link: "#",
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};


export { OTPVerificationMailGenContent,sendEmail };
