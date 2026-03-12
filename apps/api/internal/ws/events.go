package ws

const (
	EventOrderCreated    = "order:created"
	EventOrderUpdated    = "order:updated"
	EventOrderApproved   = "order:approved"
	EventDeliveryUpdated = "delivery:updated"
	EventNotification    = "notification"
	EventStockUpdated    = "stock:updated"
)

type Event struct {
	Type    string `json:"type"`
	Payload any    `json:"payload"`
}
