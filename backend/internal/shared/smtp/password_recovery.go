package smtp

import (
	"context"
	"fmt"
	"time"
)

func SendPasswordRecoveryEmail(ctx context.Context, toEmail, temporaryKey string, expiresAt time.Time) error {
	_ = expiresAt
	subject := "Recuperación de contraseña"
	text := fmt.Sprintf(
		"Tu clave temporal para recuperar la contraseña es: %s\n\nEsta clave vence en una hora y solo puede usarse una vez.",
		temporaryKey,
	)

	_, err := SendEmail(ctx, SendEmailRequest{
		ToEmail: toEmail,
		Subject: subject,
		Text:    text,
	})
	return err
}
