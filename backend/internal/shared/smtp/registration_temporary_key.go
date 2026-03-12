package smtp

import (
	"context"
	"fmt"
)

func SendRegistrationTemporaryKeyEmail(ctx context.Context, toEmail, temporaryKey string) error {
	subject := "Verificacion de registro"
	text := fmt.Sprintf(
		"Tu clave temporal para completar el registro es: %s\n\nEsta clave vence en una hora y solo puede usarse una vez.",
		temporaryKey,
	)

	_, err := SendSandboxEmail(ctx, SandboxSendRequest{
		ToEmail: toEmail,
		Subject: subject,
		Text:    text,
	})

	// _, err := SendEmail(ctx, SendEmailRequest{
	// 	ToEmail: toEmail,
	// 	Subject: subject,
	// 	Text:    text,
	// })
	return err
}
