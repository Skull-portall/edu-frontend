import emailjs from '@emailjs/browser';

// EmailJS Configuration
// TODO: Replace these with your actual EmailJS credentials from https://www.emailjs.com/
const serviceId = 'service_bukgthn';
const welcomeTemplateId = 'template_mkbrda2';
const otpTemplateId = 'template_w2stxb9';
const publicKey = 'Q9wcNF_leDViV8Nkd';

/**
 * EmailJS Service for sending emails
 */
export const emailService = {
 /**
 * Initialize EmailJS with public key
 */
 init: () => {
 try {
 emailjs.init(publicKey);
 console.log('✅ EmailJS initialized');
 } catch (error) {
 console.error('❌ Failed to initialize EmailJS:', error);
 }
 },

 /**
 * Send welcome email to new user
 * @param {string} email - User's email address
 * @param {string} name - User's name
 */
 sendWelcomeEmail: async (email, name) => {
 try {
 const templateParams = {
 email: email,
 name: name,
 };

 const response = await emailjs.send(
 serviceId,
 welcomeTemplateId,
 templateParams,
 publicKey
 );

 console.log('✅ Welcome email sent successfully:', response);
 return { success: true };
 } catch (error) {
 console.error('❌ Failed to send welcome email:', error);
 return { success: false, error };
 }
 }
};

/**
 * Send OTP email to user for password reset
 * @param {string} email - User's email address
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export const sendOTPEmail = async (email, otp) => {
 try {
 const templateParams = {
 email: email,
 otp_code: otp,
 expiry_time: '10 minutes'
 };

 const response = await emailjs.send(
 serviceId,
 otpTemplateId,
 templateParams,
 publicKey
 );

 console.log('✅ OTP email sent successfully:', response);
 return { success: true };
 } catch (error) {
 console.error('❌ Failed to send OTP email:', error);
 return { success: false, error };
 }
};

