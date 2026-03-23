package worker

import (
	"encoding/json"

	"github.com/hibiken/asynq"
	"github.com/pronto-erp/pronto/internal/email"
)

const (
	TaskSendEmail             = "email:send"
	TaskSendPasswordReset     = "email:password_reset"
	TaskSendEmailVerification = "email:verification"
	TaskSendOrderNotification = "notification:order"
)

func NewPasswordResetTask(to, name, resetURL string) (*asynq.Task, error) {
	body := email.PasswordResetHTML(name, resetURL)
	payload, err := json.Marshal(EmailPayload{
		To:      to,
		Subject: "Restablecer tu contraseña - Pronto ERP",
		Body:    body,
	})
	if err != nil {
		return nil, err
	}
	return asynq.NewTask(TaskSendPasswordReset, payload, asynq.Queue("critical"), asynq.MaxRetry(3)), nil
}

func NewEmailVerificationTask(to, name, verifyURL string) (*asynq.Task, error) {
	body := email.EmailVerificationHTML(name, verifyURL)
	payload, err := json.Marshal(EmailPayload{
		To:      to,
		Subject: "Verifica tu correo - Pronto ERP",
		Body:    body,
	})
	if err != nil {
		return nil, err
	}
	return asynq.NewTask(TaskSendEmailVerification, payload, asynq.Queue("critical"), asynq.MaxRetry(3)), nil
}

func NewWelcomeEmailTask(to, name, loginURL string) (*asynq.Task, error) {
	body := email.WelcomeHTML(name, loginURL)
	payload, err := json.Marshal(EmailPayload{
		To:      to,
		Subject: "Bienvenido a Pronto ERP",
		Body:    body,
	})
	if err != nil {
		return nil, err
	}
	return asynq.NewTask(TaskSendEmail, payload, asynq.Queue("default"), asynq.MaxRetry(3)), nil
}

func NewOrderNotificationTask(to, name, orderNum, oldStatus, newStatus, detailURL string) (*asynq.Task, error) {
	body := email.OrderStatusHTML(name, orderNum, oldStatus, newStatus, detailURL)
	payload, err := json.Marshal(EmailPayload{
		To:      to,
		Subject: "Pedido #" + orderNum + " actualizado - Pronto ERP",
		Body:    body,
	})
	if err != nil {
		return nil, err
	}
	return asynq.NewTask(TaskSendOrderNotification, payload, asynq.Queue("default"), asynq.MaxRetry(3)), nil
}
