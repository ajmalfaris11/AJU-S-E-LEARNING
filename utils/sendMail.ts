require('dotenv').config(); // Load environment variables from the .env file into process.env
import nodemailer, { Transporter } from 'nodemailer'; // Import nodemailer for sending emails and the Transporter type for typing
import ejs from 'ejs'; // Import EJS for rendering email templates
import path from 'path'; // Import path for handling file paths

// Define the interface for email options, specifying the structure of the input
interface EmailOptions {
    email: string; // Recipient's email address
    subject: string; // Subject of the email
    template: string; // Name of the template file to render
    data: { [key: string]: any }; // Data to pass to the email template for rendering
}

// Asynchronous function to send an email
const sendMail = async (options: EmailOptions): Promise<void> => {
    // Create a transporter using nodemailer with SMTP configuration
    const transporter: Transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST, // SMTP server host, loaded from .env
        port: parseInt(process.env.SMTP_PORT || '587'), // SMTP server port, default to 587 if not set
        service: process.env.SMTP_SERVICE, // Email service provider (e.g., 'gmail'), loaded from .env
        auth: {
            user: process.env.SMTP_MAIL, // Email address for authentication, loaded from .env
            pass: process.env.SMTP_PASSWORD, // Password or app-specific password, loaded from .env
        },
    });

    // Destructure the email options
    const { email, subject, template, data } = options;

    // Get the full path to the email template file
    const templatePath = path.join(__dirname, '../mails', template);

    // Render the email template with the provided data using EJS
    const html: string = await ejs.renderFile(templatePath, data);

    // Create the mail options object
    const mailOption = {
        from: process.env.SMTP_MAIL, // Sender's email address, loaded from .env
        to: email, // Recipient's email address
        subject, // Email subject
        html, // Rendered HTML content for the email
    };

    // Send the email using the transporter
    await transporter.sendMail(mailOption); // This returns a Promise, ensuring the email is sent
};

// Export the sendMail function to make it available for import in other files
export default sendMail;
