package smtp

import (
	"context"
	"fmt"
	"time"
)

func SendRegistrationTemporaryKeyEmail(ctx context.Context, toEmail, temporaryKey string, expiresAt time.Time) error {
	subject := "Verificacion de registro"
	text := fmt.Sprintf(
		"Tu clave temporal para completar el registro es: %s\n\nEsta clave vence el %s y solo puede usarse una vez.",
		temporaryKey,
		expiresAt.Format("02/01/2006 15:04"),
	)

	_, err := SendSandboxEmail(ctx, SandboxSendRequest{
		ToEmail: toEmail,
		Subject: subject,
		Text:    text,
	})
	return err
}
