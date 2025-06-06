export type MessagePayload = {
    status?: string;
    action?: string;
    cmd?: string;
    arg?: any;
    timestamp?: string;
    [key: string]: any;
};

export interface TopicTemplate {
    action: string;
    status: string;
}

export interface Message {
    deviceId: string;
    command: string;
    value?: any;
} 