<?php
require_once __DIR__ . '/lib/Exception.php';
require_once __DIR__ . '/lib/PHPMailer.php';
require_once __DIR__ . '/lib/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

/**
 * Sends an email using Gmail SMTP via PHPMailer
 * 
 * @param string $to Recipient email address
 * @param string $subject Email subject
 * @param string $htmlBody HTML content of the email
 * @return bool True if sent successfully, False otherwise
 */
function send_taskoria_email($to, $subject, $htmlBody) {
    $mail = new PHPMailer(true);

    try {
        // Server settings
        $mail->SMTPDebug = 0;                      // Enable verbose debug output (0 = off)
        $mail->isSMTP();                           // Send using SMTP
        $mail->Host       = 'smtp.gmail.com';      // Set the SMTP server to send through
        $mail->SMTPAuth   = true;                  // Enable SMTP authentication
        
        // ⚠️ IMPORTANTE: Aquí van las credenciales de tu cuenta
        $mail->Username   = 'taskoriaapp@gmail.com';  // SMTP username (tu email)
        // Necesitarás generar una "App Password" (Contraseña de Aplicación) 
        // en la configuración de seguridad de tu cuenta de Google.
        // NO pongas tu contraseña normal aquí.
        $mail->Password   = 'gzrr anzk qayk tkhp';   // SMTP password
        
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // Enable TLS encryption
        $mail->Port       = 587;                    // TCP port to connect to

        // Recipients
        $mail->setFrom('taskoriaapp@gmail.com', 'Taskoria RPG');
        $mail->addAddress($to);

        // Content
        $mail->isHTML(true);                        // Set email format to HTML
        $mail->Subject = $subject;
        $mail->Body    = $htmlBody;
        $mail->AltBody = strip_tags($htmlBody);     // Plain text alternative

        $mail->send();
        return true;
    } catch (Exception $e) {
        // We log the error silently so it doesn't break the JSON response.
        error_log("Message could not be sent. Mailer Error: {$mail->ErrorInfo}");
        return false;
    }
}
?>
