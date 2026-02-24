// reducer.ts
import { REFRESH_NOTIFICATIONS, MARK_AS_READ, REMOVE_NOTIFICATION, CLEAR_NOTIFICATIONS } from './actions';

export interface Notification {
  id: number | string;
  type: string;
  title?: string;
  read: boolean;
  eventName?: string;
  description?: string;
  newDates?: { date: string; label: string }[];
  eventId?: number;
  content?: string;
  createdAt?: string;
}

export interface NotificationState {
  notifications: Notification[];
}

export const initialState: NotificationState = {
  notifications: [],
};

export function notificationReducer(state: NotificationState, action: any): NotificationState {
  switch (action.type) {
    case REFRESH_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload,
      };
    case MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };
    case REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      };
    case CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
      };
    default:
      return state;
  }
}
