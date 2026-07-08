module.exports = {
  ROLES: {
    ADMIN: "admin",
    KITCHEN: "kitchen",
    WAITER: "waiter",
    CASHIER: "cashier",
    CUSTOMER: "customer",
  },

  ORDER_STATUS: {
    PLACED: "placed",
    ACCEPTED: "accepted",
    PREPARING: "preparing",
    READY: "ready",
    SERVED: "served",
    CANCELLED: "cancelled",
  },

  PAYMENT_STATUS: {
    PENDING: "pending",
    PARTIAL: "partial",
    PAID: "paid",
    FAILED: "failed",
    REFUNDED: "refunded",
  },

  PAYMENT_MODE: {
    PAY_NOW: "pay_now",
    PAY_LATER: "pay_later",
    SPLIT: "split",
  },

  TABLE_STATUS: {
    AVAILABLE: "available",
    SEATED: "seated",
    ORDERING: "ordering",
    EATING: "eating",
    NEEDS_ASSISTANCE: "needs_assistance",
    NEEDS_BILL: "needs_bill",
  },

  SERVICE_REQUEST_TYPE: {
    WATER: "water",
    CUTLERY: "cutlery",
    TISSUES: "tissues",
    BILL: "bill",
    WAITER_CALL: "waiter_call",
    OTHER: "other",
  },

  SERVICE_REQUEST_STATUS: {
    PENDING: "pending",
    ACKNOWLEDGED: "acknowledged",
    RESOLVED: "resolved",
  },

  SOCKET_EVENTS: {
    NEW_ORDER: "order:new",
    ORDER_STATUS_UPDATED: "order:status_updated",
    ITEM_AVAILABILITY_UPDATED: "menu:item_availability_updated",
    SERVICE_REQUEST_NEW: "service:new",
    SERVICE_REQUEST_UPDATED: "service:updated",
    TABLE_STATUS_UPDATED: "table:status_updated",
    PAYMENT_UPDATED: "payment:updated",
  },
};
