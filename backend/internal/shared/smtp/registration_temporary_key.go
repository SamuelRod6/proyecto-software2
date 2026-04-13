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

	_, err := SendEmail(ctx, SendEmailRequest{
		ToEmail: toEmail,
		Subject: subject,
		Text:    text,
	})
	return err
}
