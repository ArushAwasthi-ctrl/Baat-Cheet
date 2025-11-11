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

    // Setup transporter
    const port = Number(process.env.MAIL_TRAP_PORT) || 2525;
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_TRAP_HOST,
      port,
      secure: port === 465, // SSL true agar port 465 hai
      auth: {
        user: process.env.MAIL_TRAP_USERNAME,
        pass: process.env.MAIL_TRAP_PASSWORD,
      },
    });

    // Send mail
    const info = await transporter.sendMail({
      from: '"BaatCheet"<no-reply@BaatCheet.com>',
      to: options.email,
      subject: options.subject,
      text: emailTextual,
      html: emailHTML,
    });

    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};

// Email content generators
const OTPVerificationMailGenContent = function (username, otp) {
  return {
    body: {
      name: `${username}`,
      intro: "Welcome to BaatCheet! We're very excited to have you on board.",
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

export { OTPVerificationMailGenContent, sendEmail };
