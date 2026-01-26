import Mailgen from "mailgen";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Send mail using Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || "BaatCheet <onboarding@resend.dev>",
      to: options.email,
      subject: options.subject,
      text: emailTextual,
      html: emailHTML,
    });

    if (error) {
      console.error("Email sending failed:", error);
      throw new Error(error.message);
    }

    console.log("Email sent:", {
      id: data.id,
      to: options.email,
    });
    return data;
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
