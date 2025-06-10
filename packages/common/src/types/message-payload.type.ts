export type MessagePayload = {
  status?: string;
  action?: string;
  cmd?: string;
  arg?: any;
  timestamp?: string;
  [key: string]: any;
};
