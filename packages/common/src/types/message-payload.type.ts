export type MessagePayload = {
  clientId: string;
  action?: string;
  status: Status;
};

type Status = {
  status: string,
  timestamp?: string,
  reason?: string,
  value?: string
}
