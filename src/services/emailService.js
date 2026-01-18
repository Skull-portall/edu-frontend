import emailjs from '@emailjs/browser';

// EmailJS Configuration
// These should ideally be in .env but are often client-side exposed anyway
const EMAILJS_SERVICE_ID = 'service_bukgthn'; // User needs to fill this
const EMAILJS_TEMPLATE_ID = 'template_mkbrda2'; // User needs to fill this
const EMAILJS_PUBLIC_KEY = 'Q9wcNF_leDViV8Nkd'; // User needs to fill this

export const emailService = {
    /**
     * Initialize EmailJS (call this in App.jsx or high up)
     */
    init: () => {
        try {
            emailjs.init(EMAILJS_PUBLIC_KEY);
        } catch (error) {
            console.error('EmailJS Init Failed:', error);
        }
    },

    /**
     * Send a generic email
     * @param {Object} templateParams - Parameters to replace in the template (e.g., to_name, message)
     */
    sendEmail: async (templateParams) => {
        if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY === 'public_key_placeholder') {
            console.warn('EmailJS not configured. Skipping email send.');
            return;
        }

        try {
            const response = await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                templateParams,
                EMAILJS_PUBLIC_KEY
            );
            console.log('Email sent successfully!', response.status, response.text);
            return response;
        } catch (error) {
            console.error('Failed to send email:', error);
            throw error;
        }
    },

    /**
     * Send a welcome email to a new user
     * @param {string} email - User's email
     * @param {string} name - User's name
     */
    sendWelcomeEmail: async (email, name) => {
        const params = {
            email: email,
            name: name,
            // subject: 'Welcome to eDu Live!',
            // message: 'We are thrilled to have you join our academic community. Explore questions, share notes, and connect with peers.',
            // Add more params as per your EmailJS template variables
        };
        return emailService.sendEmail(params);
    }
};
