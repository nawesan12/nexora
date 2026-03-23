package email

import "fmt"

const (
	brandColor  = "#134E4A"
	accentColor = "#D97706"
	bgColor     = "#F3F4F6"
	textColor   = "#1F2937"
	mutedColor  = "#6B7280"
	footerYear  = "2026"
)

func baseTemplate(title, body string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>%s</title>
</head>
<body style="margin:0;padding:0;background-color:%s;font-family:'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background-color:%s;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;background-color:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
<!-- Header -->
<tr>
<td style="background-color:%s;padding:28px 40px;text-align:center;">
<span style="font-size:24px;font-weight:700;color:#FFFFFF;letter-spacing:0.5px;">Pronto ERP</span>
</td>
</tr>
<!-- Body -->
<tr>
<td style="padding:40px;">
%s
</td>
</tr>
<!-- Footer -->
<tr>
<td style="padding:24px 40px;background-color:%s;text-align:center;">
<p style="margin:0;font-size:13px;color:%s;">&copy; %s Pronto ERP. Todos los derechos reservados.</p>
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`, title, bgColor, bgColor, brandColor, body, bgColor, mutedColor, footerYear)
}

func ctaButton(label, url string) string {
	return fmt.Sprintf(`<table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px auto;">
<tr>
<td style="background-color:%s;border-radius:6px;">
<a href="%s" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;">%s</a>
</td>
</tr>
</table>`, brandColor, url, label)
}

// PasswordResetHTML genera el email para restablecer la contraseña.
// Asunto sugerido: "Restablecer tu contraseña - Pronto ERP"
func PasswordResetHTML(name, resetURL string) string {
	body := fmt.Sprintf(`<h1 style="margin:0 0 16px;font-size:22px;color:%s;">Hola, %s</h1>
<p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:%s;">Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Pronto ERP</strong>.</p>
<p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:%s;">Hacé clic en el siguiente botón para crear una nueva contraseña:</p>
%s
<p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:%s;">Este enlace expira en <strong>1 hora</strong>. Si no solicitaste este cambio, podés ignorar este mensaje.</p>
<p style="margin:24px 0 0;font-size:13px;color:%s;">Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br><a href="%s" style="color:%s;word-break:break-all;">%s</a></p>`,
		textColor, name, textColor, textColor,
		ctaButton("Restablecer contraseña", resetURL),
		textColor, mutedColor, resetURL, brandColor, resetURL)

	return baseTemplate("Restablecer tu contraseña - Pronto ERP", body)
}

// EmailVerificationHTML genera el email de verificación de correo.
// Asunto sugerido: "Verifica tu correo - Pronto ERP"
func EmailVerificationHTML(name, verifyURL string) string {
	body := fmt.Sprintf(`<h1 style="margin:0 0 16px;font-size:22px;color:%s;">Bienvenido, %s</h1>
<p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:%s;">Gracias por registrarte en <strong>Pronto ERP</strong>. Para completar tu registro, necesitamos verificar tu dirección de correo electrónico.</p>
<p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:%s;">Hacé clic en el siguiente botón para verificar tu cuenta:</p>
%s
<p style="margin:24px 0 0;font-size:13px;color:%s;">Si no creaste una cuenta en Pronto ERP, podés ignorar este mensaje.</p>`,
		textColor, name, textColor, textColor,
		ctaButton("Verificar correo", verifyURL),
		mutedColor)

	return baseTemplate("Verifica tu correo - Pronto ERP", body)
}

// WelcomeHTML genera el email de bienvenida.
// Asunto sugerido: "Bienvenido a Pronto ERP"
func WelcomeHTML(name, loginURL string) string {
	body := fmt.Sprintf(`<h1 style="margin:0 0 16px;font-size:22px;color:%s;">Bienvenido a Pronto ERP, %s</h1>
<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:%s;">Tu cuenta ya está activa. Ahora podés gestionar tu operación de forma simple y eficiente.</p>
<p style="margin:0 0 8px;font-size:16px;font-weight:600;color:%s;">Con Pronto ERP podés:</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
<tr><td style="padding:6px 0;font-size:15px;color:%s;"><span style="color:%s;margin-right:8px;">&#10003;</span> Administrar pedidos y facturación</td></tr>
<tr><td style="padding:6px 0;font-size:15px;color:%s;"><span style="color:%s;margin-right:8px;">&#10003;</span> Controlar inventario y logística</td></tr>
<tr><td style="padding:6px 0;font-size:15px;color:%s;"><span style="color:%s;margin-right:8px;">&#10003;</span> Gestionar finanzas y cobranzas</td></tr>
<tr><td style="padding:6px 0;font-size:15px;color:%s;"><span style="color:%s;margin-right:8px;">&#10003;</span> Visualizar reportes en tiempo real</td></tr>
</table>
%s`,
		textColor, name, textColor, textColor,
		textColor, accentColor,
		textColor, accentColor,
		textColor, accentColor,
		textColor, accentColor,
		ctaButton("Ingresar a Pronto ERP", loginURL))

	return baseTemplate("Bienvenido a Pronto ERP", body)
}

// OrderStatusHTML genera el email de notificación de cambio de estado de pedido.
// Asunto sugerido: "Pedido #XXX actualizado - Pronto ERP"
func OrderStatusHTML(name, orderNumber, oldStatus, newStatus, detailURL string) string {
	body := fmt.Sprintf(`<h1 style="margin:0 0 16px;font-size:22px;color:%s;">Hola, %s</h1>
<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:%s;">El estado de tu pedido ha sido actualizado.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%%;margin:0 0 24px;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
<tr>
<td style="padding:16px 20px;background-color:%s;">
<span style="font-size:14px;font-weight:600;color:#FFFFFF;">Pedido #%s</span>
</td>
</tr>
<tr>
<td style="padding:20px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%%;">
<tr>
<td style="padding:8px 0;font-size:14px;color:%s;width:120px;vertical-align:top;">Estado anterior:</td>
<td style="padding:8px 0;font-size:14px;font-weight:600;color:%s;">%s</td>
</tr>
<tr>
<td style="padding:8px 0;font-size:14px;color:%s;width:120px;vertical-align:top;">Nuevo estado:</td>
<td style="padding:8px 0;">
<span style="display:inline-block;padding:4px 12px;font-size:14px;font-weight:600;color:#FFFFFF;background-color:%s;border-radius:4px;">%s</span>
</td>
</tr>
</table>
</td>
</tr>
</table>
%s
<p style="margin:24px 0 0;font-size:13px;color:%s;">Si tenés alguna consulta sobre este pedido, contactanos respondiendo a este correo.</p>`,
		textColor, name, textColor,
		brandColor, orderNumber,
		mutedColor, textColor, oldStatus,
		mutedColor,
		accentColor, newStatus,
		ctaButton("Ver detalle del pedido", detailURL),
		mutedColor)

	return baseTemplate(fmt.Sprintf("Pedido #%s actualizado - Pronto ERP", orderNumber), body)
}
