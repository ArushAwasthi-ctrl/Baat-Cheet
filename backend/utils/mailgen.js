import Mailgen from "mailgen";
import Brevo from "@getbrevo/brevo";

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

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

    // Send mail using Brevo
    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.htmlContent = emailHTML;
    sendSmtpEmail.textContent = emailTextual;
    sendSmtpEmail.sender = {
      name: "BaatCheet",
      email: process.env.BREVO_SENDER_EMAIL || "noreply.baatcheet@gmail.com",
    };
    sendSmtpEmail.to = [{ email: options.email }];

    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log("Email sent:", {
      messageId: response.body.messageId,
      to: options.email,
    });
    return response.body;
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
